"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpretSDKCode = interpretSDKCode;
const errors_1 = require("./errors");
const parser_1 = require("./parser");
const validators_1 = require("./validators");
class SDKInterpreter {
    constructor(sdkFunctions, sourceCode) {
        this.renamedVariables = new Map();
        this.evalDepth = 0;
        this.sdkFunctions = new Map(Object.entries(sdkFunctions));
        this.variables = new Map();
        this.sourceCode = sourceCode;
    }
    generateSafeName(name) {
        const base = 'my' + name.charAt(0).toUpperCase() + name.slice(1);
        let candidate = base;
        let counter = 1;
        while (this.variables.has(candidate) || this.sdkFunctions.has(candidate)) {
            candidate = `${base}${counter}`;
            counter++;
        }
        return candidate;
    }
    interpret(ast) {
        let result;
        for (const stmt of ast.body) {
            (0, validators_1.validateNodeType)(stmt, this.sourceCode);
            switch (stmt.type) {
                case 'VariableDeclaration':
                    this.visitVariableDeclaration(stmt);
                    break;
                case 'ExpressionStatement':
                    result = this.evaluate(stmt.expression);
                    break;
                case 'ExportDefaultDeclaration':
                    return this.evaluate(stmt.declaration);
                default:
                    throw new errors_1.UnsupportedNodeError(stmt.type, stmt.loc ?? undefined, this.sourceCode);
            }
        }
        return result;
    }
    visitVariableDeclaration(node) {
        if (node.kind !== 'const') {
            throw new errors_1.SecurityError(`'${node.kind}' declarations are not allowed. Use 'const' only.`, node.loc ?? undefined, this.sourceCode);
        }
        for (const declarator of node.declarations) {
            if (declarator.id.type !== 'Identifier') {
                throw new errors_1.UnsupportedNodeError('Destructuring in variable declaration', declarator.loc ?? undefined, this.sourceCode);
            }
            const name = declarator.id.name;
            if ((0, validators_1.isAllowedSDKFunction)(name)) {
                if ((0, validators_1.isAutoRenameableSDKFunction)(name)) {
                    const safeName = this.generateSafeName(name);
                    const value = declarator.init ? this.evaluate(declarator.init) : undefined;
                    this.renamedVariables.set(name, safeName);
                    this.variables.set(safeName, value);
                    continue;
                }
                throw new errors_1.SecurityError(`'${name}' is a reserved SDK function name and cannot be used as a variable name. ` +
                    `Use a different name like 'my${name.charAt(0).toUpperCase() + name.slice(1)}'.`, declarator.loc ?? undefined, this.sourceCode);
            }
            const value = declarator.init ? this.evaluate(declarator.init) : undefined;
            this.variables.set(name, value);
        }
    }
    evaluate(node) {
        if (node === null)
            return undefined;
        if (this.evalDepth >= SDKInterpreter.MAX_EVAL_DEPTH) {
            throw new errors_1.InterpreterError('Expression nesting too deep (possible cycle in method chain)', node.loc ?? undefined, this.sourceCode);
        }
        this.evalDepth++;
        try {
            return this.evaluateNode(node);
        }
        finally {
            this.evalDepth--;
        }
    }
    evaluateNode(node) {
        (0, validators_1.validateNodeType)(node, this.sourceCode);
        switch (node.type) {
            case 'CallExpression':
                return this.visitCallExpression(node);
            case 'MemberExpression':
                return this.visitMemberExpression(node);
            case 'ObjectExpression':
                return this.visitObjectExpression(node);
            case 'ArrayExpression':
                return this.visitArrayExpression(node);
            case 'Identifier':
                return this.visitIdentifier(node);
            case 'Literal':
                return node.value;
            case 'TemplateLiteral':
                return this.visitTemplateLiteral(node);
            case 'SpreadElement':
                return this.visitSpreadElement(node);
            case 'UnaryExpression':
                return this.visitUnaryExpression(node);
            case 'BinaryExpression':
                return this.visitBinaryExpression(node);
            case 'LogicalExpression':
                return this.visitLogicalExpression(node);
            case 'ConditionalExpression':
                return this.visitConditionalExpression(node);
            case 'AssignmentExpression':
                return this.visitAssignmentExpression(node);
            default:
                throw new errors_1.UnsupportedNodeError(node.type, node.loc ?? undefined, this.sourceCode);
        }
    }
    visitCallExpression(node) {
        (0, validators_1.validateCallExpression)(node, this.sourceCode);
        let func;
        let thisArg;
        if (node.callee.type === 'Identifier') {
            const name = node.callee.name;
            if (this.sdkFunctions.has(name)) {
                func = this.sdkFunctions.get(name);
            }
            else {
                const resolvedName = this.renamedVariables.get(name) ?? name;
                if (this.variables.has(resolvedName)) {
                    func = this.variables.get(resolvedName);
                }
                else {
                    throw new errors_1.UnknownIdentifierError(name, node.callee.loc ?? undefined, this.sourceCode);
                }
            }
        }
        else if (node.callee.type === 'MemberExpression') {
            const memberExpr = node.callee;
            (0, validators_1.validateMemberExpression)(memberExpr, this.sourceCode);
            if (memberExpr.object.type === 'Super') {
                throw new errors_1.UnsupportedNodeError('super keyword is not supported in SDK code', memberExpr.object.loc ?? undefined, this.sourceCode);
            }
            let methodName;
            if (memberExpr.property.type === 'Identifier') {
                methodName = memberExpr.property.name;
            }
            else if (memberExpr.property.type === 'Literal' &&
                typeof memberExpr.property.value === 'string') {
                methodName = memberExpr.property.value;
            }
            else {
                throw new errors_1.UnsupportedNodeError('Dynamic method name', memberExpr.property.loc ?? undefined, this.sourceCode);
            }
            if (memberExpr.object.type === 'Identifier') {
                const safeMethod = (0, validators_1.getSafeJSONMethod)(memberExpr.object.name, methodName);
                if (safeMethod) {
                    const args = node.arguments.map((arg) => this.evaluate(arg));
                    return safeMethod(...args);
                }
            }
            thisArg = this.evaluate(memberExpr.object);
            const safeStringMethod = (0, validators_1.getSafeStringMethod)(thisArg, methodName);
            if (safeStringMethod) {
                const args = node.arguments.map((arg) => this.evaluate(arg));
                return safeStringMethod(...args);
            }
            if (!(0, validators_1.isAllowedMethod)(methodName)) {
                throw new errors_1.SecurityError(`Method '${methodName}' is not an allowed SDK method`, memberExpr.property.loc ?? undefined, this.sourceCode);
            }
            if (thisArg && typeof thisArg === 'object') {
                func = thisArg[methodName];
            }
        }
        else {
            throw new errors_1.UnsupportedNodeError(`Callee type ${node.callee.type}`, node.callee.loc ?? undefined, this.sourceCode);
        }
        if (typeof func !== 'function') {
            throw new errors_1.InterpreterError('Cannot call non-function', node.loc ?? undefined, this.sourceCode);
        }
        const args = node.arguments.map((arg) => this.evaluate(arg));
        return func.apply(thisArg, args);
    }
    visitMemberExpression(node) {
        (0, validators_1.validateMemberExpression)(node, this.sourceCode);
        if (node.object.type === 'Super') {
            throw new errors_1.UnsupportedNodeError('super keyword is not supported in SDK code', node.object.loc ?? undefined, this.sourceCode);
        }
        const obj = this.evaluate(node.object);
        if (obj === null || obj === undefined) {
            throw new errors_1.InterpreterError(`Cannot access property on ${obj}`, node.loc ?? undefined, this.sourceCode);
        }
        let propName;
        if (node.property.type === 'Identifier' && !node.computed) {
            propName = node.property.name;
        }
        else if (node.property.type === 'Literal') {
            propName = node.property.value;
        }
        else {
            throw new errors_1.UnsupportedNodeError('Dynamic property access', node.property.loc ?? undefined, this.sourceCode);
        }
        return obj[propName];
    }
    visitObjectExpression(node) {
        const result = {};
        for (const prop of node.properties) {
            if (prop.type === 'SpreadElement') {
                const spreadValue = this.evaluate(prop.argument);
                if (spreadValue && typeof spreadValue === 'object') {
                    Object.assign(result, spreadValue);
                }
            }
            else if (prop.type === 'Property') {
                let key;
                if (prop.key.type === 'Identifier') {
                    key = prop.key.name;
                }
                else if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') {
                    key = prop.key.value;
                }
                else if (prop.key.type === 'Literal' && typeof prop.key.value === 'number') {
                    key = String(prop.key.value);
                }
                else {
                    throw new errors_1.UnsupportedNodeError(`Object key type ${prop.key.type}`, prop.key.loc ?? undefined, this.sourceCode);
                }
                const value = this.evaluate(prop.value);
                result[key] = value;
            }
        }
        return result;
    }
    visitArrayExpression(node) {
        const result = [];
        for (const element of node.elements) {
            if (element === null) {
                result.push(undefined);
            }
            else if (element.type === 'SpreadElement') {
                const spreadValue = this.evaluate(element.argument);
                if (Array.isArray(spreadValue)) {
                    for (const item of spreadValue) {
                        result.push(item);
                    }
                }
            }
            else {
                result.push(this.evaluate(element));
            }
        }
        return result;
    }
    visitIdentifier(node) {
        const name = node.name;
        (0, validators_1.validateIdentifier)(name, this.getVariableNames(), node, this.sourceCode);
        const resolvedName = this.renamedVariables.get(name) ?? name;
        if (this.variables.has(resolvedName)) {
            return this.variables.get(resolvedName);
        }
        if (this.sdkFunctions.has(name)) {
            return this.sdkFunctions.get(name);
        }
        if (name === 'undefined')
            return undefined;
        if (name === 'null')
            return null;
        if (name === 'true')
            return true;
        if (name === 'false')
            return false;
        if (name === 'NaN')
            return NaN;
        if (name === 'Infinity')
            return Infinity;
        throw new errors_1.UnknownIdentifierError(name, node.loc ?? undefined, this.sourceCode);
    }
    visitTemplateLiteral(node) {
        let result = '';
        for (let i = 0; i < node.quasis.length; i++) {
            const quasi = node.quasis[i];
            result += quasi.value.cooked ?? quasi.value.raw;
            if (i < node.expressions.length) {
                const expr = node.expressions[i];
                const value = this.evaluateTemplateExpression(expr);
                result += value;
            }
        }
        return result;
    }
    evaluateTemplateExpression(expr) {
        if (this.isN8nRuntimeVariable(expr)) {
            return '${' + this.expressionToString(expr) + '}';
        }
        const value = this.evaluate(expr);
        return String(value);
    }
    isN8nRuntimeVariable(expr) {
        if (expr.type === 'Identifier') {
            return expr.name.startsWith('$');
        }
        if (expr.type === 'MemberExpression') {
            return this.isN8nRuntimeVariable(expr.object);
        }
        if (expr.type === 'CallExpression') {
            if (expr.callee.type === 'Identifier') {
                return expr.callee.name.startsWith('$');
            }
            if (expr.callee.type === 'MemberExpression') {
                return this.isN8nRuntimeVariable(expr.callee.object);
            }
        }
        return false;
    }
    expressionToString(expr) {
        if (expr.type === 'Identifier') {
            return expr.name;
        }
        if (expr.type === 'MemberExpression') {
            const obj = this.expressionToString(expr.object);
            if (expr.computed) {
                if (expr.property.type === 'Literal') {
                    return `${obj}[${JSON.stringify(expr.property.value)}]`;
                }
                return `${obj}[${this.expressionToString(expr.property)}]`;
            }
            const prop = expr.property.type === 'Identifier' ? expr.property.name : '';
            return `${obj}.${prop}`;
        }
        if (expr.type === 'CallExpression') {
            const callee = this.expressionToString(expr.callee);
            const args = expr.arguments
                .map((arg) => {
                if (arg.type === 'SpreadElement') {
                    return '...' + this.expressionToString(arg.argument);
                }
                return this.expressionToString(arg);
            })
                .join(', ');
            return `${callee}(${args})`;
        }
        if (expr.type === 'Literal') {
            if (typeof expr.value === 'string') {
                return JSON.stringify(expr.value);
            }
            return String(expr.value);
        }
        if (expr.type === 'BinaryExpression' || expr.type === 'LogicalExpression') {
            const left = this.expressionToString(expr.left);
            const right = this.expressionToString(expr.right);
            return `${left} ${expr.operator} ${right}`;
        }
        if (expr.type === 'ConditionalExpression') {
            const test = this.expressionToString(expr.test);
            const consequent = this.expressionToString(expr.consequent);
            const alternate = this.expressionToString(expr.alternate);
            return `${test} ? ${consequent} : ${alternate}`;
        }
        if (expr.type === 'UnaryExpression') {
            const unary = expr;
            const arg = this.expressionToString(unary.argument);
            return unary.prefix ? `${unary.operator}${arg}` : `${arg}${unary.operator}`;
        }
        if (expr.loc && this.sourceCode) {
            const lines = this.sourceCode.split('\n');
            const startLine = expr.loc.start.line - 1;
            const endLine = expr.loc.end.line - 1;
            if (startLine === endLine) {
                return lines[startLine].slice(expr.loc.start.column, expr.loc.end.column);
            }
        }
        return '';
    }
    visitSpreadElement(node) {
        return this.evaluate(node.argument);
    }
    visitUnaryExpression(node) {
        const arg = this.evaluate(node.argument);
        switch (node.operator) {
            case '-':
                return -arg;
            case '+':
                return +arg;
            case '!':
                return !arg;
            case 'typeof':
                return typeof arg;
            case 'void':
                return undefined;
            default:
                throw new errors_1.UnsupportedNodeError(`Unary operator ${node.operator}`, node.loc ?? undefined, this.sourceCode);
        }
    }
    visitBinaryExpression(node) {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        switch (node.operator) {
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    return String(left) + String(right);
                }
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return left / right;
            case '%':
                return left % right;
            case '**':
                return left ** right;
            case '==':
                return left == right;
            case '!=':
                return left != right;
            case '===':
                return left === right;
            case '!==':
                return left !== right;
            case '<':
                return left < right;
            case '<=':
                return left <= right;
            case '>':
                return left > right;
            case '>=':
                return left >= right;
            default:
                throw new errors_1.UnsupportedNodeError(`Binary operator ${node.operator}`, node.loc ?? undefined, this.sourceCode);
        }
    }
    visitLogicalExpression(node) {
        const left = this.evaluate(node.left);
        switch (node.operator) {
            case '&&':
                return left ? this.evaluate(node.right) : left;
            case '||':
                return left ? left : this.evaluate(node.right);
            case '??':
                return left ?? this.evaluate(node.right);
            default:
                throw new errors_1.UnsupportedNodeError(`Logical operator ${String(node.operator)}`, node.loc ?? undefined, this.sourceCode);
        }
    }
    visitConditionalExpression(node) {
        const test = this.evaluate(node.test);
        return test ? this.evaluate(node.consequent) : this.evaluate(node.alternate);
    }
    visitAssignmentExpression(node) {
        if (node.operator !== '=') {
            throw new errors_1.UnsupportedNodeError(`Assignment operator '${node.operator}' is not allowed. Only '=' is permitted.`, node.loc ?? undefined, this.sourceCode);
        }
        if (node.left.type !== 'MemberExpression') {
            throw new errors_1.UnsupportedNodeError('Only property assignment (e.g., obj.prop = value) is allowed. Variable reassignment is not permitted.', node.loc ?? undefined, this.sourceCode);
        }
        (0, validators_1.validateMemberExpression)(node.left, this.sourceCode);
        if (node.left.object.type === 'Super') {
            throw new errors_1.UnsupportedNodeError('super keyword is not supported in SDK code', node.left.object.loc ?? undefined, this.sourceCode);
        }
        const obj = this.evaluate(node.left.object);
        if (obj === null || obj === undefined) {
            throw new errors_1.InterpreterError(`Cannot assign property on ${String(obj)}`, node.loc ?? undefined, this.sourceCode);
        }
        let propName;
        if (node.left.property.type === 'Identifier' && !node.left.computed) {
            propName = node.left.property.name;
        }
        else if (node.left.property.type === 'Literal') {
            propName = node.left.property.value;
        }
        else {
            throw new errors_1.UnsupportedNodeError('Dynamic property assignment', node.left.property.loc ?? undefined, this.sourceCode);
        }
        const value = this.evaluate(node.right);
        obj[propName] = value;
        return value;
    }
    getVariableNames() {
        return new Set(this.variables.keys());
    }
}
SDKInterpreter.MAX_EVAL_DEPTH = 500;
function interpretSDKCode(code, sdkFunctions) {
    const ast = (0, parser_1.parseSDKCode)(code);
    const interpreter = new SDKInterpreter(sdkFunctions, code);
    return interpreter.interpret(ast);
}
//# sourceMappingURL=interpreter.js.map