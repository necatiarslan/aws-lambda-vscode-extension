# Lambda Function Tree Structure

```
📦 Lambda Function Name
├── 📄 Code
│   └── 📁 [Code Path if set]
├── ▶️ Trigger
│   ├── 🔸 With Payload
│   ├── ⚠️ Without Payload
│   └── 📄 [Saved Payload Files...]
├── 📋 Logs
│   └── 📄 [Log Streams...]
├── 🔧 Environment Variables  ← NEW
│   ├── KEY1 = value1
│   ├── KEY2 = value2
│   └── ... (click edit icon to update)
├── 🏷️ Tags  ← NEW
│   ├── Environment = production
│   ├── Team = backend
│   └── ... (all Lambda tags)
└── ℹ️ Info  ← NEW
    ├── Description: [function description]
    ├── Runtime: nodejs18.x
    ├── FunctionArn: arn:aws:lambda:...
    ├── MemorySize: 128
    ├── Timeout: 30
    ├── State: Active
    ├── LastModified: 2024-01-15...
    ├── LastUpdateStatus: Successful
    ├── LogFormat: JSON
    ├── LogGroup: /aws/lambda/...
    └── Version: $LATEST
```

## New Features

### 1. Environment Variables Node 🔧
- **Auto-loads** when expanded
- Shows all environment variables in `KEY = VALUE` format
- **Edit icon** (✏️) appears next to each variable
- Click edit to update the value
- **Refresh icon** (🔄) on the parent node to reload

### 2. Tags Node 🏷️
- **Auto-loads** when expanded
- Shows all Lambda tags in `TagKey = TagValue` format
- **Refresh icon** (🔄) on the parent node to reload
- Displays all tags assigned to the Lambda function

### 3. Info Node ℹ️
- **Auto-loads** when expanded
- Shows 11 key Lambda configuration properties
- Read-only display of important Lambda metadata
- **Refresh icon** (🔄) on the parent node to reload

## User Actions

### To Update an Environment Variable:
1. Expand Lambda Function
2. Expand "Environment Variables" node (auto-loads)
3. Click the ✏️ (edit) icon next to any variable
4. Enter new value in the input dialog
5. Variable updates automatically in AWS Lambda

### To View Tags:
1. Expand Lambda Function
2. Expand "Tags" node (auto-loads)
3. All tags appear as child nodes

### To View Info:
1. Expand Lambda Function
2. Expand "Info" node (auto-loads)
3. All information appears as child nodes

## Icons Reference

| Icon | Description |
|------|-------------|
| 🔧 | Environment Variables (wrench) |
| 🏷️ | Tags (tag) |
| ℹ️ | Info (info) |
| 🔄 | Refresh button |
| ✏️ | Edit button |
| 📊 | Info property (symbol-property) |
