"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpRequestValidator = void 0;
const validation_helpers_1 = require("../../validation-helpers");
exports.httpRequestValidator = {
    id: 'core:http-request',
    name: 'HTTP Request Validator',
    nodeTypes: ['n8n-nodes-base.httpRequest'],
    priority: 50,
    validateNode(node, _graphNode, _ctx) {
        const issues = [];
        const params = node.config?.parameters;
        if (!params) {
            return issues;
        }
        const headerParams = params.headerParameters;
        if (headerParams?.parameters) {
            for (const header of headerParams.parameters) {
                const headerValueStr = typeof header.value === 'string' ? header.value : JSON.stringify(header.value);
                if (header.name &&
                    (0, validation_helpers_1.isSensitiveHeader)(header.name) &&
                    header.value &&
                    !(0, validation_helpers_1.containsExpression)(headerValueStr)) {
                    issues.push({
                        code: 'HARDCODED_CREDENTIALS',
                        message: `'${node.name}' has a hardcoded value for sensitive header "${header.name}". Should create credentials, setting genericAuthType to httpHeaderAuth or httpBearerAuth).`,
                        severity: 'warning',
                        nodeName: node.name,
                        parameterPath: `headerParameters.parameters[${header.name}]`,
                    });
                }
            }
        }
        const queryParams = params.queryParameters;
        if (queryParams?.parameters) {
            for (const param of queryParams.parameters) {
                const paramValueStr = typeof param.value === 'string' ? param.value : JSON.stringify(param.value);
                if (param.name &&
                    (0, validation_helpers_1.isCredentialFieldName)(param.name) &&
                    param.value &&
                    !(0, validation_helpers_1.containsExpression)(paramValueStr)) {
                    issues.push({
                        code: 'HARDCODED_CREDENTIALS',
                        message: `'${node.name}' has a hardcoded value for credential-like query parameter "${param.name}". Should create credentials, setting genericAuthType to httpQueryAuth).`,
                        severity: 'warning',
                        nodeName: node.name,
                        parameterPath: `queryParameters.parameters[${param.name}]`,
                    });
                }
            }
        }
        return issues;
    },
};
//# sourceMappingURL=http-request-validator.js.map