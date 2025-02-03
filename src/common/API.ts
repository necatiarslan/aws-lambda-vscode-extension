/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs";
import { IAMClient } from "@aws-sdk/client-iam";
import * as ui from "./UI";
import { MethodResult } from './MethodResult';
import { homedir } from "os";
import { sep } from "path";
import { join, basename, extname, dirname } from "path";
import { parseKnownFiles, SourceProfileInit } from "../aws-sdk/parseKnownFiles";
import { ParsedIniData } from "@aws-sdk/types";
import * as LambdaTreeView from '../lambda/LambdaTreeView';
import * as fs from 'fs';
import * as archiver from 'archiver';

export async function IsSharedIniFileCredentials(credentials:any|undefined=undefined)
{
  return await GetCredentialProviderName(credentials) === "SharedIniFileCredentials"
}

export async function IsEnvironmentCredentials(credentials:any|undefined=undefined)
{
  return await GetCredentialProviderName(credentials) === "EnvironmentCredentials"
}

export async function GetCredentialProviderName(credentials:any|undefined=undefined)
{
  if(!credentials)
  {
    credentials = GetCredentials();
  }
  return credentials.constructor.name;
}

export async function GetCredentials() {
  let credentials;

  try {
    // Get credentials using the default provider chain.
    const provider = fromNodeProviderChain();
    credentials = await provider();

    if (!credentials) {
      throw new Error("Aws credentials not found !!!");
    }

    // If the credentials come from a shared INI file and the current profile is not "default",
    // re-resolve credentials using the specified profile.
    if (await IsSharedIniFileCredentials(credentials)) {
      if (
        LambdaTreeView.LambdaTreeView.Current &&
        LambdaTreeView.LambdaTreeView.Current.AwsProfile !== "default"
      ) {
        credentials = await fromIni({
          profile: LambdaTreeView.LambdaTreeView.Current.AwsProfile,
        })();
      }
    }

    ui.logToOutput(
      "Aws credentials provider " + (await GetCredentialProviderName(credentials))
    );
    ui.logToOutput("Aws credentials AccessKeyId=" + credentials.accessKeyId);
    return credentials;
  } catch (error: any) {
    ui.showErrorMessage("Aws Credentials Not Found !!!", error);
    ui.logToOutput("GetCredentials Error !!!", error);
    return credentials;
  }
}

async function GetLambdaClient(region: string) {
  const credentials = await GetCredentials();
  
  const lambdaClient = new LambdaClient({
    region,
    credentials,
    endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint,
  });
  
  return lambdaClient;
}

async function GetCloudWatchClient(region: string) {
  const credentials = await GetCredentials();
  const cloudwatchLogsClient = new CloudWatchLogsClient({
    region,
    credentials,
    endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint,
  });
  
  return cloudwatchLogsClient;
}

async function GetIAMClient() {
  const credentials = await GetCredentials();
  const iamClient = new IAMClient({ credentials });
  return iamClient;
}

export async function GetLambdaList(
  region: string,
  LambdaName?: string
): Promise<MethodResult<string[]>> {
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    // Get the Lambda client (v3 client)
    const lambda = await GetLambdaClient(region);
    
    // Create the command to list functions
    const command = new ListFunctionsCommand({});
    
    // Send the command to the client
    const functionsList = await lambda.send(command);

    let matchingFunctions;
    if (LambdaName) {
      matchingFunctions = functionsList.Functions?.filter(
        (func) =>
          func.FunctionName?.includes(LambdaName) || LambdaName.length === 0
      );
    } else {
      matchingFunctions = functionsList.Functions;
    }

    if (matchingFunctions && matchingFunctions.length > 0) {
      matchingFunctions.forEach((func) => {
        if (func.FunctionName) result.result.push(func.FunctionName);
      });
    }

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLambdaList Error !!!", error);
    ui.logToOutput("api.GetLambdaList Error !!!", error);
    return result;
  }
}

import {
  InvokeCommand,
  InvokeCommandOutput,
  InvokeCommandInput,
} from "@aws-sdk/client-lambda";

export async function TriggerLambda(
  Region: string,
  LambdaName: string,
  Parameters: { [key: string]: any }
): Promise<MethodResult<InvokeCommandOutput>> {
  let result: MethodResult<InvokeCommandOutput> = new MethodResult<InvokeCommandOutput>();

  try {
    const lambda = await GetLambdaClient(Region);
  
    // Specify the parameters for invoking the Lambda function
    const param: InvokeCommandInput = {
      FunctionName: LambdaName,
      // Explicitly cast the literal so that its type is the exact union type expected
      InvocationType: "RequestResponse" as const,
      Payload: JSON.stringify(Parameters),
    };

    const command = new InvokeCommand(param);
    const response = await lambda.send(command);

    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.TriggerLambda Error !!!", error);
    ui.logToOutput("api.TriggerLambda Error !!!", error);
    return result;
  }
}


import {
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

export async function GetLambdaLogs(
  Region: string,
  Lambda: string
): Promise<MethodResult<string>> {
  ui.logToOutput("Getting logs for Lambda function: " + Lambda);
  let result: MethodResult<string> = new MethodResult<string>();

  try {
    // Get the log group name
    const logGroupName = `/aws/lambda/${Lambda}`;
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    // Get the streams sorted by the latest event time
    const describeLogStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: 1,
    });

    const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);

    if (!streamsResponse.logStreams || streamsResponse.logStreams.length === 0) {
      result.isSuccessful = false;
      result.error = new Error("No log streams found for this Lambda function.");
      ui.showErrorMessage("No log streams found for this Lambda function.", result.error);
      ui.logToOutput("No log streams found for this Lambda function.");
      return result;
    }

    // Get the latest log events from the first stream
    const logStreamName = streamsResponse.logStreams[0].logStreamName;
    if (!logStreamName) {
      result.isSuccessful = false;
      result.error = new Error("No log stream name found for this Lambda function.");
      ui.showErrorMessage("No log stream name found for this Lambda function.", result.error);
      ui.logToOutput("No log stream name found for this Lambda function.");
      return result;
    }

    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      limit: 50, // Adjust the limit as needed
      startFromHead: true, // Start from the beginning of the log stream
    });

    const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);

    if (!eventsResponse.events || eventsResponse.events.length === 0) {
      result.isSuccessful = false;
      result.error = new Error("No log events found for this Lambda function.");
      ui.showErrorMessage("No log events found for this Lambda function.", result.error);
      ui.logToOutput("No log events found for this Lambda function.");
      return result;
    }

    // Concatenate log messages
    result.result = eventsResponse.events
      .map((event) => event.message)
      .filter((msg) => msg)
      .join("\n");

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLambdaLogs Error !!!", error);
    ui.logToOutput("api.GetLambdaLogs Error !!!", error);
    return result;
  }
}


import {
  GetFunctionCommand,
  GetFunctionCommandOutput,
} from "@aws-sdk/client-lambda";

export async function GetLambda(
  Region: string,
  LambdaName: string
): Promise<MethodResult<GetFunctionCommandOutput>> {
  let result: MethodResult<GetFunctionCommandOutput> = new MethodResult<GetFunctionCommandOutput>();

  try {
    const lambda = await GetLambdaClient(Region);

    const command = new GetFunctionCommand({
      FunctionName: LambdaName,
    });

    const response = await lambda.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLambda Error !!!", error);
    ui.logToOutput("api.GetLambda Error !!!", error);
    return result;
  }
}


import {
  UpdateFunctionCodeCommand,
  UpdateFunctionCodeCommandOutput,
} from "@aws-sdk/client-lambda";

export async function UpdateLambdaCode(
  Region: string,
  LambdaName: string,
  CodeFilePath: string
): Promise<MethodResult<UpdateFunctionCodeCommandOutput>> {
  let result: MethodResult<UpdateFunctionCodeCommandOutput> =
    new MethodResult<UpdateFunctionCodeCommandOutput>();

  try {
    const lambda = await GetLambdaClient(Region);

    let zipresponse = await ZipTextFile(CodeFilePath);
    const zipFileContents = fs.readFileSync(zipresponse.result);

    const command = new UpdateFunctionCodeCommand({
      FunctionName: LambdaName,
      ZipFile: zipFileContents,
    });

    const response = await lambda.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.UpdateLambdaCode Error !!!", error);
    ui.logToOutput("api.UpdateLambdaCode Error !!!", error);
    return result;
  }
}



export async function ZipTextFile(inputFilePath: string, outputZipPath?: string): Promise<MethodResult<string>> {
  let result:MethodResult<string> = new MethodResult<string>();

  try 
  {
    if(!outputZipPath)
    {
      outputZipPath = dirname(inputFilePath) + basename(inputFilePath) + ".zip"
    }

    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level
    });

    archive.pipe(output);
    archive.file(inputFilePath, { name: basename(inputFilePath)+extname(inputFilePath) });
    archive.finalize();

    result.result = outputZipPath;
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.ZipTextFile Error !!!', error);
    ui.logToOutput("api.ZipTextFile Error !!!", error); 
    return result;
  }
}

import { GetUserCommand, GetUserCommandOutput } from "@aws-sdk/client-iam";

export async function TestAwsConnection(): Promise<MethodResult<boolean>> {
  let result: MethodResult<boolean> = new MethodResult<boolean>();

  try {
    const iam = await GetIAMClient();

    const command = new GetUserCommand({});
    let response: GetUserCommandOutput = await iam.send(command);

    result.isSuccessful = true;
    result.result = true;
    return result;
  } catch (error: any) {
    if (error.name.includes("Signature")) {
      result.isSuccessful = false;
      result.error = error;
      ui.showErrorMessage("api.TestAwsConnection Error !!!", error);
      ui.logToOutput("api.TestAwsConnection Error !!!", error);
    } else {
      result.isSuccessful = true;
      result.result = true;
    }

    return result;
  }
}


export async function GetAwsProfileList(): Promise<MethodResult<string[]>> {
  ui.logToOutput("api.GetAwsProfileList Started");

  let result:MethodResult<string[]> = new MethodResult<string[]>();

  try 
  {
    let profileData = await getIniProfileData();
    
    result.result = Object.keys(profileData);
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.GetAwsProfileList Error !!!', error);
    ui.logToOutput("api.GetAwsProfileList Error !!!", error); 
    return result;
  }
}

export async function getIniProfileData(init: SourceProfileInit = {}):Promise<ParsedIniData>
{
    const profiles = await parseKnownFiles(init);
    return profiles;
}

export const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";

export const getHomeDir = (): string => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${sep}` } = process.env;
  
    if (HOME) { return HOME; }
    if (USERPROFILE) { return USERPROFILE; } 
    if (HOMEPATH) { return `${HOMEDRIVE}${HOMEPATH}`; } 
  
    return homedir();
  };

export const getCredentialsFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "credentials");

export const getConfigFilepath = () =>
  process.env[ENV_CREDENTIALS_PATH] || join(getHomeDir(), ".aws", "config");