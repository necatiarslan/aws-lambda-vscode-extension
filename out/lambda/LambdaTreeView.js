"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaTreeView = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const LambdaTreeItem_1 = require("./LambdaTreeItem");
const LambdaTreeDataProvider_1 = require("./LambdaTreeDataProvider");
const ui = require("../common/UI");
const api = require("../common/API");
const CloudWatchLogView_1 = require("../cloudwatch/CloudWatchLogView");
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
        this.treeDataProvider.Refresh();
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
    async SetFilterMessage() {
        this.view.message =
            await this.GetFilterProfilePrompt()
                + this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, "
                + this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
                + this.FilterString;
    }
    async GetFilterProfilePrompt() {
        if (await api.IsSharedIniFileCredentials()) {
            return "Profile:" + this.AwsProfile + " ";
        }
        return "";
    }
    GetBoolenSign(variable) {
        return variable ? "✓" : "𐄂";
    }
    async AddLambda() {
        ui.logToOutput('LambdaTreeView.AddLambda Started');
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        let selectedLambdaName = await vscode.window.showInputBox({ placeHolder: 'Enter Lambda Name / Search Text' });
        if (selectedLambdaName === undefined) {
            return;
        }
        var resultLambda = await api.GetLambdaList(selectedRegion, selectedLambdaName);
        if (!resultLambda.isSuccessful) {
            return;
        }
        let selectedLambdaList = await vscode.window.showQuickPick(resultLambda.result, { canPickMany: true, placeHolder: 'Select Lambda(s)' });
        if (!selectedLambdaList || selectedLambdaList.length === 0) {
            return;
        }
        for (var selectedLambda of selectedLambdaList) {
            this.treeDataProvider.AddLambda(selectedRegion, selectedLambda);
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
        if (!node.Region) {
            return;
        }
        this.treeDataProvider.RemoveLambda(node.Region, node.Lambda);
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
        //vscode.commands.executeCommand('vscode.openWith', vscode.Uri.parse('https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/' + node.Lambda), "external");
        ui.showInfoMessage("Work In Progress");
    }
    async LambdaView(node) {
        ui.logToOutput('LambdaTreeView.LambdaView Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda) {
            return;
        }
        if (!node.Lambda) {
            return;
        }
        if (!node.Region) {
            return;
        }
        ui.showInfoMessage('Work In Progress');
    }
    async TriggerLambda(node) {
        ui.logToOutput('LambdaTreeView.TriggerLambda Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda && node.TreeItemType !== LambdaTreeItem_1.TreeItemType.TriggerConfig) {
            return;
        }
        if (!node.Lambda) {
            return;
        }
        if (!node.Region) {
            return;
        }
        let config = await vscode.window.showInputBox({ placeHolder: 'Enter Trigger Config or leave empty' });
        if (config && api.isJsonString(config)) {
            ui.showInfoMessage('Config should be a valid JSON');
            return;
        }
        let param = {};
        if (config) {
            param = api.ParseJson(config);
        }
        let result = await api.TriggerLambda(node.Region, node.Lambda, param);
        if (!result.isSuccessful) {
            ui.logToOutput("api.TriggerLambda Error !!!", result.error);
            ui.showErrorMessage('Trigger Lambda Error !!!', result.error);
            return;
        }
        ui.logToOutput("api.TriggerLambda Success !!!");
        // Convert Uint8Array to string
        const payloadString = new TextDecoder("utf-8").decode(result.result.Payload);
        // Parse the JSON string
        const parsedPayload = JSON.parse(payloadString);
        // Pretty-print the JSON with 2-space indentation
        let payload = JSON.stringify(parsedPayload, null, 2);
        if (result.result && result.result.Payload) {
            ui.logToOutput("api.TriggerLambda PayLoad \n" + payload, undefined, true);
            this.ViewLatestLog(node);
        }
        ui.showInfoMessage('Lambda Triggered Successfully');
    }
    async ViewLatestLog(node) {
        ui.logToOutput('LambdaTreeView.ViewLatestLog Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda) {
            return;
        }
        if (!node.Lambda) {
            return;
        }
        if (!node.Region) {
            return;
        }
        let resultLogs = await api.GetLatestLambdaLogs(node.Region, node.Lambda);
        if (!resultLogs.isSuccessful) {
            ui.logToOutput("api.GetLatestLambdaLogs Error !!!", resultLogs.error);
            ui.showErrorMessage('Get Lambda Logs Error !!!', resultLogs.error);
            return;
        }
        ui.logToOutput("api.GetLatestLambdaLogs Success !!!");
        ui.logToOutput("api.GetLatestLambdaLogs Logs \n" + resultLogs.result, undefined, true);
        ui.showInfoMessage('Lambda Latest Logs Retrieved Successfully');
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
    async PrintLambda(node) {
        ui.logToOutput('LambdaTreeView.PrintLambda Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda) {
            return;
        }
        if (!node.Lambda) {
            return;
        }
        if (!node.Region) {
            return;
        }
        let result = await api.GetLambda(node.Region, node.Lambda);
        if (!result.isSuccessful) {
            ui.logToOutput("api.GetLambda Error !!!", result.error);
            ui.showErrorMessage('Get Lambda Error !!!', result.error);
            return;
        }
        ui.logToOutput("api.GetLambda Success !!!");
        ui.logToOutput("api.GetLambda \n" + JSON.stringify(result.result, null, 4));
        ui.showInfoMessage('Lambda Details Retrieved Successfully. Check Output window for details');
    }
    async UpdateCodes(node) {
        ui.logToOutput('LambdaTreeView.UpdateCodes Started');
        ui.showWarningMessage("Work In Progress");
    }
    async SetCodePath(node) {
        ui.logToOutput('LambdaTreeView.SetCodePath Started');
        ui.showWarningMessage("Work In Progress");
    }
    async ViewLog(node) {
        ui.logToOutput('LambdaTreeView.ViewLog Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.LogStream) {
            return;
        }
        if (!node.Lambda) {
            return;
        }
        if (!node.Region) {
            return;
        }
        if (!node.LogStreamName) {
            return;
        }
        const logGroupName = `/aws/lambda/${node.Lambda}`;
        CloudWatchLogView_1.CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, node.LogStreamName);
    }
    async RefreshLogStreams(node) {
        ui.logToOutput('LambdaTreeView.RefreshLogs Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.LogGroup) {
            return;
        }
        if (!node.Lambda) {
            return;
        }
        if (!node.Region) {
            return;
        }
        let resultLogs = await api.GetLatestLambdaLogStreams(node.Region, node.Lambda);
        if (!resultLogs.isSuccessful) {
            ui.logToOutput("api.GetLatestLambdaLogStreams Error !!!", resultLogs.error);
            ui.showErrorMessage('Get Lambda Logs Error !!!', resultLogs.error);
            return;
        }
        ui.logToOutput("api.GetLatestLambdaLogStreams Success !!!");
        this.treeDataProvider.AddLogStreams(node, resultLogs.result);
        ui.showInfoMessage('Lambda Logs Retrieved Successfully');
    }
    async RemoveTriggerConfig(node) {
        ui.logToOutput('LambdaTreeView.RemoveTriggerConfig Started');
        ui.showWarningMessage("Work In Progress");
    }
    async AddTriggerConfig(node) {
        ui.logToOutput('LambdaTreeView.AddTriggerConfig Started');
        ui.showWarningMessage("Work In Progress");
    }
}
exports.LambdaTreeView = LambdaTreeView;
//# sourceMappingURL=LambdaTreeView.js.map