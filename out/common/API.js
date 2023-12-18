"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFilepath = exports.getCredentialsFilepath = exports.getHomeDir = exports.ENV_CREDENTIALS_PATH = exports.getIniProfileData = exports.GetAwsProfileList = exports.GetRegionList = exports.TestAwsConnection = exports.GetLambdaList = exports.IsEnvironmentCredentials = exports.IsSharedIniFileCredentials = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const AWS = require("aws-sdk");
const ui = require("./UI");
const MethodResult_1 = require("./MethodResult");
const os_1 = require("os");
const path_1 = require("path");
const path_2 = require("path");
const parseKnownFiles_1 = require("../aws-sdk/parseKnownFiles");
const LambdaTreeView = require("../lambda/LambdaTreeView");
function IsSharedIniFileCredentials(credentials = undefined) {
    if (credentials) {
        return GetCredentialProvider(credentials) === "SharedIniFileCredentials";
    }
    return GetCredentialProvider(AWS.config.credentials) === "SharedIniFileCredentials";
}
exports.IsSharedIniFileCredentials = IsSharedIniFileCredentials;
function IsEnvironmentCredentials(credentials = undefined) {
    if (credentials) {
        return GetCredentialProvider(credentials) === "EnvironmentCredentials";
    }
    return GetCredentialProvider(AWS.config.credentials) === "EnvironmentCredentials";
}
exports.IsEnvironmentCredentials = IsEnvironmentCredentials;
function GetCredentialProvider(credentials) {
    if (credentials instanceof (AWS.EnvironmentCredentials)) {
        return "EnvironmentCredentials";
    }
    else if (credentials instanceof (AWS.ECSCredentials)) {
        return "ECSCredentials";
    }
    else if (credentials instanceof (AWS.SsoCredentials)) {
        return "SsoCredentials";
    }
    else if (credentials instanceof (AWS.SharedIniFileCredentials)) {
        return "SharedIniFileCredentials";
    }
    else if (credentials instanceof (AWS.ProcessCredentials)) {
        return "ProcessCredentials";
    }
    else if (credentials instanceof (AWS.TokenFileWebIdentityCredentials)) {
        return "TokenFileWebIdentityCredentials";
    }
    else if (credentials instanceof (AWS.EC2MetadataCredentials)) {
        return "EC2MetadataCredentials";
    }
    return "UnknownProvider";
}
function GetCredentials() {
    if (!AWS.config.credentials) {
        throw new Error("Aws credentials not found !!!");
    }
    let credentials = AWS.config.credentials;
    if (IsSharedIniFileCredentials()) {
        if (LambdaTreeView.LambdaTreeView.Current && LambdaTreeView.LambdaTreeView.Current?.AwsProfile != "default") {
            credentials = new AWS.SharedIniFileCredentials({ profile: LambdaTreeView.LambdaTreeView.Current?.AwsProfile });
        }
    }
    ui.logToOutput("Aws credentials provider " + GetCredentialProvider(credentials));
    ui.logToOutput("Aws credentials AccessKeyId=" + credentials?.accessKeyId);
    return credentials;
}
function GetLambdaClient(Region) {
    let lambda = undefined;
    let credentials = GetCredentials();
    lambda = new AWS.Lambda({ region: Region, credentials: credentials, endpoint: LambdaTreeView.LambdaTreeView.Current?.AwsEndPoint });
    return lambda;
}
function GetIAMClient() {
    let credentials = GetCredentials();
    const iam = new AWS.IAM({ credentials: credentials });
    return iam;
}
function GetEC2Client() {
    let credentials = GetCredentials();
    const ec2 = new AWS.EC2({ region: 'us-east-1', credentials: credentials });
    return ec2;
}
async function getAwsUserInfo() {
    let result = new MethodResult_1.MethodResult();
    const iam = GetIAMClient();
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
async function GetLambdaList(Region, LambdaName) {
    let result = new MethodResult_1.MethodResult();
    result.result = [];
    try {
        const lambda = GetLambdaClient(Region);
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
async function TestAwsConnection() {
    let result = new MethodResult_1.MethodResult();
    try {
        const iam = GetIAMClient();
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
        const ec2 = GetEC2Client();
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