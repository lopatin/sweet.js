import * as T from "./terms";

import {
    FunctionDeclTransform,
    VariableDeclTransform,
    LetDeclTransform,
    ConstDeclTransform,
    SyntaxDeclTransform,
    SyntaxQuoteTransform,
    ReturnStatementTransform,
    CompiletimeTransform
} from "./transforms";
import { List } from "immutable";
import { expect, assert } from "./errors";
import {
    isOperator,
    getOperatorAssoc,
    getOperatorPrec,
    operatorLt
} from "./operators";
import Syntax from "./syntax";

import MacroContext from "./macroContext";

import { matchCommaSeparatedIdentifiers } from "./matcher";

export class Enforester {
    constructor(stxl, prev, context) {
        this.done = false;
        assert(List.isList(stxl), "expecting a list of terms to enforest");
        assert(List.isList(prev), "expecting a list of terms to enforest");
        assert(context, "expecting a context to enforest");
        this.term = null;

        this.rest = stxl;
        this.prev = prev;

        this.context = context;
    }

    peek(n = 0) {
        return this.rest.get(n);
    }

    advance() {
        let ret = this.rest.first();
        this.rest = this.rest.rest();
        return ret;
    }

    /*
     enforest works over:
     prev - a list of the previously enforest Terms
     term - the current term being enforested (initially null)
     rest - remaining Terms to enforest
     */
    enforest(type = "Module") {
        // initialize the term
        this.term = null;

        if (this.rest.size === 0) {
            this.done = true;
            return this.term;
        }

        if (this.isEOF(this.peek())) {
            this.term = new T.EOFTerm(this.advance());
            return this.term;
        }

        let result;
        if (type === "expression") {
            result = this.enforestExpressionLoop();
        } else {
            result = this.enforestModuleItem();
        }

        if (this.rest.size === 0) {
            this.done = true;
        }
        return result;
    }

    enforestModuleItem() {
        return this.enforestStatement();
    }

    enforestStatement() {
        let lookahead = this.peek();

        if (this.term === null && this.isCompiletimeTransform(lookahead)) {
            return this.expandMacro();
        }

        if (this.term === null && this.isFnDeclTransform(lookahead)) {
            return this.enforestFunctionDeclaration();
        }

        if (this.term === null &&
            (this.isVarDeclTransform(lookahead) ||
             this.isLetDeclTransform(lookahead) ||
             this.isConstDeclTransform(lookahead) ||
             this.isSyntaxDeclTransform(lookahead))) {
            return this.enforestVariableDeclaration();
        }

        if (this.term === null && this.isReturnStmtTransform(lookahead)) {
            return this.enforestReturnStatement();
        }

        if (this.term === null && this.isPunctuator(lookahead, ";")) {
            this.advance();
            return new T.EmptyStatementTerm();
        }

        return this.enforestExpressionStatement();
    }

    enforestReturnStatement() {
        let kw = this.advance();
        let lookahead = this.peek();

        // short circuit for the empty expression case
        if (this.rest.size === 0 ||
            (lookahead && !this.lineNumberEq(kw, lookahead))) {
            return new T.ReturnStatementTerm(null);
        }

        let term = this.enforestExpressionLoop();
        this.consumeSemicolon();

        return new T.ReturnStatementTerm(term);
    }

    enforestVariableDeclaration() {
        let kind;
        let lookahead = this.advance();
        let kindSyn = this.unwrap(lookahead);

        if (kindSyn &&
            this.context.env.get(kindSyn.resolve()) === VariableDeclTransform) {
            kind = "var";
        } else if (kindSyn &&
                   this.context.env.get(kindSyn.resolve()) === LetDeclTransform) {
            kind = "let";
        } else if (kindSyn &&
                   this.context.env.get(kindSyn.resolve()) === ConstDeclTransform) {
            kind = "const";
        } else if (kindSyn &&
                   this.context.env.get(kindSyn.resolve()) === SyntaxDeclTransform) {
            kind = "syntax";
        }

        let decls = List();

        while (true) {

            let term =  this.enforestVariableDeclarator();

            decls = decls.concat(term);

            let lookahead = this.peek();

            if (this.isPunctuator(lookahead, ",")) {
                this.advance();
            } else {
                break;
            }
        }

        this.consumeSemicolon();
        return new T.VariableDeclarationTerm(decls, kind);
    }

    enforestVariableDeclarator() {
        let id = this.matchIdentifier();
        let eq = this.unwrap(this.advance());

        let init, rest;
        if (eq && eq.val() === "=") {
            init = this.enforestExpressionLoop();
        } else {
            init = null;
        }
        return new T.VariableDeclaratorTerm(id, init);
    }

    enforestExpressionStatement() {
        let start = this.rest.get(0);
        let expr = this.enforestExpressionLoop();
        if (expr === null) {
            throw this.createError(start, "not a valid expression");
        }
        this.consumeSemicolon();

        return new T.ExpressionStatementTerm(expr);
    }

    enforestExpressionLoop() {
        let lastTerm;
        let firstTime = true;

        this.term = null;
        this.opCtx = {
            prec: 0,
            combine: (x) => x,
            stack: List()
        };

        do {
            lastTerm = this.term;
            this.term = this.enforestExpression();

            if (firstTime) {
                firstTime = false;
                if (this.term === null) {
                    break;
                }
            }

            // if nothing changed, maybe we just need to pop the expr stack
            if (lastTerm === this.term && this.opCtx.stack.size > 0) {
                this.term = this.opCtx.combine(this.term);
                let {prec, combine} = this.opCtx.stack.last();
                this.opCtx.prec = prec;
                this.opCtx.combine = combine;
                this.opCtx.stack = this.opCtx.stack.pop();
            }
            // if we had that chance to pop the operator stack and still the
            // current term and last term are null then we got into an infinite
            // loop
            assert(!(this.term === null && lastTerm === null),
                   "enforesting an expression should never be null");

        } while (lastTerm !== this.term);  // get a fixpoint
        return this.term;
    }

    enforestExpression() {
        let lookahead = this.peek();

        if (this.term === null && this.isCompiletimeTransform(lookahead)) {
            let term = this.expandMacro("expression");
            if (!(term instanceof T.ExpressionTerm)) {
                throw this.createError(term,
                                       "expecting macro to return an expression");
            }
            return term;
        }

        // syntaxQuote { ... }
        if (this.term === null && this.isSyntaxQuoteTransform(lookahead)) {
            return this.enforestSyntaxQuote();
        }

        // $x:ident
        if (this.term === null && this.isIdentifier(lookahead)) {
            return new T.IdentifierExpressionTerm(this.unwrap(this.advance()));
        }
        if (this.term === null && this.isNumericLiteral(lookahead)) {
            return new T.LiteralNumericExpressionTerm(this.unwrap(this.advance()));
        }
        if (this.term === null && this.isStringLiteral(lookahead)) {
            return new T.LiteralStringExpressionTerm(this.unwrap(this.advance()));
        }
        if (this.term === null && this.isBooleanLiteral(lookahead)) {
            return new T.LiteralBooleanExpressionTerm(this.unwrap(this.advance()));
        }
        if (this.term === null && this.isNullLiteral(lookahead)) {
            this.advance();
            return new T.LiteralNullExpressionTerm();
        }
        if (this.term === null && this.isRegularExpression(lookahead)) {
            let reStx = this.unwrap(this.advance());
            return new T.LiteralRegExpExpressionTerm(reStx.token.regex.pattern, reStx.token.regex.flags);
        }
        // ($x:expr)
        if (this.term === null && this.isParenDelimiter(lookahead)) {
            return new T.ParenthesizedExpressionTerm(this.advance().getSyntax());
        }
        // $x:FunctionExpression
        if (this.term === null && this.isFnDeclTransform(lookahead)) {
            return this.enforestFunctionExpression();
        }

        // { $p:prop (,) ... }
        if (this.term === null && this.isCurlyDelimiter(lookahead)) {
            return this.enforestObjectExpression();
        }

        // [$x:expr (,) ...]
        if (this.term === null && this.isSquareDelimiter(lookahead)) {
            return this.enforestArrayExpression();
        }

        // and then check the cases where the term part of p is something...

        // $x:expr . $prop:ident
        if (this.term && this.term instanceof T.ExpressionTerm &&
            this.isPunctuator(lookahead, ".")) {
            return this.enforestStaticMemberExpression();
        }
        // $l:expr $op:binaryOperator $r:expr
        if (this.term && this.term instanceof T.ExpressionTerm &&
            this.isOperator(lookahead)) {
            return this.enforestBinaryExpression();
        }
        // $x:expr (...)
        if (this.term && this.term instanceof T.ExpressionTerm &&
            this.isParenDelimiter(lookahead)) {
            let paren = this.advance();
            return new T.CallExpressionTerm(this.term, paren);
        }

        return this.term;
    }

    enforestSyntaxQuote() {
        let name = this.unwrap(this.advance());
        let body = this.matchCurlies();

        return new T.SyntaxQuoteTerm(name, body);
    }

    enforestStaticMemberExpression() {
        let object = this.term;
        let dot = this.advance();
        let property = this.matchIdentifier();

        return new T.MemberExpressionTerm(object,
                                        new T.IdentifierExpressionTerm(property),
                                        false);
    }

    enforestArrayExpression() {
        let arr = this.advance();

        let elements = List();

        let enf = new Enforester(arr.getSyntax(), List(), this.context);

        while (enf.rest.size > 0) {
            let lookahead = enf.peek();
            if (enf.isPunctuator(lookahead, ",")) {
                enf.advance();
                elements = elements.concat(null);
            } else {
                let term = enf.enforestExpressionLoop();
                elements = elements.concat(term);
                enf.consumeComma();
            }
        }
        return new T.ArrayExpressionTerm(elements);

    }

    enforestObjectExpression() {
        let obj = this.advance();

        let properties = List();

        let enf = new Enforester(obj.getSyntax(), List(), this.context);

        let lastProp = null;
        while (enf.rest.size > 0) {
            let prop = enf.enforestProperty();
            properties = properties.concat(prop);

            if (lastProp === prop) {
                throw enf.createError(prop, "invalid syntax in object");
            }
            lastProp = prop;
        }

        return new T.ObjectExpressionTerm(properties);
    }

    enforestProperty() {
        let key = this.matchIdentifier();
        let colon = this.matchPunctuator(":");

        let value = this.enforestExpressionLoop();
        this.consumeComma();

        return new T.PropertyTerm(key, value, "init");
    }

    enforestFunctionExpression() {
        let name = null, params, body, rest;
        // eat the function keyword
        this.advance();
        let lookahead = this.peek();

        if (this.isIdentifier(lookahead)) {
            name = new T.BindingIdentifierTerm(this.unwrap(this.advance()));
        }

        params = this.matchParens("expecting a function parameter list");
        body = this.matchCurlies("expecting a function body");

        let enf = new Enforester(params, List(), this.context);
        let formalParams = enf.enforestFormalParameters();

        return new T.FunctionExpressionTerm(name, false, formalParams, body);
    }

    enforestFunctionDeclaration() {
        let name, params, body, rest;
        // eat the function keyword
        this.advance();
        let lookahead = this.peek();

        name = new T.BindingIdentifierTerm(this.unwrap(this.advance()));

        params = this.matchParens("expecting a function parameter list");
        body = this.matchCurlies("expecting a function body");

        let enf = new Enforester(params, List(), this.context);
        let formalParams = enf.enforestFormalParameters();

        return new T.FunctionDeclarationTerm(name, false, formalParams, body);
    }

    enforestFormalParameters() {
        let items = [];
        while (this.rest.size !== 0) {
            let lookahead = this.peek();

            if (this.isIdentifier(lookahead)) {
                let name = this.unwrap(this.advance())
                items.push(new T.BindingIdentifierTerm(name))
            } else if (this.isPunctuator(lookahead, ",")) {
                this.advance();
            } else {
                assert(false, "not implemented yet");
            }
        }
        return new T.FormalParametersTerm(List(items));

    }



    enforestBinaryExpression() {

        let leftTerm = this.term;
        let opStx = this.unwrap(this.peek());
        let op = opStx.val();
        let opPrec = getOperatorPrec(op);
        let opAssoc = getOperatorAssoc(op);

        if (operatorLt(this.opCtx.prec, opPrec, opAssoc)) {
            this.opCtx.stack = this.opCtx.stack.push({
                prec: this.opCtx.prec,
                combine: this.opCtx.combine
            });
            this.opCtx.prec = opPrec;
            this.opCtx.combine = (rightTerm) => {
                if (!(rightTerm instanceof T.ExpressionTerm)) {
                    throw this.createError(rightTerm,
                                           "expecting an expression on the right side of a binary operator");
                }
                return new T.BinaryExpressionTerm(leftTerm, opStx, rightTerm);
            };
            this.advance();
            return null;
        } else {
            let term = this.opCtx.combine(leftTerm);
            // this.rest does not change
            let { prec, combine } = this.opCtx.stack.last();
            this.opCtx.stack = this.opCtx.stack.pop();
            this.opCtx.prec = prec;
            this.opCtx.combine = combine;
            return term;
        }
    }

    expandMacro(enforestType) {
        let name = this.unwrap(this.advance());

        let ct = this.context.env.get(name.resolve());
        if (ct == null || typeof ct.value !== "function") {
            throw this.createError(name, "the macro name was not bound to a value that could be invoked");
        }

        let ctx = new MacroContext(this, name);

        let result = ct.value(ctx);

        // enforesting result to handle precedence issues
        // (this surrounds macro results with implicit parens)
        let enf = new Enforester(result, List(), this.context);
        let term = enf.enforest(enforestType);

        this.rest = enf.rest.concat(this.rest);
        return term;
    }

    consumeSemicolon() {
        let lookahead = this.peek();

        if (lookahead && (lookahead instanceof T.SyntaxTerm)) {
            let syn = lookahead.getSyntax().first();
            if(syn && syn.isPunctuator() && syn.val() === ";") {
                this.advance();
            }
        }
    }
    consumeComma() {
        let lookahead = this.peek();

        if (lookahead && (lookahead instanceof T.SyntaxTerm)) {
            let syn = lookahead.getSyntax().first();
            if(syn && syn.isPunctuator() && syn.val() === ",") {
                this.advance();
            }
        }
    }


    unwrap(term) {
        if (!(term instanceof T.SyntaxTerm)) {
            return null;
        }
        return term.getSyntax().first();
    }

    isEOF(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) && syn.isEOF();
    }

    isIdentifier(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) && syn.isIdentifier();
    }
    isNumericLiteral(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) && syn.isNumericLiteral();
    }
    isStringLiteral(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) && syn.isStringLiteral();
    }
    isBooleanLiteral(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) && syn.isBooleanLiteral();
    }
    isNullLiteral(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) && syn.isNullLiteral();
    }
    isRegularExpression(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) && syn.isRegularExpression();
    }
    isParenDelimiter(term) {
        return term && (term instanceof T.DelimiterTerm) &&
            term.kind === "()";
    }
    isCurlyDelimiter(term) {
        return term && (term instanceof T.DelimiterTerm) &&
            term.kind === "{}";
    }
    isSquareDelimiter(term) {
        return term && (term instanceof T.DelimiterTerm) &&
            term.kind === "[]";
    }
    isPunctuator(term, val = null) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            syn.isPunctuator() && ((val === null) || (syn.val() === val));
    }
    isOperator(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) && isOperator(syn.val());
    }


    isFnDeclTransform(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            this.context.env.get(syn.resolve()) === FunctionDeclTransform;
    }
    isVarDeclTransform(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            this.context.env.get(syn.resolve()) === VariableDeclTransform;
    }
    isLetDeclTransform(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            this.context.env.get(syn.resolve()) === LetDeclTransform;
    }
    isConstDeclTransform(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            this.context.env.get(syn.resolve()) === ConstDeclTransform;
    }
    isSyntaxDeclTransform(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            this.context.env.get(syn.resolve()) === SyntaxDeclTransform;
    }
    isSyntaxQuoteTransform(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            this.context.env.get(syn.resolve()) === SyntaxQuoteTransform;
    }
    isReturnStmtTransform(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            this.context.env.get(syn.resolve()) === ReturnStatementTransform;
    }
    isCompiletimeTransform(term) {
        let syn = this.unwrap(term);
        return syn && (syn instanceof Syntax) &&
            this.context.env.get(syn.resolve()) instanceof CompiletimeTransform;
    }


    lineNumberEq(a, b) {
        if (!(a && b)) {
            return false;
        }
        let alineNum = (a instanceof T.DelimiterTerm) ? a.stx.token.startLineNumber : a.stx.token.lineNumber;
        let blineNum = (b instanceof T.DelimiterTerm) ? b.stx.token.startLineNumber : b.stx.token.lineNumber;
        return alineNum === blineNum;
    }

    matchIdentifier() {
        let lookahead = this.advance();
        if (this.isIdentifier(lookahead)) {
            return lookahead.getSyntax().first();
        }
        throw this.createError(lookahead, "expecting an identifier");
    }
    matchLiteral() {
        let lookahead = this.advance();
        if (this.isNumericLiteral(lookahead) ||
            this.isStringLiteral(lookahead) ||
            this.isBooleanLiteral(lookahead) ||
            this.isNullLiteral(lookahead) ||
            this.isRegularExpression(lookahead)) {
            return lookahead.getSyntax().first();
        }
        throw this.createError(lookahead, "expecting a literal");
    }

    matchParens() {
        let lookahead = this.advance();
        if (this.isParenDelimiter(lookahead)) {
            return lookahead.getSyntax();
        }
        throw this.createError(lookahead, "expecting parens");
    }

    matchCurlies() {
        let lookahead = this.advance();
        if (this.isCurlyDelimiter(lookahead)) {
            return lookahead.getSyntax();
        }
        throw this.createError(lookahead, "expecting curly braces");
    }

    matchPunctuator(val) {
        let lookahead = this.advance();
        if (this.isPunctuator(lookahead)) {
            let syn = lookahead.getSyntax().first();
            if (typeof val !== 'undefined') {
                if (syn.val() === val) {
                    return syn;
                } else {
                    throw this.createError(lookahead,
                                           "expecting a " + val + " punctuator");
                }
            }
            return syn;
        }
        throw this.createError(lookahead, "expecting a punctuator");
    }

    createError(stx, message) {
        let ctx = "";
        let offending = stx == null ? null : stx.getSyntax().first();
        if (this.rest.size > 0) {
            ctx = this.rest.slice(0, 20).map(term => {
                return term.getSyntax();
            }).flatten().map(s => {
                if (s === offending) {
                    return "__" + s.val() + "__";
                }
                return s.val();
            }).join(" ");
        }
        return new Error("[error]: " + message + "\n" + ctx);
    }
}