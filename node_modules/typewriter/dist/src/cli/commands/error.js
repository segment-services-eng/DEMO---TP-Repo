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
exports.ErrorBoundary = exports.toUnexpectedError = exports.isWrappedError = exports.wrapError = exports.ErrorContext = void 0;
/**
 * For Segmenters, see:
 *   https://paper.dropbox.com/doc/Typewriter-Error-Paths--AlUBLKIIcRc_9UU3_sgAh~9YAg-bdjW1EOlEHeomztWLrYWk
 */
const react_1 = __importStar(require("react"));
const ink_1 = require("ink");
const ink_link_1 = __importDefault(require("ink-link"));
const figures_1 = __importDefault(require("figures"));
const package_json_1 = require("../../../package.json");
const analytics_1 = __importDefault(require("../../analytics"));
exports.ErrorContext = react_1.createContext({
    handleError: () => { },
    handleFatalError: () => { },
});
/** Helper to wrap an error with a human-readable description. */
function wrapError(description, error, ...notes) {
    return {
        isWrappedError: true,
        description,
        notes,
        error,
    };
}
exports.wrapError = wrapError;
function isWrappedError(error) {
    return !!error && typeof error === 'object' && error.isWrappedError;
}
exports.isWrappedError = isWrappedError;
function toUnexpectedError(error) {
    if (isWrappedError(error)) {
        return error;
    }
    return wrapError('An unexpected error occurred.', error, error.message);
}
exports.toUnexpectedError = toUnexpectedError;
/**
 * We use a class component here, because we need access to the getDerivedStateFromError
 * lifecycle method, which is not yet supported by React Hooks.
 *
 * NOTE: it's important that the CLI runs in NODE_ENV=production when packaged up,
 *    otherwise, React will print a warning preventing this component from overwriting
 *    the error-ed component. See: https://github.com/vadimdemedes/ink/issues/234
 */
class ErrorBoundary extends react_1.default.Component {
    constructor() {
        super(...arguments);
        this.state = {};
        this.reportError = (params) => __awaiter(this, void 0, void 0, function* () {
            const { anonymousId, analyticsProps } = this.props;
            analytics_1.default.errorFired({
                properties: Object.assign(Object.assign({}, analyticsProps), { error_string: JSON.stringify(params.error, undefined, 2), unexpected: params.fatal, error: params.error }),
                anonymousId,
            });
            if (this.props.debug) {
                console.trace(params.error);
            }
        });
        /** For non-fatal errors, we just log the error when in debug mode. */
        this.handleError = (error) => __awaiter(this, void 0, void 0, function* () {
            yield this.reportError({
                error,
                fatal: false,
            });
        });
        /** For fatal errors, we halt the CLI by rendering an ErrorComponent. */
        this.handleFatalError = (error) => __awaiter(this, void 0, void 0, function* () {
            yield this.reportError({
                error,
                fatal: true,
            });
            this.setState({ error });
        });
    }
    static getDerivedStateFromError(error) {
        return { error: toUnexpectedError(error) };
    }
    componentDidCatch(error) {
        this.reportError({
            error: toUnexpectedError(error),
            fatal: true,
        });
    }
    componentDidMount() {
        if (this.props.error) {
            const err = toUnexpectedError(this.props.error);
            this.reportError({
                error: err,
                fatal: true,
            });
            this.setState({ error: err });
        }
    }
    render() {
        const { children } = this.props;
        const { error } = this.state;
        const context = {
            handleError: this.handleError,
            handleFatalError: this.handleFatalError,
        };
        return (react_1.default.createElement(exports.ErrorContext.Provider, { value: context },
            react_1.default.createElement(ink_1.Box, { flexDirection: "column" },
                error && react_1.default.createElement(ErrorComponent, { error: error }),
                !error && children)));
    }
}
exports.ErrorBoundary = ErrorBoundary;
const ErrorComponent = ({ error }) => {
    const { exit } = ink_1.useApp();
    // Wrap the call to `exit` in a `useEffect` so that it fires after rendering.
    react_1.useEffect(() => {
        exit(error.error);
    }, []);
    return (react_1.default.createElement(ink_1.Box, { flexDirection: "column", marginLeft: 2, marginRight: 2, marginTop: 1, marginBottom: 1 },
        react_1.default.createElement(ink_1.Box, { width: 80, textWrap: "wrap" },
            react_1.default.createElement(ink_1.Color, { red: true },
                figures_1.default.cross,
                " Error: ",
                error.description)),
        error.notes &&
            error.notes.map(n => (react_1.default.createElement(ink_1.Box, { key: n },
                react_1.default.createElement(ink_1.Box, { marginLeft: 1, marginRight: 1 },
                    react_1.default.createElement(ink_1.Color, { grey: true }, figures_1.default.arrowRight)),
                react_1.default.createElement(ink_1.Box, { width: 80, textWrap: "wrap" },
                    react_1.default.createElement(ink_1.Color, { grey: true }, n))))),
        react_1.default.createElement(ink_1.Box, { height: 2, width: 80, textWrap: "wrap", marginTop: 1 },
            react_1.default.createElement(ink_1.Color, { grey: true },
                "If you are unable to resolve this issue,",
                ' ',
                react_1.default.createElement(ink_link_1.default, { url: "https://github.com/segmentio/typewriter/issues/new" }, "open an issue on GitHub"),
                ". Please include that you are using version ",
                react_1.default.createElement(ink_1.Color, { yellow: true }, package_json_1.version),
                " of Typewriter."))));
};
//# sourceMappingURL=error.js.map