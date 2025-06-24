# Minimal Confluence MCP Server

## Setup (3 steps only!)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure `.env`** (copy from `.env.template`):
   ```
   CONFLUENCE_URL=https://your-instance.atlassian.net/
   ATLASSIAN_USERNAME=your-email@company.com
   ATLASSIAN_API_TOKEN=your-api-token-here
   ```

3. **Update VS Code settings** (`~/Library/Application Support/Code/User/settings.json`):
   ```json
   "mcp": {
     "servers": {
       "atlassian-custom-mcp": {
         "command": "node",
         "args": ["/Users/lakshayasood/Downloads/alyne/atlassian-custom-mcp/mcp-server-stdio.js"],
         "cwd": "/Users/lakshayasood/Downloads/alyne/atlassian-custom-mcp"
       }
     }
   }
   ```

4. Open the settings.json and run the mcp server using run command

## Test

Restart VS Code completely, then in Copilot Chat:
```
@copilot Search confluence for pages containing "documentation"
```

## Files You Need
- `mcp-server-stdio.js` - The MCP server
- `.env` - Your credentials  
- `package.json` - Dependencies
- `README.md` - This file



## How to Generate Atlassian API Token

1. **Go to Atlassian Account Settings**:
   Visit [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

2. **Create API Token**:
   - Click "Create API token"
   - Give it a descriptive label (e.g., "VS Code Confluence MCP")
   - Click "Create"

3. **Copy the Token**:
   - Copy the generated token immediately (it won't be shown again)
   - Paste it into your `.env` file as `ATLASSIAN_API_TOKEN`

4. **Keep it Secure**:
   - Never share your API token
   - Never commit it to version control
   - Rotate tokens regularly for security

## How to Extend

Want to add new Confluence features? Use Copilot to help you:

1. **Open this repo in VS Code**
2. **Open Copilot Chat in agent mode**
3. **Use the `@workspace` command** to ask for specific API changes you need:

