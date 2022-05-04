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
exports.baseContext = exports.gen = void 0;
const ast_1 = require("./ast");
const javascript_1 = require("./javascript");
const objc_1 = require("./objc");
const swift_1 = require("./swift");
const android_1 = require("./android");
const options_1 = require("./options");
const templates_1 = require("../templates");
const namer_1 = require("./namer");
const json_stable_stringify_1 = __importDefault(require("json-stable-stringify"));
function gen(trackingPlan, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsedTrackingPlan = {
            url: trackingPlan.url,
            trackCalls: trackingPlan.trackCalls.map(s => {
                const sanitizedSchema = Object.assign({ $schema: 'http://json-schema.org/draft-07/schema#' }, s);
                return {
                    raw: sanitizedSchema,
                    schema: ast_1.parse(sanitizedSchema),
                };
            }),
        };
        if (options.client.sdk === options_1.SDK.WEB || options.client.sdk === options_1.SDK.NODE) {
            return yield runGenerator(javascript_1.javascript, parsedTrackingPlan, options);
        }
        else if (options.client.sdk === options_1.SDK.IOS) {
            if (options.client.language === options_1.Language.SWIFT) {
                return yield runGenerator(swift_1.swift, parsedTrackingPlan, options);
            }
            else {
                return yield runGenerator(objc_1.objc, parsedTrackingPlan, options);
            }
        }
        else if (options.client.sdk === options_1.SDK.ANDROID) {
            return yield runGenerator(android_1.android, parsedTrackingPlan, options);
        }
        else {
            throw new Error(`Invalid SDK: ${options.client.sdk}`);
        }
    });
}
exports.gen = gen;
function runGenerator(generator, trackingPlan, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // One-time setup.
        templates_1.registerStandardHelpers();
        const rootContext = yield generator.setup(options);
        const context = Object.assign(Object.assign({}, rootContext), { isDevelopment: options.isDevelopment, language: options.client.language, typewriterVersion: options.typewriterVersion, trackingPlanURL: trackingPlan.url, tracks: [], objects: [] });
        // File output.
        const files = [];
        const generateFile = (outputPath, templatePath, fileContext) => __awaiter(this, void 0, void 0, function* () {
            files.push({
                path: outputPath,
                contents: yield templates_1.generateFromTemplate(templatePath, Object.assign(Object.assign({}, context), fileContext)),
            });
        });
        const client = {
            options,
            namer: new namer_1.Namer(generator.namer),
            generateFile,
        };
        // Core generator logic. This logic involves traversing over the underlying JSON Schema
        // and calling out to the supplied generator with each "node" in the JSON Schema that,
        // based on its AST type. Each iteration of this loop generates a "property" which
        // represents the type for a given schema. This property contains metadata such as the
        // type name (string, FooBarInterface, etc.), descriptions, etc. that are used in
        // templates.
        const traverseSchema = (schema, parentPath) => __awaiter(this, void 0, void 0, function* () {
            const path = `${parentPath}->${schema.name}`;
            const base = {
                rawName: client.namer.escapeString(schema.name),
                schemaType: schema.type,
                description: schema.description,
                isRequired: !!schema.isRequired,
            };
            let p;
            if ([ast_1.Type.ANY, ast_1.Type.STRING, ast_1.Type.BOOLEAN, ast_1.Type.INTEGER, ast_1.Type.NUMBER].includes(schema.type)) {
                // Primitives are any type that doesn't require generating a "subtype".
                p = yield generator.generatePrimitive(client, schema, parentPath);
            }
            else if (schema.type === ast_1.Type.OBJECT) {
                // For objects, we need to recursively generate each property first.
                const properties = [];
                for (const property of schema.properties) {
                    properties.push(yield traverseSchema(property, path));
                }
                const { property, object } = yield generator.generateObject(client, schema, properties, parentPath);
                if (object) {
                    context.objects.push(Object.assign({ properties }, object));
                }
                p = property;
            }
            else if (schema.type === ast_1.Type.ARRAY) {
                // Arrays are another special case, because we need to generate a type to represent
                // the items allowed in this array.
                const itemsSchema = Object.assign({ name: schema.name + ' Item', description: schema.description }, schema.items);
                const items = yield traverseSchema(itemsSchema, path);
                p = yield generator.generateArray(client, schema, items, parentPath);
            }
            else if (schema.type === ast_1.Type.UNION) {
                // For unions, we generate a property type to represent each of the possible types
                // then use that list of possible property types to generate a union.
                const types = yield Promise.all(schema.types.map((t) => __awaiter(this, void 0, void 0, function* () {
                    const subSchema = Object.assign({ name: schema.name, description: schema.description }, t);
                    return yield traverseSchema(subSchema, path);
                })));
                p = yield generator.generateUnion(client, schema, types, parentPath);
            }
            else {
                throw new Error(`Invalid Schema Type: ${schema.type}`);
            }
            return Object.assign(Object.assign({}, base), p);
        });
        // Generate Track Calls.
        for (const { raw, schema } of trackingPlan.trackCalls) {
            let t;
            if (generator.generatePropertiesObject) {
                const p = yield traverseSchema(ast_1.getPropertiesSchema(schema), '');
                t = yield generator.generateTrackCall(client, schema, p);
            }
            else {
                const properties = [];
                for (const property of ast_1.getPropertiesSchema(schema).properties) {
                    properties.push(yield traverseSchema(property, schema.name));
                }
                t = Object.assign(Object.assign({}, (yield generator.generateTrackCall(client, schema, properties))), { properties });
            }
            context.tracks.push(Object.assign({ functionDescription: schema.description, rawJSONSchema: json_stable_stringify_1.default(raw, {
                    space: '\t',
                }), rawEventName: client.namer.escapeString(schema.name) }, t));
        }
        // Perform any root-level generation.
        yield generator.generateRoot(client, context);
        // Format and output all generated files.
        return files.map(f => (generator.formatFile ? generator.formatFile(client, f) : f));
    });
}
function baseContext(options) {
    return {
        isDevelopment: options.isDevelopment,
        language: options.client.language,
        typewriterVersion: options.typewriterVersion,
    };
}
exports.baseContext = baseContext;
//# sourceMappingURL=gen.js.map