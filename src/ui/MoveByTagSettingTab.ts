import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TextComponent } from 'obsidian';
import { MoveByTagSettings, TagMapping } from '../models/types';
import { FolderSuggestions } from './FolderSuggestions';
import { TagMappingService } from '../services/TagMappingService';
import { TagMappingModal } from './TagMappingModal';

export class MoveByTagSettingTab extends PluginSettingTab {
  private folderInput: TextComponent; // Declare folderInput here
  private folderSuggestions: FolderSuggestions;
  private tagMappingService: TagMappingService;
  private settings: MoveByTagSettings;
  private saveSettings: () => Promise<void>;
  private plugin: Plugin;

  constructor(app: App, plugin: Plugin, settings: MoveByTagSettings, saveSettings: () => Promise<void>) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = settings;
    this.saveSettings = saveSettings;
    this.folderSuggestions = new FolderSuggestions(app);
    this.tagMappingService = new TagMappingService();
  }

  private createFolderInputSetting(parentEl: HTMLElement, placeholder: string, label: string): TextComponent {
    let textComponent: TextComponent | null = null;
    console.log('Creating folder input setting for:', label);
    
    new Setting(parentEl)
      .setName(label)
      .addText((text) => {
        text.setPlaceholder(placeholder);
        text.inputEl.style.width = '300px'; // Make input field wider
        
        // Add a data attribute to help identify this input
        text.inputEl.setAttribute('data-folder-input', label);
        
        text.onChange(async (value) => {
          console.log('Input changed:', value);
          // Store a reference to this input element to ensure we're using the right one
          const inputEl = text.inputEl;
          const results = await this.folderSuggestions.searchFolders(value);
          
          // Make sure the input is still focused before showing suggestions
          if (document.activeElement === inputEl) {
            this.folderSuggestions.displayFolderSuggestions(results);
          }
        });
        textComponent = text;
      });
    if (!textComponent) throw new Error('Failed to create text component');
    return textComponent;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // General Settings Section
    containerEl.createEl('h3', { text: 'General Settings' });

    // CONFIRM BEFORE MOVING
    new Setting(containerEl)
      .setName('Confirm Before Moving')
      .setDesc('Show confirmation dialog before moving files')
      .addToggle(toggle => toggle
        .setValue(this.settings.confirmBeforeMove)
        .onChange(async (value) => {
          this.settings.confirmBeforeMove = value;
          await this.saveSettings();
        }));

    // ENABLE LOGGING
    new Setting(containerEl)
      .setName('Enable Logging')
      .setDesc('Log file movements to console')
      .addToggle(toggle => toggle
        .setValue(this.settings.enableLogging)
        .onChange(async (value) => {
          this.settings.enableLogging = value;
          await this.saveSettings();
        }));

    // EXCLUDED FOLDERS
    containerEl.createEl('h3', { text: 'Excluded Folders' });
    containerEl.createEl('p', {
      text: 'Files in these folders will not be moved. One folder path per line.',
      cls: 'setting-item-description'
    });

    this.createFolderInputSetting(containerEl, 'Exclude folder/subfolder','Exclude folder');

    // SPECIFIC FOLDERS 
    containerEl.createEl('h3', { text: 'Specific Folders' });
    containerEl.createEl('p', {
      text: 'Files will only be moved from these folders. One folder path per line.',
      cls: 'setting-item-description'
    });

    this.createFolderInputSetting(containerEl, 'Specific folder/subfolder','Specific folder');

    // Tag Mappings Section
    containerEl.createEl('h3', { text: 'Tag Mappings' });
    containerEl.createEl('p', {
      text: 'Define where files should be moved based on their tags.',
      cls: 'setting-item-description'
    });

    // Add New Mapping and Delete All Buttons at the top
    new Setting(containerEl)
      .addButton(button => button
        .setButtonText('Add New Mapping')
        .setCta() // Make it stand out as the primary action
        .onClick(() => {
          const modal = new TagMappingModal(
            this.app, 
            this.settings, 
            this.saveSettings, 
            () => this.display()
          );
          modal.showAddMappingModal();
        }));

    // Existing Mappings
    const mappingsContainer = containerEl.createDiv('tag-mappings-container');

    if (this.settings.tagMappings.length === 0) {
      mappingsContainer.createEl('p', {
        text: 'No tag mappings defined yet. Click "Add New Mapping" to create one.',
        cls: 'setting-item-description'
      });
    }

    // Sort mappings by first tag
    const sortedMappings = [...this.settings.tagMappings]
      .sort((a, b) => a.tags[0].localeCompare(b.tags[0]));

    for (const mapping of sortedMappings) {
      const tagDisplay = mapping.tags.map(t => '#' + t).join(' + ');
      const matchModeDisplay = mapping.matchMode === 'any' ? '(Match Any)' : '(Match All)';

      new Setting(mappingsContainer)
        .setName(`${tagDisplay} ${matchModeDisplay}`)
        .setDesc(`Current destination: ${mapping.folder}`)
        .addButton(button => button
          .setButtonText('Edit')
          .onClick(() => {
            const modal = new TagMappingModal(
              this.app, 
              this.settings, 
              this.saveSettings, 
              () => this.display()
            );
            modal.showEditMappingModal(mapping);
          }));
    }
  }
}
