"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = exports.getIniProfileData = exports.GetAwsProfileList = exports.GetRegionList = exports.TestAwsConnection = exports.ZipTextFile = exports.UpdateLambdaCode = exports.GetLambda = exports.GetLambdaLogs = exports.TriggerLambda = exports.GetLambdaList = exports.GetCurrentAwsUserInfo = exports.GetCredentials = exports.GetCredentialProviderName = exports.IsEnvironmentCredentials = exports.IsSharedIniFileCredentials = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const AWS = require("aws-sdk");
const ui = require("./UI");
const MethodResult_1 = require("./MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../aws-sdk/parseKnownFiles");
const LambdaTreeView = require("../lambda/LambdaTreeView");
const fs = require("fs");
const archiver = require("archiver");
async function IsSharedIniFileCredentials(credentials = undefined) {
    return await GetCredentialProviderName(credentials) === "SharedIniFileCredentials";
}
exports.IsSharedIniFileCredentials = IsSharedIniFileCredentials;
async function IsEnvironmentCredentials(credentials = undefined) {
    return await GetCredentialProviderName(credentials) === "EnvironmentCredentials";
}
exports.IsEnvironmentCredentials = IsEnvironmentCredentials;
async function GetCredentialProviderName(credentials = undefined) {
    if (!credentials) {
        credentials = GetCredentials();
    }
    return credentials.constructor.name;
}
exports.GetCredentialProviderName = GetCredentialProviderName;
async function GetCredentials() {
    let credentials;
    try {
        const provider = new AWS.CredentialProviderChain();
        credentials = await provider.resolvePromise();
        if (!credentials) {
            throw new Error("Aws credentials not found !!!");
        }
        if (await IsSharedIniFileCredentials(credentials)) {
            if (LambdaTreeView.LambdaTreeView.Current && LambdaTreeView.LambdaTreeView.Current?.AwsProfile != "default") {
                credentials = new AWS.SharedIniFileCredentials({ profile: LambdaTreeView.LambdaTreeView.Current?.AwsProfile });
            }
        }
        ui.logToOutput("Aws credentials provider " + await GetCredentialProviderName(credentials));
        ui.logToOutput("Aws credentials AccessKeyId=" + credentials?.accessKeyId);
        return credentials;
    }
    catch (error) {
        ui.showErrorMessage('Aws Credentials Not Found !!!', error);
        ui.logToOutput("GetCredentials Error !!!", error);
        return credentials;
    }
}
exports.GetCredentials = GetCredentials;
async function GetLambdaClient(Region) {
    let lambda = undefined;
    let credentials = await GetCredentials();
    lambda = new AWS.Lambda({ region: Region, credentials: credentials, endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint });
    return lambda;
}
async function GetCloudWatchClient(Region) {
    let cloudwatchlogs = undefined;
    let credentials = await GetCredentials();
    cloudwatchlogs = new AWS.CloudWatchLogs({ region: Region, credentials: credentials, endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint });
    return cloudwatchlogs;
}
async function GetIAMClient() {
    let credentials = await GetCredentials();
    const iam = new AWS.IAM({ credentials: credentials });
    return iam;
}
async function GetEC2Client() {
    let credentials = await GetCredentials();
    const ec2 = new AWS.EC2({ region: 'us-east-1', credentials: credentials });
    return ec2;
}
async function GetCurrentAwsUserInfo() {
    let result = new MethodResult_1.MethodResult();
    const iam = await GetIAMClient();
    try {
        const user = await iam.getUser().promise();
        result.result["UserId"] = user.User?.UserId;
        result.result["UserName"] = user.User?.UserName;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.getAwsUserInfo Error !!!', error);
        ui.logToOutput("api.getAwsUserInfo Error !!!", error);
        return result;
    }
}
exports.GetCurrentAwsUserInfo = GetCurrentAwsUserInfo;
async function GetLambdaList(Region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const lambda = await GetLambdaClient(Region);
        const functionsList = await lambda.listFunctions().promise();
        let matchingFunctions;
        if (LambdaName) {
            matchingFunctions = functionsList.Functions?.filter((func) => func.FunctionName?.includes(LambdaName) || LambdaName.length === 0);
        }
        else {
            matchingFunctions = functionsList.Functions;
        }
        if (matchingFunctions && matchingFunctions.length > 0) {
            matchingFunctions.forEach((func) => {
                if (func.FunctionName)
                    result.result.push(func.FunctionName);
            });
        }
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.GetLambdaList Error !!!', error);
        ui.logToOutput("api.GetLambdaList Error !!!", error);
        return result;
    }
}
exports.GetLambdaList = GetLambdaList;
async function TriggerLambda(Region, LambdaName, Parameters) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        // Specify the parameters for invoking the Lambda function
        const param = {
            FunctionName: LambdaName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(Parameters)
        };
        const response = await lambda.invoke(param).promise();
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.TriggerLambda Error !!!', error);
        ui.logToOutput("api.TriggerLambda Error !!!", error);
        return result;
    }
}
exports.TriggerLambda = TriggerLambda;
async function GetLambdaLogs(Region, Lambda) {
    ui.logToOutput('Getting logs for Lambda function:' + Lambda);
    let result = new MethodResult_1.MethodResult();
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
            limit: 50,
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.GetLambdaLogs Error !!!', error);
        ui.logToOutput("api.GetLambdaLogs Error !!!", error);
        return result;
    }
}
exports.GetLambdaLogs = GetLambdaLogs;
;
async function GetLambda(Region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        const param = {
            FunctionName: LambdaName
        };
        const response = await lambda.getFunction(param).promise();
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.GetLambda Error !!!', error);
        ui.logToOutput("api.GetLambda Error !!!", error);
        return result;
    }
}
exports.GetLambda = GetLambda;
async function UpdateLambdaCode(Region, LambdaName, CodeFilePath) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        let zipresponse = await ZipTextFile(CodeFilePath);
        const zipFileContents = fs.readFileSync(zipresponse.result);
        const lambdaParams = {
            FunctionName: LambdaName,
            ZipFile: zipFileContents
        };
        const response = await lambda.updateFunctionCode(lambdaParams).promise();
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.GetLambda Error !!!', error);
        ui.logToOutput("api.GetLambda Error !!!", error);
        return result;
    }
}
exports.UpdateLambdaCode = UpdateLambdaCode;
async function ZipTextFile(inputFilePath, outputZipPath) {
    let result = new MethodResult_1.MethodResult();
    try {
        if (!outputZipPath) {
            outputZipPath = (0, path_2.dirname)(inputFilePath) + (0, path_2.basename)(inputFilePath) + ".zip";
        }
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Set compression level
        });
        archive.pipe(output);
        archive.file(inputFilePath, { name: (0, path_2.basename)(inputFilePath) + (0, path_2.extname)(inputFilePath) });
        archive.finalize();
        result.result = outputZipPath;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.ZipTextFile Error !!!', error);
        ui.logToOutput("api.ZipTextFile Error !!!", error);
        return result;
    }
}
exports.ZipTextFile = ZipTextFile;
async function TestAwsConnection() {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIAMClient();
        let response = await iam.getUser().promise();
        result.isSuccessful = true;
        result.result = true;
        return result;
    }
    catch (error) {
        if (error.name.includes("Signature")) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage('api.TestAwsConnection Error !!!', error);
            ui.logToOutput("api.TestAwsConnection Error !!!", error);
        }
        else {
            result.isSuccessful = true;
            result.result = true;
        }
        return result;
    }
}
exports.TestAwsConnection = TestAwsConnection;
async function GetRegionList() {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const ec2 = await GetEC2Client();
        let response = await ec2.describeRegions().promise();
        result.isSuccessful = true;
        if (response.Regions) {
            for (var r of response.Regions) {
                if (r.RegionName) {
                    result.result.push(r.RegionName);
                }
            }
        }
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.GetRegionList Error !!!', error);
        ui.logToOutput("api.GetRegionList Error !!!", error);
        return result;
    }
}
exports.GetRegionList = GetRegionList;
async function GetAwsProfileList() {
    ui.logToOutput("api.GetAwsProfileList Started");
    let result = new MethodResult_1.MethodResult();
    try {
        let profileData = await getIniProfileData();
        result.result = Object.keys(profileData);
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage('api.GetAwsProfileList Error !!!', error);
        ui.logToOutput("api.GetAwsProfileList Error !!!", error);
        return result;
    }
}
exports.GetAwsProfileList = GetAwsProfileList;
async function getIniProfileData(init = {}) {
    const profiles = await (0, parseKnownFiles_1.parseKnownFiles)(init);
    return profiles;
}
exports.getIniProfileData = getIniProfileData;
exports.ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const getHomeDir = () => {
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${path_1.sep}` } = process.env;
    if (HOME) {
        return HOME;
    }
    if (USERPROFILE) {
        return USERPROFILE;
    }
    if (HOMEPATH) {
        return `${HOMEDRIVE}${HOMEPATH}`;
    }
    return (0, os_1.homedir)();
};
exports.getHomeDir = getHomeDir;
const getCredentialsFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "credentials");
exports.getCredentialsFilepath = getCredentialsFilepath;
const getConfigFilepath = () => process.env[exports.ENV_CREDENTIALS_PATH] || (0, path_2.join)((0, exports.getHomeDir)(), ".aws", "config");
exports.getConfigFilepath = getConfigFilepath;
//# sourceMappingURL=API.js.map