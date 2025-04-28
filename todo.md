- Command to move files in current folder with option for child folders

# Move by Tag Plugin Roadmap

This document outlines potential improvements and new features for the "Move by Tag" Obsidian plugin.

## UI/UX Improvements

1. **Dark/Light Mode Optimization**: Ensure all UI elements look good in both dark and light themes by using Obsidian's CSS variables consistently.

2. **Keyboard Shortcuts**: Add configurable keyboard shortcuts for common operations like creating a new rule or moving the current file.

3. **Drag and Drop**: Allow users to reorder tag mappings in the settings via drag and drop for better organization.

4. **Bulk Operations**: Add the ability to select multiple tag mappings for bulk deletion or modification.

## Core Functionality Enhancements

1. **Rule Testing**: Add a "Test Rule" button that shows which files would be affected by a rule without actually moving them.

2. **Rule Templates**: Allow users to save and load rule templates for common file organization patterns.

3. **Conditional Rules**: Extend rules to support more complex conditions beyond just tags (e.g., file creation date, content type, frontmatter properties).

Add all/any switch

4. **Scheduled Moves**: Allow users to schedule automatic file movements at specific times or intervals.

5. **Move History**: Maintain a history of file movements with the ability to undo recent moves.

## Integration Improvements

1. **Folder Templates**: When creating a new rule, offer to create a template for the destination folder structure.

2. **Tag Suggestions**: When creating a rule, suggest tags based on frequency of use in the vault.

3. **Integration with Dataview**: If the user has Dataview installed, allow creating rules based on Dataview queries.

4. **Conflict Resolution Strategies**: Provide more options for handling file name conflicts (auto-rename, versioning, etc.).

## Advanced Features

1. **Rule Priorities**: Allow users to set priorities for rules to determine which rule takes precedence when multiple rules match.

2. **Smart Tag Detection**: Implement fuzzy matching or synonyms for tags to make rules more flexible.

3. **Regex Support**: Allow using regular expressions in tag rules for more powerful pattern matching.

4. **Batch Processing**: Add a feature to process files in batches to avoid performance issues with large vaults.

5. **Export/Import Rules**: Allow users to export and import rule configurations to share between vaults or with other users.

6. **Cascade option**: When moving on current folder, present option to apply move on child folders as well.

7. **Create folder**: Prompt to create folder if doesn't exist when adding rule

## Documentation and Onboarding

1. **Interactive Tutorial**: Create an interactive tutorial that guides new users through setting up their first tag rule.

2. **Rule Suggestions**: Analyze the user's vault and suggest potential rules based on existing tag patterns.

3. **Documentation Improvements**: Enhance documentation with examples, use cases, and best practices.