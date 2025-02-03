/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LambdaTreeItem, TreeItemType } from './LambdaTreeItem';
import { LambdaTreeDataProvider } from './LambdaTreeDataProvider';
import * as ui from '../common/UI';
import * as api from '../common/API';

export class LambdaTreeView {

	public static Current: LambdaTreeView | undefined;
	public view: vscode.TreeView<LambdaTreeItem>;
	public treeDataProvider: LambdaTreeDataProvider;
	public context: vscode.ExtensionContext;
	public FilterString: string = "";
	public isShowOnlyFavorite: boolean = false;
	public isShowHiddenNodes: boolean = false;
	public AwsProfile: string = "default";	
	public AwsEndPoint: string | undefined;

	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('TreeView.constructor Started');
		this.context = context;
		this.treeDataProvider = new LambdaTreeDataProvider();
		this.LoadState();
		this.view = vscode.window.createTreeView('LambdaTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		this.Refresh();
		context.subscriptions.push(this.view);
		LambdaTreeView.Current = this;
		this.SetFilterMessage();
		this.TestAwsConnection();
	}

	TestAwsConnection(){
		api.TestAwsConnection()
	}

	Refresh(): void {
		ui.logToOutput('LambdaTreeView.refresh Started');

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Aws Lambda: Loading...",
		}, (progress, token) => {
			progress.report({ increment: 0 });

			this.LoadTreeItems();

			return new Promise<void>(resolve => { resolve(); });
		});
	}

	LoadTreeItems(){
		ui.logToOutput('LambdaTreeView.loadTreeItems Started');

		//this.treeDataProvider.LoadRegionNodeList();
		//this.treeDataProvider.LoadLogGroupNodeList();
		//this.treeDataProvider.LoadLogStreamNodeList();
		//this.treeDataProvider.Refresh();
		this.SetViewTitle();
	}

	ResetView(): void {
		ui.logToOutput('LambdaTreeView.resetView Started');
		this.FilterString = '';

		this.treeDataProvider.Refresh();
		this.SetViewTitle();

		this.SaveState();
		this.Refresh();
	}

	async AddToFav(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.AddToFav Started');
		node.IsFav = true;
		node.refreshUI();
	}

	async HideNode(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.HideNode Started');
		node.IsHidden = true;

		this.treeDataProvider.Refresh();
	}

	async UnHideNode(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.UnHideNode Started');
		node.IsHidden = false;
	}

	async DeleteFromFav(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.DeleteFromFav Started');
		node.IsFav = false;
		node.refreshUI();
	}

	async Filter() {
		ui.logToOutput('LambdaTreeView.Filter Started');
		let filterStringTemp = await vscode.window.showInputBox({ value: this.FilterString, placeHolder: 'Enter Your Filter Text' });

		if (filterStringTemp === undefined) { return; }

		this.FilterString = filterStringTemp;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowOnlyFavorite() {
		ui.logToOutput('LambdaTreeView.ShowOnlyFavorite Started');
		this.isShowOnlyFavorite = !this.isShowOnlyFavorite;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async ShowHiddenNodes() {
		ui.logToOutput('LambdaTreeView.ShowHiddenNodes Started');
		this.isShowHiddenNodes = !this.isShowHiddenNodes;
		this.treeDataProvider.Refresh();
		this.SetFilterMessage();
		this.SaveState();
	}

	async SetViewTitle(){
		this.view.title = "Aws Lambda";
	}

	SaveState() {
		ui.logToOutput('LambdaTreeView.saveState Started');
		try {

			this.context.globalState.update('AwsProfile', this.AwsProfile);
			this.context.globalState.update('FilterString', this.FilterString);
			this.context.globalState.update('ShowOnlyFavorite', this.isShowOnlyFavorite);
			this.context.globalState.update('ShowHiddenNodes', this.isShowHiddenNodes);
			this.context.globalState.update('LambdaList', this.treeDataProvider.GetLambdaList());
			this.context.globalState.update('ViewType', this.treeDataProvider.ViewType);
			this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);

			ui.logToOutput("LambdaTreeView.saveState Successfull");
		} catch (error) {
			ui.logToOutput("LambdaTreeView.saveState Error !!!");
		}
	}

	LoadState() {
		ui.logToOutput('LambdaTreeView.loadState Started');
		try {

			let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
			if (AwsProfileTemp) {
				this.AwsProfile = AwsProfileTemp;
			}

			let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
			if (filterStringTemp) {
				this.FilterString = filterStringTemp;
			}

			let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }

			let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
			if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }

			let LambdaListTemp:[{Region: string, Lambda: string}] | undefined  = this.context.globalState.get('LambdaList');
			if(LambdaListTemp)
			{
				this.treeDataProvider.SetLambdaList(LambdaListTemp);
			}

			let ViewTypeTemp:number | undefined = this.context.globalState.get('ViewType');
			if(ViewTypeTemp)
			{
				this.treeDataProvider.ViewType = ViewTypeTemp;
			}

			let AwsEndPointTemp: string | undefined = this.context.globalState.get('AwsEndPoint');
			this.AwsEndPoint = AwsEndPointTemp;

			ui.logToOutput("LambdaTreeView.loadState Successfull");

		} 
		catch (error) 
		{
			ui.logToOutput("LambdaTreeView.loadState Error !!!");
		}
	}

	async SetFilterMessage(){
		this.view.message = 
		await this.GetFilterProfilePrompt()
		+ this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, " 
		+ this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
		+ this.FilterString;
	}

	async GetFilterProfilePrompt() {
		if(await api.IsSharedIniFileCredentials())
		{
			return "Profile:" + this.AwsProfile + " ";
		}
		return ""
	}

	GetBoolenSign(variable: boolean){
		return variable ? "✓" : "𐄂";
	}

	async AddLambda(){
		ui.logToOutput('LambdaTreeView.AddLambda Started');

		let selectedRegion = await vscode.window.showInputBox({ placeHolder: 'Enter Region Eg: us-east-1', value: 'us-east-1' });
		if(selectedRegion===undefined){ return; }

		let selectedLambdaName = await vscode.window.showInputBox({ placeHolder: 'Enter Lambda Name / Search Text' });
		if(selectedLambdaName===undefined){ return; }

		var resultLambda = await api.GetLambdaList(selectedRegion, selectedLambdaName);
		if(!resultLambda.isSuccessful){ return; }

		let selectedLambdaList = await vscode.window.showQuickPick(resultLambda.result, {canPickMany:true, placeHolder: 'Select Lambda(s)'});
		if(!selectedLambdaList || selectedLambdaList.length===0){ return; }

		for(var selectedLambda of selectedLambdaList)
		{
			this.treeDataProvider.AddLambda(selectedRegion, selectedLambda);
		}
		this.SaveState();
	}

	async RemoveLambda(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.RemoveLambda Started');
		
		if(node.TreeItemType !== TreeItemType.Lambda) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		this.treeDataProvider.RemoveLambda(node.Region, node.Lambda);		
		this.SaveState();
	}

	async Goto(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.Goto Started');
		
		if(node.TreeItemType !== TreeItemType.Lambda) { return;}
		if(!node.Lambda) { return; }

		//vscode.commands.executeCommand('vscode.openWith', vscode.Uri.parse('https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/' + node.Lambda), "external");
		ui.showInfoMessage("Work In Progress");
		
	}

	async LambdaView(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.LambdaView Started');
		if(node.TreeItemType !== TreeItemType.Lambda) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		ui.showInfoMessage('Work In Progress');
	}

	async TriggerLambda(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.TriggerLambda Started');
		
		if(node.TreeItemType !== TreeItemType.Lambda) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		let result = await api.TriggerLambda(node.Region, node.Lambda, {});
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.TriggerLambda Error !!!", result.error);
			ui.showErrorMessage('Trigger Lambda Error !!!', result.error);
			return;
		}
		ui.logToOutput("api.TriggerLambda Success !!!");
		if(result.result && result.result.Payload)
		{
			ui.logToOutput("api.TriggerLambda PayLoad \n" + result.result.Payload.toString());
		}
		
		ui.showInfoMessage('Lambda Triggered Successfully');
		
	}

	async LatestLogs(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.LatestLogs Started');
		
		if(node.TreeItemType !== TreeItemType.Lambda) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		let resultLogs = await api.GetLambdaLogs(node.Region, node.Lambda);
		if(!resultLogs.isSuccessful)
		{
			ui.logToOutput("api.GetLambdaLogs Error !!!", resultLogs.error);
			ui.showErrorMessage('Get Lambda Logs Error !!!', resultLogs.error);
			return;
		}
		ui.logToOutput("api.GetLambdaLogs Success !!!");
		ui.logToOutput("api.GetLambdaLogs Logs \n" + resultLogs.result);
		ui.showInfoMessage('Lambda Latest Logs Retrieved Successfully');
		
	}

	async SelectAwsProfile(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.SelectAwsProfile Started');

		if (!api.IsSharedIniFileCredentials())
		{
			ui.showWarningMessage("Your Aws Access method is not credentials file");
			return;
		}

		var result = await api.GetAwsProfileList();
		if(!result.isSuccessful){ return; }

		let selectedAwsProfile = await vscode.window.showQuickPick(result.result, {canPickMany:false, placeHolder: 'Select Aws Profile'});
		if(!selectedAwsProfile){ return; }

		this.AwsProfile = selectedAwsProfile;
		this.SaveState();
		this.SetFilterMessage();
		this.TestAwsConnection();
	}

	async UpdateAwsEndPoint() {
		ui.logToOutput('LambdaTreeView.UpdateAwsEndPoint Started');

		let awsEndPointUrl = await vscode.window.showInputBox({ placeHolder: 'Enter Aws End Point URL (Leave Empty To Return To Default)' });
		if(awsEndPointUrl===undefined){ return; }
		if(awsEndPointUrl.length===0) { this.AwsEndPoint = undefined; }
		else
		{
			this.AwsEndPoint = awsEndPointUrl;
		}
		this.SaveState();
	}

}
