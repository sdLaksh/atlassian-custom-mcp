# Enhanced Confluence MCP Server

A Model Context Protocol (MCP) server for Atlassian Confluence with **complete asset download capabilities**, **smart collaborative editing**, and **perfect Markdown export** with embedded images.

## ✨ Key Features

- **📎 Complete Asset Download**: Download all images, documents, and attachments with proper embedding
- **🔧 Smart Collaborative Editing**: Patch-based updates with conflict detection
- **📄 Perfect Markdown Export**: Clean Markdown files with embedded images
- **🌳 Hierarchical Downloads**: Export entire page trees and spaces
- **🛡️ Safe Operations**: Read-only by default, intelligent conflict prevention
- **🔍 Advanced Search**: Query pages using Confluence Query Language (CQL)

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.template` to `.env` and fill in your details:
```bash
cp .env.template .env
```

Edit `.env`:
```
CONFLUENCE_URL=https://your-instance.atlassian.net/
ATLASSIAN_USERNAME=your-email@company.com
ATLASSIAN_API_TOKEN=your-api-token-here
```

### 3. Add to VS Code Settings
Add to `~/Library/Application Support/Code/User/settings.json`:
```json
{
  "mcp": {
    "servers": {
      "atlassian-custom-mcp": {
        "command": "node",
        "args": ["/path/to/your/atlassian-custom-mcp/mcp-server-stdio.js"],
        "cwd": "/path/to/your/atlassian-custom-mcp"
      }
    }
  }
}
```

### 4. Restart VS Code & Test
```
@copilot Download page tree with all child pages and attachments from confluence page 123456789 to confluence_content folder. Create Markdown files with embedded images referencing attachments/ folder.
```

## 🎯 Perfect Prompts for Complete Export

### For Documentation Export:
```
@copilot Download page tree with all child pages and attachments from confluence page [PAGE_ID] to confluence_content folder. Create Markdown files with embedded images referencing attachments/ folder. Make it a complete self-contained export.
```

### For Single Page with Assets:
```
@copilot Download confluence page [PAGE_ID] with all attachments and save as Markdown with embedded images to confluence_content folder
```

## 🔑 Get Your API Token

1. Visit: [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create new token with label "VS Code Confluence MCP"
3. Copy token immediately (shown only once)
4. Add to `.env` file
5. Keep secure - never commit to version control

## 🧪 Verify Installation

```bash
npm test
```

Safe test with mocked API calls - no real Confluence requests.

## 📚 Complete Documentation

**➡️ [USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Complete usage guide with all features and prompts

**➡️ [ASSET_DOWNLOAD_GUIDE.md](./ASSET_DOWNLOAD_GUIDE.md)** - Perfect asset download and export strategies  

**➡️ [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - Real-world examples and workflows

**➡️ [PATCH_UPDATE_GUIDE.md](./PATCH_UPDATE_GUIDE.md)** - Safe collaborative editing strategies

## 💡 What Makes This Special

### 🖼️ **Perfect Image Embedding**
- Downloads actual binary image data (not just metadata)
- Converts Confluence image markup to proper Markdown syntax
- Creates `![image.png](attachments/image.png)` references
- Self-contained documentation that works offline

### 🌳 **Intelligent Content Discovery** 
- Finds complete page hierarchies automatically
- Searches for child pages and related content
- Handles both folder structures and space-wide exports
- Avoids duplicates and manages large spaces gracefully

### 📄 **Clean Markdown Output**
- Converts Confluence storage format to readable Markdown
- Preserves formatting (headings, bold, italic, code)
- Includes complete metadata (page IDs, versions, dates)
- Creates navigable file structure with meaningful names

### 🔒 **Zero Risk Operations**
- **READ-ONLY**: Never modifies your Confluence instance
- Smart conflict detection for collaborative editing
- Comprehensive input validation and XSS protection
- Extensive testing with mocked API calls

---

**✨ Ready!** See the usage guide for all features and examples.



