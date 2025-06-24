#!/usr/bin/env node

require('dotenv').config();
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fetch = require('node-fetch');

console.error('🔧 Starting Confluence MCP Server (stdio)...');
console.error(`📁 Working directory: ${process.cwd()}`);
console.error(`🔐 Environment loaded: ${process.env.CONFLUENCE_URL ? '✅' : '❌'} Confluence URL`);
console.error(`📝 Confluence URL: ${process.env.CONFLUENCE_URL || 'NOT SET'}`);
console.error(`👤 Username: ${process.env.ATLASSIAN_USERNAME || 'NOT SET'}`);
console.error(`🔑 API Token: ${process.env.ATLASSIAN_API_TOKEN ? '✅ Set' : '❌ Not Set'}`);

// Validate environment variables
if (!process.env.CONFLUENCE_URL || process.env.CONFLUENCE_URL === 'https://your-instance.atlassian.net/') {
  console.error('❌ CONFLUENCE_URL is not properly configured in .env file');
  process.exit(1);
}

if (!process.env.ATLASSIAN_USERNAME || process.env.ATLASSIAN_USERNAME === 'your-email@company.com') {
  console.error('❌ ATLASSIAN_USERNAME is not properly configured in .env file');
  process.exit(1);
}

if (!process.env.ATLASSIAN_API_TOKEN || process.env.ATLASSIAN_API_TOKEN === 'your-api-token-here') {
  console.error('❌ ATLASSIAN_API_TOKEN is not properly configured in .env file');
  process.exit(1);
}

// Input validation helper
function validateInput(input, type, required = true) {
  if (required && (!input || input.trim() === '')) {
    throw new Error(`${type} is required`);
  }
  
  if (input && typeof input !== 'string') {
    throw new Error(`${type} must be a string`);
  }
  
  // Basic XSS prevention
  if (input && (input.includes('<script') || input.includes('javascript:'))) {
    throw new Error(`${type} contains potentially unsafe content`);
  }
  
  return input?.trim();
}

// Helper: Create Confluence API headers
function getConfluenceHeaders() {
  const username = process.env.ATLASSIAN_USERNAME;
  const token = process.env.ATLASSIAN_API_TOKEN;
  
  if (!username || !token) {
    console.error('❌ Missing ATLASSIAN_USERNAME or ATLASSIAN_API_TOKEN in .env file');
    throw new Error('Missing ATLASSIAN_USERNAME or ATLASSIAN_API_TOKEN');
  }
  
  return {
    'Authorization': 'Basic ' + Buffer.from(`${username}:${token}`).toString('base64'),
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

// Tool implementations
async function handleConfluenceSearch(cql) {
  const sanitizedCql = validateInput(cql, 'CQL query');
  const url = `${process.env.CONFLUENCE_URL}/wiki/rest/api/content/search?cql=${encodeURIComponent(sanitizedCql)}`;
  
  console.error(`🔍 Searching Confluence with CQL: ${sanitizedCql}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getConfluenceHeaders()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Confluence API error:', response.status, errorText);
    throw new Error(`Confluence API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function handleConfluenceGetPage(pageId) {
  const sanitizedPageId = validateInput(pageId, 'Page ID');
  const url = `${process.env.CONFLUENCE_URL}/wiki/rest/api/content/${sanitizedPageId}?expand=body.storage,version,space`;
  
  console.error(`📖 Fetching Confluence page: ${sanitizedPageId}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getConfluenceHeaders()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Confluence API error:', response.status, errorText);
    throw new Error(`Confluence API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function handleConfluenceCreatePage(spaceKey, title, content) {
  const sanitizedSpaceKey = validateInput(spaceKey, 'Space key');
  const sanitizedTitle = validateInput(title, 'Title');
  const sanitizedContent = validateInput(content, 'Content');
  
  console.error(`✏️ Creating Confluence page: "${sanitizedTitle}" in space ${sanitizedSpaceKey}`);
  
  const url = `${process.env.CONFLUENCE_URL}/wiki/rest/api/content`;
  const body = {
    type: "page",
    title: sanitizedTitle,
    space: { key: sanitizedSpaceKey },
    body: {
      storage: {
        value: sanitizedContent,
        representation: "storage"
      }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getConfluenceHeaders(),
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Confluence API error:', response.status, errorText);
    throw new Error(`Confluence API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function handleConfluenceUpdatePage(pageId, title, content) {
  const sanitizedPageId = validateInput(pageId, 'Page ID');
  const sanitizedTitle = validateInput(title, 'Title');
  const sanitizedContent = validateInput(content, 'Content');
  
  console.error(`🔄 Updating Confluence page: ${sanitizedPageId}`);
  
  // First get the current page to get the version number
  const currentPage = await handleConfluenceGetPage(sanitizedPageId);
  const currentVersion = currentPage.version.number;
  
  const url = `${process.env.CONFLUENCE_URL}/wiki/rest/api/content/${sanitizedPageId}`;
  const body = {
    id: sanitizedPageId,
    type: "page",
    title: sanitizedTitle,
    version: {
      number: currentVersion + 1
    },
    body: {
      storage: {
        value: sanitizedContent,
        representation: "storage"
      }
    }
  };
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: getConfluenceHeaders(),
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Confluence API error:', response.status, errorText);
    throw new Error(`Confluence API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Create the server
const server = new Server(
  {
    name: "confluence-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "confluence_search",
        description: "Search Confluence pages using CQL (Confluence Query Language)",
        inputSchema: {
          type: "object",
          properties: {
            cql: {
              type: "string",
              description: "CQL query string to search for pages"
            }
          },
          required: ["cql"]
        }
      },
      {
        name: "confluence_get_page",
        description: "Get a specific Confluence page by ID",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "The ID of the Confluence page to retrieve"
            }
          },
          required: ["pageId"]
        }
      },
      {
        name: "confluence_create_page",
        description: "Create a new Confluence page",
        inputSchema: {
          type: "object",
          properties: {
            space_key: {
              type: "string",
              description: "The space key where the page will be created"
            },
            title: {
              type: "string",
              description: "The title of the new page"
            },
            content: {
              type: "string",
              description: "The HTML content of the page"
            }
          },
          required: ["space_key", "title", "content"]
        }
      },
      {
        name: "confluence_update_page",
        description: "Update an existing Confluence page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "The ID of the page to update"
            },
            title: {
              type: "string",
              description: "The new title of the page"
            },
            content: {
              type: "string",
              description: "The new HTML content of the page"
            }
          },
          required: ["pageId", "title", "content"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'confluence_search':
        validateInput(args.cql, 'CQL query');
        result = await handleConfluenceSearch(args.cql);
        break;
      case 'confluence_get_page':
        validateInput(args.pageId, 'Page ID');
        result = await handleConfluenceGetPage(args.pageId);
        break;
      case 'confluence_create_page':
        validateInput(args.space_key, 'Space key');
        validateInput(args.title, 'Title');
        validateInput(args.content, 'Content');
        result = await handleConfluenceCreatePage(args.space_key, args.title, args.content);
        break;
      case 'confluence_update_page':
        validateInput(args.pageId, 'Page ID');
        validateInput(args.title, 'Title');
        validateInput(args.content, 'Content');
        result = await handleConfluenceUpdatePage(args.pageId, args.title, args.content);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    console.error('Tool execution error:', error);
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✨ Confluence MCP Server (stdio) ready!');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
