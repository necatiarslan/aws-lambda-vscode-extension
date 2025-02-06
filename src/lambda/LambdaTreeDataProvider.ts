/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LambdaTreeItem, TreeItemType } from './LambdaTreeItem';
import { LambdaTreeView } from './LambdaTreeView';

export class LambdaTreeDataProvider implements vscode.TreeDataProvider<LambdaTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<LambdaTreeItem | undefined | void> = new vscode.EventEmitter<LambdaTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<LambdaTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	LambdaNodeList: LambdaTreeItem[] = [];
	public LambdaList: [{Region: string, Lambda: string}] = [{Region: "", Lambda: ""}];
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
		
		for(var item of this.LambdaList)
		{
			let treeItem = new LambdaTreeItem(item.Lambda, TreeItemType.Lambda);
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			treeItem.Region = item.Region;
			treeItem.Lambda = item.Lambda;
			
			let codeItem = new LambdaTreeItem("Code", TreeItemType.Code);
			codeItem.Lambda = treeItem.Lambda;
			codeItem.Region = treeItem.Region;
			codeItem.Parent = treeItem
			treeItem.Children.push(codeItem);

			let triggerItem = new LambdaTreeItem("Trigger", TreeItemType.TriggerGroup);
			triggerItem.Lambda = treeItem.Lambda;
			triggerItem.Region = treeItem.Region;
			triggerItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			triggerItem.Parent = treeItem
			treeItem.Children.push(triggerItem);
			
			let triggerParam = new LambdaTreeItem("w/ Param", TreeItemType.TriggerConfig);
			triggerParam.Lambda = treeItem.Lambda;
			triggerParam.Region = treeItem.Region;
			triggerParam.Parent = triggerItem
			triggerItem.Children.push(triggerParam);

			let logsItem = new LambdaTreeItem("Logs", TreeItemType.LogGroup);
			logsItem.Lambda = treeItem.Lambda;
			logsItem.Region = treeItem.Region;
			logsItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			logsItem.Parent = treeItem
			treeItem.Children.push(logsItem);

			this.LambdaNodeList.push(treeItem);
		}
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