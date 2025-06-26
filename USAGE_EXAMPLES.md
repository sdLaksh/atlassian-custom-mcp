# Confluence MCP Server - Usage Examples

Complete examples showing how to use the enhanced Confluence MCP server for different scenarios.

## 🎯 Perfect Copilot Prompts

### Complete Documentation Export
```
@copilot Download page tree with all child pages and attachments from confluence page 123456789 to confluence_content folder. Create Markdown files with embedded images referencing attachments/ folder. Make it a complete self-contained export.
```

### Single Page with All Assets
```
@copilot Download confluence page 123456789 with all attachments and save as Markdown with embedded images to confluence_content folder
```

### Search and Export
```
@copilot Search confluence for "API documentation" then download the main page with all attachments as Markdown
```

### Space Backup
```
@copilot Export entire confluence space starting from page 123456789. Download all pages and images, create Markdown files with proper image embedding.
```

## 📋 Step-by-Step Examples

### Example 1: Email Digest Documentation Export

**User Request:**
> "Download page tree with all child pages and attachments from confluence_content folder. Page ID: 23899734093"

**What Happens:**
1. Copilot extracts page ID: `23899734093`
2. Gets root page info → "Email Digest" folder in "ALYNE" space
3. Searches for child pages: Technical Design, Deploy Guide, etc.
4. Downloads each page with all images
5. Creates Markdown files with embedded images
6. Saves to `confluence_content/` with shared `attachments/` folder

**Output Structure:**
```
confluence_content/
├── README.md
├── attachments/
│   ├── Screenshot_2025-02-18_at_12.53.25.png
│   ├── Screenshot_2025-04-09_at_12.48.07.png
│   └── ...more images
├── Email_Digest_Folder_23899734093.md
├── Technical_Design_23899734094.md
├── Deploy_Email_Digest_23899734095.md
└── hierarchy.json
```

### Example 2: API Documentation Backup

**User Request:**
> "Export our API documentation from confluence with all diagrams and screenshots embedded"

**Copilot Actions:**
1. Searches: `@copilot Search confluence for "API documentation"`
2. Finds main API page ID
3. Downloads: `@copilot Download page 456789123 with all attachments as Markdown`
4. Creates complete self-contained documentation

### Example 3: Team Onboarding Guide Export

**User Request:**
> "I need to create an offline copy of our team onboarding documentation from confluence"

**Recommended Flow:**
```
1. @copilot Search confluence for "onboarding" or "getting started"
2. @copilot Download page tree starting from [found-page-id] with all attachments to onboarding_docs folder
```

## 🔧 Command Line Examples

### Basic Page Download
```bash
node download-with-assets.js 123456789
# Downloads to ./downloads/ folder with HTML format
```

### Markdown Export to Specific Folder
```bash
node download-with-assets.js 123456789 ./confluence_content
# Downloads as Markdown to confluence_content folder
```

### Complete Hierarchy Export
```bash
node download-with-assets.js 123456789 ./confluence_content hierarchy
# Downloads entire page tree with all related pages
```

### Real Example with Email Digest
```bash
node download-with-assets.js 23899734093 ./confluence_content hierarchy
# Downloads the complete Email Digest documentation tree
```

## 📊 Expected Results

### What You Get:
- **Clean Markdown Files**: Easy to read and edit
- **Embedded Images**: `![screenshot.png](attachments/screenshot.png)`
- **Complete Metadata**: Page IDs, versions, modification dates
- **Offline Ready**: No external dependencies
- **Searchable Content**: Full-text search works locally

### File Naming Convention:
- **Pages**: `Page_Title_With_ID.md` (e.g., `Technical_Design_23899734094.md`)
- **Images**: Original filenames preserved (e.g., `Screenshot_2025-02-18_at_12.53.25.png`)
- **Folders**: Descriptive names based on content

## 🎭 Real Conversation Examples

### Scenario 1: Project Documentation Export
```
User: "I need to export our Email Digest project documentation from Confluence"
Copilot: "I'll help you export the Email Digest documentation. Let me search for it first."
→ Searches Confluence
→ Finds Email Digest folder (ID: 23899734093)
→ Downloads complete tree with 11 pages and 9 images
→ Creates confluence_content/ folder with embedded images
```

### Scenario 2: Troubleshooting Missing Images
```
User: "The exported documentation has broken image links"
Copilot: "Let me re-export with proper image embedding..."
→ Uses confluence_get_page_with_attachments with downloadAttachments: true
→ Saves images to attachments/ folder
→ Updates Markdown with correct relative paths
→ Result: Images display properly
```

### Scenario 3: Large Space Export
```
User: "Export everything from our DOCS space"
Copilot: "I'll export the documentation starting from the main page to avoid overwhelming the system..."
→ Finds space root page
→ Downloads up to 20 related pages
→ Creates structured export with all images
→ Provides README with complete page index
```

## ⚡ Pro Tips

### For Best Results:
1. **Be Specific**: Include page URLs or clear page titles
2. **Request Markdown**: Specify "Markdown format" for best results
3. **Include Images**: Always mention "with embedded images" or "with attachments"
4. **Name Output**: Specify folder like "confluence_content" for consistency

### Perfect Prompt Formula:
```
@copilot Download [page description] from confluence page [ID/URL] to [folder_name] folder. Create Markdown files with embedded images referencing attachments/ folder. Make it a complete self-contained export.
```

### Common Variations:
- "page tree with all child pages" → Downloads hierarchy
- "with all attachments" → Includes images and files  
- "as Markdown" → Clean Markdown output
- "self-contained export" → Everything needed for offline use

## 🛠️ Advanced Usage

### Custom CQL Searches:
```
@copilot Search confluence using CQL: space = "DOCS" AND title ~ "api" AND type = "page"
```

### Selective Downloads:
```
@copilot Download only pages modified in the last week from space "DOCS"
```

### Batch Operations:
```
@copilot Download multiple confluence pages: 123456789, 987654321, 456789123 with all their attachments
```

## 📈 Success Metrics

### What Success Looks Like:
- ✅ All images display correctly in Markdown viewers
- ✅ Documentation is completely self-contained
- ✅ File structure is logical and navigable
- ✅ No missing content or broken references
- ✅ README provides clear overview of exported content

### Quality Indicators:
- Image count matches between Confluence and export
- All pages have proper metadata
- Markdown syntax is clean and readable
- Attachments folder contains all referenced files
- hierarchy.json provides complete page inventory