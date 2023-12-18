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

	private LambdaList: { [key: string]: { [key: string]: string } } = { };

	public ViewType:ViewType = ViewType.Lambda;

	constructor() {
		
	}

	Refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public GetLambdaList(){
		return this.LambdaList;
	}

	public SetLambdaList(LambdaList: {}){
		this.LambdaList = LambdaList;
		this.LoadLambdaNodeList();
	}

	AddLambda(Lambda:string, LambdaBody:{}){
		if( Lambda in  this.LambdaList){ return; }

		this.LambdaList[Lambda] = LambdaBody;
		this.LoadLambdaNodeList();
		this.Refresh();
	}

	RemoveLambda(Lambda:string){
		if(Lambda in this.LambdaList)
		{
			delete this.LambdaList[Lambda];
		}
		this.LoadLambdaNodeList();
		this.Refresh();
	}

	LoadLambdaNodeList(){
		this.LambdaNodeList = [];
		
		for(var lambda in this.LambdaList)
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