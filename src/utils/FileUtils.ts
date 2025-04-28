import { App, TFile } from 'obsidian';

export class FileUtils {
  constructor(private app: App) {}

  /**
   * Extract tags from file content
   */
  public extractTags(content: string): string[] {
    const tags = [];
    
    // Extract inline hashtags
    const tagRegex = /#([\w-]+)/g;
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    
    // Extract frontmatter tags
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
    const frontmatterMatch = content.match(frontmatterRegex);
    
    if (frontmatterMatch && frontmatterMatch[1]) {
      const frontmatter = frontmatterMatch[1];
      // Look for tags field in frontmatter
      const tagsMatch = frontmatter.match(/tags:\s*(.*(?:\n\s*-.*)*)/);
      
      if (tagsMatch) {
        const tagsContent = tagsMatch[1].trim();
        
        if (tagsContent.startsWith('-')) {
          // Array format: tags:\n  - tag1\n  - tag2
          const arrayTagRegex = /-\s*([^\n]+)/g;
          let arrayMatch;
          while ((arrayMatch = arrayTagRegex.exec(tagsContent)) !== null) {
            tags.push(arrayMatch[1].trim());
          }
        } else if (tagsContent.startsWith('[') && tagsContent.endsWith(']')) {
          // Inline array format: tags: [tag1, tag2]
          const inlineArray = tagsContent.slice(1, -1).split(',');
          inlineArray.forEach(tag => {
            const trimmedTag = tag.trim();
            if (trimmedTag) tags.push(trimmedTag);
          });
        } else {
          // Single tag or comma-separated format: tags: tag1, tag2
          tagsContent.split(',').forEach(tag => {
            const trimmedTag = tag.trim();
            if (trimmedTag) tags.push(trimmedTag);
          });
        }
      }
    }
    
    // Return unique tags
    return [...new Set(tags)];
  }

  /**
   * Extract tags from a file
   */
  public async extractTagsFromFile(file: TFile): Promise<string[]> {
    try {
      const content = await this.app.vault.read(file);
      return this.extractTags(content);
    } catch (error) {
      console.error(`Error extracting tags from ${file.path}:`, error);
      return [];
    }
  }

  /**
   * Check if a file path is in an excluded folder
   */
  public isInExcludedFolder(filePath: string, excludedFolders: string[]): boolean {
    const normalizedFilePath = filePath.startsWith('/') ? filePath : '/' + filePath;
    
    return excludedFolders.some(folder => {
      const normalizedFolder = folder.startsWith('/') ? folder : '/' + folder;
      return normalizedFilePath.startsWith(normalizedFolder);
    });
  }

  /**
   * Check if a file path is in a limited folder
   */
  public isInLimitedFolder(filePath: string, limitedFolders: string[]): boolean {
    if (limitedFolders.length === 0) return true;
    
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    return limitedFolders.some(folder => {
      const normalizedFolder = folder === '/' ? '/' : folder.replace(/^\//, '');
      return normalizedFilePath.startsWith(normalizedFolder);
    });
  }
}
