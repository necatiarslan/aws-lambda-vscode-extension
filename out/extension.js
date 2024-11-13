"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
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
    vscode.commands.registerCommand('LambdaTreeView.UpdateAwsEndPoint', () => {
        treeView.UpdateAwsEndPoint();
    });
    vscode.commands.registerCommand('LambdaTreeView.TriggerLambda', (node) => {
        treeView.TriggerLambda(node);
    });
    vscode.commands.registerCommand('LambdaTreeView.LatestLogs', (node) => {
        treeView.LatestLogs(node);
    });
    ui.logToOutput('Aws Lambda Extension activation completed');
}
exports.activate = activate;
function deactivate() {
    ui.logToOutput('Aws Lambda is now de-active!');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map