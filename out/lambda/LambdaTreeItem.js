"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = exports.LambdaTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
class LambdaTreeItem extends vscode.TreeItem {
    constructor(text, treeItemType) {
        super(text);
        this.IsFav = false;
        this.Children = [];
        this.IsHidden = false;
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    refreshUI() {
        if (this.TreeItemType === TreeItemType.Lambda) {
            this.iconPath = new vscode.ThemeIcon('server-process');
            this.contextValue = "Lambda";
        }
        else if (this.TreeItemType === TreeItemType.Code) {
            this.iconPath = new vscode.ThemeIcon('file-code');
            this.contextValue = "Code";
        }
        else if (this.TreeItemType === TreeItemType.TriggerGroup) {
            this.iconPath = new vscode.ThemeIcon('run-all');
            this.contextValue = "TriggerGroup";
        }
        else if (this.TreeItemType === TreeItemType.TriggerConfig) {
            this.iconPath = new vscode.ThemeIcon('run-all');
            this.contextValue = "TriggerConfig";
        }
        else if (this.TreeItemType === TreeItemType.LogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogGroup";
        }
        else if (this.TreeItemType === TreeItemType.LogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogStream";
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
            this.contextValue = "Other";
        }
    }
    IsAnyChidrenFav() {
        return this.IsAnyChidrenFavInternal(this);
    }
    IsAnyChidrenFavInternal(node) {
        for (var n of node.Children) {
            if (n.IsFav) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsAnyChidrenFavInternal(n);
            }
        }
        return false;
    }
    IsFilterStringMatch(FilterString) {
        if (this.Text.includes(FilterString)) {
            return true;
        }
        if (this.IsFilterStringMatchAnyChildren(this, FilterString)) {
            return true;
        }
        return false;
    }
    IsFilterStringMatchAnyChildren(node, FilterString) {
        for (var n of node.Children) {
            if (n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.Lambda?.includes(FilterString)) {
                return true;
            }
            else if (n.Children.length > 0) {
                return this.IsFilterStringMatchAnyChildren(n, FilterString);
            }
        }
        return false;
    }
}
exports.LambdaTreeItem = LambdaTreeItem;
var TreeItemType;
(function (TreeItemType) {
    TreeItemType[TreeItemType["Lambda"] = 1] = "Lambda";
    TreeItemType[TreeItemType["Code"] = 2] = "Code";
    TreeItemType[TreeItemType["LogGroup"] = 3] = "LogGroup";
    TreeItemType[TreeItemType["LogStream"] = 4] = "LogStream";
    TreeItemType[TreeItemType["TriggerGroup"] = 5] = "TriggerGroup";
    TreeItemType[TreeItemType["TriggerConfig"] = 6] = "TriggerConfig";
})(TreeItemType = exports.TreeItemType || (exports.TreeItemType = {}));
//# sourceMappingURL=LambdaTreeItem.js.map