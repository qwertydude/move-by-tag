import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, MoveByTagSettings } from './models/types';
import { MoveByTagSettingTab } from './ui/MoveByTagSettingTab';
import { FileUtils } from './utils/FileUtils';
import { CommandManager } from './commands/CommandManager';

export default class MoveByTag extends Plugin {
  settings: MoveByTagSettings;
  private fileUtils: FileUtils;
  private commandManager: CommandManager;

  public log(message: string) {
    if (this.settings.enableLogging) {
      console.log(`[Move by Tag] ${message}`);
    }
  }

  async onload() {
    await this.loadSettings();
    this.fileUtils = new FileUtils(this.app);
    
    // Initialize the command manager
    this.commandManager = new CommandManager(
      this,
      this.app,
      this.settings,
      this.fileUtils,
      this.log.bind(this)
    );
    
    // Register all commands
    this.commandManager.registerCommands();

    this.addSettingTab(new MoveByTagSettingTab(
      this.app, 
      this, 
      this.settings, 
      this.saveSettings.bind(this)
    ));

    console.log('Move by Tag Plugin loaded');
  }

  async onunload() {
    console.log('Move by Tag Plugin unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    
    // Ensure all mappings have IDs (for backward compatibility)
    this.settings.tagMappings.forEach(mapping => {
      if (!mapping.id) {
        mapping.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      }
      
      // Ensure all mappings have matchMode (for backward compatibility)
      if (!mapping.hasOwnProperty('matchMode')) {
        mapping.matchMode = 'all'; // Default to 'all' for backward compatibility
      }
    });
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
