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

	private LambdaList: string[] = [];

	public ViewType:ViewType = ViewType.Lambda;

	constructor() {
		
	}

	Refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public GetLambdaList(){
		return this.LambdaList;
	}

	public SetLambdaList(LambdaList: string[]){
		this.LambdaList = LambdaList;
		this.LoadLambdaNodeList();
	}

	AddLambda(Lambda:string){
		if(this.LambdaList.includes(Lambda)){ return; }

		this.LambdaList.push(Lambda);
		this.LoadLambdaNodeList();
		this.Refresh();
	}

	RemoveLambda(Lambda:string){
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
			//treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			treeItem.Lambda = lambda;
			this.LambdaNodeList.push(treeItem);
		}
	}

	getChildren(node: LambdaTreeItem): Thenable<LambdaTreeItem[]> {
		let result:LambdaTreeItem[] = this.GetLambdaNodes();

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