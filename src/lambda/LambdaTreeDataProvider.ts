/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LambdaTreeItem, TreeItemType } from './LambdaTreeItem';
import { LambdaTreeView } from './LambdaTreeView';

export class LambdaTreeDataProvider implements vscode.TreeDataProvider<LambdaTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<LambdaTreeItem | undefined | void> = new vscode.EventEmitter<LambdaTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<LambdaTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	LambdaNodeList: LambdaTreeItem[] = [];

	//FunctionName, FunctionArn, Runtime, AccountName, Region

	private   LambdaList: [{Region: string, Lambda: string}] = [{Region: "", Lambda: ""}];

	public ViewType:ViewType = ViewType.Lambda;

	constructor() {
		
	}

	Refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public GetLambdaList(){
		return this.LambdaList;
	}

	public SetLambdaList(LambdaList: [{Region: string, Lambda: string}]){
		this.LambdaList = LambdaList;
		this.LoadLambdaNodeList();
	}

	AddLambda(Region:string, Lambda:string){
		for(var item of this.LambdaList)
		{
			if(item.Region === Region && item.Lambda === Lambda)
			{
				return;
			}
		}
		
		this.LambdaList.push({Region: Region, Lambda: Lambda});

		this.LoadLambdaNodeList();
		this.Refresh();
	}

	RemoveLambda(Region:string, Lambda:string){
		for(var i=0; i<this.LambdaList.length; i++)
		{
			if(this.LambdaList[i].Region === Region && this.LambdaList[i].Lambda === Lambda)
			{
				this.LambdaList.splice(i, 1);
				break;
			}
		}

		this.LoadLambdaNodeList();
		this.Refresh();
	}

	LoadLambdaNodeList(){
		this.LambdaNodeList = [];
		
		for(var item of this.LambdaList)
		{
			let treeItem = new LambdaTreeItem(item.Lambda, TreeItemType.Lambda);
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			treeItem.Region = item.Region;
			treeItem.Lambda = item.Lambda;
			this.LambdaNodeList.push(treeItem);
		}
	}

	getChildren(node: LambdaTreeItem): Thenable<LambdaTreeItem[]> {
		let result:LambdaTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetLambdaNodes());
		}
		else if(node.TreeItemType === TreeItemType.Lambda)
		{
			node.Children.push(new LambdaTreeItem("Code", TreeItemType.Code));
			node.Children.push(new LambdaTreeItem("Trigger", TreeItemType.TriggerGroup));
			node.Children.push(new LambdaTreeItem("Logs", TreeItemType.LogGroup));

			result.push(...node.Children);
		}

		return Promise.resolve(result);
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
	
	getTreeItem(element: LambdaTreeItem): LambdaTreeItem {
		return element;
	}
}

export enum ViewType{
	Lambda = 1
}