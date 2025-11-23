# Download Lambda Code Feature

## Overview
Download Lambda function code directly to your local machine with smart workspace detection.

## How to Use

### Step 1: Navigate to Code Node
1. Expand a Lambda function in the tree view
2. Find the "Code" node
3. Click the **☁️ (cloud-download)** icon

### Step 2: Choose Download Location

#### If Workspace is Open:
You'll see two options:
- **💼 Save to Workspace Root** - Saves to the root folder of your current workspace
- **📁 Choose Custom Location** - Opens folder picker to select any location

#### If No Workspace is Open:
You'll see two options:
- **📥 Save to Downloads** - Saves to your ~/Downloads folder
- **📁 Choose Custom Location** - Opens folder picker to select any location

### Step 3: Download Progress
- Loading spinner appears on the Code node
- File downloads from AWS Lambda
- Saved as `{LambdaName}.zip`

### Step 4: Open Downloaded File
After successful download, you'll see a notification:
- Click **"Open Folder"** - Opens the folder containing the downloaded file
- Click **"Cancel"** - Notification closes

## File Details

### Downloaded File
- **Format**: ZIP file
- **Name**: `{LambdaName}.zip`
- **Contents**: Complete Lambda function code as deployed in AWS

### Location Examples

With workspace open:
```
/Users/yourname/projects/my-workspace/my-lambda-function.zip
```

Without workspace (Downloads):
```
/Users/yourname/Downloads/my-lambda-function.zip
```

Custom location:
```
/Users/yourname/custom-folder/my-lambda-function.zip
```

## Features

### Smart Workspace Detection
- Automatically detects if VSCode has an open workspace
- Offers workspace root as the default save location
- Falls back to Downloads folder if no workspace

### User Choice
- Always asks where to save the file
- Provides quick options for common locations
- Allows custom folder selection

### Post-Download Actions
- Shows success message with full file path
- Option to open containing folder
- Uses native OS file explorer

## Error Handling

### Common Issues

**"No code location found"**
- Lambda function has no code deployed
- Check Lambda configuration in AWS Console

**"Failed to download"**
- Network connectivity issue
- Check your internet connection
- Verify AWS credentials

**"Failed to save"**
- Permission issue with target folder
- Disk space issue
- Choose a different location

## Technical Details

### API Call
Uses AWS Lambda SDK's `GetFunctionCommand` to retrieve:
- Lambda function details
- Code location URL (pre-signed S3 URL)

### Download Process
1. Gets Lambda function metadata
2. Extracts code location URL
3. Downloads ZIP file via HTTPS
4. Saves to selected location
5. Verifies file integrity

### Permissions Required
- AWS Lambda: `GetFunction` permission
- File System: Write permission to target folder

## Icon
☁️ **cloud-download** - appears as inline icon on Code node

## Command
`LambdaTreeView.DownloadLambdaCode`

## Context
Available on:
- Code node
- CodePath node (automatically uses parent Code node)

## Tips

1. **Workspace Organization**: Download to workspace root for easy access
2. **Version Control**: Add `.zip` to `.gitignore` to avoid committing downloaded code
3. **Extract Code**: Unzip the downloaded file to view/edit the code
4. **Batch Downloads**: Download multiple Lambda functions to the same folder
5. **Folder Navigation**: Use "Open Folder" to quickly locate the file

## Advanced Usage

### Workflow Example
```
1. Download Lambda code
2. Extract ZIP file
3. Make changes locally
4. Test changes
5. Re-zip the code
6. Upload using "Update Lambda Codes" feature
```

### Integration with Code Update
This feature works well with the existing:
- **Set Code Path** - Point to local code folder
- **Update Lambda Codes** - Upload changes back to Lambda

## Comparison with Set Code Path

| Feature | Download Lambda Code | Set Code Path |
|---------|---------------------|---------------|
| Direction | AWS → Local | Local → AWS |
| Format | ZIP file | Folder or ZIP |
| Action | Download | Set reference |
| Update | No | Yes (with Update button) |

Both features complement each other for a complete local development workflow.
