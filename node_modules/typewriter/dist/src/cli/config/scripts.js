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
exports.runScript = exports.Scripts = void 0;
const childProcess = __importStar(require("child_process"));
const util_1 = require("util");
const error_1 = require("../commands/error");
const exec = util_1.promisify(childProcess.exec);
var Scripts;
(function (Scripts) {
    Scripts["After"] = "After";
    Scripts["Token"] = "Token";
})(Scripts = exports.Scripts || (exports.Scripts = {}));
const EXEC_TIMEOUT = 5000; // ms
function runScript(script, configPath, type) {
    return __awaiter(this, void 0, void 0, function* () {
        const scriptWithCD = `cd ${configPath}; ${script}`;
        const { stdout } = yield exec(scriptWithCD, { timeout: EXEC_TIMEOUT }).catch(err => {
            const { stderr = '' } = err;
            const firstStdErrLine = stderr.split('\n')[0];
            // This child process will be SIGTERM-ed if it times out.
            throw error_1.wrapError(err.signal === 'SIGTERM' ? `${type} script timed out` : `${type} script failed`, err, `Tried running: '${script}'`, firstStdErrLine);
        });
        return stdout;
    });
}
exports.runScript = runScript;
//# sourceMappingURL=scripts.js.map