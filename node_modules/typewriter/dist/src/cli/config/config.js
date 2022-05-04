"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeToken = exports.listTokens = exports.getTokenMethod = exports.getToken = exports.verifyDirectoryExists = exports.resolveRelativePath = exports.setConfig = exports.getConfig = exports.CONFIG_NAME = void 0;
const fs = __importStar(require("fs"));
const util_1 = require("util");
const path_1 = require("path");
const yaml = __importStar(require("js-yaml"));
const templates_1 = require("../../templates");
const os_1 = require("os");
const schema_1 = require("./schema");
const api_1 = require("../api");
const error_1 = require("../commands/error");
const scripts_1 = require("./scripts");
const readFile = util_1.promisify(fs.readFile);
const writeFile = util_1.promisify(fs.writeFile);
const exists = util_1.promisify(fs.exists);
const mkdir = util_1.promisify(fs.mkdir);
exports.CONFIG_NAME = 'typewriter.yml';
// getConfig looks for, and reads, a typewriter.yml configuration file.
// If it does not exist, it will return undefined. If the configuration
// if invalid, an Error will be thrown.
// Note: path is relative to the directory where the typewriter command
// was run.
function getConfig(path = './') {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if a typewriter.yml exists.
        const configPath = yield getPath(path);
        if (!(yield exists(configPath))) {
            return undefined;
        }
        // If so, read it's contents.
        let file;
        try {
            file = yield readFile(configPath, {
                encoding: 'utf-8',
            });
        }
        catch (error) {
            throw error_1.wrapError('Unable to open typewriter.yml', error, `Failed due to an ${error.code} error (${error.errno}).`, configPath);
        }
        const rawConfig = yaml.safeLoad(file);
        return schema_1.validateConfig(rawConfig);
    });
}
exports.getConfig = getConfig;
// setConfig writes a config out to a typewriter.yml file.
// Note path is relative to the directory where the typewriter command
// was run.
function setConfig(config, path = './') {
    return __awaiter(this, void 0, void 0, function* () {
        const file = yield templates_1.generateFromTemplate('cli/config/typewriter.yml.hbs', config, false);
        yield writeFile(yield getPath(path), file);
    });
}
exports.setConfig = setConfig;
// resolveRelativePath resolves a relative path from the directory of the `typewriter.yml` config
// file. It supports file and directory paths.
function resolveRelativePath(configPath, path, ...otherPaths) {
    // Resolve the path based on the optional --config flag.
    return configPath
        ? path_1.resolve(configPath.replace(/typewriter\.yml$/, ''), path, ...otherPaths)
        : path_1.resolve(path, ...otherPaths);
}
exports.resolveRelativePath = resolveRelativePath;
function verifyDirectoryExists(path, type = 'directory') {
    return __awaiter(this, void 0, void 0, function* () {
        // If this is a file, we need to verify it's parent directory exists.
        // If it is a directory, then we need to verify the directory itself exists.
        const dirPath = type === 'directory' ? path : path_1.dirname(path);
        if (!(yield exists(dirPath))) {
            yield mkdir(dirPath, {
                recursive: true,
            });
        }
    });
}
exports.verifyDirectoryExists = verifyDirectoryExists;
// getToken uses a Config to fetch a Segment API token. It will search for it in this order:
//   1. The stdout from executing the optional token script from the config.
//   2. cat ~/.typewriter
// Returns undefined if no token can be found.
function getToken(cfg, configPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getTokenMetadata(cfg, configPath);
        return token ? token.token : undefined;
    });
}
exports.getToken = getToken;
function getTokenMethod(cfg, configPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getTokenMetadata(cfg, configPath);
        return token ? token.method : undefined;
    });
}
exports.getTokenMethod = getTokenMethod;
function getTokenMetadata(cfg, configPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokens = yield listTokens(cfg, configPath);
        const resolutionOrder = [tokens.script, tokens.file];
        for (const metadata of resolutionOrder) {
            if (metadata.isValidToken) {
                return metadata;
            }
        }
        return undefined;
    });
}
// Only resolve token scripts once per CLI invocation.
// Maps a token script -> output, if any
const tokenScriptCache = {};
function listTokens(cfg, configPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const output = {
            script: { method: 'script', isValidToken: false },
            file: { method: 'file', isValidToken: false },
        };
        // Attempt to read a token from the ~/.typewriter token file.
        // Tokens are stored here during the `init` flow, if a user generates a token.
        try {
            const path = path_1.resolve(os_1.homedir(), '.typewriter');
            const token = yield readFile(path, 'utf-8');
            output.file.token = token.trim();
        }
        catch (error) {
            // Ignore errors if ~/.typewriter doesn't exist
        }
        // Attempt to read a token by executing the token script from the typewriter.yml config file.
        // Handle token script errors gracefully, f.e., in CI where you don't need it.
        if (cfg && cfg.scripts && cfg.scripts.token) {
            const tokenScript = cfg.scripts.token;
            // Since we don't know if this token script has side effects, cache (in-memory) the result
            // s.t. we only execute it once per CLI invocation.
            if (!tokenScriptCache[tokenScript]) {
                const stdout = yield scripts_1.runScript(tokenScript, configPath, scripts_1.Scripts.Token);
                if (!!stdout) {
                    tokenScriptCache[tokenScript] = stdout.trim();
                }
            }
            output.script.token = tokenScriptCache[tokenScript];
        }
        // Validate whether any of these tokens are valid Segment API tokens.
        for (const metadata of Object.values(output)) {
            const result = yield api_1.validateToken(metadata.token);
            metadata.isValidToken = result.isValid;
            metadata.workspace = result.workspace;
        }
        return output;
    });
}
exports.listTokens = listTokens;
// storeToken writes a token to ~/.typewriter.
function storeToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = path_1.resolve(os_1.homedir(), '.typewriter');
        return writeFile(path, token, 'utf-8');
    });
}
exports.storeToken = storeToken;
function getPath(path) {
    return __awaiter(this, void 0, void 0, function* () {
        path = path.replace(/typewriter\.yml$/, '');
        // TODO: recursively move back folders until you find it, ala package.json
        return path_1.resolve(path, exports.CONFIG_NAME);
    });
}
//# sourceMappingURL=config.js.map