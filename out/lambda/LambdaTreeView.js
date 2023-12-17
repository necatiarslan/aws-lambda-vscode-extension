"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaTreeView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const LambdaTreeItem_1 = require("./LambdaTreeItem");
const LambdaTreeDataProvider_1 = require("./LambdaTreeDataProvider");
const ui = require("../common/UI");
const api = require("../common/API");
class LambdaTreeView {
    constructor(context) {
        this.FilterString = "";
        this.isShowOnlyFavorite = false;
        this.isShowHiddenNodes = false;
        this.AwsProfile = "default";
        ui.logToOutput('TreeView.constructor Started');
        this.context = context;
        this.treeDataProvider = new LambdaTreeDataProvider_1.LambdaTreeDataProvider();
        this.LoadState();
        this.view = vscode.window.createTreeView('LambdaTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
        this.Refresh();
        context.subscriptions.push(this.view);
        LambdaTreeView.Current = this;
        this.SetFilterMessage();
        this.TestAwsConnection();
    }
    TestAwsConnection() {
        api.TestAwsConnection();
    }
    Refresh() {
        ui.logToOutput('LambdaTreeView.refresh Started');
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: "Aws Lambda: Loading...",
        }, (progress, token) => {
            progress.report({ increment: 0 });
            this.LoadTreeItems();
            return new Promise(resolve => { resolve(); });
        });
    }
    LoadTreeItems() {
        ui.logToOutput('LambdaTreeView.loadTreeItems Started');
        //this.treeDataProvider.LoadRegionNodeList();
        //this.treeDataProvider.LoadLogGroupNodeList();
        //this.treeDataProvider.LoadLogStreamNodeList();
        //this.treeDataProvider.Refresh();
        this.SetViewTitle();
    }
    ResetView() {
        ui.logToOutput('LambdaTreeView.resetView Started');
        this.FilterString = '';
        this.treeDataProvider.Refresh();
        this.SetViewTitle();
        this.SaveState();
        this.Refresh();
    }
    async AddToFav(node) {
        ui.logToOutput('LambdaTreeView.AddToFav Started');
        node.IsFav = true;
        node.refreshUI();
    }
    async HideNode(node) {
        ui.logToOutput('LambdaTreeView.HideNode Started');
        node.IsHidden = true;
        this.treeDataProvider.Refresh();
    }
    async UnHideNode(node) {
        ui.logToOutput('LambdaTreeView.UnHideNode Started');
        node.IsHidden = false;
    }
    async DeleteFromFav(node) {
        ui.logToOutput('LambdaTreeView.DeleteFromFav Started');
        node.IsFav = false;
        node.refreshUI();
    }
    async Filter() {
        ui.logToOutput('LambdaTreeView.Filter Started');
        let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });
        if (filterStringTemp === undefined) {
            return;
        }
        this.FilterString = filterStringTemp;
        this.treeDataProvider.Refresh();
        this.SetFilterMessage();
        this.SaveState();
    }
    async ShowOnlyFavorite() {
        ui.logToOutput('LambdaTreeView.ShowOnlyFavorite Started');
        this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
        this.treeDataProvider.Refresh();
        this.SetFilterMessage();
        this.SaveState();
    }
    async ShowHiddenNodes() {
        ui.logToOutput('LambdaTreeView.ShowHiddenNodes Started');
        this.isShowHiddenNodes = !this.isShowHiddenNodes;
        this.treeDataProvider.Refresh();
        this.SetFilterMessage();
        this.SaveState();
    }
    async SetViewTitle() {
        this.view.title = "Aws Lambda";
    }
    SaveState() {
        ui.logToOutput('LambdaTreeView.saveState Started');
        try {
            this.context.globalState.update('AwsProfile', this.AwsProfile);
            this.context.globalState.update('FilterString', this.FilterString);
            this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
            this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
            this.context.globalState.update('LambdaList', this.treeDataProvider.GetLambdaList());
            this.context.globalState.update('ShortcutList', this.treeDataProvider.GetShortcutList());
            this.context.globalState.update('ViewType', this.treeDataProvider.ViewType);
            this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);
            ui.logToOutput("LambdaTreeView.saveState Successfull");
        }
        catch (error) {
            ui.logToOutput("LambdaTreeView.saveState Error !!!");
        }
    }
    LoadState() {
        ui.logToOutput('LambdaTreeView.loadState Started');
        try {
            let AwsProfileTemp = this.context.globalState.get('AwsProfile');
            if (AwsProfileTemp) {
                this.AwsProfile = AwsProfileTemp;
            }
            let filterStringTemp = this.context.globalState.get('FilterString');
            if (filterStringTemp) {
                this.FilterString = filterStringTemp;
            }
            let ShowOnlyFavoriteTemp = this.context.globalState.get('ShowOnlyFavorite');
            if (ShowOnlyFavoriteTemp) {
                this.isShowOnlyFavorite = ShowOnlyFavoriteTemp;
            }
            let ShowHiddenNodesTemp = this.context.globalState.get('ShowHiddenNodes');
            if (ShowHiddenNodesTemp) {
                this.isShowHiddenNodes = ShowHiddenNodesTemp;
            }
            let LambdaListTemp = this.context.globalState.get('LambdaList');
            if (LambdaListTemp) {
                this.treeDataProvider.SetLambdaList(LambdaListTemp);
            }
            let ShortcutListTemp = this.context.globalState.get('ShortcutList');
            if (ShortcutListTemp) {
                this.treeDataProvider.SetShortcutList(ShortcutListTemp);
            }
            let ViewTypeTemp = this.context.globalState.get('ViewType');
            if (ViewTypeTemp) {
                this.treeDataProvider.ViewType = ViewTypeTemp;
            }
            let AwsEndPointTemp = this.context.globalState.get('AwsEndPoint');
            this.AwsEndPoint = AwsEndPointTemp;
            ui.logToOutput("LambdaTreeView.loadState Successfull");
        }
        catch (error) {
            ui.logToOutput("LambdaTreeView.loadState Error !!!");
        }
    }
    SetFilterMessage() {
        this.view.message =
            this.GetFilterProfilePrompt()
                + this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, "
                + this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
                + this.FilterString;
    }
    GetFilterProfilePrompt() {
        if (api.IsSharedIniFileCredentials()) {
            return "Profile:" + this.AwsProfile + " ";
        }
        return "";
    }
    GetBoolenSign(variable) {
        return variable ? "✓" : "𐄂";
    }
    async AddLambda() {
        ui.logToOutput('LambdaTreeView.AddLambda Started');
        let selectedLambdaName = await vscode.window.showInputBox({ placeHolder: 'Enter Lambda Name / Search Text' });
        if (selectedLambdaName === undefined) {
            return;
        }
        var resultLambda = await api.GetLambdaList("us-east-1", selectedLambdaName);
        if (!resultLambda.isSuccessful) {
            return;
        }
        let selectedLambdaList = await vscode.window.showQuickPick(resultLambda.result, { canPickMany: true, placeHolder: 'Select Lambda(s)' });
        if (!selectedLambdaList || selectedLambdaList.length === 0) {
            return;
        }
        for (var selectedLambda of selectedLambdaList) {
            this.treeDataProvider.AddLambda(selectedLambda);
        }
        this.SaveState();
    }
    async RemoveLambda(node) {
        ui.logToOutput('LambdaTreeView.RemoveLambda Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda) {
            return;
        }
        if (!node.Lambda) {
            return;
        }
        this.treeDataProvider.RemoveLambda(node.Lambda);
        this.SaveState();
    }
    async Goto(node) {
        ui.logToOutput('LambdaTreeView.Goto Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda) {
            return;
        }
        if (!node.Lambda) {
            return;
        }
        let shortcut = await vscode.window.showInputBox({ placeHolder: 'Enter a Folder/File Key' });
        if (shortcut === undefined) {
            return;
        }
    }
    async SelectAwsProfile(node) {
        ui.logToOutput('LambdaTreeView.SelectAwsProfile Started');
        if (!api.IsSharedIniFileCredentials()) {
            ui.showWarningMessage("Your Aws Access method is not credentials file");
            return;
        }
        var result = await api.GetAwsProfileList();
        if (!result.isSuccessful) {
            return;
        }
        let selectedAwsProfile = await vscode.window.showQuickPick(result.result, { canPickMany: false, placeHolder: 'Select Aws Profile' });
        if (!selectedAwsProfile) {
            return;
        }
        this.AwsProfile = selectedAwsProfile;
        this.SaveState();
        this.SetFilterMessage();
        this.TestAwsConnection();
    }
    async UpdateAwsEndPoint() {
        ui.logToOutput('LambdaTreeView.UpdateAwsEndPoint Started');
        let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)' });
        if (awsEndPointUrl === undefined) {
            return;
        }
        if (awsEndPointUrl.length === 0) {
            this.AwsEndPoint = undefined;
        }
        else {
            this.AwsEndPoint = awsEndPointUrl;
        }
        this.SaveState();
    }
}
exports.LambdaTreeView = LambdaTreeView;
//# sourceMappingURL=LambdaTreeView.js.map