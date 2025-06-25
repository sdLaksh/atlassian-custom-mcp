# Enhanced Confluence MCP Server

A Model Context Protocol (MCP) server for Atlassian Confluence with complete asset download capabilities and smart collaborative editing features.

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
@copilot Search confluence for "documentation"
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

**➡️ [USAGE_GUIDE.md](./USAGE_GUIDE.md)** - Complete usage guide with examples, prompts, and all features

**➡️ [PATCH_UPDATE_GUIDE.md](./PATCH_UPDATE_GUIDE.md)** - Safe collaborative editing strategies

---

**✨ Ready!** See the usage guide for all features and examples.



