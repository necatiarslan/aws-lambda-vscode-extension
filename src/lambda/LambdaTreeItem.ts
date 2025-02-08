/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

export class LambdaTreeItem extends vscode.TreeItem {
	public IsFav: boolean = false
	public TreeItemType:TreeItemType
	public Text:string
	public Lambda:string | undefined
	public Region:string | undefined
	public LogStreamName:string | undefined
	public Parent:LambdaTreeItem | undefined
	public Children:LambdaTreeItem[] = []
	public IsHidden: boolean = false
	public TriggerConfigPath: string | undefined
	private codePath: string | undefined;

	constructor(text:string, treeItemType:TreeItemType) {
		super(text)
		this.Text = text
		this.TreeItemType = treeItemType
		this.refreshUI()
	}

	public set CodePath(path: string | undefined) {
		this.codePath = path;
		if (path) {
			let node = new LambdaTreeItem(path, TreeItemType.CodePath)
			node.Lambda = this.Lambda;
			node.Region = this.Region;
			node.Parent = this;
			this.Children.push(node);
			this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
		} else {
			this.Children = [];
			this.collapsibleState = vscode.TreeItemCollapsibleState.None;
		}
		//this.refreshUI();
	}

	public get CodePath(): string | undefined {
		return this.codePath;
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
		else if(this.TreeItemType === TreeItemType.CodePath)
		{
			this.iconPath = new vscode.ThemeIcon('file');
			this.contextValue = "CodePath"
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
	TriggerConfig = 6,
	CodePath = 7,
}