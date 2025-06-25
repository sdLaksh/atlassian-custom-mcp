# Confluence MCP Server - Complete Usage Guide

A comprehensive guide for using the enhanced Confluence MCP server with complete asset download capabilities and smart collaborative editing.

## ✨ Key Features

- **📎 Complete Asset Download**: Download all images, documents, and attachments
- **🔧 Smart Updates**: Patch-based updates with conflict detection  
- **🌳 Hierarchical Export**: Export entire page trees with all assets
- **🔍 Advanced Search**: Query pages using Confluence Query Language (CQL)
- **📄 Full CRUD**: Create, read, update, and delete Confluence content
- **🛡️ Safe Collaborative Editing**: Prevent overwrites with conflict detection

## 🛠️ Available Tools

| Tool | Purpose |
|------|---------|
| `confluence_search` | Search pages using CQL |
| `confluence_get_page` | Get page content by ID |
| `confluence_get_page_with_attachments` | Get page + download all assets |
| `confluence_get_attachments` | List all page attachments |
| `confluence_download_attachment` | Download specific attachments |
| `confluence_create_page` | Create new pages |
| `confluence_update_page` | Update existing pages (full replacement) |
| `confluence_patch_update` | Smart patch-based updates with conflict detection |

## 💬 Copilot Prompts by Category

### 🔍 **Search & Discovery**
```
@copilot Search confluence for pages containing "API documentation"
@copilot Search confluence using CQL: space = "DEV" AND title ~ "api"
@copilot Find confluence pages modified in the last week
```

### 📖 **Basic Page Operations**
```
@copilot Get confluence page 123456789 content only
@copilot Show me the details of confluence page 123456789
```

### 📎 **Asset Management**
```
@copilot Get confluence page 123456789 with all attachments downloaded
@copilot List all attachments on page 123456789 without downloading
@copilot Download specific attachment att987654321 as screenshot.png
@copilot Export confluence page with assets to new file
@copilot Download page tree with all child pages and attachments
```

### ✏️ **Page Creation**
```
@copilot Create new confluence page "My API Guide" in space "DEV"
@copilot Create new confluence page "Meeting Notes" in space "TEAM" with basic template
```

### 🔄 **Full Page Updates (Replace Everything)**
```
@copilot Update entire confluence page 123456789 with new content
@copilot Replace all content in confluence page 123456789
```

### 🔧 **Smart Patch Updates (Recommended for Collaboration)**
```
@copilot Smart patch update confluence page 123456789 with conflict detection
@copilot Update confluence page 123456789 using intelligent merge
@copilot Force update confluence page 123456789 overriding any conflicts
```

### 🌳 **Bulk & Export Operations**
```
@copilot Export confluence page hierarchy starting from 123456789
@copilot Download complete confluence space backup with all assets
@copilot Batch download multiple pages with their attachments
```

## 🚀 Quick Examples

### 1. Download Complete Page with Assets
```bash
node download-with-assets.js 123456789
```

### 2. Export Page Hierarchy
```bash
node download-with-assets.js 123456789 ./export hierarchy
```

## � Asset Download Features

### 1. List Attachments
```json
{
  "tool": "confluence_get_attachments",
  "arguments": {
    "pageId": "123456789"
  }
}
```

### 2. Download Specific Attachment
```json
{
  "tool": "confluence_download_attachment",
  "arguments": {
    "attachmentId": "att123456789",
    "filename": "screenshot.png"
  }
}
```

### 3. Get Page with All Assets
```json
{
  "tool": "confluence_get_page_with_attachments",
  "arguments": {
    "pageId": "123456789",
    "downloadAttachments": true
  }
}
```

## 📁 Output Structure

When downloading pages with assets:

```
downloads/
├── Page_Title.html          # Main page content
├── assets/                  # All images and attachments
│   ├── screenshot1.png
│   ├── document.pdf
│   └── diagram.jpg
└── manifest.json           # Download metadata
```

## 🎯 Common Use Cases

### Complete Page Backup
```javascript
const result = await mcp.callTool('confluence_get_page_with_attachments', {
  pageId: '123456789',
  downloadAttachments: true
});

// Save to files
const pageData = JSON.parse(result.content[0].text);
for (const attachment of pageData.downloadedAttachments) {
  const buffer = Buffer.from(attachment.data, 'base64');
  fs.writeFileSync(`./assets/${attachment.filename}`, buffer);
}
```

### Asset Inventory
```javascript
const attachments = await mcp.callTool('confluence_get_attachments', {
  pageId: '123456789'
});
console.log(`Found ${attachments.results.length} attachments`);
```

### Selective Download
```javascript
const attachments = await mcp.callTool('confluence_get_attachments', {
  pageId: '123456789'
});

const images = attachments.results.filter(att => 
  att.extensions.mediaType.startsWith('image/')
);

for (const image of images) {
  await mcp.callTool('confluence_download_attachment', {
    attachmentId: image.id,
    filename: image.title
  });
}
```

## 📋 Complete Tool Reference

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `confluence_search` | Search pages using CQL | `cql` - Query string |
| `confluence_get_page` | Get page content by ID | `pageId` - Page identifier |
| `confluence_get_page_with_attachments` | Get page + download assets | `pageId`, `downloadAttachments` |
| `confluence_get_attachments` | List page attachments | `pageId` - Page identifier |
| `confluence_download_attachment` | Download specific file | `attachmentId`, `filename` |
| `confluence_create_page` | Create new page | `space_key`, `title`, `content` |
| `confluence_update_page` | Replace entire page | `pageId`, `title`, `content` |
| `confluence_patch_update` | Smart collaborative update | `pageId`, `title`, `content`, `originalVersion`, `forceUpdate` |

## 🎯 Common Workflows

### Workflow 1: Complete Page Backup
1. Get page with assets: `confluence_get_page_with_attachments`
2. Save content and all attachments locally
3. Create manifest file for restoration

### Workflow 2: Safe Collaborative Editing
1. Get current page: `confluence_get_page` 
2. Note the version number
3. Make your changes
4. Use `confluence_patch_update` with version tracking
5. Handle conflicts if detected

### Workflow 3: Content Migration
1. Search for pages: `confluence_search`
2. Download each page with assets: `confluence_get_page_with_attachments`
3. Transform content as needed
4. Create new pages: `confluence_create_page`

### Workflow 4: Hierarchical Export
1. Find root page and children: `confluence_search` with `ancestor` CQL
2. Download each page with full assets
3. Maintain directory structure locally

## 🔧 Advanced Configuration

### Environment Variables
```bash
CONFLUENCE_URL=https://your-instance.atlassian.net/
ATLASSIAN_USERNAME=your-email@company.com
ATLASSIAN_API_TOKEN=your-api-token-here
```

### VS Code MCP Settings
```json
{
  "mcp": {
    "servers": {
      "atlassian-custom-mcp": {
        "command": "node",
        "args": ["/path/to/mcp-server-stdio.js"],
        "cwd": "/path/to/project"
      }
    }
  }
}
```

## 🚨 Important Security Notes

1. **API Token Security**: Never commit `.env` file to version control
2. **Rate Limiting**: Confluence has API rate limits - batch operations may be throttled
3. **Permissions**: You can only access content your account has permissions for
4. **Content Validation**: All inputs are sanitized to prevent XSS attacks
5. **Safe Testing**: Use `npm test` for safe validation with mocked API calls

## 💡 Pro Tips

- **Use patch updates** for collaborative environments to prevent overwrites
- **Always download with assets** for complete backups  
- **Use CQL for complex searches** - see [Confluence CQL documentation](https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/)
- **Test with mocks first** before making real API calls
- **Monitor file sizes** when downloading large attachments
- **Keep version numbers** for conflict detection in updates

Your enhanced MCP server provides enterprise-grade Confluence integration with complete asset management! 🚀
