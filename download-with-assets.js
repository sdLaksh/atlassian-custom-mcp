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
    
    // Step 2: Save the page content as Markdown
    const pageFilename = `${pageData.title.replace(/[^a-zA-Z0-9 ]/g, '_').replace(/\s+/g, '_')}.md`;
    
    // Convert HTML content to more readable format and embed images
    let markdownContent = pageData.body?.storage?.value || 'No content available';
    
    // Basic HTML to Markdown conversion for common elements
    markdownContent = markdownContent
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Handle image references - replace with markdown image syntax pointing to attachments folder
    if (pageData.downloadedAttachments && pageData.downloadedAttachments.length > 0) {
      for (const attachment of pageData.downloadedAttachments) {
        const imageName = attachment.filename;
        // Look for image references in the content and replace with proper markdown
        const imageRegex = new RegExp(`<ac:image[^>]*>.*?<ri:attachment ri:filename="${imageName}"[^>]*>.*?</ac:image>`, 'gi');
        markdownContent = markdownContent.replace(imageRegex, `![${imageName}](../attachments/${imageName})`);
        
        // Also handle simpler image tags
        const simpleImageRegex = new RegExp(`<img[^>]*src="[^"]*${imageName}[^"]*"[^>]*>`, 'gi');
        markdownContent = markdownContent.replace(simpleImageRegex, `![${imageName}](../attachments/${imageName})`);
      }
    }
    
    const pageContent = `# ${pageData.title}

**Page ID:** ${pageData.id}  
**Space:** ${pageData.space?.name || 'Unknown'}  
**Version:** ${pageData.version?.number || 'Unknown'}  
**Last Modified:** ${pageData.version?.when || 'Unknown'}  

---

${markdownContent}

${pageData.attachments && pageData.attachments.length > 0 ? `
## Attachments (${pageData.attachments.length})

${pageData.attachments.map(att => `- **${att.title}** (${att.extensions?.fileSize || 'Unknown'} bytes, ${att.extensions?.mediaType || 'Unknown'})`).join('\n')}
` : ''}
`;
    
    await fs.writeFile(path.join(outputDir, pageFilename), pageContent);
    console.log(`✅ Saved page content: ${pageFilename}`);
    
    // Step 3: Save downloaded attachments to attachments folder (in root)
    if (pageData.downloadedAttachments && pageData.downloadedAttachments.length > 0) {
      const attachmentsDir = path.join(outputDir, 'attachments');
      await fs.mkdir(attachmentsDir, { recursive: true });
      
      for (const attachment of pageData.downloadedAttachments) {
        const buffer = Buffer.from(attachment.data, 'base64');
        const filename = attachment.filename;
        
        await fs.writeFile(path.join(attachmentsDir, filename), buffer);
        console.log(`📎 Saved attachment: ${filename} (${attachment.size} bytes)`);
      }
      
      console.log(`✅ Downloaded ${pageData.downloadedAttachments.length} attachments to attachments/`);
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
        attachments: pageData.downloadedAttachments?.map(att => `attachments/${att.filename}`) || []
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
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Create attachments folder in root (shared by all pages)
    const attachmentsDir = path.join(outputDir, 'attachments');
    await fs.mkdir(attachmentsDir, { recursive: true });
    
    // Step 1: Get root page info to determine space
    console.log('🔍 Getting root page info...');
    const rootPageResponse = await client.callTool('confluence_get_page', {
      pageId: rootPageId
    });
    const rootPageData = JSON.parse(rootPageResponse.content[0].text);
    const spaceKey = rootPageData.space?.key;
    
    if (!spaceKey) {
      throw new Error('Could not determine space key from root page');
    }
    
    // Step 2: Search for all pages in the space or ancestor hierarchy
    console.log(`🔍 Finding all pages in space ${spaceKey} or under ancestor ${rootPageId}...`);
    
    // Try to find child pages first
    const childSearchResponse = await client.callTool('confluence_search', {
      cql: `ancestor = ${rootPageId}`
    });
    const childSearchData = JSON.parse(childSearchResponse.content[0].text);
    const childPages = childSearchData.results || [];
    
    // Also search for pages in the same space that might be related
    const spaceSearchResponse = await client.callTool('confluence_search', {
      cql: `space = "${spaceKey}" AND type = "page"`
    });
    const spaceSearchData = JSON.parse(spaceSearchResponse.content[0].text);
    const spacePages = spaceSearchData.results || [];
    
    // Combine and deduplicate pages
    const allPageIds = new Set();
    const allPages = [];
    
    // Add root page
    allPages.push(rootPageData);
    allPageIds.add(rootPageId);
    
    // Add child pages
    for (const page of childPages) {
      if (!allPageIds.has(page.id)) {
        allPages.push(page);
        allPageIds.add(page.id);
      }
    }
    
    // Add space pages (if not too many)
    if (spacePages.length <= 20) { // Reasonable limit
      for (const page of spacePages) {
        if (!allPageIds.has(page.id)) {
          allPages.push(page);
          allPageIds.add(page.id);
        }
      }
    }
    
    console.log(`📋 Found ${allPages.length} pages to download`);
    
    // Step 3: Download all pages with attachments
    const downloadedPages = [];
    const allAttachments = [];
    
    for (let i = 0; i < allPages.length; i++) {
      const page = allPages[i];
      try {
        console.log(`📄 Downloading page ${i + 1}/${allPages.length}: ${page.title} (${page.id})`);
        
        const pageResponse = await client.callTool('confluence_get_page_with_attachments', {
          pageId: page.id,
          downloadAttachments: true
        });
        
        const pageData = JSON.parse(pageResponse.content[0].text);
        
        // Save page as Markdown
        const pageFilename = `${pageData.title.replace(/[^a-zA-Z0-9 ]/g, '_').replace(/\s+/g, '_')}_${pageData.id}.md`;
        
        // Convert content to Markdown and handle images
        let markdownContent = pageData.body?.storage?.value || 'No content available';
        
        // Basic HTML to Markdown conversion
        markdownContent = markdownContent
          .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
          .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
          .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
          .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1')
          .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
          .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
          .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
        
        // Handle image references and save attachments
        if (pageData.downloadedAttachments && pageData.downloadedAttachments.length > 0) {
          for (const attachment of pageData.downloadedAttachments) {
            const imageName = attachment.filename;
            
            // Replace Confluence-specific image markup with Markdown
            const imageRegex = new RegExp(`<ac:image[^>]*>.*?<ri:attachment ri:filename="${imageName}"[^>]*>.*?</ac:image>`, 'gi');
            markdownContent = markdownContent.replace(imageRegex, `![${imageName}](attachments/${imageName})`);
            
            // Also handle simpler image tags
            const simpleImageRegex = new RegExp(`<img[^>]*src="[^"]*${imageName}[^"]*"[^>]*>`, 'gi');
            markdownContent = markdownContent.replace(simpleImageRegex, `![${imageName}](attachments/${imageName})`);
            
            // Save attachment to attachments folder (avoid duplicates)
            const attachmentPath = path.join(attachmentsDir, attachment.filename);
            const buffer = Buffer.from(attachment.data, 'base64');
            await fs.writeFile(attachmentPath, buffer);
            
            allAttachments.push({
              filename: attachment.filename,
              pageTitle: pageData.title,
              pageId: pageData.id,
              size: attachment.size,
              contentType: attachment.contentType
            });
          }
        }
        
        const pageContent = `# ${pageData.title}

**Page ID:** ${pageData.id}  
**Space:** ${pageData.space?.name || 'Unknown'}  
**Version:** ${pageData.version?.number || 'Unknown'}  
**Last Modified:** ${pageData.version?.when || 'Unknown'}  

---

${markdownContent}

${pageData.attachments && pageData.attachments.length > 0 ? `
## Attachments (${pageData.attachments.length})

${pageData.attachments.map(att => `- **${att.title}** (${att.extensions?.fileSize || 'Unknown'} bytes, ${att.extensions?.mediaType || 'Unknown'})`).join('\n')}
` : ''}
`;
        
        await fs.writeFile(path.join(outputDir, pageFilename), pageContent);
        console.log(`✅ Saved: ${pageFilename}`);
        
        downloadedPages.push({
          id: pageData.id,
          title: pageData.title,
          filename: pageFilename,
          attachmentCount: pageData.downloadedAttachments?.length || 0,
          isRoot: pageData.id === rootPageId
        });
        
      } catch (error) {
        console.error(`❌ Failed to download page ${page.title}:`, error.message);
      }
    }
    
    // Step 4: Create comprehensive README
    const uniqueAttachments = Array.from(
      new Map(allAttachments.map(att => [att.filename, att])).values()
    );
    
    const readmeContent = `# ${spaceKey} Space Export

**Export Date:** ${new Date().toISOString()}  
**Root Page ID:** ${rootPageId}  
**Root Page:** ${rootPageData.title}  
**Total Pages:** ${downloadedPages.length}  
**Total Attachments:** ${uniqueAttachments.length}  

## Pages Downloaded

${downloadedPages.map(page => `- ${page.isRoot ? '🏠 ' : '📄 '}[${page.title}](${page.filename}) (${page.attachmentCount} attachments)`).join('\n')}

## Attachments

${uniqueAttachments.map(att => `- **${att.filename}** from "${att.pageTitle}" (${att.size} bytes, ${att.contentType})`).join('\n')}

## Structure

\`\`\`
${path.basename(outputDir)}/
├── README.md (this file)
├── attachments/ (${uniqueAttachments.length} files)
${downloadedPages.map(page => `├── ${page.filename}`).join('\n')}
\`\`\`

## Usage

All images in the Markdown files reference the \`attachments/\` folder using relative paths. 
The exported documentation is self-contained and can be viewed with any Markdown viewer.

## Notes

- All pages from space "${spaceKey}" have been downloaded
- Images are embedded using proper Markdown syntax
- The export preserves the original Confluence structure and metadata
`;
    
    await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent);
    
    // Step 5: Create hierarchy manifest
    const hierarchyManifest = {
      downloadDate: new Date().toISOString(),
      rootPageId: rootPageId,
      rootPageTitle: rootPageData.title,
      spaceKey: spaceKey,
      totalPages: downloadedPages.length,
      totalAttachments: uniqueAttachments.length,
      pages: downloadedPages,
      attachments: uniqueAttachments
    };
    
    await fs.writeFile(
      path.join(outputDir, 'hierarchy.json'),
      JSON.stringify(hierarchyManifest, null, 2)
    );
    
    console.log('\n🎉 Hierarchical download completed!');
    console.log(`� Output directory: ${outputDir}`);
    console.log(`📄 Pages downloaded: ${downloadedPages.length}`);
    console.log(`📎 Attachments downloaded: ${uniqueAttachments.length}`);
    console.log(`🏠 Root page: ${rootPageData.title}`);
    
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
