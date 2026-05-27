"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeString = escapeString;
exports.needsQuoting = needsQuoting;
exports.formatKey = formatKey;
exports.escapeRegexChars = escapeRegexChars;
exports.isPlaceholderValue = isPlaceholderValue;
exports.extractPlaceholderHint = extractPlaceholderHint;
function escapeString(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\u2018/g, '\\u2018')
        .replace(/\u2019/g, '\\u2019')
        .replace(/\u201C/g, '\\u201C')
        .replace(/\u201D/g, '\\u201D')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}
function needsQuoting(key) {
    return !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
}
function formatKey(key) {
    return needsQuoting(key) ? `'${escapeString(key)}'` : key;
}
function escapeRegexChars(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function isPlaceholderValue(value) {
    if (typeof value !== 'string')
        return false;
    return value.startsWith('<__PLACEHOLDER_VALUE__') && value.endsWith('__>');
}
function extractPlaceholderHint(value) {
    const match = value.match(/^<__PLACEHOLDER_VALUE__(.*)__>$/);
    return match ? match[1] : '';
}
//# sourceMappingURL=string-utils.js.map