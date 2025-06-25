#!/usr/bin/env node

require('dotenv').config();
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fetch = require('node-fetch');
const { diffLines, applyPatch, createPatch } = require('diff');

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

// Helper function to calculate content differences
function calculateContentDiff(originalContent, newContent) {
  const diff = diffLines(originalContent, newContent);
  
  let hasChanges = false;
  let addedLines = 0;
  let removedLines = 0;
  
  for (const part of diff) {
    if (part.added) {
      hasChanges = true;
      addedLines += part.count || 0;
    } else if (part.removed) {
      hasChanges = true;
      removedLines += part.count || 0;
    }
  }
  
  return {
    hasChanges,
    addedLines,
    removedLines,
    diff,
    changesSummary: hasChanges ? `+${addedLines} -${removedLines} lines` : 'No changes'
  };
}

async function handleConfluencePatchUpdate(pageId, title, newContent, originalVersion = null, forceUpdate = false) {
  const sanitizedPageId = validateInput(pageId, 'Page ID');
  const sanitizedTitle = validateInput(title, 'Title');
  const sanitizedNewContent = validateInput(newContent, 'New content');
  
  console.error(`🔍 Analyzing changes for page: ${sanitizedPageId}`);
  
  // Get the current page state
  const currentPage = await handleConfluenceGetPage(sanitizedPageId);
  const currentVersion = currentPage.version.number;
  const currentContent = currentPage.body?.storage?.value || '';
  
  // Check if page has been modified since our original version
  if (originalVersion && originalVersion !== currentVersion && !forceUpdate) {
    console.error(`⚠️ Page has been modified! Original: v${originalVersion}, Current: v${currentVersion}`);
    
    // Calculate what changed between versions
    const ourChanges = calculateContentDiff(currentContent, sanitizedNewContent);
    
    if (!ourChanges.hasChanges) {
      console.error(`✅ No changes needed - content is already up to date`);
      return {
        ...currentPage,
        updateStatus: 'no-changes',
        message: 'Content is already up to date'
      };
    }
    
    return {
      ...currentPage,
      updateStatus: 'conflict-detected',
      message: `Page was modified by someone else (v${originalVersion} → v${currentVersion}). Use forceUpdate: true to override.`,
      conflictDetails: {
        originalVersion,
        currentVersion,
        ourChanges: ourChanges.changesSummary,
        requiresPermission: true
      }
    };
  }
  
  // Calculate differences
  const changes = calculateContentDiff(currentContent, sanitizedNewContent);
  
  if (!changes.hasChanges) {
    console.error(`✅ No changes needed - content is identical`);
    return {
      ...currentPage,
      updateStatus: 'no-changes',
      message: 'Content is already up to date'
    };
  }
  
  console.error(`📝 Changes detected: ${changes.changesSummary}`);
  
  // Proceed with the update
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
        value: sanitizedNewContent,
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
  
  const result = await response.json();
  
  return {
    ...result,
    updateStatus: 'success',
    changes: changes.changesSummary,
    patchInfo: {
      addedLines: changes.addedLines,
      removedLines: changes.removedLines,
      originalVersion: currentVersion,
      newVersion: currentVersion + 1
    }
  };
}

async function handleConfluenceGetAttachments(pageId) {
  const sanitizedPageId = validateInput(pageId, 'Page ID');
  const url = `${process.env.CONFLUENCE_URL}/wiki/rest/api/content/${sanitizedPageId}/child/attachment`;
  
  console.error(`📎 Fetching attachments for page: ${sanitizedPageId}`);
  
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

async function handleConfluenceDownloadAttachment(attachmentId, filename) {
  const sanitizedAttachmentId = validateInput(attachmentId, 'Attachment ID');
  const sanitizedFilename = validateInput(filename, 'Filename');
  
  console.error(`⬇️ Downloading attachment: ${sanitizedFilename} (${sanitizedAttachmentId})`);
  
  const url = `${process.env.CONFLUENCE_URL}/wiki/rest/api/content/${sanitizedAttachmentId}/download`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getConfluenceHeaders()
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Confluence API error:', response.status, errorText);
    throw new Error(`Confluence API error: ${response.status} ${response.statusText}`);
  }
  
  // Convert response to base64 for transport
  const buffer = await response.buffer();
  const base64Data = buffer.toString('base64');
  
  return {
    filename: sanitizedFilename,
    contentType: response.headers.get('content-type'),
    size: buffer.length,
    data: base64Data
  };
}

async function handleConfluenceGetPageWithAttachments(pageId, downloadAttachments = false) {
  const sanitizedPageId = validateInput(pageId, 'Page ID');
  
  // Get the page content
  const page = await handleConfluenceGetPage(sanitizedPageId);
  
  // Get attachments list
  const attachments = await handleConfluenceGetAttachments(sanitizedPageId);
  
  // If downloadAttachments is true, download each attachment
  if (downloadAttachments && attachments.results && attachments.results.length > 0) {
    console.error(`📦 Downloading ${attachments.results.length} attachments...`);
    
    const downloadedAttachments = [];
    for (const attachment of attachments.results) {
      try {
        const downloadedAttachment = await handleConfluenceDownloadAttachment(
          attachment.id, 
          attachment.title
        );
        downloadedAttachments.push(downloadedAttachment);
      } catch (error) {
        console.error(`Failed to download attachment ${attachment.title}:`, error.message);
        // Continue with other attachments
      }
    }
    
    return {
      ...page,
      attachments: attachments.results,
      downloadedAttachments
    };
  }
  
  return {
    ...page,
    attachments: attachments.results
  };
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
        description: "Update an existing Confluence page (replaces entire content)",
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
      },
      {
        name: "confluence_patch_update",
        description: "Smart patch-based update that detects conflicts and calculates diffs",
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
            },
            originalVersion: {
              type: "number",
              description: "The version number you started editing from (for conflict detection)"
            },
            forceUpdate: {
              type: "boolean",
              description: "Force update even if conflicts are detected (default: false)",
              default: false
            }
          },
          required: ["pageId", "title", "content"]
        }
      },
      {
        name: "confluence_get_attachments",
        description: "Get all attachments for a Confluence page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "The ID of the Confluence page to get attachments from"
            }
          },
          required: ["pageId"]
        }
      },
      {
        name: "confluence_download_attachment",
        description: "Download a specific attachment from Confluence",
        inputSchema: {
          type: "object",
          properties: {
            attachmentId: {
              type: "string",
              description: "The ID of the attachment to download"
            },
            filename: {
              type: "string",
              description: "The filename of the attachment"
            }
          },
          required: ["attachmentId", "filename"]
        }
      },
      {
        name: "confluence_get_page_with_attachments",
        description: "Get a Confluence page with all its attachments listed and optionally downloaded",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "The ID of the Confluence page to retrieve"
            },
            downloadAttachments: {
              type: "boolean",
              description: "Whether to download all attachments (default: false)",
              default: false
            }
          },
          required: ["pageId"]
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
      case 'confluence_patch_update':
        validateInput(args.pageId, 'Page ID');
        validateInput(args.title, 'Title');
        validateInput(args.content, 'Content');
        result = await handleConfluencePatchUpdate(
          args.pageId, 
          args.title, 
          args.content, 
          args.originalVersion,
          args.forceUpdate || false
        );
        break;
      case 'confluence_get_attachments':
        validateInput(args.pageId, 'Page ID');
        result = await handleConfluenceGetAttachments(args.pageId);
        break;
      case 'confluence_download_attachment':
        validateInput(args.attachmentId, 'Attachment ID');
        validateInput(args.filename, 'Filename');
        result = await handleConfluenceDownloadAttachment(args.attachmentId, args.filename);
        break;
      case 'confluence_get_page_with_attachments':
        validateInput(args.pageId, 'Page ID');
        result = await handleConfluenceGetPageWithAttachments(args.pageId, args.downloadAttachments || false);
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
