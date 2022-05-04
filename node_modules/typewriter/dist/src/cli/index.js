#!/usr/bin/env node
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
exports.DebugContext = void 0;
// Default to production, so that React error messages are not shown.
// Note: this must happen before we import React.
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const react_1 = __importStar(require("react"));
const ink_1 = require("ink");
const commands_1 = require("./commands");
const analytics_node_1 = __importDefault(require("analytics-node"));
const analytics_1 = __importDefault(require("../analytics"));
const config_1 = require("./config");
const node_machine_id_1 = require("node-machine-id");
const package_json_1 = require("../../package.json");
const api_1 = require("./api");
const yargs_1 = __importDefault(require("yargs"));
const commandDefaults = {
    builder: {
        config: {
            type: 'string',
            default: './',
        },
        version: {
            type: 'boolean',
            default: false,
        },
        v: {
            type: 'boolean',
            default: false,
        },
        help: {
            type: 'boolean',
            default: false,
        },
        h: {
            type: 'boolean',
            default: false,
        },
        debug: {
            type: 'boolean',
            default: false,
        },
    },
};
// The `.argv` below will boot a Yargs CLI.
yargs_1.default
    .command(Object.assign(Object.assign({}, commandDefaults), { command: ['init', 'initialize', 'quickstart'], handler: toYargsHandler(commands_1.Init, {}) }))
    .command(Object.assign(Object.assign({}, commandDefaults), { command: ['update', 'u', '*'], handler: toYargsHandler(commands_1.Build, { production: false, update: true }, { validateDefault: true }) }))
    .command(Object.assign(Object.assign({}, commandDefaults), { command: ['build', 'b', 'd', 'dev', 'development'], handler: toYargsHandler(commands_1.Build, { production: false, update: false }) }))
    .command(Object.assign(Object.assign({}, commandDefaults), { command: ['prod', 'p', 'production'], handler: toYargsHandler(commands_1.Build, { production: true, update: false }) }))
    .command(Object.assign(Object.assign({}, commandDefaults), { command: ['token', 'tokens', 't'], handler: toYargsHandler(commands_1.Token, {}) }))
    .command(Object.assign(Object.assign({}, commandDefaults), { command: 'version', handler: toYargsHandler(commands_1.Version, {}) }))
    .command(Object.assign(Object.assign({}, commandDefaults), { command: 'help', handler: toYargsHandler(commands_1.Help, {}) }))
    .strict(true)
    // We override help + version ourselves.
    .help(false)
    .showHelpOnFail(false)
    .version(false).argv;
exports.DebugContext = react_1.createContext({ debug: false });
// Initialize analytics-node
const writeKey = process.env.NODE_ENV === 'production'
    ? // Production: https://app.segment.com/segment_prod/sources/typewriter/overview
        'ahPefUgNCh3w1BdkWX68vOpVgR2Blm5e'
    : // Development: https://app.segment.com/segment_prod/sources/typewriter_dev/overview
        'NwUMoJltCrmiW5gQZyiyvKpESDcwsj1r';
const analyticsNode = new analytics_node_1.default(writeKey, {
    flushAt: 1,
    flushInterval: -1,
});
// Initialize the typewriter client that this CLI uses.
analytics_1.default.setTypewriterOptions({
    analytics: analyticsNode,
});
function toYargsHandler(Command, props, cliOptions) {
    // Return a closure which yargs will execute if this command is run.
    return (args) => __awaiter(this, void 0, void 0, function* () {
        let anonymousId = 'unknown';
        try {
            anonymousId = yield getAnonymousId();
        }
        catch (error) {
            analytics_1.default.errorFired({
                error_string: 'Failed to generate an anonymous id',
                error,
            });
        }
        try {
            // The '*' command is a catch-all. We want to fail the CLI if an unknown command is
            // supplied ('yarn typewriter footothebar'), instead of just running the default command.
            const isValidCommand = !cliOptions ||
                !cliOptions.validateDefault ||
                args._.length === 0 ||
                ['update', 'u'].includes(args._[0]);
            // We'll measure how long it takes to render this command.
            const startTime = process.hrtime();
            // Attempt to read a config, if one is available.
            const cfg = yield config_1.getConfig(args.config);
            const analyticsProps = yield typewriterLibraryProperties(args, cfg);
            // Figure out which component to render.
            let Component = Command;
            // Certain flags (--version, --help) will overide whatever command was provided.
            if (!!args.version || !!args.v || Command.displayName === commands_1.Version.displayName) {
                // We override the --version flag from yargs with our own output. If it was supplied, print
                // the `version` component instead.
                Component = commands_1.Version;
            }
            else if (!isValidCommand ||
                !!args.help ||
                !!args.h ||
                args._.includes('help') ||
                Command.displayName === commands_1.Help.displayName) {
                // Same goes for the --help flag.
                Component = commands_1.Help;
            }
            // 🌟Render the command.
            try {
                const { waitUntilExit } = ink_1.render(react_1.default.createElement(exports.DebugContext.Provider, { value: { debug: args.debug } },
                    react_1.default.createElement(commands_1.ErrorBoundary, { anonymousId: anonymousId, analyticsProps: analyticsProps, debug: args.debug },
                        react_1.default.createElement(Component, Object.assign({ configPath: args.config, config: cfg, anonymousId: anonymousId, analyticsProps: analyticsProps }, props)))), { debug: !!args.debug });
                yield waitUntilExit();
            }
            catch (err) {
                // Errors are handled/reported in ErrorBoundary.
                process.exitCode = 1;
            }
            // Measure how long this command took.
            const [sec, nsec] = process.hrtime(startTime);
            const ms = sec * 1000 + nsec / 1000000;
            // Fire analytics to Segment on typewriter command usage.
            analytics_1.default.commandRun({
                properties: Object.assign(Object.assign({}, analyticsProps), { duration: Math.round(ms) }),
                anonymousId,
            });
            // If this isn't a valid command, make sure we exit with a non-zero exit code.
            if (!isValidCommand) {
                process.exitCode = 1;
            }
        }
        catch (error) {
            // If an error was thrown in the command logic above (but outside of the ErrorBoundary in Component)
            // then render an ErrorBoundary.
            try {
                const { waitUntilExit } = ink_1.render(react_1.default.createElement(exports.DebugContext.Provider, { value: { debug: args.debug } },
                    react_1.default.createElement(commands_1.ErrorBoundary, { error: error, anonymousId: anonymousId, analyticsProps: yield typewriterLibraryProperties(args), debug: args.debug })), {
                    debug: !!args.debug,
                });
                yield waitUntilExit();
            }
            catch (_a) {
                // Errors are handled/reported in ErrorBoundary.
                process.exitCode = 1;
            }
        }
    });
}
/** Helper to fetch the name of the current yargs CLI command. */
function getCommand(args) {
    return args._.length === 0 ? 'update' : args._.join(' ');
}
/**
 * Helper to generate the shared library properties shared by all analytics calls.
 * See: https://app.segment.com/segment_prod/protocols/libraries/rs_1OL4GFYCh62cOIRi3PJuIOdN7uM
 */
function typewriterLibraryProperties(args, cfg = undefined) {
    return __awaiter(this, void 0, void 0, function* () {
        // In CI environments, or if there is no internet, we may not be able to execute the
        // the token script.
        let tokenMethod = undefined;
        try {
            tokenMethod = yield config_1.getTokenMethod(cfg, args.config);
        }
        catch (_a) { }
        // Attempt to read the name of the Tracking Plan from a local `plan.json`.
        // If this fails, that's fine -- we'll still have the id from the config.
        let trackingPlanName = '';
        try {
            if (cfg && cfg.trackingPlans.length > 0) {
                const tp = yield api_1.loadTrackingPlan(args.config, cfg.trackingPlans[0]);
                if (tp) {
                    trackingPlanName = tp.display_name;
                }
            }
        }
        catch (_b) { }
        return {
            version: package_json_1.version,
            client: cfg && {
                language: cfg.client.language,
                sdk: cfg.client.sdk,
            },
            command: getCommand(args),
            is_ci: Boolean(process.env.CI),
            token_method: tokenMethod,
            tracking_plan: cfg && cfg.trackingPlans && cfg.trackingPlans.length > 0
                ? {
                    name: trackingPlanName,
                    id: cfg.trackingPlans[0].id,
                    workspace_slug: cfg.trackingPlans[0].workspaceSlug,
                }
                : undefined,
        };
    });
}
/**
 * We generate an anonymous ID that is unique per user, s.t. we can group analytics from
 * the same user together.
 */
function getAnonymousId() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield node_machine_id_1.machineId(false);
    });
}
//# sourceMappingURL=index.js.map