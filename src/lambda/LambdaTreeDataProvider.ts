/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LambdaTreeItem, TreeItemType } from './LambdaTreeItem';
import { LambdaTreeView } from './LambdaTreeView';

export class LambdaTreeDataProvider implements vscode.TreeDataProvider<LambdaTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<LambdaTreeItem | undefined | void> = new vscode.EventEmitter<LambdaTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<LambdaTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	LambdaNodeList: LambdaTreeItem[] = [];
	ShortcutNodeList: LambdaTreeItem[] = [];

	private LambdaList: string[] = [];
	private ShortcutList: [[string,string]] = [["???","???"]];
	public ViewType:ViewType = ViewType.Lambda;

	constructor() {
		this.ShortcutList.splice(0,1);
	}

	Refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public GetLambdaList(){
		return this.LambdaList;
	}

	public GetShortcutList(){
		return this.ShortcutList;
	}

	public SetLambdaList(LambdaList: string[]){
		this.LambdaList = LambdaList;
		this.LoadLambdaNodeList();
	}

	public SetShortcutList(ShortcutList: [[string,string]]){
		this.ShortcutList = ShortcutList;
		this.LoadShortcutNodeList();
	}

	AddLambda(Lambda:string){
		if(this.LambdaList.includes(Lambda)){ return; }

		this.LambdaList.push(Lambda);
		this.LoadLambdaNodeList();
		this.Refresh();
	}

	RemoveLambda(Lambda:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i][0] === Lambda)
			{
				this.ShortcutList.splice(i, 1);
				i--;
			}
		}
		this.LoadShortcutNodeList();

		for(let i = 0; i < this.LambdaList.length; i++)
		{
			if(this.LambdaList[i] === Lambda)
			{
				this.LambdaList.splice(i, 1);
				i--;
			}
		}
		this.LoadLambdaNodeList();
		this.Refresh();
	}

	LoadLambdaNodeList(){
		this.LambdaNodeList = [];
		
		for(var lambda of this.LambdaList)
		{
			let treeItem = new LambdaTreeItem(lambda, TreeItemType.Lambda);
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			treeItem.Lambda = lambda;
			this.LambdaNodeList.push(treeItem);
		}
	}

	LoadShortcutNodeList(){
		this.ShortcutNodeList = [];
		
		for(var lg of this.ShortcutList)
		{
			let treeItem = new LambdaTreeItem(lg[1], TreeItemType.Shortcut);
			treeItem.Lambda = lg[0];
			treeItem.Shortcut = lg[1];
			this.ShortcutNodeList.push(treeItem);
		}
	}

	getChildren(node: LambdaTreeItem): Thenable<LambdaTreeItem[]> {
		let result:LambdaTreeItem[] = [];

		return Promise.resolve(result);
	}

	GetNodesShortcut(node: LambdaTreeItem):LambdaTreeItem[]
	{
		let result:LambdaTreeItem[] = [];
		result = this.GetShortcutNodes();
		return result;
	}

	GetNodesLambdaShortcut(node: LambdaTreeItem):LambdaTreeItem[]
	{
		let result:LambdaTreeItem[] = [];
		
		if (!node) {
			result = this.GetLambdaNodes();
		}
		else if(node.TreeItemType === TreeItemType.Lambda){
			result = this.GetShortcutNodesParentLambda(node);
		}

		return result;
	}

	GetLambdaNodes(): LambdaTreeItem[]{
		var result: LambdaTreeItem[] = [];
		for (var node of this.LambdaNodeList) {
			if (LambdaTreeView.Current && LambdaTreeView.Current.FilterString && !node.IsFilterStringMatch(LambdaTreeView.Current.FilterString)) { continue; }
			if (LambdaTreeView.Current && LambdaTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (LambdaTreeView.Current && !LambdaTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}

	GetShortcutNodesParentLambda(LambdaNode:LambdaTreeItem): LambdaTreeItem[]{
		var result: LambdaTreeItem[] = [];
		for (var node of this.ShortcutNodeList) {
			if(!(node.Lambda === LambdaNode.Lambda)) { continue; }
			if (LambdaTreeView.Current && LambdaTreeView.Current.FilterString && !node.IsFilterStringMatch(LambdaTreeView.Current.FilterString)) { continue; }
			if (LambdaTreeView.Current && LambdaTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (LambdaTreeView.Current && !LambdaTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			node.Parent = LambdaNode;
			if(LambdaNode.Children.indexOf(node) === -1)
			{
				LambdaNode.Children.push(node);
			}
			result.push(node);
		}
		return result;
	}

	GetShortcutNodes(): LambdaTreeItem[]{
		var result: LambdaTreeItem[] = [];
		for (var node of this.ShortcutNodeList) {
			if (LambdaTreeView.Current && LambdaTreeView.Current.FilterString && !node.IsFilterStringMatch(LambdaTreeView.Current.FilterString)) { continue; }
			if (LambdaTreeView.Current && LambdaTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (LambdaTreeView.Current && !LambdaTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}
	
	getTreeItem(element: LambdaTreeItem): LambdaTreeItem {
		return element;
	}
}

export enum ViewType{
	Lambda = 1
}