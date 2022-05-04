"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfig = void 0;
const joi_1 = __importDefault(require("@hapi/joi"));
// Ignore Prettier here, since otherwise prettier adds quite a bit of spacing
// that makes this schema too long+verbose.
// prettier-ignore
/** Joi schema for performing validation on typewriter.yml files. */
const ConfigSchema = joi_1.default.object().required().keys({
    scripts: joi_1.default.object().optional().keys({
        token: joi_1.default.string().optional().min(1),
        after: joi_1.default.string().optional().min(1),
    }),
    client: joi_1.default.object().required().keys({
        sdk: joi_1.default.string().required().valid('analytics.js', 'analytics-node', 'analytics-android', 'analytics-ios'),
        language: joi_1.default.string().required().valid('javascript', 'typescript', 'java', 'swift', 'objective-c'),
    })
        .when('sdk', {
        is: joi_1.default.string().valid('analytics.js', 'analytics-node'),
        then: {
            language: joi_1.default.string().valid('javascript', 'typescript'),
            scriptTarget: joi_1.default.string().optional().valid('ES3', 'ES5', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ESNext', 'Latest'),
            moduleTarget: joi_1.default.string().optional().valid('CommonJS', 'AMD', 'UMD', 'System', 'ES2015', 'ESNext'),
        },
    })
        .when('sdk', {
        is: joi_1.default.string().valid('analytics-android'),
        then: { language: joi_1.default.string().valid('java') },
    })
        .when('sdk', {
        is: joi_1.default.string().valid('analytics-ios'),
        then: { language: joi_1.default.string().valid('swift', 'objective-c') },
    }),
    trackingPlans: joi_1.default.array().required().items(joi_1.default.object().keys({
        id: joi_1.default.string().required().min(1),
        workspaceSlug: joi_1.default.string().required().min(1),
        path: joi_1.default.string().required().min(1),
    })),
});
const validateConfig = (rawConfig) => {
    // Validate the provided configuration file using our Joi schema.
    const result = joi_1.default.validate(rawConfig, ConfigSchema, {
        abortEarly: false,
        convert: false,
    });
    if (!!result.error) {
        throw new Error(result.error.annotate());
    }
    // We can safely type cast the config, now that is has been validated.
    return rawConfig;
};
exports.validateConfig = validateConfig;
//# sourceMappingURL=schema.js.map