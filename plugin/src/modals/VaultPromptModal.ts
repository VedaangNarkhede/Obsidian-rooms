import { App, Modal, Setting, ButtonComponent } from 'obsidian';

export class VaultPromptModal extends Modal {
	onSubmit: (vaultName: string, quickAccessName: string) => void;
	vaultName: string = '';
	quickAccessName: string = '';

	constructor(app: App, initialVaultName: string, initialQuickAccessName: string, onSubmit: (vaultName: string, quickAccessName: string) => void) {
		super(app);
		this.vaultName = initialVaultName || '';
		this.quickAccessName = initialQuickAccessName || '';
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Sync to Obsidian Rooms' });

		new Setting(contentEl)
			.setName('Vault Name')
			.setDesc('Enter the name of the vault to sync these notes to.')
			.addText(text => {
				text.setPlaceholder('e.g. My Vault');
				if (this.vaultName) text.setValue(this.vaultName);
				text.onChange(value => {
					this.vaultName = value.trim();
				});
			});

		const quickAccessSetting = new Setting(contentEl)
			.setName('Quick Access Name (Optional)')
			.setDesc('Category or subfolder for these notes. If provided, notes will be saved under vault_name/quick_access_name/.')
			.addText(text => {
				text.setPlaceholder('e.g. cryptography');
				if (this.quickAccessName) text.setValue(this.quickAccessName);
				text.onChange(value => {
					this.quickAccessName = value.trim();
				});
			});

		// Add a small warning under the quick access setting
		const warningEl = contentEl.createEl('p', {
			text: 'Warning: All scanned files will be synced under this subfolder within the vault.',
			cls: 'setting-item-description'
		});
		warningEl.style.color = 'var(--text-warning)';
		warningEl.style.marginTop = '-10px';
		warningEl.style.marginBottom = '20px';

		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.marginTop = '1rem';

		const submitBtn = new ButtonComponent(buttonContainer)
			.setButtonText('Continue')
			.setCta()
			.onClick(() => {
				if (!this.vaultName) {
					// Require vault name
					return;
				}
				this.close();
				this.onSubmit(this.vaultName, this.quickAccessName);
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
