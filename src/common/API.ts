/* eslint-disable @typescript-eslint/naming-convention */
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { LambdaClient, ListFunctionsCommand } from "@aws-sdk/client-lambda";
import { CloudWatchLogsClient, OutputLogEvent } from "@aws-sdk/client-cloudwatch-logs";
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

export async function GetCredentials() {
  let credentials;

  try {
    if (LambdaTreeView.LambdaTreeView.Current) {
      process.env.AWS_PROFILE = LambdaTreeView.LambdaTreeView.Current.AwsProfile ;
    }
    // Get credentials using the default provider chain.
    const provider = fromNodeProviderChain();
    credentials = await provider();

    if (!credentials) {
      throw new Error("Aws credentials not found !!!");
    }

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
    
    let allFunctions = [];
    let marker: string | undefined = undefined;
    
    // Continue fetching pages until no NextMarker is returned
    do {
      const command:ListFunctionsCommand = new ListFunctionsCommand({ Marker: marker });
      const functionsList = await lambda.send(command);
      
      if (functionsList.Functions) {
        allFunctions.push(...functionsList.Functions);
      }
      
      // Update marker to the next page (if present)
      marker = functionsList.NextMarker;
    } while (marker);

    // Filter functions if a LambdaName filter is provided
    let matchingFunctions;
    if (LambdaName) {
      matchingFunctions = allFunctions.filter(
        (func) =>
          func.FunctionName?.includes(LambdaName) || LambdaName.length === 0
      );
    } else {
      matchingFunctions = allFunctions;
    }

    // Extract the function names into the result
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

export function isJsonString(jsonString: string): boolean {
  try {
    var json = ParseJson(jsonString);
    return (typeof json === 'object');
  } catch (e) {
    return false;
  }
}
export function ParseJson(jsonString: string) {
  return JSON.parse(jsonString);
}

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

export async function GetLatestLambdaLogStreamName(
  Region: string,
  Lambda: string
): Promise<MethodResult<string>> {
  ui.logToOutput("GetLatestLambdaLogStreamName for Lambda function: " + Lambda);
  let result: MethodResult<string> = new MethodResult<string>();

  try {
    // Get the log group name
    const logGroupName = GetLambdaLogGroupName(Lambda);
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

    result.result = logStreamName;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLatestLambdaLogStreamName Error !!!", error);
    ui.logToOutput("api.GetLatestLambdaLogStreamName Error !!!", error);
    return result;
  }
}

export function GetLambdaLogGroupName(Lambda: string) {
  return `/aws/lambda/${Lambda}`;
}

export async function GetLatestLambdaLogs(
  Region: string,
  Lambda: string
): Promise<MethodResult<string>> {
  ui.logToOutput("Getting logs for Lambda function: " + Lambda);
  let result: MethodResult<string> = new MethodResult<string>();

  try {
    // Get the log group name
    const logGroupName = GetLambdaLogGroupName(Lambda);
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
    ui.showErrorMessage("api.GetLatestLambdaLogs Error !!!", error);
    ui.logToOutput("api.GetLatestLambdaLogs Error !!!", error);
    return result;
  }
}

export async function GetLatestLambdaLogStreams(
  Region: string,
  Lambda: string
): Promise<MethodResult<string[]>> {
  ui.logToOutput("Getting log streams for Lambda function: " + Lambda);
  let result: MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try {
    // Get the log group name
    const logGroupName = GetLambdaLogGroupName(Lambda);
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    // Get the streams sorted by the latest event time
    const describeLogStreamsCommand = new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: "LastEventTime",
      descending: true,
      limit: 1,
    });

    const streamsResponse = await cloudwatchlogs.send(describeLogStreamsCommand);

    if (streamsResponse.logStreams && streamsResponse.logStreams.length > 0) {
      let logStreamNames = streamsResponse.logStreams.slice(0, 10).map(stream => stream.logStreamName || 'invalid log stream');
      result.result = logStreamNames;
    }
  
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLatestLambdaLogStreams Error !!!", error);
    ui.logToOutput("api.GetLatestLambdaLogStreams Error !!!", error);
    return result;
  }
}

export async function GetLambdaLogs(
  Region: string,
  Lambda: string,
  LogStreamName: string
): Promise<MethodResult<string>> {
  ui.logToOutput("Getting logs for Lambda function: " + Lambda + " LogStream " + LogStreamName);
  let result: MethodResult<string> = new MethodResult<string>();

  try {
    // Get the log group name
    const logGroupName = GetLambdaLogGroupName(Lambda);
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName: logGroupName,
      logStreamName: LogStreamName,
      limit: 50, // Adjust the limit as needed
      startFromHead: true, // Start from the beginning of the log stream
    });

    const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);

    if (!eventsResponse.events || eventsResponse.events.length === 0) {
      result.isSuccessful = false;
      result.error = new Error("No log events found for this Lambda function." + Lambda + " LogStream " + LogStreamName);
      ui.showErrorMessage("No log events found for this Lambda function."+ Lambda + " LogStream " + LogStreamName, result.error);
      ui.logToOutput("No log events found for this Lambda function."+ Lambda + " LogStream " + LogStreamName);
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
    ui.showErrorMessage("api.GetLatestLambdaLogs Error !!!", error);
    ui.logToOutput("api.GetLatestLambdaLogs Error !!!", error);
    return result;
  }
}

export async function GetLogEvents(
  Region: string,
  LogGroupName: string,
  LogStreamName: string,
): Promise<MethodResult<OutputLogEvent[]>> {
  ui.logToOutput("Getting logs from LogGroupName: " + LogGroupName + " LogStreamName: " + LogStreamName);
  let result: MethodResult<OutputLogEvent[]> = new MethodResult<OutputLogEvent[]>();
  result.result = [];
  try {
    // Get the log group name
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    const getLogEventsCommand = new GetLogEventsCommand({
      logGroupName: LogGroupName,
      logStreamName: LogStreamName,
      limit: 50, // Adjust the limit as needed
      startFromHead: true, // Start from the beginning of the log stream
    });

    const eventsResponse = await cloudwatchlogs.send(getLogEventsCommand);

    if (!eventsResponse.events || eventsResponse.events.length === 0) {
      result.isSuccessful = true;
      return result;
    }

    // Concatenate log messages
    result.result.push(...eventsResponse.events);

    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLogEvents Error !!!", error);
    ui.logToOutput("api.GetLogEvents Error !!!", error);
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

import { GetFunctionConfigurationCommand, GetFunctionConfigurationCommandOutput } from "@aws-sdk/client-lambda";

export async function GetLambdaConfiguration(
  Region: string,
  LambdaName: string
): Promise<MethodResult<GetFunctionConfigurationCommandOutput>> {
  let result: MethodResult<GetFunctionConfigurationCommandOutput> = new MethodResult<GetFunctionConfigurationCommandOutput>();

  try {
    const lambda = await GetLambdaClient(Region);

    const command = new GetFunctionConfigurationCommand({
      FunctionName: LambdaName,
    });

    const response = await lambda.send(command);
    result.result = response;
    result.isSuccessful = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage("api.GetLambdaConfiguration Error !!!", error);
    ui.logToOutput("api.GetLambdaConfiguration Error !!!", error);
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
    //wait for the zip file to be created
    while (!fs.existsSync(zipresponse.result)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const zipFileContents = fs.readFileSync(zipresponse.result);

    const command = new UpdateFunctionCodeCommand({
      FunctionName: LambdaName,
      ZipFile: zipFileContents,
    });

    const response = await lambda.send(command);

    // Delete the zip file
    fs.unlinkSync(zipresponse.result);

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



export async function ZipTextFile(inputPath: string, outputZipPath?: string): Promise<MethodResult<string>> {
  let result:MethodResult<string> = new MethodResult<string>();

  try 
  {
    if(!outputZipPath)
    {
      outputZipPath = dirname(inputPath) + "/" + basename(inputPath) + ".zip"
    }

    // Delete the output zip file if it already exists
    if (fs.existsSync(outputZipPath)) {
      fs.unlinkSync(outputZipPath);
    }

    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level
    });

    archive.pipe(output);

    if (fs.lstatSync(inputPath).isDirectory()) {
      archive.directory(inputPath, false);
    } else {
      archive.file(inputPath, { name: basename(inputPath) });
    }

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
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

async function GetSTSClient() {
  const credentials = await GetCredentials();
  const iamClient = new STSClient({ credentials });
  return iamClient;
}
export async function TestAwsConnection(): Promise<MethodResult<boolean>> {
  let result: MethodResult<boolean> = new MethodResult<boolean>();

  try {
    const sts = await GetSTSClient();

    const command = new GetCallerIdentityCommand({});
    const data = await sts.send(command);

    result.isSuccessful = true;
    result.result = true;
    return result;
  } catch (error: any) {
    result.isSuccessful = false;
    result.error = error;
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