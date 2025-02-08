/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { LambdaTreeItem, TreeItemType } from './LambdaTreeItem';
import { LambdaTreeDataProvider } from './LambdaTreeDataProvider';
import * as ui from '../common/UI';
import * as api from '../common/API';
import { CloudWatchLogView } from '../cloudwatch/CloudWatchLogView';

export class LambdaTreeView {

	public static Current: LambdaTreeView;
	public view: vscode.TreeView<LambdaTreeItem>;
	public treeDataProvider: LambdaTreeDataProvider;
	public context: vscode.ExtensionContext;
	public FilterString: string = "";
	public isShowOnlyFavorite: boolean = false;
	public isShowHiddenNodes: boolean = false;
	public AwsProfile: string = "default";	
	public AwsEndPoint: string | undefined;
	public LambdaList: {Region: string, Lambda: string}[] = [];
	public CodePathList: {Region: string, Lambda: string, CodePath: string}[] = [];


	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('TreeView.constructor Started');
		LambdaTreeView.Current = this;
		this.context = context;
		this.LoadState();
		this.treeDataProvider = new LambdaTreeDataProvider();
		this.view = vscode.window.createTreeView('LambdaTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		this.Refresh();
		context.subscriptions.push(this.view);
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
		this.treeDataProvider.Refresh();
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
			this.context.globalState.update('LambdaList', this.LambdaList);
			this.context.globalState.update('CodePathList', this.CodePathList);
			this.context.globalState.update('AwsEndPoint', this.AwsEndPoint);

			ui.logToOutput("LambdaTreeView.saveState Successfull");
		} catch (error) {
			ui.logToOutput("LambdaTreeView.saveState Error !!!");
		}
	}

	LoadState() {
		ui.logToOutput('LambdaTreeView.loadState Started');
		try {
			let AwsEndPointTemp: string | undefined = this.context.globalState.get('AwsEndPoint');
			if (AwsEndPointTemp) { this.AwsEndPoint = AwsEndPointTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("LambdaTreeView.loadState AwsEndPoint Error !!!", error);
			ui.showErrorMessage("Aws Lambda Load State AwsEndPoint Error !!!", error);
		}

		try {
			let AwsProfileTemp: string | undefined = this.context.globalState.get('AwsProfile');
			if (AwsProfileTemp) { this.AwsProfile = AwsProfileTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("LambdaTreeView.loadState AwsProfile Error !!!", error);
			ui.showErrorMessage("Aws Lambda Load State AwsProfile Error !!!", error);
		}

		try {
			let filterStringTemp: string | undefined = this.context.globalState.get('FilterString');
			if (filterStringTemp) { this.FilterString = filterStringTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("LambdaTreeView.loadState FilterString Error !!!", error);
			ui.showErrorMessage("Aws Lambda Load State FilterString Error !!!", error);
		}

		try {
			let ShowOnlyFavoriteTemp: boolean | undefined = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.isShowOnlyFavorite = ShowOnlyFavoriteTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("LambdaTreeView.loadState Error !!!", error);
			ui.showErrorMessage("Aws Lambda Load State Error !!!", error);
		}

		try {
			let ShowHiddenNodesTemp: boolean | undefined = this.context.globalState.get('ShowHiddenNodes');
			if (ShowHiddenNodesTemp) { this.isShowHiddenNodes = ShowHiddenNodesTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("LambdaTreeView.loadState isShowHiddenNodes Error !!!", error);
			ui.showErrorMessage("Aws Lambda Load State isShowHiddenNodes Error !!!", error);
		}

		try {
			let LambdaListTemp:{Region: string, Lambda: string}[] | undefined  = this.context.globalState.get('LambdaList');
			if(LambdaListTemp){ this.LambdaList = LambdaListTemp; }

			let CodePathListTemp:{Region: string, Lambda: string, CodePath: string}[] | undefined  = this.context.globalState.get('CodePathList');
			if(CodePathListTemp){ this.CodePathList = CodePathListTemp; }
		} 
		catch (error:any) 
		{
			ui.logToOutput("LambdaTreeView.loadState LambdaList/CodePathList Error !!!", error);
			ui.showErrorMessage("Aws Lambda Load State LambdaList/CodePathList Error !!!", error);
		}

	}

	async SetFilterMessage(){
		if(this.LambdaList.length > 0)
		{
			this.view.message = 
			await this.GetFilterProfilePrompt()
			+ this.GetBoolenSign(this.isShowOnlyFavorite) + "Fav, " 
			+ this.GetBoolenSign(this.isShowHiddenNodes) + "Hidden, "
			+ this.FilterString;
		}
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
		
		if(node.TreeItemType !== TreeItemType.Lambda && node.TreeItemType !== TreeItemType.TriggerConfig) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		let config = await vscode.window.showInputBox({ placeHolder: 'Enter Trigger Config or leave empty' });
		if(config && api.isJsonString(config)){
			ui.showInfoMessage('Config should be a valid JSON');
			return; 
		}
		let param: {} = {}
		if(config)
		{
			param = api.ParseJson(config)
		}
		let result = await api.TriggerLambda(node.Region, node.Lambda, param);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.TriggerLambda Error !!!", result.error);
			ui.showErrorMessage('Trigger Lambda Error !!!', result.error);
			return;
		}
		ui.logToOutput("api.TriggerLambda Success !!!");

		// Convert Uint8Array to string
		const payloadString = new TextDecoder("utf-8").decode(result.result.Payload);
		// Parse the JSON string
		const parsedPayload = JSON.parse(payloadString);
		// Pretty-print the JSON with 2-space indentation
		let payload = JSON.stringify(parsedPayload, null, 2)

		if(result.result && result.result.Payload)
		{
			ui.logToOutput("api.TriggerLambda PayLoad \n" + payload, undefined, true);
			this.ViewLatestLog(node)
		}
		
		ui.showInfoMessage('Lambda Triggered Successfully');
		
	}

	async ViewLatestLog(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.ViewLatestLog Started');
		
		if(node.TreeItemType !== TreeItemType.Lambda) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		let resultLogs = await api.GetLatestLambdaLogs(node.Region, node.Lambda);
		if(!resultLogs.isSuccessful)
		{
			ui.logToOutput("api.GetLatestLambdaLogs Error !!!", resultLogs.error);
			ui.showErrorMessage('Get Lambda Logs Error !!!', resultLogs.error);
			return;
		}
		ui.logToOutput("api.GetLatestLambdaLogs Success !!!");
		ui.logToOutput("api.GetLatestLambdaLogs Logs \n" + resultLogs.result, undefined, true);
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
		this.Refresh();
	}

	async PrintLambda(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.PrintLambda Started');
		if(node.TreeItemType !== TreeItemType.Lambda) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		let result = await api.GetLambda(node.Region, node.Lambda);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.GetLambda Error !!!", result.error);
			ui.showErrorMessage('Get Lambda Error !!!', result.error);
			return;
		}
		let codePath = this.treeDataProvider.GetCodePath(node.Region, node.Lambda);
		ui.logToOutput("Code Path : " + codePath);
		ui.logToOutput(JSON.stringify(result.result, null, 4));
	}

	async UpdateCodes(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.UpdateCodes Started');
		if(node.TreeItemType !== TreeItemType.Code) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }
		if(!node.CodePath) { 
			ui.showWarningMessage("Please Set Code Path First");
			return; 
		}

		let result = await api.UpdateLambdaCode(node.Region, node.Lambda, node.CodePath);
		if(!result.isSuccessful)
		{
			ui.logToOutput("api.UpdateLambdaCode Error !!!", result.error);
			ui.showErrorMessage('Update Lambda Code Error !!!', result.error);
			return;
		}
		ui.logToOutput("api.UpdateLambdaCode Success !!!");
		ui.showInfoMessage('Lambda Code Updated Successfully');
	}

	async SetCodePath(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.SetCodePath Started');
		if(node.TreeItemType !== TreeItemType.Code) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		const selectedPath = await vscode.window.showOpenDialog({
			canSelectMany: false,
			openLabel: 'Select',
			canSelectFiles: true,
			canSelectFolders: true
		});
		
		if(!selectedPath || selectedPath.length===0){ return; }

		node.CodePath = selectedPath[0].path;
		this.treeDataProvider.AddCodePath(node.Region, node.Lambda, node.CodePath);
		this.SaveState();
		ui.showInfoMessage('Code Path Set Successfully');
	}

	async ViewLog(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.ViewLog Started');
		if(node.TreeItemType !== TreeItemType.LogStream) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }
		if(!node.LogStreamName) { return; }

		const logGroupName = `/aws/lambda/${node.Lambda}`;
		CloudWatchLogView.Render(this.context.extensionUri, node.Region, logGroupName, node.LogStreamName);
	}

	async RefreshLogStreams(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.RefreshLogs Started');
		
		if(node.TreeItemType !== TreeItemType.LogGroup) { return;}
		if(!node.Lambda) { return; }
		if(!node.Region) { return; }

		let resultLogs = await api.GetLatestLambdaLogStreams(node.Region, node.Lambda);
		if(!resultLogs.isSuccessful)
		{
			ui.logToOutput("api.GetLatestLambdaLogStreams Error !!!", resultLogs.error);
			ui.showErrorMessage('Get Lambda Logs Error !!!', resultLogs.error);
			return;
		}
		ui.logToOutput("api.GetLatestLambdaLogStreams Success !!!");
		this.treeDataProvider.AddLogStreams(node, resultLogs.result)
		ui.showInfoMessage('Lambda Logs Retrieved Successfully');
	}

	async RemoveTriggerConfig(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.RemoveTriggerConfig Started');
		ui.showWarningMessage("Work In Progress");
	}

	async AddTriggerConfig(node: LambdaTreeItem) {
		ui.logToOutput('LambdaTreeView.AddTriggerConfig Started');
		ui.showWarningMessage("Work In Progress");
	}


}
