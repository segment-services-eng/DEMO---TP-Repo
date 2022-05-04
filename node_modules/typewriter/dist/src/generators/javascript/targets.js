"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toModule = exports.toTarget = void 0;
// Helpers for mapping typewriter configuration options for module/script
// targets to TypeScript's compiler enums.
const typescript_1 = require("typescript");
function toTarget(target) {
    if (!target) {
        return typescript_1.ScriptTarget.ESNext;
    }
    switch (target) {
        case 'ES3':
            return typescript_1.ScriptTarget.ES3;
        case 'ES5':
            return typescript_1.ScriptTarget.ES5;
        case 'ES2015':
            return typescript_1.ScriptTarget.ES2015;
        case 'ES2016':
            return typescript_1.ScriptTarget.ES2016;
        case 'ES2017':
            return typescript_1.ScriptTarget.ES2017;
        case 'ES2018':
            return typescript_1.ScriptTarget.ES2018;
        case 'ES2019':
            return typescript_1.ScriptTarget.ES2019;
        case 'ESNext':
            return typescript_1.ScriptTarget.ESNext;
        case 'Latest':
            return typescript_1.ScriptTarget.Latest;
        default:
            throw new Error(`Invalid scriptTarget: '${target}'`);
    }
}
exports.toTarget = toTarget;
function toModule(target) {
    if (!target) {
        return typescript_1.ModuleKind.ESNext;
    }
    switch (target) {
        case 'CommonJS':
            return typescript_1.ModuleKind.CommonJS;
        case 'AMD':
            return typescript_1.ModuleKind.AMD;
        case 'UMD':
            return typescript_1.ModuleKind.UMD;
        case 'System':
            return typescript_1.ModuleKind.System;
        case 'ES2015':
            return typescript_1.ModuleKind.ES2015;
        case 'ESNext':
            return typescript_1.ModuleKind.ESNext;
        default:
            throw new Error(`Invalid moduleTarget: '${target}'`);
    }
}
exports.toModule = toModule;
//# sourceMappingURL=targets.js.map