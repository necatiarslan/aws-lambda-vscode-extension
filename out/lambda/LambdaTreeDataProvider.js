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
        //FunctionName, FunctionArn, Runtime, AccountName, Region
        this.LambdaList = {};
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
    AddLambda(Lambda, LambdaBody) {
        if (Lambda in this.LambdaList) {
            return;
        }
        this.LambdaList[Lambda] = LambdaBody;
        this.LoadLambdaNodeList();
        this.Refresh();
    }
    RemoveLambda(Lambda) {
        if (Lambda in this.LambdaList) {
            delete this.LambdaList[Lambda];
        }
        this.LoadLambdaNodeList();
        this.Refresh();
    }
    LoadLambdaNodeList() {
        this.LambdaNodeList = [];
        for (var lambda in this.LambdaList) {
            let treeItem = new LambdaTreeItem_1.LambdaTreeItem(lambda, LambdaTreeItem_1.TreeItemType.Lambda);
            //treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            treeItem.Lambda = lambda;
            this.LambdaNodeList.push(treeItem);
        }
    }
    getChildren(node) {
        let result = this.GetLambdaNodes();
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