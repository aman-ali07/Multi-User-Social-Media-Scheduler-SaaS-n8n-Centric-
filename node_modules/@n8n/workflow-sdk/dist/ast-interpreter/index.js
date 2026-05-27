"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedMethod = exports.isAllowedSDKFunction = exports.ALLOWED_METHODS = exports.ALLOWED_SDK_FUNCTIONS = exports.parseSDKCode = exports.UnknownIdentifierError = exports.SecurityError = exports.UnsupportedNodeError = exports.InterpreterError = exports.interpretSDKCode = void 0;
var interpreter_1 = require("./interpreter");
Object.defineProperty(exports, "interpretSDKCode", { enumerable: true, get: function () { return interpreter_1.interpretSDKCode; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "InterpreterError", { enumerable: true, get: function () { return errors_1.InterpreterError; } });
Object.defineProperty(exports, "UnsupportedNodeError", { enumerable: true, get: function () { return errors_1.UnsupportedNodeError; } });
Object.defineProperty(exports, "SecurityError", { enumerable: true, get: function () { return errors_1.SecurityError; } });
Object.defineProperty(exports, "UnknownIdentifierError", { enumerable: true, get: function () { return errors_1.UnknownIdentifierError; } });
var parser_1 = require("./parser");
Object.defineProperty(exports, "parseSDKCode", { enumerable: true, get: function () { return parser_1.parseSDKCode; } });
var validators_1 = require("./validators");
Object.defineProperty(exports, "ALLOWED_SDK_FUNCTIONS", { enumerable: true, get: function () { return validators_1.ALLOWED_SDK_FUNCTIONS; } });
Object.defineProperty(exports, "ALLOWED_METHODS", { enumerable: true, get: function () { return validators_1.ALLOWED_METHODS; } });
Object.defineProperty(exports, "isAllowedSDKFunction", { enumerable: true, get: function () { return validators_1.isAllowedSDKFunction; } });
Object.defineProperty(exports, "isAllowedMethod", { enumerable: true, get: function () { return validators_1.isAllowedMethod; } });
//# sourceMappingURL=index.js.map