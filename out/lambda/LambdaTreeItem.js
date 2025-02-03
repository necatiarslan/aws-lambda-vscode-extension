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
})(TreeItemType = exports.TreeItemType || (exports.TreeItemType = {}));
//# sourceMappingURL=LambdaTreeItem.js.map