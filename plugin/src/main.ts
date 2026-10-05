import { Plugin, Notice, TFile } from 'obsidian';
import { computeSubgraph } from './core/subgraph';
import { SelectionModal } from './modals/SelectionModal';
import { VaultPromptModal } from './modals/VaultPromptModal';
import { FetchLocationModal } from './modals/FetchLocationModal';
import { ObsidianRoomsSettingTab, DEFAULT_SETTINGS, ObsidianRoomsSettings } from './settings';
import { SyncProgressModal } from './modals/SyncProgressModal';

export default class ObsidianRoomsPlugin extends Plugin {
	settings: ObsidianRoomsSettings;

	async onload() {
		console.log('loading Obsidian Rooms plugin');

		await this.loadSettings();

		// Add Settings Tab
		this.addSettingTab(new ObsidianRoomsSettingTab(this.app, this));

		// "Add note to shared vault" command
		this.addCommand({
			id: 'add-to-shared-vault',
			name: 'Add note to shared vault',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						if (!this.settings.apiKey) {
							new Notice("Please configure your API Key in settings first.");
							return true;
						}
						new FetchLocationModal(this.app, this.settings.apiKey, activeFile.path, (vaultName, quickAccessName) => {
							this.openSelectionModal(activeFile, vaultName, quickAccessName);
						}).open();
					}
					return true;
				}
				return false;
			}
		});
	}

	openSelectionModal(file: TFile, vaultName: string, quickAccessName: string) {
		const depth = 0; // Infinite traversal
		
		const linkGraph: Record<string, string[]> = {};
		for (const [source, links] of Object.entries(this.app.metadataCache.resolvedLinks)) {
			linkGraph[source] = Object.keys(links);
		}

		const result = computeSubgraph(linkGraph, file.path, depth);
		
		new SelectionModal(this.app, result.notes, result.attachments, linkGraph, (notes, attachments) => {
			this.syncToWeb(notes, attachments, vaultName, quickAccessName);
		}).open();
	}

	async hashFile(file: TFile): Promise<string> {
		const buffer = await this.app.vault.readBinary(file);
		const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	}

	async syncToWeb(notes: string[], attachments: string[], vaultName: string, quickAccessName: string) {
		const apiKey = this.settings.apiKey;
		if (!apiKey) {
			new Notice("Please configure your API Key in settings.");
			return;
		}

		const progress = new SyncProgressModal(this.app);
		progress.open();

		try {
			progress.updateProgress("Computing hashes...", 10);
			const noteManifest = [];
			const prefix = quickAccessName ? `${quickAccessName}/` : '';

			for (const path of notes) {
				const file = this.app.vault.getAbstractFileByPath(path);
				if (file instanceof TFile) {
					const hash = await this.hashFile(file);
					noteManifest.push({ path: prefix + path, localPath: path, hash });
				}
			}
			
			const attachmentManifest = [];
			for (const path of attachments) {
				const file = this.app.vault.getAbstractFileByPath(path);
				if (file instanceof TFile) {
					const hash = await this.hashFile(file);
					attachmentManifest.push({ path: prefix + path, localPath: path, hash });
				}
			}

			progress.updateProgress("Sending manifest to server...", 30);
			const manifestRes = await fetch(`https://obsidian-rooms.vercel.app/api/sync/manifest`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apiKey,
					vaultName,
					notes: noteManifest.map(n => ({ path: n.path, hash: n.hash })),
					attachments: attachmentManifest.map(a => ({ path: a.path, hash: a.hash }))
				})
			});

			if (!manifestRes.ok) {
				let errMsg = await manifestRes.text();
				try {
					const data = JSON.parse(errMsg);
					if (data.error) errMsg = data.error;
				} catch(e) {}
				progress.finish(false, `Manifest error: ${errMsg}`);
				return;
			}

			const manifestData = await manifestRes.json();
			const neededNotes = manifestData.neededNotes || [];
			const neededAttachments = manifestData.neededAttachments || [];
			
			if (neededNotes.length === 0 && neededAttachments.length === 0) {
				progress.finish(true, "Everything is already up to date!");
				return;
			}

			progress.updateProgress(`Preparing ${neededNotes.length} notes and ${neededAttachments.length} attachments...`, 50);

			const noteAttachmentMap: Record<string, Record<string, string>> = {};
			const noteLinks: Record<string, string[]> = {};

			for (const path of notes) {
                // 1. Build Attachment Map
				const links = this.app.metadataCache.resolvedLinks[path] || {};
				const linkedAttachmentPaths = Object.keys(links).filter(p => attachments.includes(p));
                const mapForNote: Record<string, string> = {};
				for (const p of linkedAttachmentPaths) {
                    const hash = attachmentManifest.find(a => a.localPath === p)?.hash;
                    if (hash) {
                        const filename = p.split('/').pop() || p;
                        mapForNote[filename] = hash;
                    }
                }
				noteAttachmentMap[prefix + path] = mapForNote;

                // 2. Build Note Links Map (Graph Topology)
                const outgoingLinks = new Set<string>();
                for (const target of Object.keys(links)) {
                    if (target.endsWith('.md')) {
                        outgoingLinks.add(prefix + target);
                    }
                }
                const unresolved = this.app.metadataCache.unresolvedLinks[path] || {};
                for (const target of Object.keys(unresolved)) {
                    outgoingLinks.add(prefix + target);
                }
                noteLinks[prefix + path] = Array.from(outgoingLinks);
			}

			// Helper to send a chunk of data
			const sendChunk = async (chunkNotes: string[], chunkAttachments: string[], progressMsg: string) => {
				const formData = new FormData();
				formData.append('apiKey', apiKey);
				formData.append('vaultName', vaultName);

				// Only include mappings for the notes in this chunk
				const chunkMap: Record<string, Record<string, string>> = {};
				const chunkLinks: Record<string, string[]> = {};
				for (const path of chunkNotes) {
					chunkMap[path] = noteAttachmentMap[path] || {};
					chunkLinks[path] = noteLinks[path] || [];
				}
				formData.append('noteAttachmentMap', JSON.stringify(chunkMap));
				formData.append('noteLinks', JSON.stringify(chunkLinks));

				for (const path of chunkNotes) {
					const entry = noteManifest.find(n => n.path === path);
					if (entry) {
						const file = this.app.vault.getAbstractFileByPath(entry.localPath);
						if (file instanceof TFile) {
							const content = await this.app.vault.read(file);
							formData.append('notePaths', path);
							formData.append('noteHashes', entry.hash);
							formData.append('noteContents', content);
						}
					}
				}

				for (const hash of chunkAttachments) {
					const entry = attachmentManifest.find(a => a.hash === hash);
					if (entry) {
						const file = this.app.vault.getAbstractFileByPath(entry.localPath);
						if (file instanceof TFile) {
							const buffer = await this.app.vault.readBinary(file);
							const blob = new Blob([buffer]);
							formData.append('attachmentPaths', entry.path);
							formData.append('attachmentHashes', hash);
							formData.append('attachmentBlobs', blob, entry.path);
						}
					}
				}

				const uploadRes = await fetch(`https://obsidian-rooms.vercel.app/api/sync/upload`, {
					method: 'POST',
					body: formData
				});

				if (!uploadRes.ok) {
					let errMsg = await uploadRes.text();
					try {
						const data = JSON.parse(errMsg);
						if (data.error) errMsg = data.error;
					} catch(e) {}
					throw new Error(errMsg);
				}
			};

			// Batch Attachments (Max 2 per chunk)
			let totalSteps = Math.ceil(neededAttachments.length / 2) + Math.ceil(neededNotes.length / 10);
			let step = 0;

			for (let i = 0; i < neededAttachments.length; i += 2) {
				const chunk = neededAttachments.slice(i, i + 2);
				step++;
				const pct = 50 + Math.floor((step / totalSteps) * 40);
				progress.updateProgress(`Uploading attachments ${i + 1} to ${i + chunk.length} of ${neededAttachments.length}...`, pct);
				await sendChunk([], chunk, `Uploading attachments ${i + 1} to ${i + chunk.length}...`);
			}

			// Batch Notes (Max 10 per chunk)
			for (let i = 0; i < neededNotes.length; i += 10) {
				const chunk = neededNotes.slice(i, i + 10);
				step++;
				const pct = 50 + Math.floor((step / totalSteps) * 40);
				progress.updateProgress(`Uploading notes ${i + 1} to ${i + chunk.length} of ${neededNotes.length}...`, pct);
				await sendChunk(chunk, [], `Uploading notes ${i + 1} to ${i + chunk.length}...`);
			}

			progress.finish(true, "Sync complete!");
		} catch (err) {
			console.error(err);
			progress.finish(false, "Failed to sync. Check console.");
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		console.log('unloading Obsidian Rooms plugin');
	}
}
