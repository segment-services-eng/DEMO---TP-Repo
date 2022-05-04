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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = void 0;
const react_1 = __importStar(require("react"));
const ink_1 = require("ink");
const package_json_1 = require("../../../package.json");
const latest_version_1 = __importDefault(require("latest-version"));
const error_1 = require("./error");
const semver_1 = __importDefault(require("semver"));
const Version = () => {
    const [isLoading, setIsLoading] = react_1.useState(true);
    const [latestVersion, setLatestVersion] = react_1.useState('');
    const { handleError } = react_1.useContext(error_1.ErrorContext);
    const { exit } = ink_1.useApp();
    react_1.useEffect(() => {
        function effect() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let options = {};
                    // If the user is on a pre-release, check if there's a new pre-release.
                    // Otherwise, only compare against stable versions.
                    const prerelease = semver_1.default.prerelease(package_json_1.version);
                    if (prerelease && prerelease.length > 0) {
                        options = { version: 'next' };
                    }
                    const latestVersion = yield latest_version_1.default('typewriter', options);
                    setLatestVersion(latestVersion);
                }
                catch (error) {
                    // If we can't access NPM, then ignore this version check.
                    handleError(error);
                }
                setIsLoading(false);
                exit();
            });
        }
        effect();
    }, []);
    const isLatest = isLoading || latestVersion === '' || latestVersion === package_json_1.version;
    const newVersionText = isLoading
        ? '(checking for newer versions...)'
        : !isLatest
            ? `(new! ${latestVersion})`
            : '';
    return (react_1.default.createElement(ink_1.Box, null,
        react_1.default.createElement(ink_1.Color, { grey: true }, "Version: "),
        react_1.default.createElement(ink_1.Color, { green: isLatest, yellow: !isLatest },
            package_json_1.version,
            ' '),
        react_1.default.createElement(ink_1.Color, { grey: isLatest, green: !isLatest }, newVersionText)));
};
exports.Version = Version;
exports.Version.displayName = 'Version';
//# sourceMappingURL=version.js.map