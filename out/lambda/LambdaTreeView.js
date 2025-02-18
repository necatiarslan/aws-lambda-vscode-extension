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
        this.LambdaList = [];
        this.CodePathList = [];
        this.PayloadPathList = [];
        ui.logToOutput('TreeView.constructor Started');
        LambdaTreeView.Current = this;
        this.context = context;
        this.LoadState();
        this.treeDataProvider = new LambdaTreeDataProvider_1.LambdaTreeDataProvider();
        this.view = vscode.window.createTreeView('LambdaTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
        this.Refresh();
        context.subscriptions.push(this.view);
        this.SetFilterMessage();
    }
    async TestAwsConnection() {
        let response = await api.TestAwsCredentials();
        if (response.isSuccessful && response.result) {
            ui.logToOutput('Aws Credentials Test Successfull');
            ui.showInfoMessage('Aws Credentials Test Successfull');
        }
        else {
            ui.logToOutput('LambdaTreeView.TestAwsCredentials Error !!!', response.error);
            ui.showErrorMessage('Aws Credentials Test Error !!!', response.error);
        }
        let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
        if (selectedRegion === undefined) {
            return;
        }
        response = await api.TestAwsConnection(selectedRegion);
        if (response.isSuccessful && response.result) {
            ui.logToOutput('Aws Connection Test Successfull');
            ui.showInfoMessage('Aws Connection Test Successfull');
        }
        else {
            ui.logToOutput('LambdaTreeView.TestAwsConnection Error !!!', response.error);
            ui.showErrorMessage('Aws Connection Test Error !!!', response.error);
        }
    }
    BugAndNewFeature() {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/necatiarslan/aws-lambda-vscode-extension/issues/new'));
    }
    Donate() {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/necatiarslan'));
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
            this.context.globalState.update('LambdaList', this.LambdaList);
            this.context.globalState.update('CodePathList', this.CodePathList);
            this.context.globalState.update('PayloadPathList', this.PayloadPathList);
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
            let AwsEndPointTemp = this.context.globalState.get('AwsEndPoint');
            if (AwsEndPointTemp) {
                this.AwsEndPoint = AwsEndPointTemp;
            }
        }
        catch (error) {
            ui.logToOutput("LambdaTreeView.loadState AwsEndPoint Error !!!", error);
            ui.showErrorMessage("Aws Lambda Load State AwsEndPoint Error !!!", error);
        }
        try {
            let AwsProfileTemp = this.context.globalState.get('AwsProfile');
            if (AwsProfileTemp) {
                this.AwsProfile = AwsProfileTemp;
            }
        }
        catch (error) {
            ui.logToOutput("LambdaTreeView.loadState AwsProfile Error !!!", error);
            ui.showErrorMessage("Aws Lambda Load State AwsProfile Error !!!", error);
        }
        try {
            let filterStringTemp = this.context.globalState.get('FilterString');
            if (filterStringTemp) {
                this.FilterString = filterStringTemp;
            }
        }
        catch (error) {
            ui.logToOutput("LambdaTreeView.loadState FilterString Error !!!", error);
            ui.showErrorMessage("Aws Lambda Load State FilterString Error !!!", error);
        }
        try {
            let ShowOnlyFavoriteTemp = this.context.globalState.get('ShowOnlyFavorite');
            if (ShowOnlyFavoriteTemp) {
                this.isShowOnlyFavorite = ShowOnlyFavoriteTemp;
            }
        }
        catch (error) {
            ui.logToOutput("LambdaTreeView.loadState Error !!!", error);
            ui.showErrorMessage("Aws Lambda Load State Error !!!", error);
        }
        try {
            let ShowHiddenNodesTemp = this.context.globalState.get('ShowHiddenNodes');
            if (ShowHiddenNodesTemp) {
                this.isShowHiddenNodes = ShowHiddenNodesTemp;
            }
        }
        catch (error) {
            ui.logToOutput("LambdaTreeView.loadState isShowHiddenNodes Error !!!", error);
            ui.showErrorMessage("Aws Lambda Load State isShowHiddenNodes Error !!!", error);
        }
        try {
            let LambdaListTemp = this.context.globalState.get('LambdaList');
            if (LambdaListTemp) {
                this.LambdaList = LambdaListTemp;
            }
            let CodePathListTemp = this.context.globalState.get('CodePathList');
            if (CodePathListTemp) {
                this.CodePathList = CodePathListTemp;
            }
            let PayloadPathListTemp = this.context.globalState.get('PayloadPathList');
            if (PayloadPathListTemp) {
                this.PayloadPathList = PayloadPathListTemp;
            }
        }
        catch (error) {
            ui.logToOutput("LambdaTreeView.loadState LambdaList/CodePathList Error !!!", error);
            ui.showErrorMessage("Aws Lambda Load State LambdaList/CodePathList Error !!!", error);
        }
    }
    async SetFilterMessage() {
        if (this.LambdaList.length > 0) {
            this.view.message =
                await this.GetFilterProfilePrompt()
                    + this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, "
                    + this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
                    + this.FilterString;
        }
    }
    async GetFilterProfilePrompt() {
        return "Profile:" + this.AwsProfile + " ";
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
        this.treeDataProvider.RemoveLambda(node.Region, node.Lambda);
        this.SaveState();
    }
    async Goto(node) {
        ui.logToOutput('LambdaTreeView.Goto Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda) {
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
        ui.showInfoMessage('Work In Progress');
    }
    async TriggerLambda(node) {
        ui.logToOutput('LambdaTreeView.TriggerLambda Started');
        if (node.IsRunning) {
            return;
        }
        //if(node.TreeItemType !== TreeItemType.Lambda && node.TreeItemType !== TreeItemType.TriggerSavedPayload) { return;}
        this.SetNodeRunning(node, true);
        let param = {};
        if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.TriggerNoPayload) {
            param = {};
        }
        else if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.TriggerFilePayload) {
            if (!node.PayloadPath) {
                ui.showWarningMessage('Payload Path is not set');
                this.SetNodeRunning(node, false);
                return;
            }
            let payload = await vscode.workspace.openTextDocument(node.PayloadPath);
            if (payload === undefined) {
                ui.showWarningMessage('File not found: ' + node.PayloadPath);
                this.SetNodeRunning(node, false);
                return;
            }
            if (!api.isJsonString(payload.getText())) {
                ui.showWarningMessage('File content is not a valid JSON: ' + node.PayloadPath);
                this.SetNodeRunning(node, false);
                return;
            }
            param = api.ParseJson(payload.getText());
        }
        else {
            let config = await vscode.window.showInputBox({ placeHolder: 'Enter Payload Json or leave empty' });
            if (config === undefined) {
                return;
            }
            if (config && !api.isJsonString(config)) {
                ui.showInfoMessage('Config should be a valid JSON');
                this.SetNodeRunning(node, false);
                return;
            }
            if (config) {
                param = api.ParseJson(config);
            }
        }
        let result = await api.TriggerLambda(node.Region, node.Lambda, param);
        if (!result.isSuccessful) {
            ui.logToOutput("api.TriggerLambda Error !!!", result.error);
            ui.showErrorMessage('Trigger Lambda Error !!!', result.error);
            this.SetNodeRunning(node, false);
            return;
        }
        ui.logToOutput("api.TriggerLambda Success !!!");
        ui.logToOutput("RequestId: " + result.result.$metadata.requestId);
        // Convert Uint8Array to string
        const payloadString = new TextDecoder("utf-8").decode(result.result.Payload);
        // Parse the JSON string
        const parsedPayload = JSON.parse(payloadString);
        // Pretty-print the JSON with 2-space indentation
        let payload = JSON.stringify(parsedPayload, null, 2);
        if (result.result && result.result.Payload) {
            this.treeDataProvider.AddResponsePayload(node, payloadString);
            ui.logToOutput("api.TriggerLambda PayLoad \n" + payload);
        }
        ui.showInfoMessage('Lambda Triggered Successfully');
        this.SetNodeRunning(node, false);
    }
    SetNodeRunning(node, isRunning) {
        node.IsRunning = isRunning;
        node.refreshUI();
        this.treeDataProvider.Refresh();
    }
    async ViewLatestLog(node) {
        ui.logToOutput('LambdaTreeView.ViewLatestLog Started');
        if (node.IsRunning) {
            return;
        }
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda) {
            return;
        }
        this.SetNodeRunning(node, true);
        let resultLogStream = await api.GetLatestLambdaLogStreamName(node.Region, node.Lambda);
        if (!resultLogStream.isSuccessful) {
            ui.logToOutput("api.GetLatestLambdaLogStreamName Error !!!", resultLogStream.error);
            ui.showErrorMessage('Get Lambda LogStream Error !!!', resultLogStream.error);
            this.SetNodeRunning(node, false);
            return;
        }
        const logGroupName = api.GetLambdaLogGroupName(node.Lambda);
        CloudWatchLogView_1.CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, resultLogStream.result);
        this.SetNodeRunning(node, false);
    }
    async SelectAwsProfile(node) {
        ui.logToOutput('LambdaTreeView.SelectAwsProfile Started');
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
        this.Refresh();
    }
    async PrintLambda(node) {
        ui.logToOutput('LambdaTreeView.PrintLambda Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Lambda) {
            return;
        }
        let result = await api.GetLambda(node.Region, node.Lambda);
        if (!result.isSuccessful) {
            ui.logToOutput("api.GetLambda Error !!!", result.error);
            ui.showErrorMessage('Get Lambda Error !!!', result.error);
            return;
        }
        let jsonString = JSON.stringify(result.result, null, 2);
        ui.ShowTextDocument(jsonString, "json");
    }
    async UpdateLambdaCodes(node) {
        ui.logToOutput('LambdaTreeView.UpdateLambdaCodes Started');
        if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.CodePath && node.Parent) {
            node = node.Parent;
        }
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Code) {
            return;
        }
        if (node.IsRunning) {
            return;
        }
        this.SetNodeRunning(node, true);
        if (!node.CodePath) {
            ui.showWarningMessage("Please Set Code Path First");
            this.SetNodeRunning(node, false);
            return;
        }
        let result = await api.UpdateLambdaCode(node.Region, node.Lambda, node.CodePath);
        if (!result.isSuccessful) {
            ui.logToOutput("api.UpdateLambdaCode Error !!!", result.error);
            ui.showErrorMessage('Update Lambda Code Error !!!', result.error);
            this.SetNodeRunning(node, false);
            return;
        }
        ui.logToOutput("api.UpdateLambdaCode Success !!!");
        ui.showInfoMessage('Lambda Code Updated Successfully');
        this.SetNodeRunning(node, false);
    }
    async SetCodePath(node) {
        ui.logToOutput('LambdaTreeView.SetCodePath Started');
        if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.CodePath && node.Parent) {
            node = node.Parent;
        }
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Code) {
            return;
        }
        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select',
            canSelectFiles: true,
            canSelectFolders: true
        });
        if (!selectedPath || selectedPath.length === 0) {
            return;
        }
        node.CodePath = selectedPath[0].path;
        this.treeDataProvider.AddCodePath(node.Region, node.Lambda, node.CodePath);
        this.SaveState();
        ui.logToOutput("Code Path: " + node.CodePath);
        ui.showInfoMessage('Code Path Set Successfully');
    }
    async UnsetCodePath(node) {
        ui.logToOutput('LambdaTreeView.UnsetCodePath Started');
        if (node.TreeItemType === LambdaTreeItem_1.TreeItemType.CodePath && node.Parent) {
            node = node.Parent;
        }
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.Code) {
            return;
        }
        node.CodePath = undefined;
        this.treeDataProvider.RemoveCodePath(node.Region, node.Lambda);
        this.SaveState();
        ui.logToOutput("Code Path: " + node.CodePath);
        ui.showInfoMessage('Code Path Removed Successfully');
    }
    async ViewLog(node) {
        ui.logToOutput('LambdaTreeView.ViewLog Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.LogStream) {
            return;
        }
        if (!node.LogStreamName) {
            return;
        }
        const logGroupName = api.GetLambdaLogGroupName(node.Lambda);
        CloudWatchLogView_1.CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, node.LogStreamName);
    }
    async RefreshLogStreams(node) {
        ui.logToOutput('LambdaTreeView.RefreshLogs Started');
        if (node.IsRunning) {
            return;
        }
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.LogGroup) {
            return;
        }
        this.SetNodeRunning(node, true);
        let resultLogs = await api.GetLatestLambdaLogStreams(node.Region, node.Lambda);
        if (!resultLogs.isSuccessful) {
            ui.logToOutput("api.GetLatestLambdaLogStreams Error !!!", resultLogs.error);
            ui.showErrorMessage('Get Lambda Logs Error !!!', resultLogs.error);
            this.SetNodeRunning(node, false);
            return;
        }
        ui.logToOutput("api.GetLatestLambdaLogStreams Success !!!");
        this.treeDataProvider.AddLogStreams(node, resultLogs.result);
        ui.showInfoMessage('Lambda Logs Retrieved Successfully');
        this.SetNodeRunning(node, false);
    }
    async RemovePayloadPath(node) {
        ui.logToOutput('LambdaTreeView.RemovePayloadPath Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.TriggerFilePayload) {
            return;
        }
        this.treeDataProvider.RemovePayloadPath(node);
        this.SaveState();
        ui.showInfoMessage('Payload Path Removed Successfully');
    }
    async AddPayloadPath(node) {
        ui.logToOutput('LambdaTreeView.AddPayloadPath Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.TriggerGroup) {
            return;
        }
        const selectedPath = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select',
            canSelectFiles: true
        });
        if (!selectedPath || selectedPath.length === 0) {
            return;
        }
        this.treeDataProvider.AddPayloadPath(node, selectedPath[0].path);
        this.SaveState();
        ui.showInfoMessage('Payload Path Added Successfully');
    }
    async ViewResponsePayload(node) {
        ui.logToOutput('LambdaTreeView.ViewResponsePayload Started');
        if (node.TreeItemType !== LambdaTreeItem_1.TreeItemType.ResponsePayload) {
            return;
        }
        if (!node.ResponsePayload) {
            return;
        }
        const parsedPayload = JSON.parse(node.ResponsePayload);
        let jsonString = JSON.stringify(parsedPayload, null, 2);
        ui.logToOutput(jsonString);
        ui.ShowTextDocument(jsonString, "json");
    }
}
exports.LambdaTreeView = LambdaTreeView;
//# sourceMappingURL=LambdaTreeView.js.map