import { App, ButtonComponent, Modal, Notice, Setting, TextComponent, TFile, ToggleComponent } from 'obsidian';
import { MoveByTagSettings, TagMapping } from '../models/types';
import { FolderSuggestions } from './FolderSuggestions';
import { TagMappingService } from '../services/TagMappingService';
import { FileUtils } from '../utils/FileUtils';

/**
 * Modal for adding or editing tag mappings
 */
export class TagMappingModal extends Modal {
  private settings: MoveByTagSettings;
  private saveSettings: () => Promise<void>;
  private folderSuggestions: FolderSuggestions;
  private tagMappingService: TagMappingService;
  private fileUtils: FileUtils;
  private onCloseCallback: () => void;
  private activeFile: TFile | null;

  constructor(
    app: App, 
    settings: MoveByTagSettings, 
    saveSettings: () => Promise<void>,
    onCloseCallback: () => void = () => {},
    activeFile: TFile | null = null
  ) {
    super(app);
    this.settings = settings;
    this.saveSettings = saveSettings;
    this.onCloseCallback = onCloseCallback;
    this.activeFile = activeFile;
    this.folderSuggestions = new FolderSuggestions(app);
    this.tagMappingService = new TagMappingService();
    this.fileUtils = new FileUtils(app);
  }

  /**
   * Create a folder input setting with autocomplete
   */
  private createFolderInputSetting(parentEl: HTMLElement, placeholder: string, label: string): TextComponent {
    let textComponent: TextComponent | null = null;
    
    new Setting(parentEl)
      .setName(label)
      .addText((text) => {
        text.setPlaceholder(placeholder);
        text.inputEl.style.width = '300px'; // Make input field wider
        
        // Add a data attribute to help identify this input
        text.inputEl.setAttribute('data-folder-input', label);
        
        text.onChange(async (value) => {
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

  /**
   * Show modal for adding a new tag mapping
   */
  async showAddMappingModal(): Promise<void> {
    this.titleEl.setText('Add Tag Mapping');

    const contentEl = this.contentEl;
    contentEl.empty();
    
    let tagsInput: TextComponent;
    let folderInput: TextComponent;
    let matchModeToggle: ToggleComponent;
    let initialTags = '';

    // If we have an active file, pre-populate with its tags
    if (this.activeFile) {
      try {
        const fileContent = await this.app.vault.read(this.activeFile);
        const fileTags = this.fileUtils.extractTags(fileContent);
        initialTags = fileTags.join(', ');
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }

    // Tags input
    new Setting(contentEl)
      .setName('Tags')
      .setDesc('Enter tags without # symbol, separated by commas.')
      .addText(text => {
        tagsInput = text;
        text.setPlaceholder('tag1, tag2, tag3');
        if (initialTags) {
          text.setValue(initialTags);
        }
      });

    // Folder input for add/edit tag mapping
    folderInput = this.createFolderInputSetting(contentEl, 'folder/subfolder', 'Destination Folder');

    // Match mode toggle
    new Setting(contentEl)
      .setName('Matching Mode')
      .setDesc('Choose how tags should be matched')
      .addToggle(toggle => {
        matchModeToggle = toggle;
        toggle.setValue(true); // Default to 'all'
        toggle.setTooltip('Match All Tags');
        toggle.onChange(value => {
          toggle.setTooltip(value ? 'Match All Tags' : 'Match Any Tag');
        });
      });

    // If we have an active file, suggest its parent folder
    // if (this.activeFile && this.activeFile.parent) {
    //   folderInput.setValue(this.activeFile.parent.path);
    // }

    // Buttons
    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Cancel')
        .onClick(() => this.close()))
      .addButton(button => button
        .setButtonText('Add')
        .setCta()
        .onClick(async () => {
          const tagsValue = tagsInput.getValue().trim();
          const folder = folderInput.getValue().trim();
          const matchMode = matchModeToggle.getValue() ? 'all' : 'any';

          if (!tagsValue || !folder) {
            new Notice('Both tags and folder are required');
            return;
          }

          const tags = tagsValue.split(',').map(t => t.trim()).filter(t => t.length > 0);
          if (tags.length === 0) {
            new Notice('At least one tag is required');
            return;
          }

          // Check for duplicate tag combinations
          const tagSet = new Set(tags.map(t => t.toLowerCase()));
          if (this.settings.tagMappings.some(m =>
            m.tags.length === tags.length &&
            m.tags.every(t => tagSet.has(t.toLowerCase()))
          )) {
            new Notice('This tag combination already has a mapping');
            return;
          }

          const newMapping: TagMapping = {
            id: this.tagMappingService.generateId(),
            tags,
            folder,
            matchMode
          };

          this.settings.tagMappings.push(newMapping);
          await this.saveSettings();
          this.close();
        }));

    this.open();
  }

  /**
   * Show modal for editing an existing tag mapping
   */
  async showEditMappingModal(mapping: TagMapping): Promise<void> {
    this.titleEl.setText('Edit Tag Mapping');

    const contentEl = this.contentEl;
    contentEl.empty();
    
    let tagsInput: TextComponent;
    let folderInput: TextComponent;
    let matchModeToggle: ToggleComponent;

    // Tags input
    new Setting(contentEl)
      .setName('Tags')
      .setDesc('Enter tags without # symbol, separated by commas.')
      .addText(text => {
        tagsInput = text;
        text.setValue(mapping.tags.join(', '));
      });

    // Folder input with dropdown
    folderInput = this.createFolderInputSetting(contentEl, 'folder/subfolder', 'Destination Folder');
    folderInput.setValue(mapping.folder);

    // Match mode toggle
    new Setting(contentEl)
      .setName('Matching Mode')
      .setDesc('Choose how tags should be matched')
      .addToggle(toggle => {
        matchModeToggle = toggle;
        // Default to 'all' if matchMode not set (for backward compatibility)
        toggle.setValue(mapping.matchMode !== 'any');
        toggle.setTooltip(mapping.matchMode !== 'any' ? 'Match All Tags' : 'Match Any Tag');
        toggle.onChange(value => {
          toggle.setTooltip(value ? 'Match All Tags' : 'Match Any Tag');
        });
      });

    // Buttons
    new Setting(contentEl)
      .addButton(button => button
        .setButtonText('Cancel')
        .onClick(() => this.close()))
      .addButton(button => button
        .setButtonText('Delete')
        .setWarning()
        .onClick(async () => {
          if (await this.showDeleteConfirmation(mapping)) {
            this.settings.tagMappings = this.settings.tagMappings
              .filter(m => m.id !== mapping.id);
            await this.saveSettings();
            this.close();
          }
        }))
      .addButton(button => button
        .setButtonText('Save')
        .setCta()
        .onClick(async () => {
          const tagsValue = tagsInput.getValue().trim();
          const folder = folderInput.getValue().trim();
          const matchMode = matchModeToggle.getValue() ? 'all' : 'any';

          if (!tagsValue || !folder) {
            new Notice('Both tags and folder are required');
            return;
          }

          const tags = tagsValue.split(',').map(t => t.trim()).filter(t => t.length > 0);
          if (tags.length === 0) {
            new Notice('At least one tag is required');
            return;
          }

          // Check for duplicate tag combinations (excluding this mapping)
          const tagSet = new Set(tags.map(t => t.toLowerCase()));
          if (this.settings.tagMappings.some(m =>
            m.id !== mapping.id &&
            m.tags.length === tags.length &&
            m.tags.every(t => tagSet.has(t.toLowerCase()))
          )) {
            new Notice('This tag combination already has a mapping');
            return;
          }

          // Update the mapping
          const index = this.settings.tagMappings.findIndex(m => m.id === mapping.id);
          if (index !== -1) {
            this.settings.tagMappings[index] = {
              ...mapping,
              tags,
              folder,
              matchMode
            };
            await this.saveSettings();
            this.close();
          }
        }));

    this.open();
  }

  /**
   * Show confirmation dialog for deleting a mapping
   */
  private async showDeleteConfirmation(mapping: TagMapping): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new Modal(this.app);
      modal.titleEl.setText('Delete Mapping');
      
      const contentEl = modal.contentEl;
      contentEl.createEl('p', {
        text: `Are you sure you want to delete the mapping for tags: ${mapping.tags.map(t => '#' + t).join(' + ')}?`
      });
      
      new Setting(contentEl)
        .addButton(button => button
          .setButtonText('Cancel')
          .onClick(() => {
            modal.close();
            resolve(false);
          }))
        .addButton(button => button
          .setButtonText('Delete')
          .setWarning()
          .onClick(() => {
            modal.close();
            resolve(true);
          }));
      
      modal.open();
    });
  }

  onClose() {
    // Clean up suggestions when modal is closed
    const suggestionsContainer = document.getElementById('folder-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.remove();
    }
    
    // Call the onClose callback
    this.onCloseCallback();
  }
} 