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
exports.Token = void 0;
const react_1 = __importStar(require("react"));
const ink_1 = require("ink");
const ink_link_1 = __importDefault(require("ink-link"));
const ink_spinner_1 = __importDefault(require("ink-spinner"));
const config_1 = require("../config");
const error_1 = require("./error");
const Token = props => {
    const [isLoading, setIsLoading] = react_1.useState(true);
    const [method, setMethod] = react_1.useState();
    const [tokens, setTokens] = react_1.useState();
    const { handleFatalError } = react_1.useContext(error_1.ErrorContext);
    const { exit } = ink_1.useApp();
    react_1.useEffect(() => {
        function effect() {
            return __awaiter(this, void 0, void 0, function* () {
                setMethod(yield config_1.getTokenMethod(props.config, props.configPath));
                setTokens(yield config_1.listTokens(props.config, props.configPath));
                setIsLoading(false);
                exit();
            });
        }
        effect().catch(handleFatalError);
    }, []);
    if (isLoading) {
        return (react_1.default.createElement(ink_1.Box, { marginLeft: 2, marginTop: 1, marginBottom: 1 },
            react_1.default.createElement(ink_spinner_1.default, { type: "dots" }),
            " ",
            react_1.default.createElement(ink_1.Color, { grey: true }, "Loading...")));
    }
    return (react_1.default.createElement(ink_1.Box, { marginTop: 1, marginBottom: 1, marginLeft: 2, flexDirection: "column" },
        react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
            react_1.default.createElement(TokenRow, { name: "scripts.token", tokenMetadata: tokens && tokens.script, method: method }),
            react_1.default.createElement(TokenRow, { name: "~/.typewriter", tokenMetadata: tokens && tokens.file, method: method })),
        react_1.default.createElement(ink_1.Box, { marginTop: 1, width: 80, textWrap: "wrap" },
            react_1.default.createElement(ink_1.Color, { grey: true },
                react_1.default.createElement(ink_1.Text, { bold: true }, "Tip:"),
                " For more information on configuring an API token, see the",
                ' ',
                react_1.default.createElement(ink_link_1.default, { url: "https://segment.com/docs/protocols/typewriter/#api-token-configuration" }, "online docs"),
                "."))));
};
exports.Token = Token;
const TokenRow = ({ tokenMetadata, method, name }) => {
    const isSelected = tokenMetadata && method === tokenMetadata.method;
    return (react_1.default.createElement(ink_1.Box, { flexDirection: "row" },
        react_1.default.createElement(ink_1.Color, { green: isSelected, grey: !isSelected },
            react_1.default.createElement(ink_1.Box, { width: 20 },
                name,
                ":"),
            react_1.default.createElement(ink_1.Box, { width: 15 }, tokenMetadata && tokenMetadata.token
                ? `${tokenMetadata.token.slice(0, 10)}...`
                : '(None)'),
            tokenMetadata && !!tokenMetadata.token && !tokenMetadata.isValidToken ? (react_1.default.createElement(ink_1.Box, { width: 10 },
                react_1.default.createElement(ink_1.Color, { red: true }, "(invalid token)"))) : (react_1.default.createElement(ink_1.Box, { width: 10 }, tokenMetadata && tokenMetadata.workspace ? tokenMetadata.workspace.name : '')))));
};
//# sourceMappingURL=token.js.map