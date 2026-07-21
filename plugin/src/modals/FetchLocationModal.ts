import { App, Modal, ButtonComponent } from 'obsidian';
import { VaultPromptModal } from './VaultPromptModal';

export class FetchLocationModal extends Modal {
    apiKey: string;
    notePath: string;
    onNext: (vaultName: string, quickAccessName: string) => void;

    constructor(app: App, apiKey: string, notePath: string, onNext: (vaultName: string, quickAccessName: string) => void) {
        super(app);
        this.apiKey = apiKey;
        this.notePath = notePath;
        this.onNext = onNext;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Checking Remote Status...' });
        
        const statusEl = contentEl.createEl('p', { text: 'Scanning server to see if this note is already synced...' });
        statusEl.style.marginBottom = '1.5rem';

        try {
            const res = await fetch(`https://obsidian-rooms.vercel.app/api/sync/locate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: this.apiKey, notePath: this.notePath })
            });

            if (res.ok) {
                const data = await res.json();
                
                if (data.found) {
                    statusEl.innerText = `Note found remotely!\nVault: ${data.vaultName}\nFolder: ${data.quickAccessName || '(Root)'}`;
                    statusEl.style.color = 'var(--text-accent)';
                    
                    this.createNextButton(data.vaultName, data.quickAccessName);
                } else {
                    statusEl.innerText = `Note not found remotely. You can create a new sync entry.`;
                    statusEl.style.color = 'var(--text-muted)';
                    this.createNextButton('', '');
                }
            } else {
                statusEl.innerText = `Failed to contact server.`;
                this.createNextButton('', '');
            }
        } catch (err) {
            statusEl.innerText = `Network error while checking remote status.`;
            this.createNextButton('', '');
        }
    }

    createNextButton(prefillVault: string, prefillFolder: string) {
        const btnContainer = this.contentEl.createDiv();
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'flex-end';
        btnContainer.style.marginTop = '1rem';

        new ButtonComponent(btnContainer)
            .setButtonText('Next')
            .setCta()
            .onClick(() => {
                this.close();
                new VaultPromptModal(this.app, prefillVault, prefillFolder, this.onNext).open();
            });
    }

    onClose() {
        this.contentEl.empty();
    }
}
