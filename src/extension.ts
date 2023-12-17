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

	vscode.commands.registerCommand('LambdaTreeView.AddBucket', () => {
		treeView.AddBucket();
	});

	vscode.commands.registerCommand('LambdaTreeView.RemoveBucket', (node: LambdaTreeItem) => {
		treeView.RemoveBucket(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.Goto', (node: LambdaTreeItem) => {
		treeView.Goto(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.RemoveShortcut', (node: LambdaTreeItem) => {
		treeView.RemoveShortcut(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.AddShortcut', (node: LambdaTreeItem) => {
		treeView.AddShortcut(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.CopyShortcut', (node: LambdaTreeItem) => {
		treeView.CopyShortcut(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.ShowS3Explorer', (node: LambdaTreeItem) => {
		treeView.ShowS3Explorer(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.ShowS3Search', (node: LambdaTreeItem) => {
		treeView.ShowS3Search(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.SelectAwsProfile', (node: LambdaTreeItem) => {
		treeView.SelectAwsProfile(node);
	});

	vscode.commands.registerCommand('LambdaTreeView.UpdateAwsEndPoint', () => {
		treeView.UpdateAwsEndPoint();
	});

	ui.logToOutput('Aws Lambda Extension activation completed');
}

export function deactivate() {
	ui.logToOutput('Aws Lambda is now de-active!');
}
