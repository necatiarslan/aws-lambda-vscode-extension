"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewType = exports.LambdaTreeDataProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const LambdaTreeItem_1 = require("./LambdaTreeItem");
const LambdaTreeView_1 = require("./LambdaTreeView");
class LambdaTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.LambdaNodeList = [];
        this.ShortcutNodeList = [];
        this.LambdaList = [];
        this.ShortcutList = [["???", "???"]];
        this.ViewType = ViewType.Lambda;
        this.ShortcutList.splice(0, 1);
    }
    Refresh() {
        this._onDidChangeTreeData.fire();
    }
    GetLambdaList() {
        return this.LambdaList;
    }
    GetShortcutList() {
        return this.ShortcutList;
    }
    SetLambdaList(LambdaList) {
        this.LambdaList = LambdaList;
        this.LoadLambdaNodeList();
    }
    SetShortcutList(ShortcutList) {
        this.ShortcutList = ShortcutList;
        this.LoadShortcutNodeList();
    }
    AddLambda(Lambda) {
        if (this.LambdaList.includes(Lambda)) {
            return;
        }
        this.LambdaList.push(Lambda);
        this.LoadLambdaNodeList();
        this.Refresh();
    }
    RemoveLambda(Lambda) {
        for (let i = 0; i < this.ShortcutList.length; i++) {
            if (this.ShortcutList[i][0] === Lambda) {
                this.ShortcutList.splice(i, 1);
                i--;
            }
        }
        this.LoadShortcutNodeList();
        for (let i = 0; i < this.LambdaList.length; i++) {
            if (this.LambdaList[i] === Lambda) {
                this.LambdaList.splice(i, 1);
                i--;
            }
        }
        this.LoadLambdaNodeList();
        this.Refresh();
    }
    LoadLambdaNodeList() {
        this.LambdaNodeList = [];
        for (var lambda of this.LambdaList) {
            let treeItem = new LambdaTreeItem_1.LambdaTreeItem(lambda, LambdaTreeItem_1.TreeItemType.Lambda);
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            treeItem.Lambda = lambda;
            this.LambdaNodeList.push(treeItem);
        }
    }
    LoadShortcutNodeList() {
        this.ShortcutNodeList = [];
        for (var lg of this.ShortcutList) {
            let treeItem = new LambdaTreeItem_1.LambdaTreeItem(lg[1], LambdaTreeItem_1.TreeItemType.Shortcut);
            treeItem.Lambda = lg[0];
            treeItem.Shortcut = lg[1];
            this.ShortcutNodeList.push(treeItem);
        }
    }
    getChildren(node) {
        let result = [];
        return Promise.resolve(result);
    }
    GetNodesShortcut(node) {
        let result = [];
        result = this.GetShortcutNodes();
        return result;
    }
    GetNodesLambdaShortcut(node) {
        let result = [];
        if (!node) {
            result = this.GetLambdaNodes();
        }
        else if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.Lambda) {
            result = this.GetShortcutNodesParentLambda(node);
        }
        return result;
    }
    GetLambdaNodes() {
        var result = [];
        for (var node of this.LambdaNodeList) {
            if (LambdaTreeView_1.LambdaTreeView.Current && LambdaTreeView_1.LambdaTreeView.Current.FilterString && !node.IsFilterStringMatch(LambdaTreeView_1.LambdaTreeView.Current.FilterString)) {
                continue;
            }
            if (LambdaTreeView_1.LambdaTreeView.Current && LambdaTreeView_1.LambdaTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (LambdaTreeView_1.LambdaTreeView.Current && !LambdaTreeView_1.LambdaTreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    GetShortcutNodesParentLambda(LambdaNode) {
        var result = [];
        for (var node of this.ShortcutNodeList) {
            if (!(node.Lambda === LambdaNode.Lambda)) {
                continue;
            }
            if (LambdaTreeView_1.LambdaTreeView.Current && LambdaTreeView_1.LambdaTreeView.Current.FilterString && !node.IsFilterStringMatch(LambdaTreeView_1.LambdaTreeView.Current.FilterString)) {
                continue;
            }
            if (LambdaTreeView_1.LambdaTreeView.Current && LambdaTreeView_1.LambdaTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (LambdaTreeView_1.LambdaTreeView.Current && !LambdaTreeView_1.LambdaTreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            node.Parent = LambdaNode;
            if (LambdaNode.Children.indexOf(node) === -1) {
                LambdaNode.Children.push(node);
            }
            result.push(node);
        }
        return result;
    }
    GetShortcutNodes() {
        var result = [];
        for (var node of this.ShortcutNodeList) {
            if (LambdaTreeView_1.LambdaTreeView.Current && LambdaTreeView_1.LambdaTreeView.Current.FilterString && !node.IsFilterStringMatch(LambdaTreeView_1.LambdaTreeView.Current.FilterString)) {
                continue;
            }
            if (LambdaTreeView_1.LambdaTreeView.Current && LambdaTreeView_1.LambdaTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) {
                continue;
            }
            if (LambdaTreeView_1.LambdaTreeView.Current && !LambdaTreeView_1.LambdaTreeView.Current.isShowHiddenNodes && (node.IsHidden)) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    getTreeItem(element) {
        return element;
    }
}
exports.LambdaTreeDataProvider = LambdaTreeDataProvider;
var ViewType;
(function (ViewType) {
    ViewType[ViewType["Lambda"] = 1] = "Lambda";
})(ViewType = exports.ViewType || (exports.ViewType = {}));
//# sourceMappingURL=LambdaTreeDataProvider.js.map