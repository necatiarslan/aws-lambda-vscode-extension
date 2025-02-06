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
        this.LambdaList = [{ Region: "", Lambda: "" }];
        this.ViewType = ViewType.Lambda;
    }
    Refresh() {
        this._onDidChangeTreeData.fire();
    }
    GetLambdaList() {
        return this.LambdaList;
    }
    SetLambdaList(LambdaList) {
        this.LambdaList = LambdaList;
        this.LoadLambdaNodeList();
    }
    AddLambda(Region, Lambda) {
        for (var item of this.LambdaList) {
            if (item.Region === Region && item.Lambda === Lambda) {
                return;
            }
        }
        this.LambdaList.push({ Region: Region, Lambda: Lambda });
        this.LoadLambdaNodeList();
        this.Refresh();
    }
    RemoveLambda(Region, Lambda) {
        for (var i = 0; i < this.LambdaList.length; i++) {
            if (this.LambdaList[i].Region === Region && this.LambdaList[i].Lambda === Lambda) {
                this.LambdaList.splice(i, 1);
                break;
            }
        }
        this.LoadLambdaNodeList();
        this.Refresh();
    }
    AddLogStreams(node, LogStreams) {
        for (var streamName of LogStreams) {
            if (node.Children.find((item) => item.LogStreamName === streamName)) {
                continue;
            }
            let treeItem = new LambdaTreeItem_1.LambdaTreeItem(streamName, LambdaTreeItem_1.TreeItemType.LogStream);
            treeItem.Region = node.Region;
            treeItem.Lambda = node.Lambda;
            treeItem.LogStreamName = streamName;
            treeItem.Parent = node;
            node.Children.push(treeItem);
        }
        this.Refresh();
    }
    LoadLambdaNodeList() {
        this.LambdaNodeList = [];
        for (var item of this.LambdaList) {
            let treeItem = new LambdaTreeItem_1.LambdaTreeItem(item.Lambda, LambdaTreeItem_1.TreeItemType.Lambda);
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            treeItem.Region = item.Region;
            treeItem.Lambda = item.Lambda;
            let codeItem = new LambdaTreeItem_1.LambdaTreeItem("Code", LambdaTreeItem_1.TreeItemType.Code);
            codeItem.Lambda = treeItem.Lambda;
            codeItem.Region = treeItem.Region;
            codeItem.Parent = treeItem;
            treeItem.Children.push(codeItem);
            let triggerItem = new LambdaTreeItem_1.LambdaTreeItem("Trigger", LambdaTreeItem_1.TreeItemType.TriggerGroup);
            triggerItem.Lambda = treeItem.Lambda;
            triggerItem.Region = treeItem.Region;
            triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            triggerItem.Parent = treeItem;
            treeItem.Children.push(triggerItem);
            let triggerParam = new LambdaTreeItem_1.LambdaTreeItem("w/ Param", LambdaTreeItem_1.TreeItemType.TriggerConfig);
            triggerParam.Lambda = treeItem.Lambda;
            triggerParam.Region = treeItem.Region;
            triggerParam.Parent = triggerItem;
            triggerItem.Children.push(triggerParam);
            let logsItem = new LambdaTreeItem_1.LambdaTreeItem("Logs", LambdaTreeItem_1.TreeItemType.LogGroup);
            logsItem.Lambda = treeItem.Lambda;
            logsItem.Region = treeItem.Region;
            logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            logsItem.Parent = treeItem;
            treeItem.Children.push(logsItem);
            this.LambdaNodeList.push(treeItem);
        }
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetLambdaNodes());
        }
        else if (node.Children.length > 0) {
            result.push(...node.Children);
        }
        return Promise.resolve(result);
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