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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Help = void 0;
/**
 * Help layout inspired by Zeit's Now CLI.
 *   https://zeit.co
 */
const react_1 = __importStar(require("react"));
const ink_1 = require("ink");
const ink_link_1 = __importDefault(require("ink-link"));
const Help = () => {
    const { exit } = ink_1.useApp();
    react_1.useEffect(() => {
        exit();
    }, []);
    return (react_1.default.createElement(ink_1.Box, { marginLeft: 2, flexDirection: "column" },
        react_1.default.createElement(ink_1.Box, { marginBottom: 2, textWrap: "wrap" },
            react_1.default.createElement(ink_1.Color, { grey: true },
                "Typewriter is a tool for generating strongly-typed",
                ' ',
                react_1.default.createElement(ink_link_1.default, { url: "https://segment.com" }, "Segment"),
                " analytics libraries based on your pre-defined",
                ' ',
                react_1.default.createElement(ink_link_1.default, { url: "https://segment.com/docs/protocols/tracking-plan" }, "Tracking Plan"),
                " spec.",
                '\n\n',
                "Learn more from",
                ' ',
                react_1.default.createElement(ink_link_1.default, { url: "https://segment.com/docs/protocols/typewriter" }, "Typewriter's documentation here"),
                ".")),
        react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
            react_1.default.createElement(ink_1.Box, { marginBottom: 1 },
                react_1.default.createElement(ink_1.Color, { grey: true }, "$"),
                " ",
                react_1.default.createElement(ink_1.Color, null, "typewriter"),
                " ",
                react_1.default.createElement(ink_1.Color, { grey: true }, "[command, options]")),
            react_1.default.createElement(HelpSection, { name: "Commands" },
                react_1.default.createElement(HelpRow, { name: "init", description: react_1.default.createElement(ink_1.Text, null,
                        "Quickstart wizard to create a ",
                        react_1.default.createElement(ink_1.Color, { yellow: true }, "typewriter.yml")) }),
                react_1.default.createElement(HelpRow, { name: "update", isDefault: true, linesNeeded: 2, description: react_1.default.createElement(ink_1.Text, null,
                        "Syncs ",
                        react_1.default.createElement(ink_1.Color, { yellow: true }, "plan.json"),
                        " with Segment, then generates a",
                        ' ',
                        react_1.default.createElement(ink_1.Color, { yellow: true }, "development"),
                        " client.") }),
                react_1.default.createElement(HelpRow, { name: "dev", description: react_1.default.createElement(ink_1.Text, null,
                        "Generates a ",
                        react_1.default.createElement(ink_1.Color, { yellow: true }, "development"),
                        " client from",
                        ' ',
                        react_1.default.createElement(ink_1.Color, { yellow: true }, "plan.json")) }),
                react_1.default.createElement(HelpRow, { name: "prod", description: react_1.default.createElement(ink_1.Text, null,
                        "Generates a ",
                        react_1.default.createElement(ink_1.Color, { yellow: true }, "production"),
                        " client from",
                        ' ',
                        react_1.default.createElement(ink_1.Color, { yellow: true }, "plan.json")) }),
                react_1.default.createElement(HelpRow, { name: "token", description: "Prints the local Segment API token configuration" })),
            react_1.default.createElement(HelpSection, { name: "Options" },
                react_1.default.createElement(HelpRow, { name: "-h, --help", description: "Prints this help message" }),
                react_1.default.createElement(HelpRow, { name: "-v, --version", description: "Prints the CLI version" }),
                react_1.default.createElement(HelpRow, { name: "-c, --config", description: react_1.default.createElement(ink_1.Text, null,
                        "Path to a ",
                        react_1.default.createElement(ink_1.Color, { yellow: true }, "typewriter.yml"),
                        " file") }),
                react_1.default.createElement(HelpRow, { name: "    --debug", isHidden: process.env.NODE_ENV === 'production', description: "Enables Ink debug mode" })),
            react_1.default.createElement(HelpSection, { name: "Examples" },
                react_1.default.createElement(ExampleRow, { description: "Initialize Typewriter in a new repo", command: "typewriter init" }),
                react_1.default.createElement(ExampleRow, { description: "Pull your latest Tracking Plan changes", command: "typewriter" }),
                react_1.default.createElement(ExampleRow, { description: "Build a client without runtime validation", command: "typewriter prod" }),
                react_1.default.createElement(ExampleRow, { description: "Use a config in another directory", command: "typewriter --config ../typewriter.yml" })))));
};
exports.Help = Help;
const HelpSection = ({ name, children }) => {
    return (react_1.default.createElement(ink_1.Box, { flexDirection: "column", marginBottom: 1 },
        react_1.default.createElement(ink_1.Color, { grey: true },
            name,
            ":"),
        react_1.default.createElement(ink_1.Box, { flexDirection: "column", marginLeft: 2 }, children)));
};
const HelpRow = ({ name, description, isDefault, linesNeeded, isHidden, }) => {
    if (!!isHidden) {
        return null;
    }
    return (react_1.default.createElement(ink_1.Box, { height: linesNeeded || 1 },
        react_1.default.createElement(ink_1.Box, { width: "20%" }, name),
        react_1.default.createElement(ink_1.Box, { width: "65%", textWrap: "wrap" }, description),
        react_1.default.createElement(ink_1.Box, { width: "15%" }, !!isDefault ? react_1.default.createElement(ink_1.Color, { blue: true }, "(default)") : '')));
};
const ExampleRow = ({ description, command }) => {
    return (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
        description,
        react_1.default.createElement(ink_1.Box, { marginLeft: 2 },
            react_1.default.createElement(ink_1.Color, { redBright: true },
                "$ ",
                command))));
};
exports.Help.displayName = 'Help';
//# sourceMappingURL=help.js.map