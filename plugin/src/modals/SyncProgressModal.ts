import { App, Modal, Notice } from 'obsidian';

export class SyncProgressModal extends Modal {
    private messageEl: HTMLElement;
    private progressBarEl: HTMLElement;
    private progressFillEl: HTMLElement;

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h2', { text: 'Syncing to Obsidian Rooms' });

        this.messageEl = contentEl.createEl('p', { text: 'Initializing sync...' });

        // Create a simple progress bar
        this.progressBarEl = contentEl.createDiv({
            attr: {
                style: 'width: 100%; height: 20px; background-color: var(--background-modifier-border); border-radius: 10px; overflow: hidden; margin-top: 10px;'
            }
        });

        this.progressFillEl = this.progressBarEl.createDiv({
            attr: {
                style: 'width: 0%; height: 100%; background-color: var(--interactive-accent); transition: width 0.3s ease;'
            }
        });
    }

    onClose() {
        this.contentEl.empty();
    }

    updateProgress(message: string, percent: number) {
        if (this.messageEl) {
            this.messageEl.setText(message);
        }
        if (this.progressFillEl) {
            this.progressFillEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }

    finish(success: boolean, message: string) {
        this.updateProgress(message, success ? 100 : 0);
        if (this.progressFillEl) {
            this.progressFillEl.style.backgroundColor = success ? 'var(--text-success)' : 'var(--text-error)';
        }
        
        const btn = this.contentEl.createEl('button', { text: 'Close' });
        btn.style.marginTop = '20px';
        btn.onclick = () => this.close();
    }
}
