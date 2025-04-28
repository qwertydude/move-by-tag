import { TagMapping, TagMappingMatch } from '../models/types';

export class TagMappingService {
  /**
   * Generate a unique ID for a tag mapping
   */
  public generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Find matching folders for a set of tags
   */
  public getTargetFolderForTags(fileTags: string[], tagMappings: TagMapping[]): TagMappingMatch[] {
    if (tagMappings.length === 0) {
      return [];
    }

    // Convert file tags to lowercase for case-insensitive matching
    const lowerFileTags = fileTags.map(tag => tag.toLowerCase());
    const matches: TagMappingMatch[] = [];

    // Check each mapping
    for (const mapping of tagMappings) {
      // Convert mapping tags to lowercase
      const lowerMappingTags = mapping.tags.map(tag => tag.toLowerCase());

      // Track which tags from the mapping were found in the file
      const matchedTags: string[] = [];

      // Check each tag in the mapping
      for (const mappingTag of mapping.tags) {
        const lowerMappingTag = mappingTag.toLowerCase();

        // Check if any file tag matches this mapping tag
        const matchingFileTag = lowerFileTags.find(fileTag =>
          fileTag === lowerMappingTag ||
          fileTag === lowerMappingTag + 's' ||
          fileTag.slice(0, -1) === lowerMappingTag
        );

        if (matchingFileTag) {
          matchedTags.push(mappingTag);
        }
      }

      // Determine match mode (default to 'all' for backward compatibility)
      const matchMode = mapping.matchMode || 'all';
      
      // Check if we have a match based on the match mode
      const isMatch = matchMode === 'any' 
        ? matchedTags.length > 0  // For 'any' mode, at least one tag must match
        : matchedTags.length === mapping.tags.length; // For 'all' mode, all tags must match
      
      if (isMatch) {
        matches.push({ mapping, matchedTags });
      }
    }

    return matches;
  }
}
