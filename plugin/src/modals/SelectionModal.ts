import { App, Modal, Setting, TFile } from 'obsidian';

export class SelectionModal extends Modal {
	notes: string[];
	attachments: string[];
	linkGraph: Record<string, string[]>;
	onConfirm: (selectedNotes: string[], selectedAttachments: string[]) => void;
	
	private selectedNotes: Set<string>;
	private selectedAttachments: Set<string>;
	private attachmentToggles: Record<string, any> = {}; // Store toggle components to update their UI

	constructor(app: App, notes: string[], attachments: string[], linkGraph: Record<string, string[]>, onConfirm: (selectedNotes: string[], selectedAttachments: string[]) => void) {
		super(app);
		this.notes = notes;
		this.attachments = attachments;
		this.linkGraph = linkGraph;
		this.onConfirm = onConfirm;
		
		this.selectedNotes = new Set(notes);
		this.selectedAttachments = new Set(attachments);
	}

	recalculateAttachments() {
		// Find all attachments referenced by currently selected notes
		const neededAttachments = new Set<string>();
		for (const note of this.selectedNotes) {
			const links = this.linkGraph[note] || [];
			for (const link of links) {
				if (!link.endsWith('.md')) { // It's an attachment
					neededAttachments.add(link);
				}
			}
		}

		// Update our selection and the UI toggles
		for (const attachment of this.attachments) {
			// If it's no longer needed by ANY selected note, uncheck it automatically
			if (!neededAttachments.has(attachment) && this.selectedAttachments.has(attachment)) {
				this.selectedAttachments.delete(attachment);
				if (this.attachmentToggles[attachment]) {
					this.attachmentToggles[attachment].setValue(false);
				}
			}
		}
	}

	onOpen() {
		const {contentEl} = this;
		
		contentEl.createEl('h2', {text: 'Share to Obsidian Rooms'});
		
		contentEl.createEl('p', {
			text: `Review the ${this.notes.length} notes and ${this.attachments.length} attachments to sync.`
		});
		
		contentEl.createEl('h3', {text: 'Notes'});
		const notesContainer = contentEl.createDiv({ cls: 'obsidian-rooms-scroll-container' });
		notesContainer.style.maxHeight = '200px';
		notesContainer.style.overflowY = 'auto';
		
		this.notes.forEach(note => {
			new Setting(notesContainer)
				.setName(note)
				.addToggle(toggle => toggle
					.setValue(this.selectedNotes.has(note))
					.onChange(value => {
						if (value) this.selectedNotes.add(note);
						else this.selectedNotes.delete(note);
						this.recalculateAttachments();
					})
				);
		});

		contentEl.createEl('h3', {text: 'Attachments'});
		const attachmentsContainer = contentEl.createDiv({ cls: 'obsidian-rooms-scroll-container' });
		attachmentsContainer.style.maxHeight = '150px';
		attachmentsContainer.style.overflowY = 'auto';
		
		this.attachments.forEach(attachment => {
			new Setting(attachmentsContainer)
				.setName(attachment)
				.addToggle(toggle => {
					this.attachmentToggles[attachment] = toggle;
					toggle.setValue(this.selectedAttachments.has(attachment))
						  .onChange(value => {
							  if (value) this.selectedAttachments.add(attachment);
							  else this.selectedAttachments.delete(attachment);
						  });
				});
		});

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Sync to Web')
				.setCta()
				.onClick(() => {
					this.close();
					this.onConfirm(Array.from(this.selectedNotes), Array.from(this.selectedAttachments));
				}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
