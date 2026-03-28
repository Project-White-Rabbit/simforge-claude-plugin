import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const DEFAULT_SERVICE_URL = "https://simforge.goharvest.ai";
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), ".config", "simforge");
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, "config.json");
const GLOBAL_CREDENTIALS_FILE = path.join(GLOBAL_CONFIG_DIR, "credentials.json");
function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
function getConfigData() {
    return readJsonFile(GLOBAL_CONFIG_FILE) ?? {};
}
function getCredentialsData() {
    return readJsonFile(GLOBAL_CREDENTIALS_FILE) ?? {};
}
function getServiceUrl() {
    if (process.env.SIMFORGE_SERVICE_URL) {
        return process.env.SIMFORGE_SERVICE_URL;
    }
    const config = getConfigData();
    return typeof config.serviceUrl === "string"
        ? config.serviceUrl
        : DEFAULT_SERVICE_URL;
}
function getApiKey() {
    if (process.env.SIMFORGE_API_KEY) {
        return process.env.SIMFORGE_API_KEY;
    }
    const creds = getCredentialsData();
    return typeof creds.apiKey === "string" ? creds.apiKey : null;
}
function getVerbose() {
    if (process.env.SIMFORGE_VERBOSE === "true" || process.env.SIMFORGE_VERBOSE === "1") {
        return true;
    }
    if (process.env.SIMFORGE_VERBOSE === "false" || process.env.SIMFORGE_VERBOSE === "0") {
        return false;
    }
    const config = getConfigData();
    return config.verbose === true;
}
function getDebug() {
    if (process.env.SIMFORGE_DEBUG === "true" || process.env.SIMFORGE_DEBUG === "1") {
        return true;
    }
    const config = getConfigData();
    return config.debug === true;
}
export function getConfig() {
    return {
        serviceUrl: getServiceUrl(),
        apiKey: getApiKey(),
        verbose: getVerbose(),
        debug: getDebug(),
    };
}
export function saveCredentials(apiKey) {
    fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true });
    fs.writeFileSync(GLOBAL_CREDENTIALS_FILE, `${JSON.stringify({ apiKey }, null, 2)}\n`);
}
export function deleteCredentials() {
    try {
        fs.unlinkSync(GLOBAL_CREDENTIALS_FILE);
    }
    catch {
        // already gone
    }
}
export function hasCredentials() {
    return getApiKey() !== null;
}
export { GLOBAL_CONFIG_DIR as CONFIG_DIR, GLOBAL_CREDENTIALS_FILE as CREDENTIALS_FILE };
