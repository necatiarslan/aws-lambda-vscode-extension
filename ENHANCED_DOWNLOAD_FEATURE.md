# Enhanced Download Lambda Code Feature

## Overview
Download Lambda function code and optionally unzip it with automatic code path setup.

## Complete Workflow

### Step 1: Download
1. Click ☁️ (cloud-download) icon on the Code node
2. Choose download location (workspace or custom)
3. File downloads as `{LambdaName}.zip`

### Step 2: Unzip Decision
After download completes, you'll see a dialog with 3 options:

#### Option 1: "Yes, Unzip" ✅ **RECOMMENDED**
- Extracts ZIP file to a folder named `{LambdaName}`
- Shows extraction success message
- Proceeds to Step 3 (Auto Code Path)

#### Option 2: "No, Keep ZIP"
- Keeps the ZIP file as-is
- Shows save location
- Ends workflow

#### Option 3: "Open Folder"
- Opens the download location in file explorer
- Does NOT unzip
- Ends workflow

### Step 3: Auto Code Path Setup (After Unzip)

#### Single File/Folder Detected
If the ZIP contains only ONE item:
```
Dialog: "Found single file/folder: 'index.js'. Set as code path?"
Options: [Yes] [No]
```

If you click **Yes**:
- ✅ Code path is automatically set to that file/folder
- ✅ Tree view refreshes to show the path
- ✅ Ready to use "Update Lambda Codes" feature

#### Multiple Files Detected
If the ZIP contains multiple items:
```
Dialog: "Found 5 items. Set extracted folder as code path?"
Options: [Yes] [No]
```

If you click **Yes**:
- ✅ Code path is set to the extraction folder
- ✅ Tree view refreshes to show the path
- ✅ Ready to use "Update Lambda Codes" feature

### Step 4: Open Extracted Folder (Optional)
After auto code path setup:
```
Dialog: "Do you want to open the extracted folder?"
Options: [Open Folder] [Cancel]
```

- **Open Folder**: Opens extraction folder in file explorer
- **Cancel**: Completes the workflow

## File Structure Examples

### Example 1: Single JavaScript File
```
my-lambda.zip
└── index.js

After extraction:
my-lambda/
└── index.js  ← Auto-set as code path
```

### Example 2: Single Folder with Multiple Files
```
my-lambda.zip
└── src/
    ├── index.js
    ├── utils.js
    └── package.json

After extraction:
my-lambda/
└── src/  ← Auto-set as code path
    ├── index.js
    ├── utils.js
    └── package.json
```

### Example 3: Multiple Files
```
my-lambda.zip
├── index.js
├── utils.js
└── package.json

After extraction:
my-lambda/  ← Auto-set as code path (whole folder)
├── index.js
├── utils.js
└── package.json
```

## Features

### ✅ Smart Unzipping
- Uses `yauzl` library for reliable ZIP extraction
- Creates extraction folder with Lambda function name
- Handles nested directories correctly
- Filters out hidden files (.__MACOSX, .DS_Store)

### ✅ Intelligent Code Path Detection
- **Single Item**: Sets exact file/folder as code path
- **Multiple Items**: Sets extraction folder as code path
- **User Choice**: Always asks before setting code path
- **Auto Refresh**: Tree view updates immediately

### ✅ Complete Development Workflow
```
1. Download Lambda Code     ← Download from AWS
2. Unzip Files              ← Extract locally  
3. Set Code Path            ← Auto-configure (NEW!)
4. Edit Files              ← Make changes
5. Update Lambda Codes     ← Push to AWS
```

## User Prompts Summary

| Step | Prompt | Options | Default |
|------|--------|---------|---------|
| 1. Location | "Where do you want to save?" | Workspace/Downloads/Custom | Workspace |
| 2. Unzip | "Do you want to unzip it?" | Yes/No/Open Folder | - |
| 3a. Single Item | "Set '{item}' as code path?" | Yes/No | - |
| 3b. Multiple | "Set folder as code path?" | Yes/No | - |
| 4. Open | "Open extracted folder?" | Open/Cancel | - |

## Benefits

### 🚀 Speed
- One-click download and setup
- Automatic code path configuration
- No manual folder navigation

### 🎯 Accuracy
- Detects single vs multiple files
- Sets optimal code path automatically
- Filters system files

### 💡 Convenience
- Workspace-aware location selection
- Optional folder opening
- Tree view auto-refresh

## Technical Details

### Unzip Implementation
```typescript
// Uses yauzl for ZIP extraction
yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
    // Extracts all files and directories
    // Preserves folder structure
    // Handles read/write streams efficiently
});
```

### File Detection Logic
```typescript
// Read extraction folder
const files = fs.readdirSync(extractPath);

// Filter system files
const actualFiles = files.filter(f => 
    !f.startsWith('.') && f !== '__MACOSX'
);

// Determine code path
if (actualFiles.length === 1) {
    // Single file/folder → set as code path
} else {
    // Multiple items → set folder as code path
}
```

### Code Path Setting
```typescript
// Set the code path
node.CodePath = selectedPath;
this.treeDataProvider.AddCodePath(region, lambda, selectedPath);
this.SaveState();

// Refresh tree to show update
this.treeDataProvider.Refresh();
```

## Error Handling

### Download Errors
- Network issues
- AWS permissions
- Invalid Lambda function

### Extraction Errors
- Corrupted ZIP file
- Disk space issues
- File permission problems

All errors show clear messages and don't interrupt the workflow.

## Advanced Usage

### Scenario 1: Quick Edit Workflow
```
1. Download & Unzip
2. Auto-set code path (1 file detected)
3. Edit the file in VSCode
4. Click "Update Lambda Codes"
5. Changes deployed to AWS
```

### Scenario 2: Project Development
```
1. Download & Unzip
2. Auto-set code path (folder detected)
3. Open folder in VSCode workspace
4. Make changes to multiple files
5. Click "Update Lambda Codes"
6. Entire project deployed to AWS
```

### Scenario 3: Code Review
```
1. Download & Unzip
2. Don't set code path
3. Browse extracted files
4. Review code
5. Close when done
```

## Comparison: With vs Without Unzip

### Without Unzip (Old Behavior)
```
1. Download ZIP ✓
2. Manually locate ZIP file
3. Manually extract
4. Manually find extracted files
5. Manually set code path
6. Finally ready to edit
```

### With Unzip (New Behavior)
```
1. Download ZIP ✓
2. Click "Yes, Unzip" ✓
3. Click "Yes" to auto-set code path ✓
4. Ready to edit immediately! 🎉
```

**Time Saved**: ~2-3 minutes per download

## Tips

1. **Always Unzip**: Choose "Yes, Unzip" for best experience
2. **Trust Auto-Setup**: Let the extension set the code path automatically
3. **Workspace Downloads**: Download to workspace for easy access
4. **Version Control**: Add `*.zip` and extracted folders to `.gitignore`
5. **Batch Processing**: Download multiple Lambdas to same location

## Package Added
- `yauzl@^2.10.0` - Reliable ZIP file extraction library

## Commands
- `LambdaTreeView.DownloadLambdaCode` - Download and optionally unzip

## Icon
☁️ **cloud-download** - appears on Code node
