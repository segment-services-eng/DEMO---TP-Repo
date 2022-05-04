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
Object.defineProperty(exports, "__esModule", { value: true });
exports.android = void 0;
const lodash_1 = require("lodash");
const ast_1 = require("../ast");
exports.android = {
    generatePropertiesObject: true,
    namer: {
        // See: https://github.com/AnanthaRajuCprojects/Reserved-Key-Words-list-of-various-programming-languages/blob/master/Java%20Keywords%20List.md
        // prettier-ignore
        reservedWords: [
            "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const",
            "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float",
            "for", "goto", "if", "implement", "imports", "instanceof", "int", "interface", "long", "native",
            "new", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super",
            "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"
        ],
        quoteChar: '"',
        allowedIdentifierStartingChars: 'A-Za-z_',
        allowedIdentifierChars: 'A-Za-z0-9_',
    },
    generatePrimitive: (client, schema, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        let type = 'Object';
        if (schema.type === ast_1.Type.STRING) {
            type = 'String';
        }
        else if (schema.type === ast_1.Type.BOOLEAN) {
            type = 'Boolean';
        }
        else if (schema.type === ast_1.Type.INTEGER) {
            type = 'Long';
        }
        else if (schema.type === ast_1.Type.NUMBER) {
            type = 'Double';
        }
        return Object.assign({}, defaultPropertyContext(client, schema, type, parentPath));
    }),
    setup: () => __awaiter(void 0, void 0, void 0, function* () { return ({}); }),
    generateArray: (client, schema, items, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        return Object.assign(Object.assign({}, defaultPropertyContext(client, schema, `List<${items.type}>`, parentPath)), { isListType: true });
    }),
    generateObject: (client, schema, properties, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        const property = defaultPropertyContext(client, schema, 'Object', parentPath);
        let object;
        if (properties.length > 0) {
            const className = client.namer.register(schema.name, 'class', {
                transform: (name) => {
                    return lodash_1.upperFirst(lodash_1.camelCase(name));
                },
            });
            property.type = className;
            property.implementsSerializableProperties = true;
            object = {
                name: className,
            };
        }
        return { property, object };
    }),
    generateUnion: (client, schema, _, parentPath) => __awaiter(void 0, void 0, void 0, function* () {
        // TODO: support unions
        return defaultPropertyContext(client, schema, 'Object', parentPath);
    }),
    generateTrackCall: (client, schema, propertiesObject) => __awaiter(void 0, void 0, void 0, function* () {
        const { properties } = ast_1.getPropertiesSchema(schema);
        return {
            class: schema.name.replace(/\s/g, ''),
            functionName: client.namer.register(schema.name, 'function->track', {
                transform: lodash_1.camelCase,
            }),
            propsType: propertiesObject.type,
            propsParam: !!properties.length,
        };
    }),
    generateRoot: (client, context) => __awaiter(void 0, void 0, void 0, function* () {
        yield Promise.all([
            client.generateFile('TypewriterAnalytics.java', 'generators/android/templates/TypewriterAnalytics.java.hbs', context),
            client.generateFile('TypewriterUtils.java', 'generators/android/templates/TypewriterUtils.java.hbs', context),
            client.generateFile('SerializableProperties.java', 'generators/android/templates/SerializableProperties.java.hbs', context),
            ...context.objects.map(o => client.generateFile(`${o.name}.java`, 'generators/android/templates/class.java.hbs', o)),
        ]);
    }),
};
function defaultPropertyContext(client, schema, type, namespace) {
    return {
        name: client.namer.register(schema.name, namespace, {
            transform: lodash_1.camelCase,
        }),
        type,
        isVariableNullable: !schema.isRequired || !!schema.isNullable,
        shouldThrowRuntimeError: schema.isRequired && !schema.isNullable,
        isListType: false,
        implementsSerializableProperties: false,
    };
}
//# sourceMappingURL=android.js.map