"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = exports.getIniProfileData = exports.GetAwsProfileList = exports.TestAwsConnection = exports.ZipTextFile = exports.UpdateLambdaCode = exports.GetLambda = exports.GetLambdaLogs = exports.TriggerLambda = exports.GetLambdaList = exports.GetCredentials = exports.GetCredentialProviderName = exports.IsEnvironmentCredentials = exports.IsSharedIniFileCredentials = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const credential_providers_1 = require("@aws-sdk/credential-providers");
const credential_provider_ini_1 = require("@aws-sdk/credential-provider-ini");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const client_cloudwatch_logs_1 = require("@aws-sdk/client-cloudwatch-logs");
const client_iam_1 = require("@aws-sdk/client-iam");
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
        // Get credentials using the default provider chain.
        const provider = (0, credential_providers_1.fromNodeProviderChain)();
        credentials = await provider();
        if (!credentials) {
            throw new Error("Aws credentials not found !!!");
        }
        // If the credentials come from a shared INI file and the current profile is not "default",
        // re-resolve credentials using the specified profile.
        if (await IsSharedIniFileCredentials(credentials)) {
            if (LambdaTreeView.LambdaTreeView.Current &&
                LambdaTreeView.LambdaTreeView.Current.AwsProfile !== "default") {
                credentials = await (0, credential_provider_ini_1.fromIni)({
                    profile: LambdaTreeView.LambdaTreeView.Current.AwsProfile,
                })();
            }
        }
        ui.logToOutput("Aws credentials provider " + (await GetCredentialProviderName(credentials)));
        ui.logToOutput("Aws credentials AccessKeyId=" + credentials.accessKeyId);
        return credentials;
    }
    catch (error) {
        ui.showErrorMessage("Aws Credentials Not Found !!!", error);
        ui.logToOutput("GetCredentials Error !!!", error);
        return credentials;
    }
}
exports.GetCredentials = GetCredentials;
async function GetLambdaClient(region) {
    const credentials = await GetCredentials();
    const lambdaClient = new client_lambda_1.LambdaClient({
        region,
        credentials,
        endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint,
    });
    return lambdaClient;
}
async function GetCloudWatchClient(region) {
    const credentials = await GetCredentials();
    const cloudwatchLogsClient = new client_cloudwatch_logs_1.CloudWatchLogsClient({
        region,
        credentials,
        endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint,
    });
    return cloudwatchLogsClient;
}
async function GetIAMClient() {
    const credentials = await GetCredentials();
    const iamClient = new client_iam_1.IAMClient({ credentials });
    return iamClient;
}
async function GetLambdaList(region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        // Get the Lambda client (v3 client)
        const lambda = await GetLambdaClient(region);
        // Create the command to list functions
        const command = new client_lambda_1.ListFunctionsCommand({});
        // Send the command to the client
        const functionsList = await lambda.send(command);
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
        ui.showErrorMessage("api.GetLambdaList Error !!!", error);
        ui.logToOutput("api.GetLambdaList Error !!!", error);
        return result;
    }
}
exports.GetLambdaList = GetLambdaList;
const client_lambda_2 = require("@aws-sdk/client-lambda");
async function TriggerLambda(Region, LambdaName, Parameters) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        // Specify the parameters for invoking the Lambda function
        const param = {
            FunctionName: LambdaName,
            // Explicitly cast the literal so that its type is the exact union type expected
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(Parameters),
        };
        const command = new client_lambda_2.InvokeCommand(param);
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.TriggerLambda Error !!!", error);
        ui.logToOutput("api.TriggerLambda Error !!!", error);
        return result;
    }
}
exports.TriggerLambda = TriggerLambda;
const client_cloudwatch_logs_2 = require("@aws-sdk/client-cloudwatch-logs");
async function GetLambdaLogs(Region, Lambda) {
    ui.logToOutput("Getting logs for Lambda function: " + Lambda);
    let result = new MethodResult_1.MethodResult();
    try {
        // Get the log group name
        const logGroupName = `/aws/lambda/${Lambda}`;
        const cloudwatchlogs = await GetCloudWatchClient(Region);
        // Get the streams sorted by the latest event time
        const describeLogStreamsCommand = new client_cloudwatch_logs_2.DescribeLogStreamsCommand({
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
        const getLogEventsCommand = new client_cloudwatch_logs_2.GetLogEventsCommand({
            logGroupName: logGroupName,
            logStreamName: logStreamName,
            limit: 50,
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
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambdaLogs Error !!!", error);
        ui.logToOutput("api.GetLambdaLogs Error !!!", error);
        return result;
    }
}
exports.GetLambdaLogs = GetLambdaLogs;
const client_lambda_3 = require("@aws-sdk/client-lambda");
async function GetLambda(Region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        const command = new client_lambda_3.GetFunctionCommand({
            FunctionName: LambdaName,
        });
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.GetLambda Error !!!", error);
        ui.logToOutput("api.GetLambda Error !!!", error);
        return result;
    }
}
exports.GetLambda = GetLambda;
const client_lambda_4 = require("@aws-sdk/client-lambda");
async function UpdateLambdaCode(Region, LambdaName, CodeFilePath) {
    let result = new MethodResult_1.MethodResult();
    try {
        const lambda = await GetLambdaClient(Region);
        let zipresponse = await ZipTextFile(CodeFilePath);
        const zipFileContents = fs.readFileSync(zipresponse.result);
        const command = new client_lambda_4.UpdateFunctionCodeCommand({
            FunctionName: LambdaName,
            ZipFile: zipFileContents,
        });
        const response = await lambda.send(command);
        result.result = response;
        result.isSuccessful = true;
        return result;
    }
    catch (error) {
        result.isSuccessful = false;
        result.error = error;
        ui.showErrorMessage("api.UpdateLambdaCode Error !!!", error);
        ui.logToOutput("api.UpdateLambdaCode Error !!!", error);
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
const client_iam_2 = require("@aws-sdk/client-iam");
async function TestAwsConnection() {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = await GetIAMClient();
        const command = new client_iam_2.GetUserCommand({});
        let response = await iam.send(command);
        result.isSuccessful = true;
        result.result = true;
        return result;
    }
    catch (error) {
        if (error.name.includes("Signature")) {
            result.isSuccessful = false;
            result.error = error;
            ui.showErrorMessage("api.TestAwsConnection Error !!!", error);
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