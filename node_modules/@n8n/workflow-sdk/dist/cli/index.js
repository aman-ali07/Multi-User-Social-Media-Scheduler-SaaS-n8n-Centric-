#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_to_json_1 = require("./code-to-json");
const json_to_code_1 = require("./json-to-code");
const [command, filePath] = process.argv.slice(2);
if (command === 'json-to-code') {
    (0, json_to_code_1.jsonToCode)(filePath);
}
else if (command === 'code-to-json') {
    (0, code_to_json_1.codeToJson)(filePath);
}
else {
    console.error('Usage: workflow-sdk <json-to-code|code-to-json> <file-path>');
    console.error('');
    console.error('Commands:');
    console.error('  json-to-code  Convert workflow JSON to SDK TypeScript code');
    console.error('  code-to-json  Convert SDK TypeScript code to workflow JSON');
    console.error('');
    console.error('Examples:');
    console.error('  pnpm json-to-code ./workflow.json');
    console.error('  pnpm code-to-json ./workflow.ts');
    process.exit(1);
}
//# sourceMappingURL=index.js.map