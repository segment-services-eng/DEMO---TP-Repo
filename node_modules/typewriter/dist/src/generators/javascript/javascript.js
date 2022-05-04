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
exports.javascript = void 0;
const ast_1 = require("../ast");
const lodash_1 = require("lodash");
const prettier = __importStar(require("prettier"));
const typescript_1 = require("typescript");
const options_1 = require("../options");
const targets_1 = require("./targets");
const templates_1 = require("../../templates");
exports.javascript = {
    generatePropertiesObject: true,
    namer: {
        // See: https://mathiasbynens.be/notes/reserved-keywords#ecmascript-6
        // prettier-ignore
        reservedWords: [
            'do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'null', 'this',
            'true', 'void', 'with', 'await', 'break', 'catch', 'class', 'const', 'false', 'super', 'throw',
            'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof',
            'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments',
            'interface', 'protected', 'implements', 'instanceof',
        ],
        quoteChar: "'",
        // Note: we don't support the full range of allowed JS chars, instead focusing on a subset.
        // The full regex 11k+ chars: https://mathiasbynens.be/demo/javascript-identifier-regex
        // See: https://mathiasbynens.be/notes/javascript-identifiers-es6
        allowedIdentifierStartingChars: 'A-Za-z_$',
        allowedIdentifierChars: 'A-Za-z0-9_$',
    },
    setup: (options) => __awaiter(void 0, void 0, void 0, function* () {
        yield templates_1.registerPartial('generators/javascript/templates/setTypewriterOptionsDocumentation.hbs', 'setTypewriterOptionsDocumentation');
        yield templates_1.registerPartial('generators/javascript/templates/functionDocumentation.hbs', 'functionDocumentation');
        return {
            isBrowser: options.client.sdk === options_1.SDK.WEB,
            useProxy: true,
        };
    }),
    generatePrimitive: (client, schema) => __awaiter(void 0, void 0, void 0, function* () {
        let type = 'any';
        if (schema.type === ast_1.Type.STRING) {
            type = 'string';
        }
        else if (schema.type === ast_1.Type.BOOLEAN) {
            type = 'boolean';
        }
        else if (schema.type === ast_1.Type.INTEGER || schema.type === ast_1.Type.NUMBER) {
            type = 'number';
        }
        return conditionallyNullable(schema, {
            name: client.namer.escapeString(schema.name),
            type,
        });
    }),
    generateArray: (client, schema, items) => __awaiter(void 0, void 0, void 0, function* () {
        return conditionallyNullable(schema, {
            name: client.namer.escapeString(schema.name),
            type: `${items.type}[]`,
        });
    }),
    generateObject: (client, schema, properties) => __awaiter(void 0, void 0, void 0, function* () {
        if (properties.length === 0) {
            // If no properties are set, replace this object with a untyped map to allow any properties.
            return {
                property: conditionallyNullable(schema, {
                    name: client.namer.escapeString(schema.name),
                    type: 'Record<string, any>',
                }),
            };
        }
        else {
            // Otherwise generate an interface to represent this object.
            const interfaceName = client.namer.register(schema.name, 'interface', {
                transform: (name) => lodash_1.upperFirst(lodash_1.camelCase(name)),
            });
            return {
                property: conditionallyNullable(schema, {
                    name: client.namer.escapeString(schema.name),
                    type: interfaceName,
                }),
                object: {
                    name: interfaceName,
                },
            };
        }
    }),
    generateUnion: (client, schema, types) => __awaiter(void 0, void 0, void 0, function* () {
        return conditionallyNullable(schema, {
            name: client.namer.escapeString(schema.name),
            type: types.map(t => t.type).join(' | '),
        });
    }),
    generateTrackCall: (client, schema, propertiesObject) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            functionName: client.namer.register(schema.name, 'function->track', { transform: lodash_1.camelCase }),
            propertiesType: propertiesObject.type,
            // The properties object in a.js can be omitted if no properties are required.
            isPropertiesOptional: client.options.client.sdk === options_1.SDK.WEB && !propertiesObject.isRequired,
        });
    }),
    generateRoot: (client, context) => __awaiter(void 0, void 0, void 0, function* () {
        // index.hbs contains all JavaScript client logic.
        yield client.generateFile(client.options.client.language === options_1.Language.TYPESCRIPT ? 'index.ts' : 'index.js', 'generators/javascript/templates/index.hbs', context);
        // segment.hbs contains the TypeScript definitions for the Segment API.
        // It becomes an empty file for JavaScript after being transpiled.
        if (client.options.client.language === options_1.Language.TYPESCRIPT) {
            yield client.generateFile('segment.ts', 'generators/javascript/templates/segment.hbs', context);
        }
    }),
    formatFile: (client, file) => {
        let { contents } = file;
        // If we are generating a JavaScript client, transpile the client
        // from TypeScript into JavaScript.
        if (client.options.client.language === options_1.Language.JAVASCRIPT) {
            // If we're generating a JavaScript client, compile from TypeScript to JavaScript.
            const { outputText } = typescript_1.transpileModule(contents, {
                compilerOptions: {
                    target: targets_1.toTarget(client.options.client.scriptTarget),
                    module: targets_1.toModule(client.options.client.moduleTarget),
                    esModuleInterop: true,
                },
            });
            contents = outputText;
        }
        // Apply stylistic formatting, via Prettier.
        const formattedContents = prettier.format(contents, {
            parser: client.options.client.language === options_1.Language.TYPESCRIPT ? 'typescript' : 'babel',
            // Overwrite a few of the standard prettier settings to match with our Typewriter configuration:
            useTabs: true,
            singleQuote: true,
            semi: false,
            trailingComma: client.options.client.language === options_1.Language.JAVASCRIPT &&
                client.options.client.scriptTarget === 'ES3'
                ? 'none'
                : 'es5',
        });
        return Object.assign(Object.assign({}, file), { contents: formattedContents });
    },
};
function conditionallyNullable(schema, property) {
    return Object.assign(Object.assign({}, property), { type: !!schema.isNullable ? `${property.type} | null` : property.type });
}
//# sourceMappingURL=javascript.js.map