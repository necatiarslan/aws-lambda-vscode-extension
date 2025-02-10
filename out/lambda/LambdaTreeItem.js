"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemType = exports.LambdaTreeItem = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
class LambdaTreeItem extends vscode.TreeItem {
    constructor(text, treeItemType) {
        super(text);
        this.IsFav = false;
        this.Lambda = "";
        this.Region = "";
        this.Children = [];
        this.IsHidden = false;
        this.IsRunning = false;
        this.Text = text;
        this.TreeItemType = treeItemType;
        this.refreshUI();
    }
    set CodePath(path) {
        if (this.TreeItemType !== TreeItemType.Code) {
            return;
        }
        this.codePath = path;
        if (path && this.Children.length === 0) {
            let node = new LambdaTreeItem(path, TreeItemType.CodePath);
            node.Lambda = this.Lambda;
            node.Region = this.Region;
            node.Parent = this;
            this.Children.push(node);
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        else if (path && this.Children.length > 0) {
            let node = this.Children[0];
            node.label = path;
            node.Text = path;
        }
        else {
            this.Children = [];
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        //this.refreshUI();
    }
    get CodePath() {
        return this.codePath;
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
        else if (this.TreeItemType === TreeItemType.TriggerSavedPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket');
            this.contextValue = "TriggerSavedPayload";
        }
        else if (this.TreeItemType === TreeItemType.TriggerWithPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-dot');
            this.contextValue = "TriggerWithPayload";
        }
        else if (this.TreeItemType === TreeItemType.TriggerFilePayload) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "TriggerFilePayload";
        }
        else if (this.TreeItemType === TreeItemType.TriggerNoPayload) {
            this.iconPath = new vscode.ThemeIcon('bracket-error');
            this.contextValue = "TriggerNoPayload";
        }
        else if (this.TreeItemType === TreeItemType.ResponsePayload) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "ResponsePayload";
        }
        else if (this.TreeItemType === TreeItemType.LogGroup) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogGroup";
        }
        else if (this.TreeItemType === TreeItemType.LogStream) {
            this.iconPath = new vscode.ThemeIcon('output');
            this.contextValue = "LogStream";
        }
        else if (this.TreeItemType === TreeItemType.CodePath) {
            this.iconPath = new vscode.ThemeIcon('file');
            this.contextValue = "CodePath";
        }
        else if (this.TreeItemType === TreeItemType.EnvironmentVariableGroup) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariableGroup";
        }
        else if (this.TreeItemType === TreeItemType.EnvironmentVariable) {
            this.iconPath = new vscode.ThemeIcon('wrench');
            this.contextValue = "EnvironmentVariable";
        }
        else {
            this.iconPath = new vscode.ThemeIcon('circle-outline');
            this.contextValue = "Other";
        }
        if (this.IsRunning) {
            this.iconPath = new vscode.ThemeIcon('loading~spin');
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
    TreeItemType[TreeItemType["TriggerSavedPayload"] = 6] = "TriggerSavedPayload";
    TreeItemType[TreeItemType["CodePath"] = 7] = "CodePath";
    TreeItemType[TreeItemType["TriggerNoPayload"] = 8] = "TriggerNoPayload";
    TreeItemType[TreeItemType["TriggerWithPayload"] = 9] = "TriggerWithPayload";
    TreeItemType[TreeItemType["TriggerFilePayload"] = 10] = "TriggerFilePayload";
    TreeItemType[TreeItemType["ResponsePayload"] = 11] = "ResponsePayload";
    TreeItemType[TreeItemType["EnvironmentVariableGroup"] = 12] = "EnvironmentVariableGroup";
    TreeItemType[TreeItemType["EnvironmentVariable"] = 13] = "EnvironmentVariable";
})(TreeItemType = exports.TreeItemType || (exports.TreeItemType = {}));
//# sourceMappingURL=LambdaTreeItem.js.map