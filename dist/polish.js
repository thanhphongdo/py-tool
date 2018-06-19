(function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) {
        module.exports = definition();
    } else if (typeof define == 'function' && define.amd) {
        define(definition);
    } else {
        context[name] = definition();
    }
})('polishNotation', this, function () {
    var Calculator = function () {},
        Parser = {
            lexer: function (expression) {
                var tokens = expression.match(/\(|\)|\d+(\.\d+)?|\w+|[\|\&+*\/-]/g);

                return tokens.map(function (token) {
                    return /^\d/.test(token) ? parseFloat(token) : token;
                });
            },
            parse: function (expression) {
                var tokens = Parser.lexer(expression),
                    start  = tokens.length - 1,
                    stack  = [];

                for (var i = start, token; i >= 0; i--) {
                    token = tokens[i];
                    if (Parser.isAnOperator(token)) {
                        stack.unshift(Parser._doOperation(token, stack.shift(), stack.shift()));
                    } else {
                        stack.unshift(token);
                    }
                }

                return stack.shift();
            },

            _doOperation: function (operator, x, y) {
                return Parser[operator](x, y);
            },

            isAnOperand: function (subject) {
                return (subject - parseFloat(subject) + 1) >= 0;
            },

            isAnOperator: function (subject) {
                return /^[\|\&\+\*\/-]$/.test(subject);
            },
            "+": function (x, y) {
                return `(${x} + ${y})`;
            },
            "-": function (x, y) {
                return `(${x} - ${y})`;
            },
            "/": function (x, y) {
                return `(${x} / ${y})`;
            },
            "*": function (x, y) {
                return `(${x} * ${y})`;
            },
            "|": function (x, y) {
                return `(${x} or ${y})`;
            },
            "&": function (x, y) {
                return `(${x} and ${y})`;
            }
        };
    Calculator.prototype.calculate = function (expression) {
        return Parser.parse(expression);
    };

    return Calculator;
});