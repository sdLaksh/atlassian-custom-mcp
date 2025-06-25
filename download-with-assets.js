#!/usr/bin/env node

/**
 * Example script showing how to download Confluence pages with all their assets
 * This demonstrates the enhanced MCP server capabilities for handling attachments
 */

const fs = require('fs').promises;
const path = require('path');

// Mock MCP client for demonstration - replace with actual MCP client calls
class MCPClient {
  async callTool(toolName, args) {
    console.log(`📞 Calling tool: ${toolName}`, args);
    // In practice, this would be an actual MCP client call
    // For now, returning mock data structure
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ mock: "data" }, null, 2)
      }]
    };
  }
}

async function downloadPageWithAssets(pageId, outputDir = './downloads') {
  const client = new MCPClient();
  
  console.log(`🚀 Starting download of page ${pageId} with all assets...`);
  
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Step 1: Get page with attachments
    console.log('📄 Fetching page content and attachments...');
    const pageResponse = await client.callTool('confluence_get_page_with_attachments', {
      pageId: pageId,
      downloadAttachments: true // This will download all attachments
    });
    
    const pageData = JSON.parse(pageResponse.content[0].text);
    
    // Step 2: Save the page content
    const pageFilename = `${pageData.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    const pageContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${pageData.title}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .page-meta { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        .attachments { border-top: 1px solid #ddd; margin-top: 40px; padding-top: 20px; }
        .attachment { margin: 10px 0; padding: 10px; background: #f9f9f9; }
    </style>
</head>
<body>
    <div class="page-meta">
        <h1>${pageData.title}</h1>
        <p><strong>Space:</strong> ${pageData.space?.name || 'Unknown'}</p>
        <p><strong>Page ID:</strong> ${pageData.id}</p>
        <p><strong>Version:</strong> ${pageData.version?.number || 'Unknown'}</p>
        <p><strong>Last Modified:</strong> ${pageData.version?.when || 'Unknown'}</p>
    </div>
    
    <div class="content">
        ${pageData.body?.storage?.value || 'No content available'}
    </div>
    
    ${pageData.attachments && pageData.attachments.length > 0 ? `
    <div class="attachments">
        <h2>Attachments (${pageData.attachments.length})</h2>
        ${pageData.attachments.map(att => `
            <div class="attachment">
                <strong>${att.title}</strong><br>
                <small>Size: ${att.extensions?.fileSize || 'Unknown'} | 
                Type: ${att.extensions?.mediaType || 'Unknown'}</small>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
    `;
    
    await fs.writeFile(path.join(outputDir, pageFilename), pageContent);
    console.log(`✅ Saved page content: ${pageFilename}`);
    
    // Step 3: Save downloaded attachments
    if (pageData.downloadedAttachments && pageData.downloadedAttachments.length > 0) {
      const assetsDir = path.join(outputDir, 'assets');
      await fs.mkdir(assetsDir, { recursive: true });
      
      for (const attachment of pageData.downloadedAttachments) {
        const buffer = Buffer.from(attachment.data, 'base64');
        const filename = attachment.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        await fs.writeFile(path.join(assetsDir, filename), buffer);
        console.log(`📎 Saved attachment: ${filename} (${attachment.size} bytes)`);
      }
      
      console.log(`✅ Downloaded ${pageData.downloadedAttachments.length} attachments to assets/`);
    }
    
    // Step 4: Create manifest file
    const manifest = {
      downloadDate: new Date().toISOString(),
      pageId: pageData.id,
      title: pageData.title,
      space: pageData.space?.name,
      version: pageData.version?.number,
      attachmentCount: pageData.attachments?.length || 0,
      downloadedAttachmentCount: pageData.downloadedAttachments?.length || 0,
      files: {
        page: pageFilename,
        assets: pageData.downloadedAttachments?.map(att => `assets/${att.filename}`) || []
      }
    };
    
    await fs.writeFile(
      path.join(outputDir, 'manifest.json'), 
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('✨ Download complete!');
    console.log(`📁 Files saved to: ${outputDir}`);
    console.log(`📄 Page: ${pageFilename}`);
    console.log(`📎 Assets: ${manifest.downloadedAttachmentCount} files in assets/`);
    
    return manifest;
    
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    throw error;
  }
}

async function downloadPageHierarchy(rootPageId, outputDir = './downloads') {
  const client = new MCPClient();
  
  console.log(`🌳 Starting hierarchical download from page ${rootPageId}...`);
  
  try {
    // Step 1: Find all child pages
    console.log('🔍 Finding child pages...');
    const searchResponse = await client.callTool('confluence_search', {
      cql: `ancestor = ${rootPageId}`
    });
    
    const searchData = JSON.parse(searchResponse.content[0].text);
    const childPages = searchData.results || [];
    
    // Step 2: Download root page
    await downloadPageWithAssets(rootPageId, path.join(outputDir, 'root'));
    
    // Step 3: Download each child page
    for (let i = 0; i < childPages.length; i++) {
      const childPage = childPages[i];
      console.log(`📄 Downloading child page ${i + 1}/${childPages.length}: ${childPage.title}`);
      
      const childDir = path.join(outputDir, 'children', childPage.id);
      await downloadPageWithAssets(childPage.id, childDir);
    }
    
    // Step 4: Create hierarchy manifest
    const hierarchyManifest = {
      downloadDate: new Date().toISOString(),
      rootPageId: rootPageId,
      totalPages: childPages.length + 1,
      structure: {
        root: rootPageId,
        children: childPages.map(p => ({
          id: p.id,
          title: p.title,
          path: `children/${p.id}`
        }))
      }
    };
    
    await fs.writeFile(
      path.join(outputDir, 'hierarchy.json'),
      JSON.stringify(hierarchyManifest, null, 2)
    );
    
    console.log('🎉 Hierarchical download complete!');
    console.log(`📁 Total pages downloaded: ${hierarchyManifest.totalPages}`);
    
    return hierarchyManifest;
    
  } catch (error) {
    console.error('❌ Hierarchical download failed:', error.message);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  const pageId = process.argv[2];
  const outputDir = process.argv[3] || './downloads';
  const mode = process.argv[4] || 'single'; // 'single' or 'hierarchy'
  
  if (!pageId) {
    console.log('Usage: node download-with-assets.js <pageId> [outputDir] [mode]');
    console.log('');
    console.log('Examples:');
    console.log('  node download-with-assets.js 123456789');
    console.log('  node download-with-assets.js 123456789 ./my-downloads');
    console.log('  node download-with-assets.js 123456789 ./hierarchy hierarchy');
    process.exit(1);
  }
  
  const downloadFunction = mode === 'hierarchy' ? downloadPageHierarchy : downloadPageWithAssets;
  
  downloadFunction(pageId, outputDir)
    .then(result => {
      console.log('📋 Download summary:', result);
    })
    .catch(error => {
      console.error('💥 Error:', error.message);
      process.exit(1);
    });
}

module.exports = {
  downloadPageWithAssets,
  downloadPageHierarchy
};
