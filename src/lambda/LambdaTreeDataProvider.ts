/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LambdaTreeItem, TreeItemType } from './LambdaTreeItem';
import { LambdaTreeView } from './LambdaTreeView';

export class LambdaTreeDataProvider implements vscode.TreeDataProvider<LambdaTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<LambdaTreeItem | undefined | void> = new vscode.EventEmitter<LambdaTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<LambdaTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	LambdaNodeList: LambdaTreeItem[] = [];

	constructor() {
		
	}

	Refresh(): void {
		if(this.LambdaNodeList.length === 0){ this.LoadLambdaNodeList(); }
		this._onDidChangeTreeData.fire();
	}

	AddLambda(Region:string, Lambda:string){
		for(var item of LambdaTreeView.Current.LambdaList)
		{
			if(item.Region === Region && item.Lambda === Lambda)
			{
				return;
			}
		}
		
		LambdaTreeView.Current.LambdaList.push({Region: Region, Lambda: Lambda});
		this.AddNewLambdaNode(Region, Lambda);
		this.Refresh();
	}

	RemoveLambda(Region:string, Lambda:string){
		for(var i=0; i<LambdaTreeView.Current.LambdaList.length; i++)
		{
			if(LambdaTreeView.Current.LambdaList[i].Region === Region && LambdaTreeView.Current.LambdaList[i].Lambda === Lambda)
			{
				LambdaTreeView.Current.LambdaList.splice(i, 1);
				break;
			}
		}

		this.RemoveLambdaNode(Region, Lambda);
		this.Refresh();
	}
	AddLogStreams(node: LambdaTreeItem, LogStreams:string[]){
		for(var streamName of LogStreams)
		{
			if(node.Children.find((item) => item.LogStreamName === streamName)){ continue; }
			
			let treeItem = new LambdaTreeItem(streamName, TreeItemType.LogStream);
			treeItem.Region = node.Region;
			treeItem.Lambda = node.Lambda;
			treeItem.LogStreamName = streamName
			treeItem.Parent = node
			node.Children.push(treeItem)
		}
		this.Refresh();
	}
	LoadLambdaNodeList(){
		this.LambdaNodeList = [];
		
		for(var item of LambdaTreeView.Current.LambdaList)
		{
			let treeItem = this.NewLambdaNode(item.Region, item.Lambda);

			this.LambdaNodeList.push(treeItem);
		}
	}

	AddNewLambdaNode(Region:string, Lambda:string){
		if (this.LambdaNodeList.some(item => item.Region === Region && item.Lambda === Lambda)) { return; }

		let treeItem = this.NewLambdaNode(Region, Lambda);
		this.LambdaNodeList.push(treeItem);
	}

	RemoveLambdaNode(Region:string, Lambda:string){
		for(var i=0; i<this.LambdaNodeList.length; i++)
		{
			if(this.LambdaNodeList[i].Region === Region && this.LambdaNodeList[i].Lambda === Lambda)
			{
				this.LambdaNodeList.splice(i, 1);
				break;
			}
		}
	}

	private NewLambdaNode(Region: string, Lambda: string) : LambdaTreeItem
	{
		let treeItem = new LambdaTreeItem(Lambda, TreeItemType.Lambda);
		treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		treeItem.Region = Region;
		treeItem.Lambda = Lambda;

		let codeItem = new LambdaTreeItem("Code", TreeItemType.Code);
		codeItem.Lambda = treeItem.Lambda;
		codeItem.Region = treeItem.Region;
		codeItem.Parent = treeItem;
		codeItem.CodePath = this.GetCodePath(treeItem.Region, treeItem.Lambda);
		treeItem.Children.push(codeItem);

		let triggerItem = new LambdaTreeItem("Trigger", TreeItemType.TriggerGroup);
		triggerItem.Lambda = treeItem.Lambda;
		triggerItem.Region = treeItem.Region;
		triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		triggerItem.Parent = treeItem;
		treeItem.Children.push(triggerItem);

		let triggerParam = new LambdaTreeItem("w/ Param", TreeItemType.TriggerConfig);
		triggerParam.Lambda = treeItem.Lambda;
		triggerParam.Region = treeItem.Region;
		triggerParam.Parent = triggerItem;
		triggerItem.Children.push(triggerParam);

		let logsItem = new LambdaTreeItem("Logs", TreeItemType.LogGroup);
		logsItem.Lambda = treeItem.Lambda;
		logsItem.Region = treeItem.Region;
		logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		logsItem.Parent = treeItem;
		treeItem.Children.push(logsItem);
		return treeItem;
	}

	AddCodePath(Region:string, Lambda:string, CodePath:string){
		this.RemoveCodePath(Region, Lambda);
		
		LambdaTreeView.Current.CodePathList.push({Region: Region, Lambda: Lambda, CodePath: CodePath});
		this.Refresh();
	}

	RemoveCodePath(Region:string, Lambda:string){
		for(var i=0; i<LambdaTreeView.Current.CodePathList.length; i++)
		{
			if(LambdaTreeView.Current.CodePathList[i].Region === Region && LambdaTreeView.Current.CodePathList[i].Lambda === Lambda)
			{
				LambdaTreeView.Current.CodePathList.splice(i, 1);
			}
		}
	}

	GetCodePath(Region:string, Lambda:string){
		for(var item of LambdaTreeView.Current.CodePathList)
		{
			if(item.Region === Region && item.Lambda === Lambda)
			{
				return item.CodePath;
			}
		}
		return "";
	}

	getChildren(node: LambdaTreeItem): Thenable<LambdaTreeItem[]> {
		let result:LambdaTreeItem[] = [];

		if(!node)
		{
			result.push(...this.GetLambdaNodes());
		}
		else if(node.Children.length > 0)
		{
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