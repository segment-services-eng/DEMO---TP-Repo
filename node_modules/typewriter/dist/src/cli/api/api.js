"use strict";
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
exports.validateToken = exports.fetchWorkspaces = exports.fetchAllTrackingPlans = exports.fetchTrackingPlans = exports.fetchTrackingPlan = void 0;
const got_1 = __importDefault(require("got"));
const package_json_1 = require("../../../package.json");
const error_1 = require("../commands/error");
const trackingplans_1 = require("./trackingplans");
const lodash_1 = require("lodash");
function fetchTrackingPlan(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `workspaces/${options.workspaceSlug}/tracking-plans/${options.id}`;
        const response = yield apiGet(url, options.token);
        response.create_time = new Date(response.create_time);
        response.update_time = new Date(response.update_time);
        return trackingplans_1.sanitizeTrackingPlan(response);
    });
}
exports.fetchTrackingPlan = fetchTrackingPlan;
// fetchTrackingPlans fetches all Tracking Plans accessible by a given API token
// within a specified workspace.
function fetchTrackingPlans(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `workspaces/${options.workspaceSlug}/tracking-plans`;
        const response = yield apiGet(url, options.token);
        return response.tracking_plans.map(tp => (Object.assign(Object.assign({}, tp), { create_time: new Date(tp.create_time), update_time: new Date(tp.update_time) })));
    });
}
exports.fetchTrackingPlans = fetchTrackingPlans;
// fetchAllTrackingPlans fetches all Tracking Plans accessible by a given API token.
function fetchAllTrackingPlans(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const trackingPlans = [];
        const workspaces = yield fetchWorkspaces({ token: options.token });
        for (const workspace of workspaces) {
            const workspaceTPs = yield fetchTrackingPlans({
                workspaceSlug: workspace.name.replace('workspaces/', ''),
                token: options.token,
            });
            trackingPlans.push(...workspaceTPs);
        }
        return trackingPlans;
    });
}
exports.fetchAllTrackingPlans = fetchAllTrackingPlans;
// fetchWorkspaces lists all workspaces found with a given Segment API token.
function fetchWorkspaces(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = yield apiGet('workspaces', options.token);
        return resp.workspaces.map(w => (Object.assign(Object.assign({}, w), { create_time: new Date(w.create_time) })));
    });
}
exports.fetchWorkspaces = fetchWorkspaces;
const tokenValidationCache = {};
function validateToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token) {
            return { isValid: false };
        }
        // If we don't have a cached result, query the API to find out if this is a valid token.
        if (!tokenValidationCache[token]) {
            const result = { isValid: false };
            try {
                const workspaces = yield fetchWorkspaces({ token });
                result.isValid = workspaces.length > 0;
                result.workspace = workspaces.length === 1 ? workspaces[0] : undefined;
            }
            catch (error) {
                // Check if this was a 403 error, which means the token is invalid.
                // Otherwise, surface the error becuase something else went wrong.
                if (!error_1.isWrappedError(error) || !error.description.toLowerCase().includes('denied')) {
                    throw error;
                }
            }
            tokenValidationCache[token] = result;
        }
        return tokenValidationCache[token];
    });
}
exports.validateToken = validateToken;
function apiGet(url, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const resp = got_1.default(url, {
            baseUrl: 'https://platform.segmentapis.com/v1beta',
            headers: {
                'User-Agent': `Segment (typewriter/${package_json_1.version})`,
                Authorization: `Bearer ${token.trim()}`,
            },
            json: true,
            timeout: 10000,
        });
        try {
            const { body } = yield resp;
            return body;
        }
        catch (error) {
            // Don't include the user's authorization token. Overwrite the header value from this error.
            const tokenHeader = `Bearer ${token.trim().substring(0, 10)}... (token redacted)`;
            error = lodash_1.set(error, 'gotOptions.headers.authorization', tokenHeader);
            if (error.statusCode === 401 || error.statusCode === 403) {
                throw error_1.wrapError('Permission denied by Segment API', error, `Failed while querying the ${url} endpoint`, "Verify you are using the right API token by running 'npx typewriter tokens'");
            }
            else if (error.code === 'ETIMEDOUT') {
                throw error_1.wrapError('Segment API request timed out', error, `Failed while querying the ${url} endpoint`);
            }
            throw error;
        }
    });
}
//# sourceMappingURL=api.js.map