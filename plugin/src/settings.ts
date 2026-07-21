import { App, PluginSettingTab, Setting, Platform } from 'obsidian';
import ObsidianRoomsPlugin from './main';

export interface ObsidianRoomsSettings {
	apiKey: string; // Used only on mobile; desktop uses SecretStorage
}

export const DEFAULT_SETTINGS: ObsidianRoomsSettings = {
	apiKey: ''
}

export class ObsidianRoomsSettingTab extends PluginSettingTab {
	plugin: ObsidianRoomsPlugin;

	constructor(app: App, plugin: ObsidianRoomsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Obsidian Rooms Settings'});

		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Your personal API key generated from the Obsidian Rooms dashboard.')
			.addText(text => {
				text.setPlaceholder('Enter your API key');
				text.inputEl.type = 'password';
				text.setValue(this.plugin.settings.apiKey);
				text.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
