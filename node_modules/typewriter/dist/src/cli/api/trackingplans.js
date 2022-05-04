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
exports.toTrackingPlanURL = exports.parseTrackingPlanName = exports.computeDelta = exports.sanitizeTrackingPlan = exports.writeTrackingPlan = exports.loadTrackingPlan = exports.TRACKING_PLAN_FILENAME = void 0;
const config_1 = require("../config");
const sort_keys_1 = __importDefault(require("sort-keys"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const lodash_1 = require("lodash");
const json_stable_stringify_1 = __importDefault(require("json-stable-stringify"));
const writeFile = util_1.promisify(fs.writeFile);
const readFile = util_1.promisify(fs.readFile);
exports.TRACKING_PLAN_FILENAME = 'plan.json';
function loadTrackingPlan(configPath, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = config_1.resolveRelativePath(configPath, config.path, exports.TRACKING_PLAN_FILENAME);
        // Load the Tracking Plan from the local cache.
        try {
            const plan = JSON.parse(yield readFile(path, {
                encoding: 'utf-8',
            }));
            return yield sanitizeTrackingPlan(plan);
        }
        catch (_a) {
            // We failed to read the Tracking Plan, possibly because no plan.json exists.
            return undefined;
        }
    });
}
exports.loadTrackingPlan = loadTrackingPlan;
function writeTrackingPlan(configPath, plan, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = config_1.resolveRelativePath(configPath, config.path, exports.TRACKING_PLAN_FILENAME);
        yield config_1.verifyDirectoryExists(path, 'file');
        // Perform some pre-processing on the Tracking Plan before writing it.
        const planJSON = lodash_1.flow(
        // Enforce a deterministic ordering to reduce verson control deltas.
        plan => sanitizeTrackingPlan(plan), plan => json_stable_stringify_1.default(plan, { space: '\t' }))(plan);
        yield writeFile(path, planJSON, {
            encoding: 'utf-8',
        });
    });
}
exports.writeTrackingPlan = writeTrackingPlan;
function sanitizeTrackingPlan(plan) {
    // TODO: on JSON Schema Draft-04, required fields must have at least one element.
    // Therefore, we strip `required: []` from your rules so this error isn't surfaced.
    return sort_keys_1.default(plan, { deep: true });
}
exports.sanitizeTrackingPlan = sanitizeTrackingPlan;
function computeDelta(prev, next) {
    const deltas = {
        added: 0,
        modified: 0,
        removed: 0,
    };
    // Since we only use track calls in typewriter, we only changes to track calls.
    const nextByName = {};
    for (const rule of next.rules.events) {
        nextByName[rule.name] = rule;
    }
    const prevByName = {};
    if (!!prev) {
        for (const rule of prev.rules.events) {
            prevByName[rule.name] = rule;
        }
    }
    for (const rule of next.rules.events) {
        const prevRule = prevByName[rule.name];
        if (!prevRule) {
            deltas.added++;
        }
        else {
            if (JSON.stringify(rule) !== JSON.stringify(prevRule)) {
                deltas.modified++;
            }
        }
    }
    if (!!prev) {
        for (const rule of prev.rules.events) {
            if (!nextByName[rule.name]) {
                deltas.removed++;
            }
        }
    }
    return deltas;
}
exports.computeDelta = computeDelta;
function parseTrackingPlanName(name) {
    const parts = name.split('/');
    // Sane fallback:
    if (parts.length !== 4 || (parts[0] !== 'workspaces' && parts[2] !== 'tracking-plans')) {
        throw new Error(`Unable to parse Tracking Plan name: ${name}`);
    }
    const workspaceSlug = parts[1];
    const id = parts[3];
    return {
        id,
        workspaceSlug,
    };
}
exports.parseTrackingPlanName = parseTrackingPlanName;
function toTrackingPlanURL(name) {
    const { id, workspaceSlug } = parseTrackingPlanName(name);
    return `https://app.segment.com/${workspaceSlug}/protocols/tracking-plans/${id}`;
}
exports.toTrackingPlanURL = toTrackingPlanURL;
//# sourceMappingURL=trackingplans.js.map