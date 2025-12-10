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
    }
    Refresh() {
        if (this.LambdaNodeList.length === 0) {
            this.LoadLambdaNodeList();
        }
        this._onDidChangeTreeData.fire();
    }
    AddLambda(Region, Lambda) {
        for (var item of LambdaTreeView_1.LambdaTreeView.Current.LambdaList) {
            if (item.Region === Region && item.Lambda === Lambda) {
                return;
            }
        }
        LambdaTreeView_1.LambdaTreeView.Current.LambdaList.push({ Region: Region, Lambda: Lambda });
        this.AddNewLambdaNode(Region, Lambda);
        this.Refresh();
    }
    RemoveLambda(Region, Lambda) {
        for (var i = 0; i < LambdaTreeView_1.LambdaTreeView.Current.LambdaList.length; i++) {
            if (LambdaTreeView_1.LambdaTreeView.Current.LambdaList[i].Region === Region && LambdaTreeView_1.LambdaTreeView.Current.LambdaList[i].Lambda === Lambda) {
                LambdaTreeView_1.LambdaTreeView.Current.LambdaList.splice(i, 1);
                break;
            }
        }
        this.RemoveLambdaNode(Region, Lambda);
        this.Refresh();
    }
    AddResponsePayload(node, payloadString) {
        let now = new Date();
        let currentTime = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0') + ':' +
            now.getSeconds().toString().padStart(2, '0');
        let treeItem = new LambdaTreeItem_1.LambdaTreeItem("Response - " + currentTime, LambdaTreeItem_1.TreeItemType.ResponsePayload);
        treeItem.Region = node.Region;
        treeItem.Lambda = node.Lambda;
        treeItem.ResponsePayload = payloadString;
        treeItem.Parent = node;
        node.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        node.Children.push(treeItem);
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
        for (var item of LambdaTreeView_1.LambdaTreeView.Current.LambdaList) {
            let treeItem = this.NewLambdaNode(item.Region, item.Lambda);
            this.LambdaNodeList.push(treeItem);
        }
    }
    AddNewLambdaNode(Region, Lambda) {
        if (this.LambdaNodeList.some(item => item.Region === Region && item.Lambda === Lambda)) {
            return;
        }
        let treeItem = this.NewLambdaNode(Region, Lambda);
        this.LambdaNodeList.push(treeItem);
    }
    RemoveLambdaNode(Region, Lambda) {
        for (var i = 0; i < this.LambdaNodeList.length; i++) {
            if (this.LambdaNodeList[i].Region === Region && this.LambdaNodeList[i].Lambda === Lambda) {
                this.LambdaNodeList.splice(i, 1);
                break;
            }
        }
    }
    NewLambdaNode(Region, Lambda) {
        let treeItem = new LambdaTreeItem_1.LambdaTreeItem(Lambda, LambdaTreeItem_1.TreeItemType.Lambda);
        treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        treeItem.Region = Region;
        treeItem.Lambda = Lambda;
        let codeItem = new LambdaTreeItem_1.LambdaTreeItem("Code", LambdaTreeItem_1.TreeItemType.Code);
        codeItem.Lambda = treeItem.Lambda;
        codeItem.Region = treeItem.Region;
        codeItem.Parent = treeItem;
        codeItem.CodePath = this.GetCodePath(treeItem.Region, treeItem.Lambda);
        treeItem.Children.push(codeItem);
        let triggerItem = new LambdaTreeItem_1.LambdaTreeItem("Trigger", LambdaTreeItem_1.TreeItemType.TriggerGroup);
        triggerItem.Lambda = treeItem.Lambda;
        triggerItem.Region = treeItem.Region;
        triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        triggerItem.Parent = treeItem;
        treeItem.Children.push(triggerItem);
        let triggerWithPayload = new LambdaTreeItem_1.LambdaTreeItem("With Paylod", LambdaTreeItem_1.TreeItemType.TriggerWithPayload);
        triggerWithPayload.Lambda = treeItem.Lambda;
        triggerWithPayload.Region = treeItem.Region;
        triggerWithPayload.Parent = triggerItem;
        triggerItem.Children.push(triggerWithPayload);
        let triggerWithoutPayload = new LambdaTreeItem_1.LambdaTreeItem("Without Paylod", LambdaTreeItem_1.TreeItemType.TriggerNoPayload);
        triggerWithoutPayload.Lambda = treeItem.Lambda;
        triggerWithoutPayload.Region = treeItem.Region;
        triggerWithoutPayload.Parent = triggerItem;
        triggerItem.Children.push(triggerWithoutPayload);
        for (var i = 0; i < LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList.length; i++) {
            if (LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList[i].Region === Region
                && LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList[i].Lambda === Lambda) {
                this.AddNewPayloadPathNode(triggerItem, LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList[i].PayloadPath);
            }
        }
        let logsItem = new LambdaTreeItem_1.LambdaTreeItem("Logs", LambdaTreeItem_1.TreeItemType.LogGroup);
        logsItem.Lambda = treeItem.Lambda;
        logsItem.Region = treeItem.Region;
        logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        logsItem.Parent = treeItem;
        treeItem.Children.push(logsItem);
        // Add Environment Variables Group
        let envVarsItem = new LambdaTreeItem_1.LambdaTreeItem("Environment Variables", LambdaTreeItem_1.TreeItemType.EnvironmentVariableGroup);
        envVarsItem.Lambda = treeItem.Lambda;
        envVarsItem.Region = treeItem.Region;
        envVarsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        envVarsItem.Parent = treeItem;
        treeItem.Children.push(envVarsItem);
        // Add Tags Group
        let tagsItem = new LambdaTreeItem_1.LambdaTreeItem("Tags", LambdaTreeItem_1.TreeItemType.TagsGroup);
        tagsItem.Lambda = treeItem.Lambda;
        tagsItem.Region = treeItem.Region;
        tagsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        tagsItem.Parent = treeItem;
        treeItem.Children.push(tagsItem);
        // Add Info Group
        let infoItem = new LambdaTreeItem_1.LambdaTreeItem("Info", LambdaTreeItem_1.TreeItemType.InfoGroup);
        infoItem.Lambda = treeItem.Lambda;
        infoItem.Region = treeItem.Region;
        infoItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        infoItem.Parent = treeItem;
        treeItem.Children.push(infoItem);
        return treeItem;
    }
    AddPayloadPath(node, PayloadPath) {
        for (var i = 0; i < LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList.length; i++) {
            if (LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList[i].Region === node.Region
                && LambdaTreeView_1.LambdaTreeView.Current.CodePathList[i].Lambda === node.Lambda
                && LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList[i].PayloadPath === PayloadPath) {
                return;
            }
        }
        this.AddNewPayloadPathNode(node, PayloadPath);
        LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList.push({ Region: node.Region, Lambda: node.Lambda, PayloadPath: PayloadPath });
        this.Refresh();
    }
    AddNewPayloadPathNode(node, PayloadPath) {
        let fileName = PayloadPath.split("/").pop();
        if (!fileName) {
            fileName = PayloadPath;
        }
        let treeItem = new LambdaTreeItem_1.LambdaTreeItem(fileName, LambdaTreeItem_1.TreeItemType.TriggerFilePayload);
        treeItem.Region = node.Region;
        treeItem.Lambda = node.Lambda;
        treeItem.PayloadPath = PayloadPath;
        treeItem.Parent = node;
        node.Children.push(treeItem);
    }
    RemovePayloadPath(node) {
        if (!node.Parent) {
            return;
        }
        for (var i = 0; i < LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList.length; i++) {
            if (LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList[i].Region === node.Region
                && LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList[i].Lambda === node.Lambda
                && LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList[i].PayloadPath === node.PayloadPath) {
                LambdaTreeView_1.LambdaTreeView.Current.PayloadPathList.splice(i, 1);
            }
        }
        let parentNode = node.Parent;
        for (var i = 0; i < parentNode.Children.length; i++) {
            if (parentNode.Children[i].Region === node.Region
                && parentNode.Children[i].Lambda === node.Lambda
                && parentNode.Children[i].PayloadPath === node.PayloadPath) {
                parentNode.Children.splice(i, 1);
            }
        }
        this.Refresh();
    }
    AddCodePath(Region, Lambda, CodePath) {
        //remove old
        for (var i = 0; i < LambdaTreeView_1.LambdaTreeView.Current.CodePathList.length; i++) {
            if (LambdaTreeView_1.LambdaTreeView.Current.CodePathList[i].Region === Region && LambdaTreeView_1.LambdaTreeView.Current.CodePathList[i].Lambda === Lambda) {
                LambdaTreeView_1.LambdaTreeView.Current.CodePathList.splice(i, 1);
            }
        }
        LambdaTreeView_1.LambdaTreeView.Current.CodePathList.push({ Region: Region, Lambda: Lambda, CodePath: CodePath });
        this.Refresh();
    }
    RemoveCodePath(Region, Lambda) {
        for (var i = 0; i < LambdaTreeView_1.LambdaTreeView.Current.CodePathList.length; i++) {
            if (LambdaTreeView_1.LambdaTreeView.Current.CodePathList[i].Region === Region && LambdaTreeView_1.LambdaTreeView.Current.CodePathList[i].Lambda === Lambda) {
                LambdaTreeView_1.LambdaTreeView.Current.CodePathList.splice(i, 1);
            }
        }
        this.Refresh();
    }
    GetCodePath(Region, Lambda) {
        for (var item of LambdaTreeView_1.LambdaTreeView.Current.CodePathList) {
            if (item.Region === Region && item.Lambda === Lambda) {
                return item.CodePath;
            }
        }
        return "";
    }
    getChildren(node) {
        let result = [];
        if (!node) {
            result.push(...this.GetLambdaNodes());
        }
        else if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.EnvironmentVariableGroup && node.Children.length === 0) {
            // Auto-load environment variables when the node is expanded
            LambdaTreeView_1.LambdaTreeView.Current.LoadEnvironmentVariables(node);
        }
        else if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.TagsGroup && node.Children.length === 0) {
            // Auto-load tags when the node is expanded
            LambdaTreeView_1.LambdaTreeView.Current.LoadTags(node);
        }
        else if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.InfoGroup && node.Children.length === 0) {
            // Auto-load info when the node is expanded
            LambdaTreeView_1.LambdaTreeView.Current.LoadInfo(node);
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
})(ViewType || (exports.ViewType = ViewType = {}));
//# sourceMappingURL=LambdaTreeDataProvider.js.map