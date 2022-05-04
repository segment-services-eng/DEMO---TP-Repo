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
exports.objc = void 0;
const lodash_1 = require("lodash");
const ast_1 = require("../ast");
const Handlebars = __importStar(require("handlebars"));
exports.objc = {
    generatePropertiesObject: false,
    namer: {
        // See: https://github.com/AnanthaRajuCprojects/Reserved-Key-Words-list-of-various-programming-languages/blob/master/Objective-C%20Reserved%20Words.md
        // prettier-ignore
        reservedWords: [
            'asm', 'atomic', 'auto', 'bool', 'break', 'bycopy', 'byref', 'case', 'catch', 'char',
            'class', 'const', 'continue', 'copy', 'debugDescription', 'default', 'description',
            'do', 'double', 'dynamic', 'else', 'end', 'enum', 'extern', 'false', 'finally', 'float',
            'for', 'goto', 'hash', 'id', 'if', 'imp', 'implementation', 'in', 'init', 'inline',
            'inout', 'int', 'interface', 'long', 'mutableCopy', 'new', 'nil', 'no', 'nonatomic',
            'null', 'nullable', 'nonnull', 'oneway', 'options', 'out', 'private', 'property', 'protected',
            'protocol', 'public', 'register', 'restrict', 'retain', 'return', 'sel', 'selector', 'self',
            'short', 'signed', 'sizeof', 'static', 'struct', 'super', 'superclass', 'switch', 'synthesize',
            'throw', 'true', 'try', 'typedef', 'typeof', 'union', 'unsigned', 'void', 'volatile', 'while',
            'yes'
        ],
        quoteChar: '"',
        allowedIdentifierStartingChars: 'A-Za-z_$',
        allowedIdentifierChars: 'A-Za-z0-9_$',
    },
    setup: () => __awaiter(void 0, void 0, void 0, function* () {
        Handlebars.registerHelper('propertiesDictionary', generatePropertiesDictionary);
        Handlebars.registerHelper('functionCall', generateFunctionCall);
        Handlebars.registerHelper('functionSignature', generateFunctionSignature);
        Handlebars.registerHelper('variableSeparator', variableSeparator);
        return {};
    }),
    generatePrimitive: (client, schema, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        let type = 'id';
        let isPointerType = !schema.isRequired || !!schema.isNullable;
        if (schema.type === ast_1.Type.STRING) {
            type = 'NSString *';
            isPointerType = true;
        }
        else if (schema.type === ast_1.Type.BOOLEAN) {
            // BOOLs cannot nullable in Objective-C. Instead, use an NSNumber which can be
            // initialized like a boolean like so: [NSNumber numberWithBool:YES]
            // This is what is done behind the scenes by typewriter if this boolean is nonnull.
            type = isPointerType ? 'NSNumber *' : 'BOOL';
        }
        else if (schema.type === ast_1.Type.INTEGER) {
            type = isPointerType ? 'NSNumber *' : 'NSInteger';
        }
        else if (schema.type === ast_1.Type.NUMBER) {
            type = 'NSNumber *';
            isPointerType = true;
        }
        return defaultPropertyContext(client, schema, type, parentPath, isPointerType);
    }),
    generateArray: (client, schema, items, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        // Objective-C doesn't support NSArray's of primitives. Therefore, we
        // map booleans and integers to NSNumbers.
        const itemsType = [ast_1.Type.BOOLEAN, ast_1.Type.INTEGER].includes(items.schemaType)
            ? 'NSNumber *'
            : items.type;
        return Object.assign(Object.assign({}, defaultPropertyContext(client, schema, `NSArray<${itemsType}> *`, parentPath, true)), { importName: items.importName });
    }),
    generateObject: (client, schema, properties, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        const property = defaultPropertyContext(client, schema, 'SERIALIZABLE_DICT', parentPath, true);
        let object = undefined;
        if (properties.length > 0) {
            // If at least one property is set, generate a class that only allows the explicitly
            // allowed properties.
            const className = client.namer.register(schema.name, 'class', {
                transform: (name) => {
                    return `SEG${lodash_1.upperFirst(lodash_1.camelCase(name))}`;
                },
            });
            property.type = `${className} *`;
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
        return defaultPropertyContext(client, schema, 'id', parentPath, true);
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
            client.generateFile('SEGTypewriterAnalytics.h', 'generators/objc/templates/analytics.h.hbs', context),
            client.generateFile('SEGTypewriterAnalytics.m', 'generators/objc/templates/analytics.m.hbs', context),
            client.generateFile('SEGTypewriterUtils.h', 'generators/objc/templates/SEGTypewriterUtils.h.hbs', context),
            client.generateFile('SEGTypewriterUtils.m', 'generators/objc/templates/SEGTypewriterUtils.m.hbs', context),
            client.generateFile('SEGTypewriterSerializable.h', 'generators/objc/templates/SEGTypewriterSerializable.h.hbs', context),
            ...context.objects.map(o => client.generateFile(`${o.name}.h`, 'generators/objc/templates/class.h.hbs', o)),
            ...context.objects.map(o => client.generateFile(`${o.name}.m`, 'generators/objc/templates/class.m.hbs', o)),
        ]);
    }),
};
function defaultPropertyContext(client, schema, type, namespace, isPointerType) {
    return {
        name: client.namer.register(schema.name, namespace, {
            transform: lodash_1.camelCase,
        }),
        type,
        modifiers: isPointerType
            ? schema.isRequired
                ? 'strong, nonatomic, nonnull'
                : 'strong, nonatomic, nullable'
            : 'nonatomic',
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
            type: 'SERIALIZABLE_DICT',
            isPointerType: true,
            isVariableNullable: true,
        });
    }
    const withNullability = (property) => {
        const { isPointerType, type, isVariableNullable } = property;
        return isPointerType ? `${isVariableNullable ? 'nullable' : 'nonnull'} ${type}` : type;
    };
    // Mutate the function name to match standard Objective-C naming standards (FooBar vs. FooBarWithSparkles:sparkles).
    if (parameters.length > 0) {
        const first = parameters[0];
        signature += `With${lodash_1.upperFirst(first.name)}:(${withNullability(first)})${first.name}\n`;
    }
    for (const parameter of parameters.slice(1)) {
        signature += `${parameter.name}:(${withNullability(parameter)})${parameter.name}\n`;
    }
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
    if (parameters.length > 0) {
        const { name, value } = parameters[0];
        functionCall += `With${lodash_1.upperFirst(name)}:${value}`;
    }
    for (const { name, value } of parameters.slice(1)) {
        functionCall += ` ${name}:${value}`;
    }
    return `[${caller} ${functionCall.trim()}];`;
}
function generatePropertiesDictionary(properties, prefix) {
    let out = 'NSMutableDictionary *properties = [[NSMutableDictionary alloc] init];\n';
    for (const property of properties) {
        const name = prefix && prefix.length > 0 ? `${prefix}${property.name}` : property.name;
        const serializableName = property.schemaType === ast_1.Type.BOOLEAN
            ? property.isPointerType
                ? name
                : `[NSNumber numberWithBool:${name}]`
            : property.schemaType === ast_1.Type.INTEGER
                ? property.isPointerType
                    ? name
                    : `[NSNumber numberWithInteger:${name}]`
                : property.schemaType === ast_1.Type.OBJECT && !property.type.includes('SERIALIZABLE_DICT')
                    ? `[${name} toDictionary]`
                    : property.schemaType === ast_1.Type.ARRAY
                        ? `[SEGTypewriterUtils toSerializableArray:${name}]`
                        : name;
        let setter;
        if (property.isPointerType) {
            if (property.isPayloadFieldNullable) {
                // If the value is nil, we need to convert it from a primitive nil to NSNull (an object).
                setter = `properties[@"${property.rawName}"] = ${name} == nil ? [NSNull null] : ${serializableName};\n`;
            }
            else {
                // If the property is not nullable, but is a pointer, then we need to guard on nil
                // values. In that case, we don't set any value to the field.
                // TODO: do we need these guards if we've already set a field as nonnull? TBD
                setter = `if (${name} != nil) {\n  properties[@"${property.rawName}"] = ${serializableName};\n}\n`;
            }
        }
        else {
            setter = `properties[@"${property.rawName}"] = ${serializableName};\n`;
        }
        out += setter;
    }
    return out;
}
// Render `NSString *foo` not `NSString * foo` and `BOOL foo` not `BOOLfoo` or `BOOL  foo` by doing:
// `{{type}}{{variableSeparator type}}{{name}}`
function variableSeparator(type) {
    return type.endsWith('*') ? '' : ' ';
}
//# sourceMappingURL=objc.js.map