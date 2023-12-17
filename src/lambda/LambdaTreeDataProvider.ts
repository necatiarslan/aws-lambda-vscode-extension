/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LambdaTreeItem, TreeItemType } from './LambdaTreeItem';
import { LambdaTreeView } from './LambdaTreeView';

export class LambdaTreeDataProvider implements vscode.TreeDataProvider<LambdaTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<LambdaTreeItem | undefined | void> = new vscode.EventEmitter<LambdaTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<LambdaTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	
	BucketNodeList: LambdaTreeItem[] = [];
	ShortcutNodeList: LambdaTreeItem[] = [];

	private BucketList: string[] = [];
	private ShortcutList: [[string,string]] = [["???","???"]];
	public ViewType:ViewType = ViewType.Bucket_Shortcut;

	constructor() {
		this.ShortcutList.splice(0,1);
	}

	Refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	public GetBucketList(){
		return this.BucketList;
	}

	public GetShortcutList(){
		return this.ShortcutList;
	}

	public SetBucketList(BucketList: string[]){
		this.BucketList = BucketList;
		this.LoadBucketNodeList();
	}

	public SetShortcutList(ShortcutList: [[string,string]]){
		this.ShortcutList = ShortcutList;
		this.LoadShortcutNodeList();
	}

	AddBucket(Bucket:string){
		if(this.BucketList.includes(Bucket)){ return; }

		this.BucketList.push(Bucket);
		this.LoadBucketNodeList();
		this.Refresh();
	}

	RemoveBucket(Bucket:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i][0] === Bucket)
			{
				this.ShortcutList.splice(i, 1);
				i--;
			}
		}
		this.LoadShortcutNodeList();

		for(let i = 0; i < this.BucketList.length; i++)
		{
			if(this.BucketList[i] === Bucket)
			{
				this.BucketList.splice(i, 1);
				i--;
			}
		}
		this.LoadBucketNodeList();
		this.Refresh();
	}

	RemoveAllShortcuts(Bucket:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i][0] === Bucket)
			{
				this.ShortcutList.splice(i, 1);
				i--;
			}
		}
		this.LoadShortcutNodeList();
		this.Refresh();
	}

	DoesShortcutExists(Bucket:string, Key:string):boolean{
		if(!Bucket || !Key) { return false; }

		for(var ls of this.ShortcutList)
		{
			if(ls[0] === Bucket && ls[1] === Key)
			{
				return true;
			}
		}
		return false;
	}

	AddShortcut(Bucket:string, Key:string){
		if(!Bucket || !Key) { return; }
		
		if(this.DoesShortcutExists(Bucket, Key))
		{
			return;
		}

		this.ShortcutList.push([Bucket, Key]);
		this.LoadShortcutNodeList();
		this.Refresh();
	}

	RemoveShortcut(Bucket:string, Shortcut:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i][0] === Bucket && this.ShortcutList[i][1] === Shortcut)
			{
				this.ShortcutList.splice(i, 1);
				i--;
			}
		}
		this.LoadShortcutNodeList();
		this.Refresh();
	}

	UpdateShortcut(Bucket:string, Shortcut:string, NewShortcut:string){
		for(let i = 0; i < this.ShortcutList.length; i++)
		{
			if(this.ShortcutList[i][0] === Bucket && this.ShortcutList[i][1] === Shortcut)
			{
				this.ShortcutList[i][1] = NewShortcut
			}
		}
		this.LoadShortcutNodeList();
		this.Refresh();
	}

	LoadBucketNodeList(){
		this.BucketNodeList = [];
		
		for(var bucket of this.BucketList)
		{
			let treeItem = new LambdaTreeItem(bucket, TreeItemType.Bucket);
			treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
			treeItem.Bucket = bucket;
			this.BucketNodeList.push(treeItem);
		}
	}

	LoadShortcutNodeList(){
		this.ShortcutNodeList = [];
		
		for(var lg of this.ShortcutList)
		{
			let treeItem = new LambdaTreeItem(lg[1], TreeItemType.Shortcut);
			treeItem.Bucket = lg[0];
			treeItem.Shortcut = lg[1];
			this.ShortcutNodeList.push(treeItem);
		}
	}

	getChildren(node: LambdaTreeItem): Thenable<LambdaTreeItem[]> {
		let result:LambdaTreeItem[] = [];

		if(this.ViewType === ViewType.Bucket_Shortcut)
		{
			result = this.GetNodesBucketShortcut(node);
		}

		return Promise.resolve(result);
	}

	GetNodesShortcut(node: LambdaTreeItem):LambdaTreeItem[]
	{
		let result:LambdaTreeItem[] = [];
		result = this.GetShortcutNodes();
		return result;
	}

	GetNodesBucketShortcut(node: LambdaTreeItem):LambdaTreeItem[]
	{
		let result:LambdaTreeItem[] = [];
		
		if (!node) {
			result = this.GetBucketNodes();
		}
		else if(node.TreeItemType === TreeItemType.Bucket){
			result = this.GetShortcutNodesParentBucket(node);
		}

		return result;
	}

	GetBucketNodes(): LambdaTreeItem[]{
		var result: LambdaTreeItem[] = [];
		for (var node of this.BucketNodeList) {
			if (LambdaTreeView.Current && LambdaTreeView.Current.FilterString && !node.IsFilterStringMatch(LambdaTreeView.Current.FilterString)) { continue; }
			if (LambdaTreeView.Current && LambdaTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (LambdaTreeView.Current && !LambdaTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			result.push(node);
		}
		return result;
	}

	GetShortcutNodesParentBucket(BucketNode:LambdaTreeItem): LambdaTreeItem[]{
		var result: LambdaTreeItem[] = [];
		for (var node of this.ShortcutNodeList) {
			if(!(node.Bucket === BucketNode.Bucket)) { continue; }
			if (LambdaTreeView.Current && LambdaTreeView.Current.FilterString && !node.IsFilterStringMatch(LambdaTreeView.Current.FilterString)) { continue; }
			if (LambdaTreeView.Current && LambdaTreeView.Current.isShowOnlyFavorite && !(node.IsFav || node.IsAnyChidrenFav())) { continue; }
			if (LambdaTreeView.Current && !LambdaTreeView.Current.isShowHiddenNodes && (node.IsHidden)) { continue; }

			node.Parent = BucketNode;
			if(BucketNode.Children.indexOf(node) === -1)
			{
				BucketNode.Children.push(node);
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
	Bucket_Shortcut = 1
}