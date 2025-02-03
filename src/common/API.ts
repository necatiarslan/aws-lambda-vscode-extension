/* eslint-disable @typescript-eslint/naming-convention */
import * as AWS from "aws-sdk";
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

export async function GetCredentials()
{
  let credentials:AWS.Credentials|undefined;

  try
  {
    const provider = new AWS.CredentialProviderChain();
    credentials = await provider.resolvePromise();
    
    if(!credentials)
    {
      throw new Error("Aws credentials not found !!!")
    }
  
    if(await IsSharedIniFileCredentials(credentials))
    {
      if(LambdaTreeView.LambdaTreeView.Current && LambdaTreeView.LambdaTreeView.Current?.AwsProfile != "default")
      {
        credentials = new AWS.SharedIniFileCredentials({ profile: LambdaTreeView.LambdaTreeView.Current?.AwsProfile });
      }
    }
    ui.logToOutput("Aws credentials provider " + await GetCredentialProviderName(credentials));
    ui.logToOutput("Aws credentials AccessKeyId=" + credentials?.accessKeyId)
    return credentials    
  }
  catch (error:any) 
  {
    ui.showErrorMessage('Aws Credentials Not Found !!!', error);
    ui.logToOutput("GetCredentials Error !!!", error);
    return credentials;
  }

}

async function GetLambdaClient(Region:string) {
  let lambda = undefined; 

  let credentials = await GetCredentials();
  lambda = new AWS.Lambda({region:Region, credentials: credentials, endpoint:LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint});
  
  return lambda;
}

async function GetCloudWatchClient(Region:string) {
  let cloudwatchlogs = undefined; 

  let credentials = await GetCredentials();
  cloudwatchlogs = new AWS.CloudWatchLogs({region:Region, credentials: credentials, endpoint:LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint});
  
  return cloudwatchlogs;
}

async function GetIAMClient()
{
  let credentials = await GetCredentials();
  const iam = new AWS.IAM({credentials:credentials});
  return iam;
}

async function GetEC2Client()
{
  let credentials = await GetCredentials();
  const ec2 = new AWS.EC2({region: 'us-east-1', credentials:credentials});
  return ec2;
}

export async function GetCurrentAwsUserInfo(): Promise<MethodResult<{ [key: string]: string }>> {
  let result:MethodResult<{ [key: string]: string }> = new MethodResult<{ [key: string]: string }>();
  const iam = await GetIAMClient();

  try {
    const user = await iam.getUser().promise();
    result.result["UserId"] = user.User?.UserId;
    result.result["UserName"] = user.User?.UserName;
    return result
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.getAwsUserInfo Error !!!', error);
    ui.logToOutput("api.getAwsUserInfo Error !!!", error); 
    return result;
  }
}

export async function GetLambdaList(Region:string, LambdaName?:string): Promise<MethodResult<string[]>> {
  let result:MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try 
  {
    const lambda = await GetLambdaClient(Region);
    const functionsList = await lambda.listFunctions().promise();

    let matchingFunctions;
    if(LambdaName)
    {
      matchingFunctions = functionsList.Functions?.filter(
        (func) => func.FunctionName?.includes(LambdaName) || LambdaName.length === 0
      );
    }
    else
    {
      matchingFunctions = functionsList.Functions;
    }
    

    if (matchingFunctions && matchingFunctions.length > 0) {
      matchingFunctions.forEach((func) => {
        if(func.FunctionName)
          result.result.push(func.FunctionName);
      });
    }
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.GetLambdaList Error !!!', error);
    ui.logToOutput("api.GetLambdaList Error !!!", error); 
    return result;
  }
}

export async function TriggerLambda(Region:string, LambdaName:string, Parameters:{[key: string]: any}): Promise<MethodResult<AWS.Lambda.InvocationResponse>> {
  let result:MethodResult<AWS.Lambda.InvocationResponse> = new MethodResult<AWS.Lambda.InvocationResponse>();

  try 
  {
    const lambda = await GetLambdaClient(Region);
  
    // Specify the parameters for invoking the Lambda function
    const param: AWS.Lambda.InvocationRequest = {
      FunctionName: LambdaName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(Parameters)
    };
    
    const response = await lambda.invoke(param).promise();
    result.result = response;
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.TriggerLambda Error !!!', error);
    ui.logToOutput("api.TriggerLambda Error !!!", error); 
    return result;
  }
}

export async function GetLambdaLogs(Region:string, Lambda:string) : Promise<MethodResult<string>>
{
  ui.logToOutput('Getting logs for Lambda function:' + Lambda); 
  let result:MethodResult<string> = new MethodResult<string>();
  try {
    // Get the log group name
    const logGroupName = `/aws/lambda/${Lambda}`;
    const cloudwatchlogs = await GetCloudWatchClient(Region);

    // Get the streams sorted by the latest event time
    const streams = await cloudwatchlogs.describeLogStreams({
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 1,
    }).promise();

    if (!streams.logStreams) {
      result.isSuccessful = false;
      result.error = new Error('No log streams found for this Lambda function.');
      ui.showErrorMessage('No log streams found for this Lambda function.', result.error);
      ui.logToOutput('No log streams found for this Lambda function.'); 
      return result;
    }

    if (streams.logStreams && streams.logStreams.length === 0) {
      result.isSuccessful = false;
      result.error = new Error('No log streams found for this Lambda function.');
      ui.showErrorMessage('No log streams found for this Lambda function.', result.error);
      ui.logToOutput('No log streams found for this Lambda function.'); 
      return result;
    }

    // Get the latest log events from the first stream
    const logStreamName = streams.logStreams[0].logStreamName;
    if (!logStreamName) {
      result.isSuccessful = false;
      result.error = new Error('No log stream name found for this Lambda function.');
      ui.showErrorMessage('No log stream name found for this Lambda function.', result.error);
      ui.logToOutput('No log stream name found for this Lambda function.'); 
      return result;
    }
    const events = await cloudwatchlogs.getLogEvents({
      logGroupName: logGroupName,
      logStreamName: logStreamName,
      limit: 50, // Adjust the limit as needed
      startFromHead: true, // Start from the beginning of the log stream
    }).promise();

    if (!events.events) {
      result.isSuccessful = false;
      result.error = new Error('No log events found for this Lambda function.');
      ui.showErrorMessage('No log events found for this Lambda function.', result.error);
      ui.logToOutput('No log events found for this Lambda function.'); 
      return result;
    }

    // Display the log events
    events.events.forEach(event => {
      if (event.message) {
        result.result += event.message + '\n';
      }
    });

    result.isSuccessful = true;
    return result;

  } catch (error:any) {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.GetLambdaLogs Error !!!', error);
    ui.logToOutput("api.GetLambdaLogs Error !!!", error); 
    return result;
  }
};


export async function GetLambda(Region:string, LambdaName:string): Promise<MethodResult<AWS.Lambda.GetFunctionResponse>> {
  let result:MethodResult<AWS.Lambda.GetFunctionResponse> = new MethodResult<AWS.Lambda.GetFunctionResponse>();

  try 
  {
    const lambda = await GetLambdaClient(Region);
  
    const param: AWS.Lambda.GetFunctionRequest = {
      FunctionName: LambdaName
    };
    
    const response = await lambda.getFunction(param).promise();
    result.result = response;
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.GetLambda Error !!!', error);
    ui.logToOutput("api.GetLambda Error !!!", error); 
    return result;
  }
}

export async function UpdateLambdaCode(Region:string, LambdaName:string, CodeFilePath: string): Promise<MethodResult<AWS.Lambda.FunctionConfiguration>> {
  let result:MethodResult<AWS.Lambda.FunctionConfiguration> = new MethodResult<AWS.Lambda.FunctionConfiguration>();

  try 
  {
    const lambda = await GetLambdaClient(Region);
  
    let zipresponse = await ZipTextFile(CodeFilePath);

    const zipFileContents = fs.readFileSync(zipresponse.result);

    const lambdaParams: AWS.Lambda.UpdateFunctionCodeRequest = {
      FunctionName: LambdaName,
      ZipFile: zipFileContents
    };
    
    const response = await lambda.updateFunctionCode(lambdaParams).promise();
    result.result = response;
    result.isSuccessful = true;
    return result;
  } 
  catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.GetLambda Error !!!', error);
    ui.logToOutput("api.GetLambda Error !!!", error); 
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

export async function TestAwsConnection(): Promise<MethodResult<boolean>> {
  let result:MethodResult<boolean> = new MethodResult<boolean>();

  try 
  {
    const iam = await GetIAMClient()

    let response = await iam.getUser().promise();
    result.isSuccessful = true;
    result.result = true;
    return result;
  } 
  catch (error:any) 
  {
    if (error.name.includes("Signature"))
    {
      result.isSuccessful = false;
      result.error = error;
      ui.showErrorMessage('api.TestAwsConnection Error !!!', error);
      ui.logToOutput("api.TestAwsConnection Error !!!", error); 
    }
    else
    {
      result.isSuccessful = true;
      result.result = true;
    }
    
    return result;
  }
}

export async function GetRegionList(): Promise<MethodResult<string[]>> {
  let result:MethodResult<string[]> = new MethodResult<string[]>();
  result.result = [];

  try 
  {
    const ec2 = await GetEC2Client()
    let response = await ec2.describeRegions().promise();

    result.isSuccessful = true;
    if(response.Regions)
    {
      for(var r of response.Regions)
      {
        if(r.RegionName)
        {
          result.result.push(r.RegionName);
        }
      }
    }
    return result;
  } catch (error:any) 
  {
    result.isSuccessful = false;
    result.error = error;
    ui.showErrorMessage('api.GetRegionList Error !!!', error);
    ui.logToOutput("api.GetRegionList Error !!!", error); 
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