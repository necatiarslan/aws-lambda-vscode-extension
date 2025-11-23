# Quick Reference Guide - Environment Variables & Tags

## Environment Variables Operations

| Operation | Icon | Steps |
|-----------|------|-------|
| **View** | 🔧 | 1. Expand Lambda function<br>2. Click "Environment Variables" node |
| **Add** | ➕ | 1. Click ➕ on Environment Variables group<br>2. Enter name<br>3. Enter value |
| **Update** | ✏️ | 1. Click ✏️ on specific variable<br>2. Enter new value |
| **Remove** | 🗑️ | 1. Click 🗑️ on specific variable<br>2. Confirm deletion |
| **Refresh** | 🔄 | 1. Click 🔄 on Environment Variables group |

## Tags Operations

| Operation | Icon | Steps |
|-----------|------|-------|
| **View** | 🏷️ | 1. Expand Lambda function<br>2. Click "Tags" node |
| **Add** | ➕ | 1. Click ➕ on Tags group<br>2. Enter key<br>3. Enter value |
| **Update** | ✏️ | 1. Click ✏️ on specific tag<br>2. Enter new value |
| **Remove** | 🗑️ | 1. Click 🗑️ on specific tag<br>2. Confirm deletion |
| **Refresh** | 🔄 | 1. Click 🔄 on Tags group |

## Info Operations

| Operation | Icon | Steps |
|-----------|------|-------|
| **View** | ℹ️ | 1. Expand Lambda function<br>2. Click "Info" node |
| **Refresh** | 🔄 | 1. Click 🔄 on Info group |

## Available Actions by Node Type

### Environment Variables Group Node
- 🔄 Refresh
- ➕ Add

### Individual Environment Variable Node
- ✏️ Update
- 🗑️ Remove

### Tags Group Node
- 🔄 Refresh
- ➕ Add

### Individual Tag Node
- ✏️ Update
- 🗑️ Remove

### Info Group Node
- 🔄 Refresh

## Command Names (for keyboard shortcuts)

```
LambdaTreeView.LoadEnvironmentVariables
LambdaTreeView.AddEnvironmentVariable
LambdaTreeView.UpdateEnvironmentVariable
LambdaTreeView.RemoveEnvironmentVariable

LambdaTreeView.LoadTags
LambdaTreeView.AddTag
LambdaTreeView.UpdateTag
LambdaTreeView.RemoveTag

LambdaTreeView.LoadInfo
```

## Input Prompts

### Add Environment Variable
1. "Enter Environment Variable Name (e.g., API_KEY)"
2. "Enter Environment Variable Value"

### Update Environment Variable
1. "Enter New Value for {VARIABLE_NAME}"

### Remove Environment Variable
1. Confirmation: "Are you sure you want to remove environment variable "{VARIABLE_NAME}"?"

### Add Tag
1. "Enter Tag Key (e.g., Environment)"
2. "Enter Tag Value (e.g., Production)"

### Update Tag
1. "Enter New Value for {TAG_KEY}"

### Remove Tag
1. Confirmation: "Are you sure you want to remove tag "{TAG_KEY}"?"

## Success Messages

- ✅ "Environment Variable Added Successfully"
- ✅ "Environment Variable Updated Successfully"
- ✅ "Environment Variable Removed Successfully"
- ✅ "Tag Added Successfully"
- ✅ "Tag Updated Successfully"
- ✅ "Tag Removed Successfully"

## Tips

1. **Canceling Operations**: Press `Esc` or leave input blank to cancel
2. **Confirmation Dialogs**: Delete operations require confirmation
3. **Auto-refresh**: Tree automatically refreshes after successful operations
4. **Loading Indicators**: Spinner icon shows during API operations
5. **Error Messages**: Check output panel for detailed error information
