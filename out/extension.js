"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const ui = require("./common/UI");
const LambdaTreeView_1 = require("./lambda/LambdaTreeView");
function activate(context) {
    ui.logToOutput('Aws Lambda Extension activation started');
    let treeView = new LambdaTreeView_1.LambdaTreeView(context);
    vscode.commands.registerCommand('LambdaTreeView.Refresh', () => {
        treeView.Refresh();
    });
    vscode.commands.registerCommand('LambdaTreeView.Filter', () => {
        treeView.Filter();
    });
    vscode.commands.registerCommand('LambdaTreeView.ShowOnlyFavorite', () => {
        treeView.ShowOnlyFavorite();
    });
    vscode.commands.registerCommand('LambdaTreeView.ShowHiddenNodes', () => {
        treeView.ShowHiddenNodes();
    });
    vscode.commands.registerCommand('LambdaTreeView.AddToFav', (node) => {
        treeView.AddToFav(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.DeleteFromFav', (node) => {
        treeView.DeleteFromFav(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.HideNode', (node) => {
        treeView.HideNode(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.UnHideNode', (node) => {
        treeView.UnHideNode(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.AddLambda', () => {
        treeView.AddLambda();
    });
    vscode.commands.registerCommand('LambdaTreeView.RemoveLambda', (node) => {
        treeView.RemoveLambda(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.Goto', (node) => {
        treeView.Goto(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.SelectAwsProfile', (node) => {
        treeView.SelectAwsProfile(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.TestAwsConnection', () => {
        treeView.TestAwsConnection();
    });
    vscode.commands.registerCommand('LambdaTreeView.UpdateAwsEndPoint', () => {
        treeView.UpdateAwsEndPoint();
    });
    vscode.commands.registerCommand('LambdaTreeView.Donate', () => {
        treeView.Donate();
    });
    vscode.commands.registerCommand('LambdaTreeView.BugAndNewFeature', () => {
        treeView.BugAndNewFeature();
    });
    vscode.commands.registerCommand('LambdaTreeView.TriggerLambda', (node) => {
        treeView.TriggerLambda(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.ViewLatestLog', (node) => {
        treeView.ViewLatestLog(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.LambdaView', (node) => {
        treeView.LambdaView(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.PrintLambda', async (node) => {
        await treeView.PrintLambda(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.UpdateLambdaCodes', async (node) => {
        await treeView.UpdateLambdaCodes(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.SetCodePath', async (node) => {
        await treeView.SetCodePath(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.UnsetCodePath', async (node) => {
        await treeView.UnsetCodePath(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.ViewLog', async (node) => {
        await treeView.ViewLog(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.ViewResponsePayload', async (node) => {
        await treeView.ViewResponsePayload(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.RefreshLogs', async (node) => {
        await treeView.RefreshLogStreams(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.RemovePayloadPath', async (node) => {
        await treeView.RemovePayloadPath(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.AddPayloadPath', async (node) => {
        await treeView.AddPayloadPath(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.LoadEnvironmentVariables', async (node) => {
        await treeView.LoadEnvironmentVariables(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.UpdateEnvironmentVariable', async (node) => {
        await treeView.UpdateEnvironmentVariable(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.LoadTags', async (node) => {
        await treeView.LoadTags(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.LoadInfo', async (node) => {
        await treeView.LoadInfo(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.AddEnvironmentVariable', async (node) => {
        await treeView.AddEnvironmentVariable(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.RemoveEnvironmentVariable', async (node) => {
        await treeView.RemoveEnvironmentVariable(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.AddTag', async (node) => {
        await treeView.AddTag(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.UpdateTag', async (node) => {
        await treeView.UpdateTag(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.RemoveTag', async (node) => {
        await treeView.RemoveTag(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.DownloadLambdaCode', async (node) => {
        await treeView.DownloadLambdaCode(node);
    });
    ui.logToOutput('Aws Lambda Extension activation completed');
}
function deactivate() {
    ui.logToOutput('Aws Lambda is now de-active!');
}
//# sourceMappingURL=extension.js.map