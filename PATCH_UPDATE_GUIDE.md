# Intelligent Patch Updates - Confluence MCP Server

This guide explains the smart patch-based update system that prevents overwriting changes made by other users.

## 🚨 The Problem

Previously, when updating Confluence pages, the MCP server would:
1. Get the current page version
2. **Completely replace** all content
3. Risk overwriting changes made by other users

This could lead to **data loss** if multiple people were editing the same page.

## ✅ The Solution: Smart Patch Updates

The new `confluence_patch_update` tool provides:

### 🔍 **Conflict Detection**
- Tracks the original version you started editing from
- Detects if someone else modified the page while you were working
- Prevents accidental overwrites

### 📊 **Change Analysis**
- Calculates exactly what changed (lines added/removed)
- Shows a summary of modifications
- Only updates if there are actual changes

### 🤝 **User Permission System**
- Asks for explicit permission before overwriting conflicts
- Provides detailed conflict information
- Allows forced updates when needed

## 🛠️ How to Use

### Option 1: Basic Patch Update
```javascript
// Smart update with conflict detection
{
  "tool": "confluence_patch_update",
  "arguments": {
    "pageId": "123456789",
    "title": "Updated Title",
    "content": "<p>New content here</p>",
    "originalVersion": 5  // Version you started editing from
  }
}
```

### Option 2: Force Update (Override Conflicts)
```javascript
// Force update even if conflicts exist
{
  "tool": "confluence_patch_update", 
  "arguments": {
    "pageId": "123456789",
    "title": "Updated Title", 
    "content": "<p>New content here</p>",
    "originalVersion": 5,
    "forceUpdate": true  // Override any conflicts
  }
}
```

## 📋 Response Types

### ✅ Success Update
```json
{
  "updateStatus": "success",
  "changes": "+3 -1 lines",
  "patchInfo": {
    "addedLines": 3,
    "removedLines": 1,
    "originalVersion": 5,
    "newVersion": 6
  }
}
```

### ⚠️ Conflict Detected
```json
{
  "updateStatus": "conflict-detected",
  "message": "Page was modified by someone else (v5 → v7). Use forceUpdate: true to override.",
  "conflictDetails": {
    "originalVersion": 5,
    "currentVersion": 7,
    "ourChanges": "+10 -3 lines",
    "requiresPermission": true
  }
}
```

### 😴 No Changes Needed
```json
{
  "updateStatus": "no-changes",
  "message": "Content is already up to date"
}
```

## 🎯 Copilot Usage Examples

### Smart Update with Conflict Detection
```
@copilot Update confluence page 123456789 using smart patch method with conflict detection
```

### Force Update After Reviewing Conflicts
```
@copilot Force update confluence page 123456789 overriding any conflicts
```

### Check for Changes Before Updating
```
@copilot Analyze changes for confluence page 123456789 before updating
```

## 🔄 Workflow Comparison

### ❌ Old Workflow (Dangerous)
1. Get current page
2. Replace entire content
3. Hope nobody else made changes
4. **Risk data loss**

### ✅ New Workflow (Safe)
1. Get current page with version tracking
2. Calculate differences between versions
3. Detect conflicts with other users' changes
4. Ask permission before overwriting
5. Apply only necessary changes
6. **Preserve data integrity**

## 🎛️ Configuration Options

### `originalVersion` (Recommended)
- **Purpose**: Track the version you started editing from
- **Benefit**: Enables conflict detection
- **Usage**: Pass the version number from when you first retrieved the page

### `forceUpdate` (Use with Caution)
- **Purpose**: Override conflicts when you're sure about the changes
- **Risk**: Can overwrite other users' work
- **Usage**: Only use after reviewing conflict details

## 🚦 Best Practices

### ✅ DO:
- Always pass `originalVersion` when possible
- Review conflict details before forcing updates
- Use patch updates for collaborative environments
- Check the response status before assuming success

### ❌ DON'T:
- Use `forceUpdate: true` without reviewing conflicts
- Ignore conflict warnings
- Use old `confluence_update_page` for collaborative editing
- Update without tracking original versions

## 🔧 Technical Implementation

### Change Detection Algorithm
1. **Fetch Current State**: Get the latest page content and version
2. **Version Comparison**: Compare original vs current version numbers
3. **Content Diffing**: Use line-by-line diff to calculate changes
4. **Conflict Analysis**: Determine if changes would overwrite other work
5. **Smart Decision**: Proceed, warn, or request permission

### Diff Calculation
```javascript
const changes = diffLines(currentContent, newContent);
// Returns: { hasChanges, addedLines, removedLines, diff, changesSummary }
```

## 🎉 Benefits

### For Individual Users
- ✅ Never lose your changes due to conflicts
- ✅ See exactly what you're changing
- ✅ Confidence in collaborative editing

### For Teams
- ✅ Prevent accidental overwrites
- ✅ Transparent change tracking
- ✅ Safe collaborative workflows
- ✅ Audit trail of modifications

### For Administrators
- ✅ Reduced support tickets about lost changes
- ✅ Better content integrity
- ✅ Clearer update history

## 🚀 Migration Guide

### From `confluence_update_page` to `confluence_patch_update`

**Before:**
```javascript
await mcp.callTool('confluence_update_page', {
  pageId: '123456789',
  title: 'My Page',
  content: '<p>Updated content</p>'
});
```

**After:**
```javascript
// First, get the current page to track version
const currentPage = await mcp.callTool('confluence_get_page', {
  pageId: '123456789'
});

// Then use patch update with version tracking
await mcp.callTool('confluence_patch_update', {
  pageId: '123456789',
  title: 'My Page', 
  content: '<p>Updated content</p>',
  originalVersion: currentPage.version.number
});
```

## 🔮 Future Enhancements

- **Three-way merge**: Automatically merge non-conflicting changes
- **Visual diff display**: Show changes in a user-friendly format  
- **Change approval workflow**: Route conflicts to page owners
- **Automatic backup**: Save versions before major changes

Your Confluence MCP server now provides enterprise-grade conflict management for safe collaborative editing! 🎉
