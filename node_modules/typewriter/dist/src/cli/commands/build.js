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
exports.AfterStep = exports.GenerationStep = exports.ClearFilesStep = exports.UpdatePlanStep = exports.Build = void 0;
const react_1 = __importStar(require("react"));
const ink_1 = require("ink");
const ink_link_1 = __importDefault(require("ink-link"));
const ink_spinner_1 = __importDefault(require("ink-spinner"));
const config_1 = require("../config");
const fs = __importStar(require("fs"));
const util_1 = require("util");
const api_1 = require("../api");
const gen_1 = require("../../generators/gen");
const templates_1 = require("../../templates");
const path_1 = require("path");
const package_json_1 = require("../../../package.json");
const index_1 = require("../index");
const error_1 = require("./error");
const figures_1 = __importDefault(require("figures"));
const init_1 = require("./init");
const readFile = util_1.promisify(fs.readFile);
const readdir = util_1.promisify(fs.readdir);
const writeFile = util_1.promisify(fs.writeFile);
const unlink = util_1.promisify(fs.unlink);
var Steps;
(function (Steps) {
    Steps[Steps["UpdatePlan"] = 0] = "UpdatePlan";
    Steps[Steps["ClearFiles"] = 1] = "ClearFiles";
    Steps[Steps["Generation"] = 2] = "Generation";
    Steps[Steps["After"] = 3] = "After";
    Steps[Steps["Done"] = 4] = "Done";
})(Steps || (Steps = {}));
const Build = ({ config: currentConfig, configPath, production, update, anonymousId, analyticsProps, onDone, }) => {
    const [step, setStep] = react_1.useState(Steps.UpdatePlan);
    const [trackingPlans, setTrackingPlans] = react_1.useState([]);
    const [config, setConfig] = react_1.useState(currentConfig);
    const { exit } = ink_1.useApp();
    const onNext = () => setStep(step + 1);
    function withNextStep(f) {
        return (arg) => {
            f(arg);
            setStep(step + 1);
        };
    }
    react_1.useEffect(() => {
        if (step === Steps.Done) {
            onDone ? onDone() : exit();
        }
    }, [step]);
    // If a typewriter.yml hasn't been configured yet, drop the user into the init wizard.
    if (!config) {
        return (react_1.default.createElement(init_1.Init, { config: config, configPath: configPath, onDone: setConfig, anonymousId: anonymousId, analyticsProps: analyticsProps }));
    }
    return (react_1.default.createElement(ink_1.Box, { marginBottom: 1, marginTop: 1, flexDirection: "column" },
        react_1.default.createElement(exports.UpdatePlanStep, { config: config, configPath: configPath, update: update, step: step, onDone: withNextStep(setTrackingPlans) }),
        react_1.default.createElement(exports.ClearFilesStep, { config: config, configPath: configPath, step: step, onDone: onNext }),
        react_1.default.createElement(exports.GenerationStep, { config: config, configPath: configPath, production: production, trackingPlans: trackingPlans, step: step, onDone: onNext }),
        react_1.default.createElement(exports.AfterStep, { config: config, configPath: configPath, step: step, onDone: onNext })));
};
exports.Build = Build;
// Load a Tracking Plan, either from the API or from the `plan.json` file.
const UpdatePlanStep = ({ config, configPath, update, step, onDone, }) => {
    const [trackingPlans, setTrackingPlans] = react_1.useState([]);
    // The various warning states we enter while loading Tracking Plans:
    const [failedToFindToken, setFailedToFindToken] = react_1.useState(false);
    const [fellbackToUpdate, setFellbackToUpdate] = react_1.useState(false);
    const [apiError, setAPIError] = react_1.useState();
    const { handleFatalError, handleError } = react_1.useContext(error_1.ErrorContext);
    const { isRunning, isDone } = useStep(step, Steps.UpdatePlan, loadTrackingPlans, onDone);
    function loadTrackingPlans() {
        return __awaiter(this, void 0, void 0, function* () {
            const loadedTrackingPlans = [];
            for (const trackingPlanConfig of config.trackingPlans) {
                // Load the local copy of this Tracking Plan, we'll either use this for generation
                // or use it to identify what changed with the latest copy of this Tracking Plan.
                const previousTrackingPlan = yield api_1.loadTrackingPlan(configPath, trackingPlanConfig);
                // If we don't have a copy of the Tracking Plan, then we would fatal error. Instead,
                // fallback to pulling down a new copy of the Tracking Plan.
                if (!update && !previousTrackingPlan) {
                    setFellbackToUpdate(true);
                }
                // If we are pulling the latest Tracking Plan (npx typewriter), or if there is no local
                // copy of the Tracking Plan (plan.json), then query the API for the latest Tracking Plan.
                let newTrackingPlan = undefined;
                if (update || !previousTrackingPlan) {
                    // Attempt to read a token and use it to update the local Tracking Plan to the latest version.
                    const token = yield config_1.getToken(config, configPath);
                    if (token) {
                        try {
                            newTrackingPlan = yield api_1.fetchTrackingPlan({
                                id: trackingPlanConfig.id,
                                workspaceSlug: trackingPlanConfig.workspaceSlug,
                                token,
                            });
                        }
                        catch (error) {
                            handleError(error);
                            if (error_1.isWrappedError(error)) {
                                setAPIError(error.description);
                            }
                            else {
                                setAPIError('API request failed');
                            }
                        }
                        if (newTrackingPlan) {
                            // Update plan.json with the latest Tracking Plan.
                            yield api_1.writeTrackingPlan(configPath, newTrackingPlan, trackingPlanConfig);
                        }
                    }
                    else {
                        setFailedToFindToken(true);
                    }
                }
                newTrackingPlan = newTrackingPlan || previousTrackingPlan;
                if (!newTrackingPlan) {
                    handleFatalError(error_1.wrapError('Unable to fetch Tracking Plan from local cache or API'));
                    return null;
                }
                const { events } = newTrackingPlan.rules;
                const trackingPlan = {
                    name: newTrackingPlan.display_name,
                    url: api_1.toTrackingPlanURL(newTrackingPlan.name),
                    path: trackingPlanConfig.path,
                    trackCalls: events
                        // Typewriter doesn't yet support event versioning. For now, we just choose the most recent version.
                        .filter(e => events.every(e2 => e.name !== e2.name || e.version >= e2.version))
                        .map(e => (Object.assign(Object.assign({}, e.rules), { title: e.name, description: e.description }))),
                };
                loadedTrackingPlans.push({
                    trackingPlan,
                    deltas: api_1.computeDelta(previousTrackingPlan, newTrackingPlan),
                });
                setTrackingPlans(loadedTrackingPlans);
            }
            return loadedTrackingPlans.map(({ trackingPlan }) => trackingPlan);
        });
    }
    const s = config.trackingPlans.length > 1 ? 's' : '';
    const stepName = isDone ? `Loaded Tracking Plan${s}` : `Loading Tracking Plan${s}...`;
    return (react_1.default.createElement(Step, { name: stepName, isRunning: isRunning, isDone: isDone },
        update && react_1.default.createElement(Note, null,
            "Downloading the latest version",
            s,
            " from Segment..."),
        fellbackToUpdate && (react_1.default.createElement(Note, { isWarning: true }, "No local copy of this Tracking Plan, fetching from API.")),
        failedToFindToken && (react_1.default.createElement(Note, { isWarning: true },
            "No valid API token, using local ",
            s ? 'copies' : 'copy',
            " instead.")),
        !!apiError && (react_1.default.createElement(Note, { isWarning: true },
            apiError,
            ". Using local ",
            s ? 'copies' : 'copy',
            " instead.")),
        trackingPlans.map(({ trackingPlan, deltas }) => (react_1.default.createElement(ink_1.Box, { flexDirection: "column", key: trackingPlan.url },
            react_1.default.createElement(Note, null,
                "Loaded ",
                react_1.default.createElement(ink_link_1.default, { url: trackingPlan.url }, trackingPlan.name),
                ' ',
                (deltas.added !== 0 || deltas.modified !== 0 || deltas.removed !== 0) && (react_1.default.createElement(react_1.default.Fragment, null,
                    "(",
                    react_1.default.createElement(ink_1.Color, { grey: deltas.added === 0, green: deltas.added > 0 },
                        deltas.added,
                        " added"),
                    ",",
                    ' ',
                    react_1.default.createElement(ink_1.Color, { grey: deltas.modified === 0, yellow: deltas.modified > 0 },
                        deltas.modified,
                        " modified"),
                    ",",
                    ' ',
                    react_1.default.createElement(ink_1.Color, { grey: deltas.removed === 0, red: deltas.removed > 0 },
                        deltas.removed,
                        " removed"),
                    ")"))))))));
};
exports.UpdatePlanStep = UpdatePlanStep;
const ClearFilesStep = ({ config, configPath, step, onDone }) => {
    const { handleFatalError } = react_1.useContext(error_1.ErrorContext);
    const { isRunning, isDone } = useStep(step, Steps.ClearFiles, clearGeneratedFiles, onDone);
    function clearGeneratedFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = yield Promise.all(config.trackingPlans.map((trackingPlanConfig) => __awaiter(this, void 0, void 0, function* () {
                const path = config_1.resolveRelativePath(configPath, trackingPlanConfig.path);
                yield config_1.verifyDirectoryExists(path);
                try {
                    yield clearFolder(path);
                }
                catch (error) {
                    return error_1.wrapError('Failed to clear generated files', error, `Failed on: '${trackingPlanConfig.path}'`, error.message);
                }
            })));
            const error = errors.find(error => error_1.isWrappedError(error));
            if (error) {
                handleFatalError(error);
                return null;
            }
        });
    }
    // clearFolder removes all typewriter-generated files from the specified folder
    // except for a plan.json.
    // It uses a simple heuristic to avoid accidentally clobbering a user's files --
    // it only clears files with the "this file was autogenerated by Typewriter" warning.
    // Therefore, all generators need to output that warning in a comment in the first few
    // lines of every generated file.
    function clearFolder(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileNames = yield readdir(path, 'utf-8');
            for (const fileName of fileNames) {
                const fullPath = path_1.join(path, fileName);
                try {
                    const contents = yield readFile(fullPath, 'utf-8');
                    if (contents.includes(templates_1.SEGMENT_AUTOGENERATED_FILE_WARNING)) {
                        yield unlink(fullPath);
                    }
                }
                catch (error) {
                    // Note: none of our generators produce folders, but if we ever do, then we'll need to
                    // update this logic to handle recursively traversing directores. For now, we just ignore
                    // any directories.
                    if (error.code !== 'EISDIR') {
                        throw error;
                    }
                }
            }
        });
    }
    const stepName = isDone ? 'Removed generated files' : 'Removing generated files...';
    return react_1.default.createElement(Step, { name: stepName, isRunning: isRunning, isDone: isDone });
};
exports.ClearFilesStep = ClearFilesStep;
const GenerationStep = ({ config, configPath, production, trackingPlans, step, onDone, }) => {
    const { isRunning, isDone } = useStep(step, Steps.Generation, generate, onDone);
    function generate() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const trackingPlan of trackingPlans) {
                // Generate the client:
                const files = yield gen_1.gen(trackingPlan, {
                    client: config.client,
                    typewriterVersion: package_json_1.version,
                    isDevelopment: !production,
                });
                // Write it out to the specified directory:
                for (const file of files) {
                    const path = config_1.resolveRelativePath(configPath, trackingPlan.path, file.path);
                    yield config_1.verifyDirectoryExists(path, 'file');
                    yield writeFile(path, file.contents, {
                        encoding: 'utf-8',
                    });
                }
            }
        });
    }
    const s = config.trackingPlans.length > 1 ? 's' : '';
    const stepName = isDone ? `Generated client${s}` : `Generating client${s}...`;
    return (react_1.default.createElement(Step, { name: stepName, isRunning: isRunning, isDone: isDone },
        react_1.default.createElement(Note, null,
            "Building for ",
            production ? 'production' : 'development'),
        trackingPlans.map(trackingPlan => (react_1.default.createElement(Note, { key: trackingPlan.url },
            react_1.default.createElement(ink_link_1.default, { url: trackingPlan.url }, trackingPlan.name))))));
};
exports.GenerationStep = GenerationStep;
const AfterStep = ({ config, configPath, step, onDone }) => {
    const { handleError } = react_1.useContext(error_1.ErrorContext);
    const [error, setError] = react_1.useState();
    const { isRunning, isDone } = useStep(step, Steps.After, after, onDone);
    const afterScript = config.scripts ? config.scripts.after : undefined;
    function after() {
        return __awaiter(this, void 0, void 0, function* () {
            if (afterScript) {
                try {
                    yield config_1.runScript(afterScript, configPath, config_1.Scripts.After);
                }
                catch (error) {
                    if (error_1.isWrappedError(error)) {
                        handleError(error);
                        setError(error);
                    }
                    else {
                        throw error;
                    }
                }
            }
        });
    }
    const stepName = isDone ? 'Cleaned up' : 'Running clean up script...';
    return (react_1.default.createElement(Step, { name: stepName, isRunning: isRunning, isDone: isDone, isSkipped: !afterScript },
        afterScript && react_1.default.createElement(Note, null, afterScript),
        error && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Note, { isWarning: true }, error.description),
            error.notes
                .filter(n => !!n)
                .map(n => (react_1.default.createElement(Note, { isWarning: true, key: n }, n)))))));
};
exports.AfterStep = AfterStep;
function useStep(step, thisStep, f, onDone) {
    const { handleFatalError } = react_1.useContext(error_1.ErrorContext);
    const isRunning = step === thisStep;
    function runStep() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield f();
                // If a fatal error occurred, return null to skip any further updates to this component.
                if (result !== null) {
                    onDone(result);
                }
            }
            catch (error) {
                handleFatalError(error_1.toUnexpectedError(error));
            }
        });
    }
    react_1.useEffect(() => {
        if (isRunning) {
            runStep();
        }
    }, [isRunning]);
    return {
        isRunning,
        isDone: step > thisStep,
    };
}
const Step = ({ name, isSkipped, isRunning, isDone, children }) => {
    const { debug } = react_1.useContext(index_1.DebugContext);
    if (isSkipped) {
        return null;
    }
    return (react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
        react_1.default.createElement(ink_1.Color, { white: true },
            react_1.default.createElement(ink_1.Box, { width: 3, justifyContent: "flex-end" }, isDone ? (react_1.default.createElement(ink_1.Color, { green: true }, " \u2714")) : isRunning ? (debug ? (figures_1.default.ellipsis) : (react_1.default.createElement(ink_spinner_1.default, { type: "dots" }))) : ('')),
            react_1.default.createElement(ink_1.Box, { marginLeft: 1, width: 70 }, name)),
        (isRunning || isDone) && children));
};
const Note = ({ isWarning, children }) => {
    return (react_1.default.createElement(ink_1.Text, { italic: true },
        react_1.default.createElement(ink_1.Color, { grey: !isWarning, yellow: !!isWarning },
            react_1.default.createElement(ink_1.Box, { marginLeft: 4 }, isWarning ? '⚠' : '↪'),
            react_1.default.createElement(ink_1.Box, { marginLeft: 2, width: 80, textWrap: "wrap" }, children))));
};
//# sourceMappingURL=build.js.map