import { TFile } from 'obsidian';

export interface TagMapping {
  id: string;
  tags: string[];
  folder: string;
  matchMode?: 'all' | 'any';
}

export interface MoveByTagSettings {
  tagMappings: TagMapping[];
  excludedFolders: string[];
  limitedFolders: string[];
  confirmBeforeMove: boolean;
  enableLogging: boolean;
}

export const DEFAULT_SETTINGS: MoveByTagSettings = {
  tagMappings: [],
  excludedFolders: [],
  limitedFolders: [],
  confirmBeforeMove: true,
  enableLogging: false
};

export interface FileMovement {
  file: any; // TFile
  targetPath: string;
}

export interface TagMappingMatch {
  mapping: TagMapping;
  matchedTags: string[];
}

export enum MoveScope {
  SINGLE_FILE = 'single_file',
  CURRENT_FOLDER = 'current_folder',
  ALL_FOLDERS = 'all_folders'
}
