/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

export class LambdaTreeItem extends vscode.TreeItem {
	public IsFav: boolean = false;
	public TreeItemType:TreeItemType;
	public Text:string;
	public Lambda:string | undefined;
	public Region:string | undefined;
	public Shortcut:string | undefined;
	public Parent:LambdaTreeItem | undefined;
	public Children:LambdaTreeItem[] = [];
	public IsHidden: boolean = false;

	constructor(text:string, treeItemType:TreeItemType) {
		super(text);
		this.Text = text;
		this.TreeItemType = treeItemType;
		this.refreshUI();
	}

	public refreshUI() {

		if(this.TreeItemType === TreeItemType.Lambda)
		{
			this.iconPath = new vscode.ThemeIcon('server-process');
			this.contextValue = "Lambda"
		}
		else if(this.TreeItemType === TreeItemType.Code)
		{
			this.iconPath = new vscode.ThemeIcon('file-code');
			this.contextValue = "Code"
		}
		else if(this.TreeItemType === TreeItemType.TriggerGroup)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
			this.contextValue = "TriggerGroup"
		}
		else if(this.TreeItemType === TreeItemType.TriggerConfig)
		{
			this.iconPath = new vscode.ThemeIcon('run-all');
			this.contextValue = "TriggerConfig"
		}
		else if(this.TreeItemType === TreeItemType.LogGroup)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogGroup"
		}
		else if(this.TreeItemType === TreeItemType.LogStream)
		{
			this.iconPath = new vscode.ThemeIcon('output');
			this.contextValue = "LogStream"
		}
		else
		{
			this.iconPath = new vscode.ThemeIcon('circle-outline');
			this.contextValue = "Other"
		}
	}

	public IsAnyChidrenFav(){
		return this.IsAnyChidrenFavInternal(this);
	}

	public IsAnyChidrenFavInternal(node:LambdaTreeItem): boolean{
		for(var n of node.Children)
		{
			if(n.IsFav)
			{
				return true;
			}
			else if (n.Children.length > 0)
			{
				return this.IsAnyChidrenFavInternal(n);
			}
		}

		return false;
	}

	public IsFilterStringMatch(FilterString:string){
		if(this.Text.includes(FilterString))
		{
			return true;
		}

		if(this.IsFilterStringMatchAnyChildren(this, FilterString))
		{
			return true;
		}

		return false;
	}

	public IsFilterStringMatchAnyChildren(node:LambdaTreeItem, FilterString:string): boolean{
		for(var n of node.Children)
		{
			if(n.Text.includes(FilterString) || n.Region?.includes(FilterString) || n.Lambda?.includes(FilterString))
			{
				return true;
			}
			else if (n.Children.length > 0)
			{
				return this.IsFilterStringMatchAnyChildren(n, FilterString);
			}
		}

		return false;
	}
}

export enum TreeItemType{
	Lambda = 1,
	Code = 2,
	LogGroup = 3,
	LogStream = 4,
	TriggerGroup = 5,
	TriggerConfig = 6
}