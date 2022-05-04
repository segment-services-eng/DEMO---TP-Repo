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
exports.Init = void 0;
const react_1 = __importStar(require("react"));
const ink_1 = require("ink");
const ink_link_1 = __importDefault(require("ink-link"));
const ink_select_input_1 = __importDefault(require("ink-select-input"));
const ink_text_input_1 = __importDefault(require("ink-text-input"));
const ink_spinner_1 = __importDefault(require("ink-spinner"));
const config_1 = require("../config");
const api_1 = require("../api");
const options_1 = require("../../generators/options");
const figures_1 = __importDefault(require("figures"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const path_1 = require("path");
const lodash_1 = require("lodash");
const build_1 = require("./build");
const fuse_js_1 = __importDefault(require("fuse.js"));
const index_1 = require("../index");
const error_1 = require("./error");
const readir = util_1.promisify(fs.readdir);
var Steps;
(function (Steps) {
    Steps[Steps["Confirmation"] = 0] = "Confirmation";
    Steps[Steps["SDK"] = 1] = "SDK";
    Steps[Steps["Language"] = 2] = "Language";
    Steps[Steps["APIToken"] = 3] = "APIToken";
    Steps[Steps["TrackingPlan"] = 4] = "TrackingPlan";
    Steps[Steps["Path"] = 5] = "Path";
    Steps[Steps["Summary"] = 6] = "Summary";
    Steps[Steps["Build"] = 7] = "Build";
    Steps[Steps["Done"] = 8] = "Done";
})(Steps || (Steps = {}));
const Init = props => {
    const { config, configPath } = props;
    const [step, setStep] = react_1.useState(Steps.Confirmation);
    const [sdk, setSDK] = react_1.useState(config ? config.client.sdk : options_1.SDK.WEB);
    const [language, setLanguage] = react_1.useState(config ? config.client.language : options_1.Language.JAVASCRIPT);
    const [path, setPath] = react_1.useState(config && config.trackingPlans.length > 0 ? config.trackingPlans[0].path : '');
    const [tokenMetadata, setTokenMetadata] = react_1.useState({
        token: '',
        workspace: undefined,
    });
    const [trackingPlan, setTrackingPlan] = react_1.useState();
    const { exit } = ink_1.useApp();
    react_1.useEffect(() => {
        if (!props.onDone && step === Steps.Done) {
            exit();
        }
    }, [step]);
    const onNext = () => setStep(step + 1);
    const onRestart = () => {
        setStep(Steps.SDK);
    };
    function withNextStep(f) {
        return (arg) => {
            if (f) {
                f(arg);
            }
            setStep(step + 1);
        };
    }
    function onAcceptSummary(config) {
        onNext();
        if (props.onDone) {
            props.onDone(config);
        }
    }
    return (react_1.default.createElement(ink_1.Box, { minHeight: 20, marginLeft: 2, marginRight: 2, marginTop: 1, marginBottom: 1, flexDirection: "column" },
        step === Steps.Confirmation && react_1.default.createElement(ConfirmationPrompt, { onSubmit: onNext }),
        step === Steps.SDK && react_1.default.createElement(SDKPrompt, { step: step, sdk: sdk, onSubmit: withNextStep(setSDK) }),
        step === Steps.Language && (react_1.default.createElement(LanguagePrompt, { step: step, sdk: sdk, language: language, onSubmit: withNextStep(setLanguage) })),
        step === Steps.APIToken && (react_1.default.createElement(APITokenPrompt, { step: step, config: config, configPath: configPath, onSubmit: withNextStep(setTokenMetadata) })),
        step === Steps.TrackingPlan && (react_1.default.createElement(TrackingPlanPrompt, { step: step, token: tokenMetadata.token, trackingPlan: trackingPlan, onSubmit: withNextStep(setTrackingPlan) })),
        step === Steps.Path && (react_1.default.createElement(PathPrompt, { step: step, path: path, onSubmit: withNextStep(setPath) })),
        step === Steps.Summary && (react_1.default.createElement(SummaryPrompt, { step: step, sdk: sdk, language: language, path: path, token: tokenMetadata.token, workspace: tokenMetadata.workspace, trackingPlan: trackingPlan, onConfirm: onAcceptSummary, onRestart: onRestart })),
        step === Steps.Build && !props.onDone && (react_1.default.createElement(build_1.Build, Object.assign({}, props, { production: false, update: true, onDone: onNext })))));
};
exports.Init = Init;
const Header = () => {
    return (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
        react_1.default.createElement(ink_1.Box, { width: 80, textWrap: "wrap", marginBottom: 4 },
            react_1.default.createElement(ink_1.Color, { white: true },
                "Typewriter is a tool for generating strongly-typed",
                ' ',
                react_1.default.createElement(ink_link_1.default, { url: "https://segment.com" }, "Segment"),
                " analytics libraries from a",
                ' ',
                react_1.default.createElement(ink_link_1.default, { url: "https://segment.com/docs/protocols/tracking-plan" }, "Tracking Plan"),
                "."),
            ' ',
            react_1.default.createElement(ink_1.Color, { grey: true },
                "Learn more from",
                ' ',
                react_1.default.createElement(ink_link_1.default, { url: "https://segment.com/docs/protocols/typewriter" }, "Typewriter's documentation here"),
                ". To get started, ",
                "you'll",
                " need a ",
                react_1.default.createElement(ink_1.Color, { yellow: true }, "typewriter.yml"),
                ". The quickstart below will walk you through creating one."))));
};
/** A simple prompt to get users acquainted with the terminal-based select. */
const ConfirmationPrompt = ({ onSubmit }) => {
    const items = [{ label: 'Ok!', value: 'ok' }];
    const tips = ['Hit return to continue.'];
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Header, null),
        react_1.default.createElement(Step, { name: "Ready?", tips: tips },
            react_1.default.createElement(ink_select_input_1.default, { items: items, onSelect: onSubmit }))));
};
/** A prompt to identify which Segment SDK a user wants to use. */
const SDKPrompt = ({ step, sdk, onSubmit }) => {
    const items = [
        { label: 'Web (analytics.js)', value: options_1.SDK.WEB },
        { label: 'Node.js (analytics-node)', value: options_1.SDK.NODE },
        { label: 'iOS (analytics-ios)', value: options_1.SDK.IOS },
        { label: 'Android (analytics-android)', value: options_1.SDK.ANDROID },
    ];
    const initialIndex = items.findIndex(i => i.value === sdk);
    const onSelect = (item) => {
        onSubmit(item.value);
    };
    const tips = [
        'Use your arrow keys to select.',
        'Typewriter clients are strongly-typed wrappers around a Segment analytics SDK.',
        react_1.default.createElement(ink_1.Text, { key: "sdk-docs" },
            "To learn more about ",
            "Segment's",
            " SDKs, see the",
            ' ',
            react_1.default.createElement(ink_link_1.default, { url: "https://segment.com/docs/sources" }, "documentation"),
            "."),
    ];
    return (react_1.default.createElement(Step, { name: "Choose a SDK:", step: step, tips: tips },
        react_1.default.createElement(ink_select_input_1.default, { items: items, initialIndex: initialIndex, onSelect: onSelect })));
};
/** A prompt to identify which Segment programming language a user wants to use. */
const LanguagePrompt = ({ step, sdk, language, onSubmit }) => {
    const items = [
        { label: 'JavaScript', value: options_1.Language.JAVASCRIPT },
        { label: 'TypeScript', value: options_1.Language.TYPESCRIPT },
        { label: 'Objective-C', value: options_1.Language.OBJECTIVE_C },
        { label: 'Swift', value: options_1.Language.SWIFT },
        { label: 'Java', value: options_1.Language.JAVA },
    ].filter(item => {
        // Filter out items that aren't relevant, given the selected SDK.
        const supportedLanguages = {
            [options_1.SDK.WEB]: [options_1.Language.JAVASCRIPT, options_1.Language.TYPESCRIPT],
            [options_1.SDK.NODE]: [options_1.Language.JAVASCRIPT, options_1.Language.TYPESCRIPT],
            [options_1.SDK.IOS]: [options_1.Language.OBJECTIVE_C, options_1.Language.SWIFT],
            [options_1.SDK.ANDROID]: [options_1.Language.JAVA],
        };
        return supportedLanguages[sdk].includes(item.value);
    });
    const initialIndex = items.findIndex(i => i.value === language);
    const onSelect = (item) => {
        onSubmit(item.value);
    };
    return (react_1.default.createElement(Step, { name: "Choose a language:", step: step },
        react_1.default.createElement(ink_select_input_1.default, { items: items, initialIndex: initialIndex, onSelect: onSelect })));
};
/** Helper to list and filter all directories under a given filesystem path. */
function filterDirectories(path) {
    return __awaiter(this, void 0, void 0, function* () {
        /** Helper to list all directories in a given path. */
        const listDirectories = (path) => __awaiter(this, void 0, void 0, function* () {
            try {
                const files = yield readir(path, {
                    withFileTypes: true,
                });
                const directoryBlocklist = ['node_modules'];
                return files
                    .filter(f => f.isDirectory())
                    .filter(f => !f.name.startsWith('.'))
                    .filter(f => !directoryBlocklist.some(b => f.name.startsWith(b)))
                    .map(f => path_1.join(path, f.name))
                    .filter(f => path_1.normalize(f).startsWith(path_1.normalize(path).replace(/^\.\/?/, '')));
            }
            catch (_a) {
                // If we can't read this path, then return an empty list of sub-directories.
                return [];
            }
        });
        const isPathEmpty = ['', '.', './'].includes(path);
        const directories = new Set();
        // First look for all directories in the same directory as the current query path.
        const parentPath = path_1.join(path, isPathEmpty || path.endsWith('/') ? '.' : '..');
        const parentDirectories = yield listDirectories(parentPath);
        parentDirectories.forEach(f => directories.add(f));
        const queryPath = path_1.join(parentPath, path);
        // Next, if the current query IS a directory, then we want to prioritize results from inside that directory.
        if (directories.has(queryPath)) {
            const queryDirectories = yield listDirectories(queryPath);
            queryDirectories.forEach(f => directories.add(f));
        }
        // Otherwise, show results from inside any other directories at the level of the current query path.
        for (const dirPath of parentDirectories) {
            if (directories.size >= 10) {
                break;
            }
            const otherDirectories = yield listDirectories(dirPath);
            otherDirectories.forEach(f => directories.add(f));
        }
        // Now sort these directories by the query path.
        const fuse = new fuse_js_1.default([...directories].map(d => ({ name: d })), { keys: ['name'] });
        return isPathEmpty ? [...directories] : fuse.search(path).map(d => d.name);
    });
}
/** A prompt to identify where to store the new client on the user's filesystem. */
const PathPrompt = ({ step, path: initialPath, onSubmit }) => {
    const [path, setPath] = react_1.useState(initialPath);
    const [directories, setDirectories] = react_1.useState([]);
    // Fetch a list of directories, filtering by the supplied path.
    react_1.useEffect(() => {
        ;
        (() => __awaiter(void 0, void 0, void 0, function* () {
            let directories = [];
            try {
                directories = yield filterDirectories(path);
            }
            catch (err) {
                console.error(err);
            }
            setDirectories(directories);
        }))();
    }, [path]);
    const tips = [
        'The generated client will be stored in this directory.',
        'Start typing to filter existing directories. Hit return to submit.',
        'Directories will be automatically created, if needed.',
    ];
    const onSubmitPath = () => {
        onSubmit(path_1.normalize(path));
    };
    const isNewDirectory = !['', '.', './'].includes(path_1.normalize(path)) && !directories.includes(path_1.normalize(path));
    const directoryRows = isNewDirectory
        ? [
            react_1.default.createElement(ink_1.Text, { key: "new-directory" },
                path,
                " ",
                react_1.default.createElement(ink_1.Color, { blue: true }, "(new)")),
        ]
        : [];
    directoryRows.push(...directories.slice(0, 10 - directoryRows.length));
    return (react_1.default.createElement(Step, { name: "Enter a directory:", step: step, tips: tips },
        react_1.default.createElement(ink_1.Box, null,
            react_1.default.createElement(ink_1.Text, null, figures_1.default.pointer),
            ' ',
            react_1.default.createElement(ink_text_input_1.default, { value: path, showCursor: true, onChange: setPath, onSubmit: onSubmitPath })),
        react_1.default.createElement(ink_1.Box, { height: 10, marginLeft: 2, flexDirection: "column" }, directoryRows.map((d, i) => (react_1.default.createElement(ink_1.Color, { key: i, grey: true }, d))))));
};
/** A prompt to walk a user through getting a new Segment API token. */
const APITokenPrompt = ({ step, config, configPath, onSubmit }) => {
    const [state, setState] = react_1.useState({
        token: '',
        canBeSet: true,
        workspace: undefined,
        isLoading: true,
        isInvalid: false,
        foundCachedToken: false,
    });
    const { handleFatalError } = react_1.useContext(error_1.ErrorContext);
    react_1.useEffect(() => {
        function effect() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const tokens = yield config_1.listTokens(config, configPath);
                    const method = yield config_1.getTokenMethod(config, configPath);
                    const token = method === tokens.script.method ? tokens.script : tokens.file;
                    setState(Object.assign(Object.assign({}, state), { token: token.isValidToken ? token.token : '', isInvalid: false, workspace: token.workspace || state.workspace, foundCachedToken: token.isValidToken, isLoading: false, 
                        // If the user already has a typewriter.yml with a valid token script,
                        // then let the user know that they can't overwrite it.
                        canBeSet: method !== tokens.script.method }));
                }
                catch (error) {
                    handleFatalError(error);
                }
            });
        }
        effect();
    }, []);
    // Fired after a user enters a token.
    const onConfirm = () => __awaiter(void 0, void 0, void 0, function* () {
        // Validate whether the entered token is a valid Segment API token.
        setState(Object.assign(Object.assign({}, state), { isLoading: true }));
        const result = yield api_1.validateToken(state.token);
        if (result.isValid) {
            try {
                yield config_1.storeToken(state.token);
            }
            catch (error) {
                handleFatalError(error_1.wrapError('Unable to save token to ~/.typewriter', error, `Failed due to an ${error.code} error (${error.errno}).`));
                return;
            }
            onSubmit({ token: state.token, workspace: result.workspace });
        }
        else {
            setState(Object.assign(Object.assign({}, state), { token: '', workspace: undefined, isInvalid: true, isLoading: false }));
        }
    });
    // Fired if a user confirms a cached token.
    const onConfirmCachedToken = (item) => __awaiter(void 0, void 0, void 0, function* () {
        if (item.value === 'no') {
            // Clear the selected token so they can enter their own.
            setState(Object.assign(Object.assign({}, state), { foundCachedToken: false, token: '', workspace: undefined, isInvalid: false }));
        }
        else {
            // Otherwise submit this token.
            yield onConfirm();
        }
    });
    const setToken = (token) => {
        setState(Object.assign(Object.assign({}, state), { token }));
    };
    const tips = [
        'An API token is used to download Tracking Plans from Segment.',
        react_1.default.createElement(ink_1.Text, { key: "api-token-docs" },
            "Documentation on generating an API token can be found",
            ' ',
            react_1.default.createElement(ink_link_1.default, { url: "https://segment.com/docs/protocols/typewriter/#api-token-configuration" }, "here"),
            "."),
    ];
    if (state.foundCachedToken) {
        tips.push(react_1.default.createElement(ink_1.Color, { yellow: true },
            "A cached token for ",
            state.workspace.name,
            " is already in your environment."));
    }
    return (react_1.default.createElement(Step, { name: "Enter a Segment API token:", step: step, isLoading: state.isLoading, tips: tips },
        !state.canBeSet && (react_1.default.createElement(ink_select_input_1.default, { items: [{ label: 'Ok!', value: 'ok' }], onSelect: onConfirm })),
        state.canBeSet && state.foundCachedToken && (react_1.default.createElement(ink_select_input_1.default, { items: [
                { label: 'Use this token', value: 'yes' },
                { label: 'No, provide a different token.', value: 'no' },
            ], onSelect: onConfirmCachedToken })),
        state.canBeSet && !state.foundCachedToken && (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
            react_1.default.createElement(ink_1.Box, null,
                react_1.default.createElement(ink_1.Text, null, figures_1.default.pointer),
                ' ',
                react_1.default.createElement(ink_text_input_1.default, { value: state.token, 
                    // See: https://github.com/vadimdemedes/ink-text-input/issues/41
                    showCursor: true, onChange: setToken, onSubmit: onConfirm, mask: "*" })),
            state.isInvalid && (react_1.default.createElement(ink_1.Box, { textWrap: "wrap", marginLeft: 2 },
                react_1.default.createElement(ink_1.Color, { red: true },
                    figures_1.default.cross,
                    " Invalid Segment API token.")))))));
};
/** A prompt to identify which Segment Tracking Plan a user wants to use. */
// Needs an empty state — allows users to create a Tracking Plan, then a reload button to refetch
const TrackingPlanPrompt = ({ step, token, trackingPlan, onSubmit, }) => {
    const [trackingPlans, setTrackingPlans] = react_1.useState([]);
    const [isLoading, setIsLoading] = react_1.useState(true);
    const { handleFatalError } = react_1.useContext(error_1.ErrorContext);
    function loadTrackingPlans() {
        return __awaiter(this, void 0, void 0, function* () {
            setIsLoading(true);
            try {
                setTrackingPlans(yield api_1.fetchAllTrackingPlans({ token }));
                setIsLoading(false);
            }
            catch (error) {
                if (error.statusCode === 403) {
                    return handleFatalError(error_1.wrapError('Failed to authenticate with the Segment API', error, 'You may be using a malformed/invalid token or a legacy personal access token'));
                }
                else {
                    return handleFatalError(error_1.wrapError('Unable to fetch Tracking Plans', error, 'Check your internet connectivity and try again'));
                }
            }
        });
    }
    react_1.useEffect(() => {
        loadTrackingPlans();
    }, []);
    const onSelect = (item) => {
        const trackingPlan = trackingPlans.find(tp => tp.name === item.value);
        onSubmit(trackingPlan);
    };
    // Sort the Tracking Plan alphabetically by display name.
    const choices = lodash_1.orderBy(trackingPlans.map(tp => ({
        label: tp.display_name,
        value: tp.name,
    })), 'label', 'asc');
    let initialIndex = choices.findIndex(c => !!trackingPlan && c.value === trackingPlan.name);
    initialIndex = initialIndex === -1 ? 0 : initialIndex;
    const tips = [
        'Typewriter will generate a client from this Tracking Plan.',
        react_1.default.createElement(ink_1.Text, { key: "plan-path" },
            "This Tracking Plan is saved locally in a ",
            react_1.default.createElement(ink_1.Color, { yellow: true }, "plan.json"),
            " file."),
    ];
    return (react_1.default.createElement(Step, { name: "Tracking Plan:", tips: tips, step: step, isLoading: isLoading },
        trackingPlans.length > 0 && (react_1.default.createElement(ink_select_input_1.default, { items: choices, onSelect: onSelect, initialIndex: initialIndex, limit: 10 })),
        trackingPlans.length === 0 && (react_1.default.createElement(Step, { name: "Your workspace does not have any Tracking Plans. Add one first, before continuing." },
            react_1.default.createElement(ink_select_input_1.default, { items: [{ label: 'Refresh', value: 'refresh' }], onSelect: loadTrackingPlans })))));
};
/** A prompt to confirm all of the configured settings with the user. */
const SummaryPrompt = ({ step, sdk, language, path, token, workspace, trackingPlan, onConfirm, onRestart, }) => {
    const [isLoading, setIsLoading] = react_1.useState(false);
    const { handleFatalError } = react_1.useContext(error_1.ErrorContext);
    const onSelect = (item) => __awaiter(void 0, void 0, void 0, function* () {
        if (item.value === 'lgtm') {
            // Write the updated typewriter.yml config.
            setIsLoading(true);
            let client = {
                sdk,
                language,
            };
            // Default to ES5 syntax for analytics-node in JS, since node doesn't support things
            // like ES6 modules. TypeScript transpiles for you, so we don't need it there.
            // See https://node.green
            if (sdk === options_1.SDK.NODE && language === options_1.Language.JAVASCRIPT) {
                client = client;
                client.moduleTarget = 'CommonJS';
                client.scriptTarget = 'ES5';
            }
            const tp = api_1.parseTrackingPlanName(trackingPlan.name);
            try {
                const config = {
                    client,
                    trackingPlans: [
                        {
                            name: trackingPlan.display_name,
                            id: tp.id,
                            workspaceSlug: tp.workspaceSlug,
                            path,
                        },
                    ],
                };
                yield config_1.setConfig(config);
                setIsLoading(false);
                onConfirm(config);
            }
            catch (error) {
                handleFatalError(error_1.wrapError('Unable to write typewriter.yml', error, `Failed due to an ${error.code} error (${error.errno}).`));
                return;
            }
        }
        else {
            onRestart();
        }
    });
    const summaryRows = [
        { label: 'SDK', value: sdk },
        { label: 'Language', value: language },
        { label: 'Directory', value: path },
        { label: 'API Token', value: `${workspace.name} (${token.slice(0, 10)}...)` },
        {
            label: 'Tracking Plan',
            value: react_1.default.createElement(ink_link_1.default, { url: api_1.toTrackingPlanURL(trackingPlan.name) }, trackingPlan.display_name),
        },
    ];
    const summary = (react_1.default.createElement(ink_1.Box, { flexDirection: "column" }, summaryRows.map(r => (react_1.default.createElement(ink_1.Box, { key: r.label },
        react_1.default.createElement(ink_1.Box, { width: 20 },
            react_1.default.createElement(ink_1.Color, { grey: true },
                r.label,
                ":")),
        react_1.default.createElement(ink_1.Color, { yellow: true }, r.value))))));
    return (react_1.default.createElement(Step, { name: "Summary:", step: step, description: summary, isLoading: isLoading },
        react_1.default.createElement(ink_select_input_1.default, { items: [{ label: 'Looks good!', value: 'lgtm' }, { label: 'Edit', value: 'edit' }], onSelect: onSelect })));
};
const Step = ({ step, name, isLoading = false, description, tips, children, }) => {
    const { debug } = react_1.useContext(index_1.DebugContext);
    return (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
        react_1.default.createElement(ink_1.Box, { flexDirection: "row", width: 80, justifyContent: "space-between" },
            react_1.default.createElement(ink_1.Box, null,
                react_1.default.createElement(ink_1.Color, { white: true }, name)),
            step && (react_1.default.createElement(ink_1.Box, null,
                react_1.default.createElement(ink_1.Color, { yellow: true },
                    "[",
                    step,
                    "/6]")))),
        react_1.default.createElement(ink_1.Box, { marginLeft: 1, flexDirection: "column" },
            tips &&
                tips.map((t, i) => (react_1.default.createElement(ink_1.Color, { grey: true, key: i },
                    figures_1.default.arrowRight,
                    " ",
                    t))),
            description,
            react_1.default.createElement(ink_1.Box, { marginTop: 1, flexDirection: "column" },
                isLoading && (react_1.default.createElement(ink_1.Color, { grey: true },
                    !debug && (react_1.default.createElement(react_1.default.Fragment, null,
                        react_1.default.createElement(ink_spinner_1.default, { type: "dots" }),
                        ' ')),
                    "Loading...")),
                !isLoading && children))));
};
//# sourceMappingURL=init.js.map