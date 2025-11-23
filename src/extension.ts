import * as vscode from 'vscode';
import * as ui from './common/UI';
import { LambdaTreeView } from './lambda/LambdaTreeView';
import { LambdaTreeItem } from './lambda/LambdaTreeItem';

export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Aws Lambda Extension activation started');

	let treeView:LambdaTreeView = new LambdaTreeView(context);

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

	vscode.commands.registerCommand('LambdaTreeView.AddToFav', (node: LambdaTreeItem) => {
		treeView.AddToFav(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.DeleteFromFav', (node: LambdaTreeItem) => {
		treeView.DeleteFromFav(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.HideNode', (node: LambdaTreeItem) => {
		treeView.HideNode(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.UnHideNode', (node: LambdaTreeItem) => {
		treeView.UnHideNode(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.AddLambda', () => {
		treeView.AddLambda();
	});

	vscode.commands.registerCommand('LambdaTreeView.RemoveLambda', (node: LambdaTreeItem) => {
		treeView.RemoveLambda(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.Goto', (node: LambdaTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.SelectAwsProfile', (node: LambdaTreeItem) => {
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

	vscode.commands.registerCommand('LambdaTreeView.TriggerLambda', (node: LambdaTreeItem) => {
		treeView.TriggerLambda(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.ViewLatestLog', (node: LambdaTreeItem) => {
		treeView.ViewLatestLog(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.LambdaView', (node: LambdaTreeItem) => {
		treeView.LambdaView(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.PrintLambda', async (node: LambdaTreeItem) => {
		await treeView.PrintLambda(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.UpdateLambdaCodes', async (node: LambdaTreeItem) => {
		await treeView.UpdateLambdaCodes(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.SetCodePath', async (node: LambdaTreeItem) => {
		await treeView.SetCodePath(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.UnsetCodePath', async (node: LambdaTreeItem) => {
		await treeView.UnsetCodePath(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.ViewLog', async (node: LambdaTreeItem) => {
		await treeView.ViewLog(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.ViewResponsePayload', async (node: LambdaTreeItem) => {
		await treeView.ViewResponsePayload(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.RefreshLogs', async (node: LambdaTreeItem) => {
		await treeView.RefreshLogStreams(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.RemovePayloadPath', async (node: LambdaTreeItem) => {
		await treeView.RemovePayloadPath(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.AddPayloadPath', async (node: LambdaTreeItem) => {
		await treeView.AddPayloadPath(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.LoadEnvironmentVariables', async (node: LambdaTreeItem) => {
		await treeView.LoadEnvironmentVariables(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.UpdateEnvironmentVariable', async (node: LambdaTreeItem) => {
		await treeView.UpdateEnvironmentVariable(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.LoadTags', async (node: LambdaTreeItem) => {
		await treeView.LoadTags(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.LoadInfo', async (node: LambdaTreeItem) => {
		await treeView.LoadInfo(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.AddEnvironmentVariable', async (node: LambdaTreeItem) => {
		await treeView.AddEnvironmentVariable(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.RemoveEnvironmentVariable', async (node: LambdaTreeItem) => {
		await treeView.RemoveEnvironmentVariable(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.AddTag', async (node: LambdaTreeItem) => {
		await treeView.AddTag(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.UpdateTag', async (node: LambdaTreeItem) => {
		await treeView.UpdateTag(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.RemoveTag', async (node: LambdaTreeItem) => {
		await treeView.RemoveTag(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.DownloadLambdaCode', async (node: LambdaTreeItem) => {
		await treeView.DownloadLambdaCode(node);
	});

	ui.logToOutput('Aws Lambda Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws Lambda is now de-active!');
}
