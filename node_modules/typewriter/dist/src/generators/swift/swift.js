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
exports.swift = void 0;
const lodash_1 = require("lodash");
const ast_1 = require("../ast");
const Handlebars = __importStar(require("handlebars"));
exports.swift = {
    generatePropertiesObject: false,
    namer: {
        // See: https://docs.swift.org/swift-book/ReferenceManual/LexicalStructure.html#ID413
        // prettier-ignore
        reservedWords: [
            'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate', 'func', 'import', 'init',
            'inout', 'internal', 'let', 'open', 'operator', 'private', 'protocol', 'public', 'rethrows', 'static',
            'struct', 'subscript', 'typealias', 'var', 'break', 'case', 'continue', 'default', 'defer', 'do', 'else',
            'fallthrough', 'for', 'guard', 'if', 'in', 'repeat', 'return', 'switch', 'where', 'while', 'as', 'Any',
            'catch', 'false', 'is', 'nil', 'super', 'self', 'Self', 'throw', 'throws', 'true', 'try', '_',
            'associativity', 'convenience', 'dynamic', 'didSet', 'final', 'get', 'infix', 'indirect', 'lazy', 'left',
            'mutating', 'none', 'nonmutating', 'optional', 'override', 'postfix', 'precedence', 'prefix', 'Protocol',
            'required', 'right', 'set', 'Type', 'unowned', 'weak', 'willSet'
        ],
        quoteChar: '"',
        allowedIdentifierStartingChars: 'A-Za-z_$',
        allowedIdentifierChars: 'A-Za-z0-9_$',
    },
    setup: () => __awaiter(void 0, void 0, void 0, function* () {
        Handlebars.registerHelper('propertiesDictionary', generatePropertiesDictionary);
        Handlebars.registerHelper('functionCall', generateFunctionCall);
        Handlebars.registerHelper('functionSignature', generateFunctionSignature);
        return {};
    }),
    generatePrimitive: (client, schema, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        let type = 'Any';
        let isPointerType = !schema.isRequired || !!schema.isNullable;
        if (schema.type === ast_1.Type.STRING) {
            type = 'String';
            isPointerType = true;
        }
        else if (schema.type === ast_1.Type.BOOLEAN) {
            // BOOLs cannot nullable in Objective-C. Instead, use an NSNumber which can be
            // initialized like a boolean like so: [NSNumber numberWithBool:YES]
            // This is what is done behind the scenes by typewriter if this boolean is nonnull.
            type = 'Bool';
        }
        else if (schema.type === ast_1.Type.INTEGER) {
            type = 'Int';
        }
        else if (schema.type === ast_1.Type.NUMBER) {
            type = 'Decimal';
            isPointerType = true;
        }
        return defaultPropertyContext(client, schema, type, parentPath, isPointerType);
    }),
    generateArray: (client, schema, items, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        // Objective-C doesn't support NSArray's of primitives. Therefore, we
        // map booleans and integers to NSNumbers.
        const itemsType = items.type;
        return Object.assign(Object.assign({}, defaultPropertyContext(client, schema, `[${itemsType}]`, parentPath, true)), { importName: items.importName });
    }),
    generateObject: (client, schema, properties, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        const property = defaultPropertyContext(client, schema, '[String: Any]', parentPath, true);
        let object = undefined;
        if (properties.length > 0) {
            // If at least one property is set, generate a class that only allows the explicitly
            // allowed properties.
            const className = client.namer.register(schema.name, 'class', {
                transform: (name) => {
                    return `${lodash_1.upperFirst(lodash_1.camelCase(name))}`;
                },
            });
            property.type = `${className}`;
            property.importName = `"${className}.h"`;
            object = {
                name: className,
                imports: properties.filter(p => !!p.importName).map(p => p.importName),
            };
        }
        return { property, object };
    }),
    generateUnion: (client, schema, _, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        // TODO: support unions in iOS
        return defaultPropertyContext(client, schema, 'Any', parentPath, true);
    }),
    generateTrackCall: (client, schema) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            functionName: client.namer.register(schema.name, 'function->track', {
                transform: lodash_1.camelCase,
            }),
        });
    }),
    generateRoot: (client, context) => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all([
            client.generateFile('TypewriterAnalytics.swift', 'generators/swift/templates/analytics.swift.hbs', context),
            client.generateFile('TypewriterUtils.swift', 'generators/swift/templates/TypewriterUtils.swift.hbs', context),
            client.generateFile('TypewriterSerializable.swift', 'generators/swift/templates/TypewriterSerializable.swift.hbs', context),
            ...context.objects.map(o => client.generateFile(`${o.name}.swift`, 'generators/swift/templates/class.swift.hbs', o)),
        ]);
    }),
};
function defaultPropertyContext(client, schema, type, namespace, isPointerType) {
    return {
        name: client.namer.register(schema.name, namespace, {
            transform: lodash_1.camelCase,
        }),
        type,
        isVariableNullable: !schema.isRequired || !!schema.isNullable,
        isPayloadFieldNullable: !!schema.isNullable && !!schema.isRequired,
        isPointerType,
    };
}
// Handlebars partials
function generateFunctionSignature(functionName, properties, withOptions) {
    let signature = functionName;
    const parameters = [...properties];
    if (withOptions) {
        parameters.push({
            name: 'options',
            type: '[String: Any]',
            isPointerType: true,
            isVariableNullable: true,
        });
    }
    const withNullability = (property) => {
        const { type, isVariableNullable } = property;
        if (isVariableNullable) {
            return `${type}?`;
        }
        else {
            return `${type}`;
        }
    };
    signature += `(`;
    for (let index = 0; index < parameters.length; index++) {
        const parameter = parameters[index];
        signature += `${parameter.name}: ${withNullability(parameter)}`;
        if (index != parameters.length - 1) {
            signature += `, `;
        }
    }
    signature += `)`;
    return signature.trim();
}
function generateFunctionCall(caller, functionName, properties, extraParameterName, extraParameterValue) {
    let functionCall = functionName;
    const parameters = properties.map(p => ({
        name: p.name,
        value: p.name,
    }));
    if (extraParameterName && extraParameterValue) {
        parameters.push({
            name: extraParameterName,
            value: extraParameterValue,
        });
    }
    functionCall += `(`;
    for (let index = 0; index < parameters.length; index++) {
        const parameter = parameters[index];
        functionCall += `${parameter.name}: ${parameter.value}`;
        if (index != parameters.length - 1) {
            functionCall += `, `;
        }
    }
    functionCall += `)`;
    return `${caller}.${functionCall.trim()}`;
}
function generatePropertiesDictionary(properties, prefix) {
    const varOrLet = properties.length > 0 ? `var` : `let`;
    let out = varOrLet + ` properties = [String: Any]()\n`;
    for (const property of properties) {
        const name = prefix && prefix.length > 0 ? `${prefix}${property.name}` : property.name;
        const serializableName = property.schemaType === ast_1.Type.BOOLEAN
            ? name
            : property.schemaType === ast_1.Type.INTEGER
                ? name
                : property.schemaType === ast_1.Type.OBJECT && !property.type.includes('[String: Any]')
                    ? property.isVariableNullable
                        ? `${name}?.serializableDictionary()`
                        : `${name}.serializableDictionary()`
                    : property.schemaType === ast_1.Type.ARRAY
                        ? property.isVariableNullable
                            ? `${name}?.serializableArray()`
                            : `${name}.serializableArray()`
                        : name;
        let setter;
        if (property.isPointerType) {
            if (property.isPayloadFieldNullable) {
                // If the value is nil, we need to convert it from a primitive nil to NSNull (an object).
                setter = `properties["${property.rawName}"] = ${name} == nil ? NSNull() : ${serializableName}\n`;
            }
            else {
                setter = `properties["${property.rawName}"] = ${serializableName};\n`;
            }
        }
        else {
            setter = `properties["${property.rawName}"] = ${serializableName};\n`;
        }
        out += setter;
    }
    return out;
}
//# sourceMappingURL=swift.js.map