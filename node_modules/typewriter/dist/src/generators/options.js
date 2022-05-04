"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Language = exports.SDK = void 0;
// Which Segment SDK to generate for.
var SDK;
(function (SDK) {
    SDK["WEB"] = "analytics.js";
    SDK["NODE"] = "analytics-node";
    SDK["IOS"] = "analytics-ios";
    SDK["ANDROID"] = "analytics-android";
})(SDK = exports.SDK || (exports.SDK = {}));
// Which language to generate clients for.
var Language;
(function (Language) {
    Language["JAVASCRIPT"] = "javascript";
    Language["TYPESCRIPT"] = "typescript";
    Language["OBJECTIVE_C"] = "objective-c";
    Language["SWIFT"] = "swift";
    Language["JAVA"] = "java";
})(Language = exports.Language || (exports.Language = {}));
//# sourceMappingURL=options.js.map