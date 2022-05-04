"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.getPropertiesSchema = exports.Type = void 0;
// Type is a standardization of the various JSON Schema types. It removes the concept
// of a "null" type, and introduces Unions and an explicit Any type. The Any type is
// part of the JSON Schema spec, but it isn't an explicit type.
var Type;
(function (Type) {
    Type[Type["ANY"] = 0] = "ANY";
    Type[Type["STRING"] = 1] = "STRING";
    Type[Type["BOOLEAN"] = 2] = "BOOLEAN";
    Type[Type["INTEGER"] = 3] = "INTEGER";
    Type[Type["NUMBER"] = 4] = "NUMBER";
    Type[Type["OBJECT"] = 5] = "OBJECT";
    Type[Type["ARRAY"] = 6] = "ARRAY";
    Type[Type["UNION"] = 7] = "UNION";
})(Type = exports.Type || (exports.Type = {}));
function toType(t) {
    switch (t) {
        case 'string':
            return Type.STRING;
        case 'integer':
            return Type.INTEGER;
        case 'number':
            return Type.NUMBER;
        case 'boolean':
            return Type.BOOLEAN;
        case 'object':
            return Type.OBJECT;
        case 'array':
            return Type.ARRAY;
        case 'null':
            return Type.ANY;
        default:
            throw new Error(`Unsupported type: ${t}`);
    }
}
// getPropertiesSchema extracts the Schema for `.properties` from an
// event schema.
function getPropertiesSchema(event) {
    let properties = undefined;
    // Events should always be a type="object" at the root, anything
    // else would not match on a Segment analytics event.
    if (event.type === Type.OBJECT) {
        const propertiesSchema = event.properties.find((schema) => schema.name === 'properties');
        // The schema representing `.properties` in the Segement analytics
        // event should also always be an object.
        if (propertiesSchema && propertiesSchema.type === Type.OBJECT) {
            properties = propertiesSchema;
        }
    }
    return Object.assign(Object.assign({ 
        // If `.properties` doesn't exist in the user-supplied JSON Schema,
        // default to an empty object schema as a sane default.
        type: Type.OBJECT, properties: [] }, (properties || {})), { isRequired: properties ? !!properties.isRequired : false, isNullable: false, 
        // Use the event's name and description when generating an interface
        // to represent these properties.
        name: event.name, description: event.description });
}
exports.getPropertiesSchema = getPropertiesSchema;
// parse transforms a JSON Schema into a standardized Schema.
function parse(raw, name, isRequired) {
    // TODO: validate that the raw JSON Schema is a valid JSON Schema before attempting to parse it.
    // Parse the relevant fields from the JSON Schema based on the type.
    const typeSpecificFields = parseTypeSpecificFields(raw, getType(raw));
    const schema = Object.assign({ name: name || raw.title || '' }, typeSpecificFields);
    if (raw.description) {
        schema.description = raw.description;
    }
    if (isRequired) {
        schema.isRequired = true;
    }
    if (isNullable(raw)) {
        schema.isNullable = true;
    }
    return schema;
}
exports.parse = parse;
// parseTypeSpecificFields extracts the relevant fields from the raw JSON Schema,
// interpreting the schema based on the provided Type.
function parseTypeSpecificFields(raw, type) {
    if (type === Type.OBJECT) {
        const fields = { type, properties: [] };
        const requiredFields = new Set(raw.required || []);
        for (const entry of Object.entries(raw.properties || {})) {
            const [property, propertySchema] = entry;
            if (typeof propertySchema !== 'boolean') {
                const isRequired = requiredFields.has(property);
                fields.properties.push(parse(propertySchema, property, isRequired));
            }
        }
        return fields;
    }
    else if (type === Type.ARRAY) {
        const fields = { type, items: { type: Type.ANY } };
        if (typeof raw.items !== 'boolean' && raw.items !== undefined) {
            // `items` can be a single schemas, or an array of schemas, so standardize on an array.
            const definitions = raw.items instanceof Array ? raw.items : [raw.items];
            // Convert from JSONSchema7Definition -> JSONSchema7
            const schemas = definitions.filter(def => typeof def !== 'boolean');
            if (schemas.length === 1) {
                const schema = schemas[0];
                fields.items = parseTypeSpecificFields(schema, getType(schema));
            }
            else if (schemas.length > 1) {
                fields.items = {
                    type: Type.UNION,
                    types: schemas.map(schema => parseTypeSpecificFields(schema, getType(schema))),
                };
            }
        }
        return fields;
    }
    else if (type === Type.UNION) {
        const fields = { type, types: [] };
        for (const val of getRawTypes(raw).values()) {
            // For codegen purposes, we don't consider "null" as a type, so remove it.
            if (val === 'null') {
                continue;
            }
            fields.types.push(parseTypeSpecificFields(raw, toType(val)));
        }
        if (raw.enum) {
            fields.enum = getEnum(raw);
        }
        return fields;
    }
    else {
        const fields = { type };
        // TODO: Per above comment, consider filtering the enum values to just the matching type (string, boolean, etc.).
        if (raw.enum) {
            fields.enum = getEnum(raw);
        }
        // Handle the special case of `type: "null"`. In this case, only the value "null"
        // is allowed, so treat this as a single-value enum.
        const rawTypes = getRawTypes(raw);
        if (rawTypes.has('null') && rawTypes.size === 1) {
            fields.enum = [null];
        }
        return fields;
    }
}
// getRawTypes returns the types for a given raw JSON Schema. These correspond
// with the standard JSON Schema types (null, string, etc.)
function getRawTypes(raw) {
    // JSON Schema's `type` field is either an array or a string -- standardize it into an array.
    const rawTypes = new Set();
    if (typeof raw.type === 'string') {
        rawTypes.add(raw.type);
    }
    else if (raw.type instanceof Array) {
        raw.type.forEach(t => rawTypes.add(t));
    }
    return rawTypes;
}
// getType parses the raw types from a JSON Schema and returns the standardized Type.
function getType(raw) {
    const rawTypes = getRawTypes(raw);
    // For codegen purposes, we don't consider "null" as a type, so remove it.
    rawTypes.delete('null');
    let type = Type.ANY;
    if (rawTypes.size === 1) {
        type = toType(rawTypes.values().next().value);
    }
    else if (rawTypes.size >= 1) {
        type = Type.UNION;
    }
    return type;
}
// isNullable returns true if `null` is a valid value for this JSON Schema.
function isNullable(raw) {
    const typeAllowsNull = getRawTypes(raw).has('null') || getType(raw) === Type.ANY;
    const enumAllowsNull = !raw.enum || raw.enum.includes(null) || raw.enum.includes('null');
    return typeAllowsNull && enumAllowsNull;
}
// getEnum parses the enum, if specified
function getEnum(raw) {
    if (!raw.enum) {
        return undefined;
    }
    const enm = raw.enum.filter(val => ['boolean', 'number', 'string'].includes(typeof val) || val === null);
    return enm;
}
//# sourceMappingURL=ast.js.map