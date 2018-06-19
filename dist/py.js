function makeUtils() {
    var id = -1;

    var utils = {
        /**
         * Throws an error if the given condition is not true
         *
         * @param {any} bool
         */
        assert: function (bool) {
            if (!bool) {
                throw new Error("AssertionError");
            }
        },
        /**
         * Confines a value inside an interval
         *
         * @param {number} [val] the value to confine
         * @param {number} [min] the minimum of the interval
         * @param {number} [max] the maximum of the interval
         * @return {number} val if val is in [min, max], min if val < min and max
         *   otherwise
         */
        confine: function (val, min, max) {
            return Math.max(min, Math.min(max, val));
        },
        /**
         * computes (Math.floor(a/b), a%b and passes that to the callback.
         *
         * returns the callback's result
         */
        divmod: function (a, b, fn) {
            var mod = a % b;
            // in python, sign(a % b) === sign(b). Not in JS. If wrong side, add a
            // round of b
            if (mod > 0 && b < 0 || mod < 0 && b > 0) {
                mod += b;
            }
            return fn(Math.floor(a / b), mod);
        },
        /**
         * @param {number} value
         * @param {integer} decimals
         * @returns {boolean}
         */
        float_is_zero: function (value, decimals) {
            var epsilon = Math.pow(10, -decimals);
            return Math.abs(utils.round_precision(value, epsilon)) < epsilon;
        },
        /**
         * Generate a unique numerical ID
         *
         * @returns {integer}
         */
        generateID: function () {
            return ++id;
        },
        /**
         * Read the cookie described by c_name
         *
         * @param {string} c_name
         * @returns {string}
         */
        get_cookie: function (c_name) {
            var cookies = document.cookie ? document.cookie.split('; ') : [];
            for (var i = 0, l = cookies.length; i < l; i++) {
                var parts = cookies[i].split('=');
                var name = parts.shift();
                var cookie = parts.join('=');

                if (c_name && c_name === name) {
                    return cookie;
                }
            }
            return "";
        },
        /**
         * Insert "thousands" separators in the provided number (which is actually
         * a string)
         *
         * @param {String} num
         * @returns {String}
         */
        insert_thousand_seps: function (num) {
            var negative = num[0] === '-';
            num = (negative ? num.slice(1) : num);
            return (negative ? '-' : '') + utils.intersperse(
                num, _t.database.parameters.grouping, _t.database.parameters.thousands_sep);
        },
        /**
         * Intersperses ``separator`` in ``str`` at the positions indicated by
         * ``indices``.
         *
         * ``indices`` is an array of relative offsets (from the previous insertion
         * position, starting from the end of the string) at which to insert
         * ``separator``.
         *
         * There are two special values:
         *
         * ``-1``
         *   indicates the insertion should end now
         * ``0``
         *   indicates that the previous section pattern should be repeated (until all
         *   of ``str`` is consumed)
         *
         * @param {String} str
         * @param {Array<Number>} indices
         * @param {String} separator
         * @returns {String}
         */
        intersperse: function (str, indices, separator) {
            separator = separator || '';
            var result = [], last = str.length;

            for (var i = 0; i < indices.length; ++i) {
                var section = indices[i];
                if (section === -1 || last <= 0) {
                    // Done with string, or -1 (stops formatting string)
                    break;
                } else if (section === 0 && i === 0) {
                    // repeats previous section, which there is none => stop
                    break;
                } else if (section === 0) {
                    // repeat previous section forever
                    //noinspection AssignmentToForLoopParameterJS
                    section = indices[--i];
                }
                result.push(str.substring(last - section, last));
                last -= section;
            }

            var s = str.substring(0, last);
            if (s) { result.push(s); }
            return result.reverse().join(separator);
        },
        /**
         * @param {any} object
         * @param {any} path
         * @returns
         */
        into: function (object, path) {
            if (!_(path).isArray()) {
                path = path.split('.');
            }
            for (var i = 0; i < path.length; i++) {
                object = object[path[i]];
            }
            return object;
        },
        /**
         * @param {string} v
         * @returns {boolean}
         */
        is_bin_size: function (v) {
            return (/^\d+(\.\d*)? [^0-9]+$/).test(v);
        },
        /**
         * Left-pad provided arg 1 with zeroes until reaching size provided by second
         * argument.
         *
         * @see rpad
         *
         * @param {number|string} str value to pad
         * @param {number} size size to reach on the final padded value
         * @returns {string} padded string
         */
        lpad: function (str, size) {
            str = "" + str;
            return new Array(size - str.length + 1).join('0') + str;
        },
        /**
         * Passes the fractional and integer parts of x to the callback, returns
         * the callback's result
         */
        modf: function (x, fn) {
            var mod = x % 1;
            if (mod < 0) {
                mod += 1;
            }
            return fn(mod, Math.floor(x));
        },
        /**
         * performs a half up rounding with a fixed amount of decimals, correcting for float loss of precision
         * See the corresponding float_round() in server/tools/float_utils.py for more info
         * @param {Number} value the value to be rounded
         * @param {Number} decimals the number of decimals. eg: round_decimals(3.141592,2) -> 3.14
         */
        round_decimals: function (value, decimals) {
            return utils.round_precision(value, Math.pow(10, -decimals));
        },
        /**
         * performs a half up rounding with arbitrary precision, correcting for float loss of precision
         * See the corresponding float_round() in server/tools/float_utils.py for more info
         *
         * @param {number} value the value to be rounded
         * @param {number} precision a precision parameter. eg: 0.01 rounds to two digits.
         */
        round_precision: function (value, precision) {
            if (!value) {
                return 0;
            } else if (!precision || precision < 0) {
                precision = 1;
            }
            var normalized_value = value / precision;
            var epsilon_magnitude = Math.log(Math.abs(normalized_value)) / Math.log(2);
            var epsilon = Math.pow(2, epsilon_magnitude - 53);
            normalized_value += normalized_value >= 0 ? epsilon : -epsilon;

            /**
             * Javascript performs strictly the round half up method, which is asymmetric. However, in
             * Python, the method is symmetric. For example:
             * - In JS, Math.round(-0.5) is equal to -0.
             * - In Python, round(-0.5) is equal to -1.
             * We want to keep the Python behavior for consistency.
             */
            var sign = normalized_value < 0 ? -1.0 : 1.0;
            var rounded_value = sign * Math.round(Math.abs(normalized_value));
            return rounded_value * precision;
        },
        /**
         * @see lpad
         *
         * @param {string} str
         * @param {number} size
         * @returns {string}
         */
        rpad: function (str, size) {
            str = "" + str;
            return str + new Array(size - str.length + 1).join('0');
        },
        /**
         * Create a cookie
         * @param {String} name the name of the cookie
         * @param {String} value the value stored in the cookie
         * @param {Integer} ttl time to live of the cookie in millis. -1 to erase the cookie.
         */
        set_cookie: function (name, value, ttl) {
            ttl = ttl || 24 * 60 * 60 * 365;
            document.cookie = [
                name + '=' + value,
                'path=/',
                'max-age=' + ttl,
                'expires=' + new Date(new Date().getTime() + ttl * 1000).toGMTString()
            ].join(';');
        },
        /**
         * Sort an array in place, keeping the initial order for identical values.
         *
         * @param {Array} array
         * @param {function} iteratee
         */
        stableSort: function (array, iteratee) {
            var stable = array.slice();
            return array.sort(function stableCompare(a, b) {
                var order = iteratee(a, b);
                if (order !== 0) {
                    return order;
                } else {
                    return stable.indexOf(a) - stable.indexOf(b);
                }
            });
        },
        /**
         * @param {any} array
         * @param {any} elem1
         * @param {any} elem2
         */
        swap: function (array, elem1, elem2) {
            var i1 = array.indexOf(elem1);
            var i2 = array.indexOf(elem2);
            array[i2] = elem1;
            array[i1] = elem2;
        },

        /**
         * @param {string} value
         * @param {boolean} allow_mailto
         * @returns boolean
         */
        is_email: function (value, allow_mailto) {
            // http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
            var re;
            if (allow_mailto) {
                re = /^(mailto:)?(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            } else {
                re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            }
            return re.test(value);
        },

        /**
         * @param {any} str
         * @param {any} elseValues
         * @param {any} trueValues
         * @param {any} falseValues
         * @returns
         */
        toBoolElse: function (str, elseValues, trueValues, falseValues) {
            var ret = _.str.toBool(str, trueValues, falseValues);
            if (_.isUndefined(ret)) {
                return elseValues;
            }
            return ret;
        },
        /**
         * @todo: is this really the correct place?
         *
         * @param {any} data
         * @param {any} f
         */
        traverse_records: function (data, f) {
            if (data.type === 'record') {
                f(data);
            } else if (data.data) {
                for (var i = 0; i < data.data.length; i++) {
                    utils.traverse_records(data.data[i], f);
                }
            }
        },
        /**
         * @param {any} node
         * @param {any} strip_whitespace
         * @returns
         */
        xml_to_json: function (node, strip_whitespace) {
            switch (node.nodeType) {
                case 9:
                    return utils.xml_to_json(node.documentElement, strip_whitespace);
                case 3:
                case 4:
                    return (strip_whitespace && node.data.trim() === '') ? undefined : node.data;
                case 1:
                    var attrs = $(node).getAttributes();
                    _.each(['domain', 'filter_domain', 'context', 'default_get'], function (key) {
                        if (attrs[key]) {
                            try {
                                attrs[key] = JSON.parse(attrs[key]);
                            } catch (e) { }
                        }
                    });
                    return {
                        tag: node.tagName.toLowerCase(),
                        attrs: attrs,
                        children: _.compact(_.map(node.childNodes, function (node) {
                            return utils.xml_to_json(node, strip_whitespace);
                        })),
                    };
            }
        },
        /**
         * @param {any} node
         * @returns {string}
         */
        xml_to_str: function (node) {
            var str = "";
            if (window.XMLSerializer) {
                str = (new XMLSerializer()).serializeToString(node);
            } else if (window.ActiveXObject) {
                str = node.xml;
            } else {
                throw new Error("Could not serialize XML");
            }
            // Browsers won't deal with self closing tags except void elements:
            // http://www.w3.org/TR/html-markup/syntax.html
            var void_elements = 'area base br col command embed hr img input keygen link meta param source track wbr'.split(' ');

            // The following regex is a bit naive but it's ok for the xmlserializer output
            str = str.replace(/<([a-z]+)([^<>]*)\s*\/\s*>/g, function (match, tag, attrs) {
                if (void_elements.indexOf(tag) < 0) {
                    return "<" + tag + attrs + "></" + tag + ">";
                } else {
                    return match;
                }
            });
            return str;
        },
        /**
         * Visit a tree of objects, where each children are in an attribute 'children'.
         * For each children, we call the callback function given in arguments.
         *
         * @param {Object} tree an object describing a tree structure
         * @param {function} f a callback
         */
        traverse: function (tree, f) {
            if (f(tree)) {
                _.each(tree.children, function (c) { utils.traverse(c, f); });
            }
        },
        /**
         * Visit a tree of objects and freeze all
         *
         * @param {Object} obj
         */
        deepFreeze: function (obj) {
            var propNames = Object.getOwnPropertyNames(obj);
            propNames.forEach(function (name) {
                var prop = obj[name];
                if (typeof prop == 'object' && prop !== null)
                    utils.deepFreeze(prop);
            });
            return Object.freeze(obj);
        },

    };

    return utils;

};

function makePy(py) {
    var create = function (o, props) {
        function F() { }
        F.prototype = o;
        var inst = new F;
        if (props) {
            for (var name in props) {
                if (!props.hasOwnProperty(name)) { continue; }
                inst[name] = props[name];
            }
        }
        return inst;
    };

    var symbols = {};
    var comparators = {};
    var Base = {
        nud: function () { throw new Error(this.id + " undefined as prefix"); },
        led: function (led) { throw new Error(this.id + " undefined as infix"); },
        toString: function () {
            if (this.id === '(constant)' || this.id === '(number)' || this.id === '(name)' || this.id === '(string)') {
                return [this.id.slice(0, this.id.length - 1), ' ', this.value, ')'].join('');
            } else if (this.id === '(end)') {
                return '(end)';
            } else if (this.id === '(comparator)') {
                var repr = ['(comparator', this.expressions[0]];
                for (var i = 0; i < this.operators.length; ++i) {
                    repr.push(this.operators[i], this.expressions[i + 1]);
                }
                return repr.join(' ') + ')';
            }
            var out = [this.id, this.first, this.second, this.third]
                .filter(function (r) { return r }).join(' ');
            return '(' + out + ')';
        }
    };
    function symbol(id, bp) {
        bp = bp || 0;
        var s = symbols[id];
        if (s) {
            if (bp > s.lbp) {
                s.lbp = bp;
            }
            return s;
        }
        return symbols[id] = create(Base, {
            id: id,
            lbp: bp
        });
    }
    function constant(id) {
        var s = symbol(id);
        s.id = '(constant)';
        s.value = id;
        s.nud = function () {
            return this;
        };
    }
    function prefix(id, bp, nud) {
        symbol(id).nud = nud || function () {
            this.first = expression(bp);
            return this
        }
    }
    function infix(id, bp, led) {
        symbol(id, bp).led = led || function (left) {
            this.first = left;
            this.second = expression(bp);
            return this;
        }
    }
    function infixr(id, bp) {
        symbol(id, bp).led = function (left) {
            this.first = left;
            this.second = expression(bp - 1);
            return this;
        }
    }
    function comparator(id) {
        comparators[id] = true;
        var bp = 60;
        infix(id, bp, function (left) {
            this.id = '(comparator)';
            this.operators = [id];
            this.expressions = [left, expression(bp)];
            while (token.id in comparators) {
                this.operators.push(token.id);
                advance();
                this.expressions.push(
                    expression(bp));
            }
            return this;
        });
    }

    constant('None'); constant('False'); constant('True');

    symbol('(number)').nud = function () { return this; };
    symbol('(name)').nud = function () { return this; };
    symbol('(string)').nud = function () { return this; };
    symbol('(end)');

    symbol(':'); symbol(')'); symbol(']'); symbol('}'); symbol(',');
    symbol('else');

    infix('=', 10, function (left) {
        if (left.id !== '(name)') {
            throw new Error("Expected keyword argument name, got " + token.id);
        }
        this.first = left;
        this.second = expression();
        return this;
    });

    symbol('lambda', 20).nud = function () {
        this.first = [];
        if (token.id !== ':') {
            for (; ;) {
                if (token.id !== '(name)') {
                    throw new Error('Excepted an argument name');
                }
                this.first.push(token);
                advance();
                if (token.id !== ',') {
                    break;
                }
                advance(',');
            }
        }
        advance(':');
        this.second = expression();
        return this;
    };
    infix('if', 20, function (left) {
        this.first = left;
        this.second = expression();
        advance('else');
        this.third = expression();
        return this;
    });

    infixr('or', 30); infixr('and', 40); prefix('not', 50);

    comparator('in'); comparator('not in');
    comparator('is'); comparator('is not');
    comparator('<'); comparator('<=');
    comparator('>'); comparator('>=');
    comparator('<>'); comparator('!='); comparator('==');

    infix('|', 70); infix('^', 80); infix('&', 90);

    infix('<<', 100); infix('>>', 100);

    infix('+', 110); infix('-', 110);

    infix('*', 120); infix('/', 120);
    infix('//', 120); infix('%', 120);

    prefix('-', 130); prefix('+', 130); prefix('~', 130);

    infixr('**', 140);

    infix('.', 150, function (left) {
        if (token.id !== '(name)') {
            throw new Error('Expected attribute name, got ' + token.id);
        }
        this.first = left;
        this.second = token;
        advance();
        return this;
    });
    symbol('(', 150).nud = function () {
        this.first = [];
        var comma = false;
        if (token.id !== ')') {
            while (true) {
                if (token.id === ')') {
                    break;
                }
                this.first.push(expression());
                if (token.id !== ',') {
                    break;
                }
                comma = true;
                advance(',');
            }
        }
        advance(')');
        if (!this.first.length || comma) {
            return this;
        } else {
            return this.first[0];
        }
    };
    symbol('(').led = function (left) {
        this.first = left;
        this.second = [];
        if (token.id !== ")") {
            for (; ;) {
                this.second.push(expression());
                if (token.id !== ',') {
                    break;
                }
                advance(',');
            }
        }
        advance(")");
        return this;

    };
    infix('[', 150, function (left) {
        this.first = left;
        this.second = expression();
        advance("]");
        return this;
    });
    symbol('[').nud = function () {
        this.first = [];
        if (token.id !== ']') {
            for (; ;) {
                if (token.id === ']') {
                    break;
                }
                this.first.push(expression());
                if (token.id !== ',') {
                    break;
                }
                advance(',');
            }
        }
        advance(']');
        return this;
    };

    symbol('{').nud = function () {
        this.first = [];
        if (token.id !== '}') {
            for (; ;) {
                if (token.id === '}') {
                    break;
                }
                var key = expression();
                advance(':');
                var value = expression();
                this.first.push([key, value]);
                if (token.id !== ',') {
                    break;
                }
                advance(',');
            }
        }
        advance('}');
        return this;
    };

    py.tokenize = (function () {
        function group() { return '(' + Array.prototype.join.call(arguments, '|') + ')'; }

        var Whitespace = '[ \\f\\t]*';

        var Name = '[a-zA-Z_]\\w*';

        var DecNumber = '\\d+(L|l)?';
        var IntNumber = DecNumber;
        var PointFloat = group('\\d+\\.\\d*', '\\.\\d+');
        var FloatNumber = PointFloat;
        var Number = group(FloatNumber, IntNumber);

        var Operator = group("\\*\\*=?", ">>=?", "<<=?", "<>", "!=",
            "//=?", "[+\\-*/%&|^=<>]=?", "~");
        var Bracket = '[\\[\\]\\(\\)\\{\\}]';
        var Special = '[:;.,`@]';
        var Funny = group(Operator, Bracket, Special);

        var ContStr = group("([uU])?'([^']*)'", '([uU])?"([^"]*)"');

        var PseudoToken = Whitespace + group(Number, Funny, ContStr, Name);

        var number_pattern = new RegExp('^' + Number + '$');
        var string_pattern = new RegExp('^' + ContStr + '$');
        var name_pattern = new RegExp('^' + Name + '$');
        var strip = new RegExp('^' + Whitespace);
        return function tokenize(s) {
            var max = s.length, tokens = [], start, end = undefined;
            // /g flag makes repeated exec() have memory
            var pseudoprog = new RegExp(PseudoToken, 'g');

            while (pseudoprog.lastIndex < max) {
                var pseudomatch = pseudoprog.exec(s);
                if (!pseudomatch) {
                    // if match failed on trailing whitespace, end tokenizing
                    if (/^\s+$/.test(s.slice(end))) {
                        break;
                    }
                    throw new Error('Failed to tokenize <<' + s
                        + '>> at index ' + (end || 0)
                        + '; parsed so far: ' + tokens);
                }

                start = pseudomatch.index;
                end = pseudoprog.lastIndex;
                // strip leading space caught by Whitespace
                var token = s.slice(start, end).replace(strip, '');
                var initial = token[0];

                if (number_pattern.test(token)) {
                    tokens.push(create(symbols['(number)'], {
                        value: parseFloat(token)
                    }));
                } else if (string_pattern.test(token)) {
                    var m = string_pattern.exec(token);
                    tokens.push(create(symbols['(string)'], {
                        unicode: !!(m[2] || m[4]),
                        value: (m[3] !== undefined ? m[3] : m[5])
                    }));
                } else if (token in symbols) {
                    var symbol;
                    // transform 'not in' and 'is not' in a single token
                    if (token === 'in' && tokens.length > 1 && tokens[tokens.length - 1].id === 'not') {
                        symbol = symbols['not in'];
                        tokens.pop();
                    } else if (token === 'not' && tokens.length > 1 && tokens[tokens.length - 1].id === 'is') {
                        symbol = symbols['is not'];
                        tokens.pop();
                    } else {
                        symbol = symbols[token];
                    }
                    tokens.push(create(symbol));
                } else if (name_pattern.test(token)) {
                    tokens.push(create(symbols['(name)'], {
                        value: token
                    }));
                } else {
                    throw new Error("Tokenizing failure of <<" + s + ">> at index " + start
                        + " for token [[" + token + "]]"
                        + "; parsed so far: " + tokens);

                }
            }
            tokens.push(create(symbols['(end)']));
            return tokens;
        }
    })();

    var token, next;
    function expression(rbp) {
        rbp = rbp || 0;
        var t = token;
        token = next();
        var left = t.nud();
        while (rbp < token.lbp) {
            t = token;
            token = next();
            left = t.led(left);
        }
        return left;
    }
    function advance(id) {
        if (id && token.id !== id) {
            throw new Error(
                'Expected "' + id + '", got "' + token.id + '"');
        }
        token = next();
    }

    function PY_ensurepy(val, name) {
        switch (val) {
            case undefined:
                throw new Error("NameError: name '" + name + "' is not defined");
            case null:
                return py.None;
            case true:
                return py.True;
            case false:
                return py.False;
        }

        var fn = function () { };
        fn.prototype = py.object;
        if (py.PY_isInstance(val, py.object)
            || py.PY_isSubclass(val, py.object)) {
            return val;
        }

        switch (typeof val) {
            case 'number':
                return py.float.fromJSON(val);
            case 'string':
                return py.str.fromJSON(val);
            case 'function':
                return py.PY_def.fromJSON(val);
        }

        switch (val.constructor) {
            case Object:
                // TODO: why py.object instead of py.dict?
                var o = py.PY_call(py.object);
                for (var prop in val) {
                    if (val.hasOwnProperty(prop)) {
                        o[prop] = val[prop];
                    }
                }
                return o;
            case Array:
                return py.list.fromJSON(val);
        }

        throw new Error("Could not convert " + val + " to a pyval");
    }

    var typename = function (obj) {
        if (obj.__class__) { // py type
            return obj.__class__.__name__;
        } else if (typeof obj !== 'object') { // JS primitive
            return typeof obj;
        } else { // JS object
            return obj.constructor.name;
        }
    };
    // JSAPI, JS-level utility functions for implementing new py.js
    // types
    py.py = {};

    py.PY_parseArgs = function PY_parseArgs(argument, format) {
        var out = {};
        var args = argument[0];
        var kwargs = {};
        for (var k in argument[1]) {
            if (!argument[1].hasOwnProperty(k)) { continue; }
            kwargs[k] = argument[1][k];
        }
        if (typeof format === 'string') {
            format = format.split(/\s+/);
        }
        var name = function (spec) {
            if (typeof spec === 'string') {
                return spec;
            } else if (spec instanceof Array && spec.length === 2) {
                return spec[0];
            }
            throw new Error(
                "TypeError: unknown format specification " +
                JSON.stringify(spec));
        };
        var spec;
        // TODO: ensure all format arg names are actual names?
        for (var i = 0; i < args.length; ++i) {
            spec = format[i];
            // spec list ended, or specs switching to keyword-only
            if (!spec || spec === '*') {
                throw new Error(
                    "TypeError: function takes exactly " + (i - 1) +
                    " positional arguments (" + args.length +
                    " given")
            } else if (/^\*\w/.test(spec)) {
                // *args, final
                out[name(spec.slice(1))] = args.slice(i);
                break;
            }

            out[name(spec)] = args[i];
        }
        for (var j = i; j < format.length; ++j) {
            spec = format[j];
            var n = name(spec);

            if (n in out) {
                throw new Error(
                    "TypeError: function got multiple values " +
                    "for keyword argument '" + kwarg + "'");
            }
            if (/^\*\*\w/.test(n)) {
                // **kwarg
                out[n.slice(2)] = kwargs;
                kwargs = {};
                break;
            }
            if (n in kwargs) {
                out[n] = kwargs[n];
                // Remove from args map
                delete kwargs[n];
            }
        }
        // Ensure all keyword arguments were consumed
        for (var key in kwargs) {
            throw new Error(
                "TypeError: function got an unexpected keyword argument '"
                + key + "'");
        }

        // Fixup args count if there's a kwonly flag (or an *args)
        var kwonly = 0;
        for (var k = 0; k < format.length; ++k) {
            if (/^\*/.test(format[k])) { kwonly = 1; break; }
        }
        // Check that all required arguments have been matched, add
        // optional values
        for (var k = 0; k < format.length; ++k) {
            spec = format[k];
            var n = name(spec);
            // kwonly, va_arg or matched argument
            if (/^\*/.test(n) || n in out) { continue; }
            // Unmatched required argument
            if (!(spec instanceof Array)) {
                throw new Error(
                    "TypeError: function takes exactly " + (format.length - kwonly)
                    + " arguments");
            }
            // Set default value
            out[n] = spec[1];
        }

        return out;
    };

    py.PY_hasAttr = function (o, attr_name) {
        try {
            py.PY_getAttr(o, attr_name);
            return true;
        } catch (e) {
            return false;
        }
    };
    py.PY_getAttr = function (o, attr_name) {
        return PY_ensurepy(o.__getattribute__(attr_name));
    };
    py.PY_str = function (o) {
        var v = o.__str__();
        if (py.PY_isInstance(v, py.str)) {
            return v;
        }
        throw new Error(
            'TypeError: __str__ returned non-string (type '
            + typename(v)
            + ')');
    };
    py.PY_isInstance = function (inst, cls) {
        var fn = function () { };
        fn.prototype = cls;
        return inst instanceof fn;
    };
    py.PY_isSubclass = function (derived, cls) {
        var fn = function () { };
        fn.prototype = cls;
        return derived === cls || derived instanceof fn;
    };
    py.PY_call = function (callable, args, kwargs) {
        if (!args) {
            args = [];
        }
        if (typeof args === 'object' && !(args instanceof Array)) {
            kwargs = args;
            args = [];
        }
        if (!kwargs) {
            kwargs = {};
        }
        if (callable.__is_type) {
            // class hack
            var instance = callable.__new__.call(callable, args, kwargs);
            var typ = function () { };
            typ.prototype = callable;
            if (instance instanceof typ) {
                instance.__init__.call(instance, args, kwargs);
            }
            return instance
        }
        return callable.__call__(args, kwargs);
    };
    py.PY_isTrue = function (o) {
        var res = o.__nonzero__();
        if (res === py.True) {
            return true;
        }
        if (res === py.False) {
            return false;
        }
        throw new Error(
            "TypeError: __nonzero__ should return bool, returned "
            + typename(res));
    };
    py.PY_not = function (o) {
        return !py.PY_isTrue(o);
    };
    py.PY_size = function (o) {
        if (!o.__len__) {
            throw new Error(
                "TypeError: object of type '" +
                typename(o) +
                "' has no len()");
        }
        var v = o.__len__();
        if (typeof v !== 'number') {
            throw new Error("TypeError: a number is required");
        }
        return v;
    };
    py.PY_getItem = function (o, key) {
        if (!('__getitem__' in o)) {
            throw new Error(
                "TypeError: '" + typename(o) +
                "' object is unsubscriptable")
        }
        if (!py.PY_isInstance(key, py.object)) {
            throw new Error(
                "TypeError: '" + typename(key) +
                "' is not a py.js object");
        }
        var res = o.__getitem__(key);
        if (!py.PY_isInstance(key, py.object)) {
            throw new Error(
                "TypeError: __getitem__ must return a py.js object, got "
                + typename(res));
        }
        return res;
    };
    py.PY_setItem = function (o, key, v) {
        if (!('__setitem__' in o)) {
            throw new Error(
                "TypeError: '" + typename(o) +
                "' object does not support item assignment");
        }
        if (!py.PY_isInstance(key, py.object)) {
            throw new Error(
                "TypeError: '" + typename(key) +
                "' is not a py.js object");
        }
        if (!py.PY_isInstance(v, py.object)) {
            throw new Error(
                "TypeError: '" + typename(v) +
                "' is not a py.js object");
        }
        o.__setitem__(key, v);
    };

    py.PY_add = function (o1, o2) {
        return PY_op(o1, o2, '+');
    };
    py.PY_subtract = function (o1, o2) {
        return PY_op(o1, o2, '-');
    };
    py.PY_multiply = function (o1, o2) {
        return PY_op(o1, o2, '*');
    };
    py.PY_divide = function (o1, o2) {
        return PY_op(o1, o2, '/');
    };
    py.PY_negative = function (o) {
        if (!o.__neg__) {
            throw new Error(
                "TypeError: bad operand for unary -: '"
                + typename(o)
                + "'");
        }
        return o.__neg__();
    };
    py.PY_positive = function (o) {
        if (!o.__pos__) {
            throw new Error(
                "TypeError: bad operand for unary +: '"
                + typename(o)
                + "'");
        }
        return o.__pos__();
    };

    // Builtins
    py.type = function type(name, bases, dict) {
        if (typeof name !== 'string') {
            throw new Error("ValueError: a class name should be a string");
        }
        if (!bases || bases.length === 0) {
            bases = [py.object];
        } else if (bases.length > 1) {
            throw new Error("ValueError: can't provide multiple bases for a "
                + "new type");
        }
        var base = bases[0];
        var ClassObj = create(base);
        if (dict) {
            for (var k in dict) {
                if (!dict.hasOwnProperty(k)) { continue; }
                ClassObj[k] = dict[k];
            }
        }
        ClassObj.__class__ = ClassObj;
        ClassObj.__name__ = name;
        ClassObj.__bases__ = bases;
        ClassObj.__is_type = true;

        return ClassObj;
    };
    py.type.__call__ = function () {
        var args = py.PY_parseArgs(arguments, ['object']);
        return args.object.__class__;
    };

    var hash_counter = 0;
    py.object = py.type('object', [{}], {
        __new__: function () {
            // If ``this`` isn't the class object, this is going to be
            // beyond fucked up
            var inst = create(this);
            inst.__is_type = false;
            return inst;
        },
        __init__: function () { },
        // Basic customization
        __hash__: function () {
            if (this._hash) {
                return this._hash;
            }
            // tagged counter, to avoid collisions with e.g. number hashes
            return this._hash = '\0\0\0' + String(hash_counter++);
        },
        __eq__: function (other) {
            return (this === other) ? py.True : py.False;
        },
        __ne__: function (other) {
            if (py.PY_isTrue(this.__eq__(other))) {
                return py.False;
            } else {
                return py.True;
            }
        },
        __lt__: function () { return py.NotImplemented; },
        __le__: function () { return py.NotImplemented; },
        __ge__: function () { return py.NotImplemented; },
        __gt__: function () { return py.NotImplemented; },
        __str__: function () {
            return this.__unicode__();
        },
        __unicode__: function () {
            return py.str.fromJSON('<' + typename(this) + ' object>');
        },
        __nonzero__: function () {
            return py.True;
        },
        // Attribute access
        __getattribute__: function (name) {
            if (name in this) {
                var val = this[name];
                if (typeof val === 'object' && '__get__' in val) {
                    // TODO: second argument should be class
                    return val.__get__(this, py.PY_call(py.type, [this]));
                }
                if (typeof val === 'function' && !this.hasOwnProperty(name)) {
                    // val is a method from the class
                    return PY_instancemethod.fromJSON(val, this);
                }
                return val;
            }
            if ('__getattr__' in this) {
                return this.__getattr__(name);
            }
            throw new Error("AttributeError: object has no attribute '" + name + "'");
        },
        __setattr__: function (name, value) {
            if (name in this && '__set__' in this[name]) {
                this[name].__set__(this, value);
            }
            this[name] = value;
        },
        // no delattr, because no 'del' statement

        // Conversion
        toJSON: function () {
            throw new Error(this.constructor.name + ' can not be converted to JSON');
        }
    });
    var NoneType = py.type('NoneType', null, {
        __nonzero__: function () { return py.False; },
        toJSON: function () { return null; }
    });
    py.None = py.PY_call(NoneType);
    var NotImplementedType = py.type('NotImplementedType', null, {});
    py.NotImplemented = py.PY_call(NotImplementedType);
    var booleans_initialized = false;
    py.bool = py.type('bool', null, {
        __new__: function () {
            if (!booleans_initialized) {
                return py.object.__new__.apply(this);
            }

            var ph = {};
            var args = py.PY_parseArgs(arguments, [['value', ph]]);
            if (args.value === ph) {
                return py.False;
            }
            return py.PY_isTrue(args.value) ? py.True : py.False;
        },
        __str__: function () {
            return py.str.fromJSON((this === py.True) ? "True" : "False");
        },
        __nonzero__: function () { return this; },
        fromJSON: function (val) { return val ? py.True : py.False },
        toJSON: function () { return this === py.True; }
    });
    py.True = py.PY_call(py.bool);
    py.False = py.PY_call(py.bool);
    booleans_initialized = true;
    py.float = py.type('float', null, {
        __init__: function () {
            var placeholder = {};
            var args = py.PY_parseArgs(arguments, [['value', placeholder]]);
            var value = args.value;
            if (value === placeholder) {
                this._value = 0; return;
            }
            if (py.PY_isInstance(value, py.float)) {
                this._value = value._value;
            }
            if (py.PY_isInstance(value, py.object) && '__float__' in value) {
                var res = value.__float__();
                if (py.PY_isInstance(res, py.float)) {
                    this._value = res._value;
                    return;
                }
                throw new Error('TypeError: __float__ returned non-float (type ' +
                    typename(res) + ')');
            }
            throw new Error('TypeError: float() argument must be a string or a number');
        },
        __str__: function () {
            return py.str.fromJSON(String(this._value));
        },
        __eq__: function (other) {
            return this._value === other._value ? py.True : py.False;
        },
        __lt__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            return this._value < other._value ? py.True : py.False;
        },
        __le__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            return this._value <= other._value ? py.True : py.False;
        },
        __gt__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            return this._value > other._value ? py.True : py.False;
        },
        __ge__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            return this._value >= other._value ? py.True : py.False;
        },
        __abs__: function () {
            return py.float.fromJSON(
                Math.abs(this._value));
        },
        __add__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            return py.float.fromJSON(this._value + other._value);
        },
        __neg__: function () {
            return py.float.fromJSON(-this._value);
        },
        __sub__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            return py.float.fromJSON(this._value - other._value);
        },
        __mul__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            return py.float.fromJSON(this._value * other._value);
        },
        __div__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            return py.float.fromJSON(this._value / other._value);
        },
        __nonzero__: function () {
            return this._value ? py.True : py.False;
        },
        fromJSON: function (v) {
            if (!(typeof v === 'number')) {
                throw new Error('py.float.fromJSON can only take numbers');
            }
            var instance = py.PY_call(py.float);
            instance._value = v;
            return instance;
        },
        toJSON: function () {
            return this._value;
        }
    });
    py.str = py.type('str', null, {
        __init__: function () {
            var placeholder = {};
            var args = py.PY_parseArgs(arguments, [['value', placeholder]]);
            var s = args.value;
            if (s === placeholder) { this._value = ''; return; }
            this._value = py.PY_str(s)._value;
        },
        __hash__: function () {
            return '\1\0\1' + this._value;
        },
        __str__: function () {
            return this;
        },
        __eq__: function (other) {
            if (py.PY_isInstance(other, py.str)
                && this._value === other._value) {
                return py.True;
            }
            return py.False;
        },
        __lt__: function (other) {
            if (py.PY_not(py.PY_call(py.isinstance, [other, py.str]))) {
                return py.NotImplemented;
            }
            return this._value < other._value ? py.True : py.False;
        },
        __le__: function (other) {
            if (!py.PY_isInstance(other, py.str)) {
                return py.NotImplemented;
            }
            return this._value <= other._value ? py.True : py.False;
        },
        __gt__: function (other) {
            if (!py.PY_isInstance(other, py.str)) {
                return py.NotImplemented;
            }
            return this._value > other._value ? py.True : py.False;
        },
        __ge__: function (other) {
            if (!py.PY_isInstance(other, py.str)) {
                return py.NotImplemented;
            }
            return this._value >= other._value ? py.True : py.False;
        },
        __add__: function (other) {
            if (!py.PY_isInstance(other, py.str)) {
                return py.NotImplemented;
            }
            return py.str.fromJSON(this._value + other._value);
        },
        __nonzero__: function () {
            return this._value.length ? py.True : py.False;
        },
        __contains__: function (s) {
            return (this._value.indexOf(s._value) !== -1) ? py.True : py.False;
        },
        fromJSON: function (s) {
            if (typeof s === 'string') {
                var instance = py.PY_call(py.str);
                instance._value = s;
                return instance;
            }
            throw new Error("str.fromJSON can only take strings");
        },
        toJSON: function () {
            return this._value;
        }
    });
    py.tuple = py.type('tuple', null, {
        __init__: function () {
            this._values = [];
        },
        __len__: function () {
            return this._values.length;
        },
        __nonzero__: function () {
            return py.PY_size(this) > 0 ? py.True : py.False;
        },
        __contains__: function (value) {
            for (var i = 0, len = this._values.length; i < len; ++i) {
                if (py.PY_isTrue(this._values[i].__eq__(value))) {
                    return py.True;
                }
            }
            return py.False;
        },
        __getitem__: function (index) {
            return this._values[index.toJSON()];
        },
        toJSON: function () {
            var out = [];
            for (var i = 0; i < this._values.length; ++i) {
                out.push(this._values[i].toJSON());
            }
            return out;
        },
        fromJSON: function (ar) {
            if (!(ar instanceof Array)) {
                throw new Error("Can only create a py.tuple from an Array");
            }
            var t = py.PY_call(py.tuple);
            for (var i = 0; i < ar.length; ++i) {
                t._values.push(PY_ensurepy(ar[i]));
            }
            return t;
        }
    });
    py.list = py.type('list', null, {
        __nonzero__: function () {
            return this.__len__ > 0 ? py.True : py.False;
        },
    });
    _.defaults(py.list, py.tuple) // Copy attributes not redefined in type list
    py.dict = py.type('dict', null, {
        __init__: function () {
            this._store = {};
        },
        __getitem__: function (key) {
            var h = key.__hash__();
            if (!(h in this._store)) {
                throw new Error("KeyError: '" + key.toJSON() + "'");
            }
            return this._store[h][1];
        },
        __setitem__: function (key, value) {
            this._store[key.__hash__()] = [key, value];
        },
        __len__: function () {
            return Object.keys(this._store).length
        },
        __nonzero__: function () {
            return py.PY_size(this) > 0 ? py.True : py.False;
        },
        get: function () {
            var args = py.PY_parseArgs(arguments, ['k', ['d', py.None]]);
            var h = args.k.__hash__();
            if (!(h in this._store)) {
                return args.d;
            }
            return this._store[h][1];
        },
        fromJSON: function (d) {
            var instance = py.PY_call(py.dict);
            for (var k in (d || {})) {
                if (!d.hasOwnProperty(k)) { continue; }
                instance.__setitem__(
                    py.str.fromJSON(k),
                    PY_ensurepy(d[k]));
            }
            return instance;
        },
        toJSON: function () {
            var out = {};
            for (var k in this._store) {
                var item = this._store[k];
                out[item[0].toJSON()] = item[1].toJSON();
            }
            return out;
        }
    });
    py.PY_def = py.type('function', null, {
        __call__: function () {
            // don't want to rewrite __call__ for instancemethod
            return this._func.apply(this._inst, arguments);
        },
        fromJSON: function (nativefunc) {
            var instance = py.PY_call(py.PY_def);
            instance._inst = null;
            instance._func = nativefunc;
            return instance;
        },
        toJSON: function () {
            return this._func;
        }
    });
    py.classmethod = py.type('classmethod', null, {
        __init__: function () {
            var args = py.PY_parseArgs(arguments, 'function');
            this._func = args['function'];
        },
        __get__: function (obj, type) {
            return PY_instancemethod.fromJSON(this._func, type);
        },
        fromJSON: function (func) {
            return py.PY_call(py.classmethod, [func]);
        }
    });
    var PY_instancemethod = py.type('instancemethod', [py.PY_def], {
        fromJSON: function (nativefunc, instance) {
            var inst = py.PY_call(PY_instancemethod);
            // could also use bind?
            inst._inst = instance;
            inst._func = nativefunc;
            return inst;
        }
    });

    py.abs = new py.PY_def.fromJSON(function abs() {
        var args = py.PY_parseArgs(arguments, ['number']);
        if (!args.number.__abs__) {
            throw new Error(
                "TypeError: bad operand type for abs(): '"
                + typename(args.number)
                + "'");
        }
        return args.number.__abs__();
    });
    py.len = new py.PY_def.fromJSON(function len() {
        var args = py.PY_parseArgs(arguments, ['object']);
        return py.float.fromJSON(py.PY_size(args.object));
    });
    py.isinstance = new py.PY_def.fromJSON(function isinstance() {
        var args = py.PY_parseArgs(arguments, ['object', 'class']);
        return py.PY_isInstance(args.object, args['class'])
            ? py.True : py.False;
    });
    py.issubclass = new py.PY_def.fromJSON(function issubclass() {
        var args = py.PY_parseArgs(arguments, ['C', 'B']);
        return py.PY_isSubclass(args.C, args.B)
            ? py.True : py.False;
    });


    /**
     * Implements the decoding of Python string literals (embedded in
     * JS strings) into actual JS strings. This includes the decoding
     * of escapes into their corresponding JS
     * characters/codepoints/whatever.
     *
     * The ``unicode`` flags notes whether the literal should be
     * decoded as a bytestring literal or a unicode literal, which
     * pretty much only impacts decoding (or not) of unicode escapes
     * at this point since bytestrings are not technically handled
     * (everything is decoded to JS "unicode" strings)
     *
     * Eventurally, ``str`` could eventually use typed arrays, that'd
     * be interesting...
     */
    var PY_decode_string_literal = function (str, unicode) {
        var out = [], code;
        // Directly maps a single escape code to an output
        // character
        var direct_map = {
            '\\': '\\',
            '"': '"',
            "'": "'",
            'a': '\x07',
            'b': '\x08',
            'f': '\x0c',
            'n': '\n',
            'r': '\r',
            't': '\t',
            'v': '\v'
        };

        for (var i = 0; i < str.length; ++i) {
            if (str[i] !== '\\') {
                out.push(str[i]);
                continue;
            }
            var escape = str[i + 1];
            if (escape in direct_map) {
                out.push(direct_map[escape]);
                ++i;
                continue;
            }

            switch (escape) {
                // Ignored
                case '\n': ++i; continue;
                // Character named name in the Unicode database (Unicode only)
                case 'N':
                    if (!unicode) { break; }
                    throw Error("SyntaxError: \\N{} escape not implemented");
                case 'u':
                    if (!unicode) { break; }
                    var uni = str.slice(i + 2, i + 6);
                    if (!/[0-9a-f]{4}/i.test(uni)) {
                        throw new Error([
                            "SyntaxError: (unicode error) 'unicodeescape' codec",
                            " can't decode bytes in position ",
                            i, "-", i + 4,
                            ": truncated \\uXXXX escape"
                        ].join(''));
                    }
                    code = parseInt(uni, 16);
                    out.push(String.fromCharCode(code));
                    // escape + 4 hex digits
                    i += 5;
                    continue;
                case 'U':
                    if (!unicode) { break; }
                    // TODO: String.fromCodePoint
                    throw Error("SyntaxError: \\U escape not implemented");
                case 'x':
                    // get 2 hex digits
                    var hex = str.slice(i + 2, i + 4);
                    if (!/[0-9a-f]{2}/i.test(hex)) {
                        if (!unicode) {
                            throw new Error('ValueError: invalid \\x escape');
                        }
                        throw new Error([
                            "SyntaxError: (unicode error) 'unicodeescape'",
                            " codec can't decode bytes in position ",
                            i, '-', i + 2,
                            ": truncated \\xXX escape"
                        ].join(''))
                    }
                    code = parseInt(hex, 16);
                    out.push(String.fromCharCode(code));
                    // skip escape + 2 hex digits
                    i += 3;
                    continue;
                default:
                    // Check if octal
                    if (!/[0-8]/.test(escape)) { break; }
                    var r = /[0-8]{1,3}/g;
                    r.lastIndex = i + 1;
                    var m = r.exec(str);
                    var oct = m[0];
                    code = parseInt(oct, 8);
                    out.push(String.fromCharCode(code));
                    // skip matchlength
                    i += oct.length;
                    continue;
            }
            out.push('\\');
        }

        return out.join('');
    };
    // All binary operators with fallbacks, so they can be applied generically
    var PY_operators = {
        '==': ['eq', 'eq', function (a, b) { return a === b; }],
        '!=': ['ne', 'ne', function (a, b) { return a !== b; }],
        '<>': ['ne', 'ne', function (a, b) { return a !== b; }],
        '<': ['lt', 'gt', function (a, b) { return a.__class__.__name__ < b.__class__.__name__; }],
        '<=': ['le', 'ge', function (a, b) { return a.__class__.__name__ <= b.__class__.__name__; }],
        '>': ['gt', 'lt', function (a, b) { return a.__class__.__name__ > b.__class__.__name__; }],
        '>=': ['ge', 'le', function (a, b) { return a.__class__.__name__ >= b.__class__.__name__; }],

        '+': ['add', 'radd'],
        '-': ['sub', 'rsub'],
        '*': ['mul', 'rmul'],
        '/': ['div', 'rdiv'],
        '//': ['floordiv', 'rfloordiv'],
        '%': ['mod', 'rmod'],
        '**': ['pow', 'rpow'],
        '<<': ['lshift', 'rlshift'],
        '>>': ['rshift', 'rrshift'],
        '&': ['and', 'rand'],
        '^': ['xor', 'rxor'],
        '|': ['or', 'ror']
    };
    /**
      * Implements operator fallback/reflection.
      *
      * First two arguments are the objects to apply the operator on,
      * in their actual order (ltr).
      *
      * Third argument is the actual operator.
      *
      * If the operator methods raise exceptions, those exceptions are
      * not intercepted.
      */
    var PY_op = function (o1, o2, op) {
        var r;
        var methods = PY_operators[op];
        var forward = '__' + methods[0] + '__', reverse = '__' + methods[1] + '__';
        var otherwise = methods[2];

        if (forward in o1 && (r = o1[forward](o2)) !== py.NotImplemented) {
            return r;
        }
        if (reverse in o2 && (r = o2[reverse](o1)) !== py.NotImplemented) {
            return r;
        }
        if (otherwise) {
            return PY_ensurepy(otherwise(o1, o2));
        }
        throw new Error(
            "TypeError: unsupported operand type(s) for " + op + ": '"
            + typename(o1) + "' and '" + typename(o2) + "'");
    };

    var PY_builtins = {
        type: py.type,

        None: py.None,
        True: py.True,
        False: py.False,
        NotImplemented: py.NotImplemented,

        object: py.object,
        bool: py.bool,
        float: py.float,
        str: py.str,
        unicode: py.unicode,
        tuple: py.tuple,
        list: py.list,
        dict: py.dict,

        abs: py.abs,
        len: py.len,
        isinstance: py.isinstance,
        issubclass: py.issubclass,
        classmethod: py.classmethod,
    };

    py.parse = function (toks) {
        var index = 0;
        token = toks[0];
        next = function () { return toks[++index]; };
        return expression();
    };
    var evaluate_operator = function (operator, a, b) {
        switch (operator) {
            case 'is': return a === b ? py.True : py.False;
            case 'is not': return a !== b ? py.True : py.False;
            case 'in':
                return b.__contains__(a);
            case 'not in':
                return py.PY_isTrue(b.__contains__(a)) ? py.False : py.True;
            case '==': case '!=': case '<>':
            case '<': case '<=':
            case '>': case '>=':
                return PY_op(a, b, operator);
        }
        throw new Error('SyntaxError: unknown comparator [[' + operator + ']]');
    };
    py.evaluate = function (expr, context) {
        context = context || {};
        switch (expr.id) {
            case '(name)':
                var val = context[expr.value];
                if (val === undefined && expr.value in PY_builtins) {
                    return PY_builtins[expr.value];
                }
                return PY_ensurepy(val, expr.value);
            case '(string)':
                return py.str.fromJSON(PY_decode_string_literal(
                    expr.value, expr.unicode));
            case '(number)':
                return py.float.fromJSON(expr.value);
            case '(constant)':
                switch (expr.value) {
                    case 'None': return py.None;
                    case 'False': return py.False;
                    case 'True': return py.True;
                }
                throw new Error("SyntaxError: unknown constant '" + expr.value + "'");
            case '(comparator)':
                var result, left = py.evaluate(expr.expressions[0], context);
                for (var i = 0; i < expr.operators.length; ++i) {
                    result = evaluate_operator(
                        expr.operators[i],
                        left,
                        left = py.evaluate(expr.expressions[i + 1], context));
                    if (py.PY_not(result)) { return py.False; }
                }
                return py.True;
            case 'not':
                return py.PY_isTrue(py.evaluate(expr.first, context)) ? py.False : py.True;
            case 'and':
                var and_first = py.evaluate(expr.first, context);
                if (py.PY_isTrue(and_first.__nonzero__())) {
                    return py.evaluate(expr.second, context);
                }
                return and_first;
            case 'or':
                var or_first = py.evaluate(expr.first, context);
                if (py.PY_isTrue(or_first.__nonzero__())) {
                    return or_first
                }
                return py.evaluate(expr.second, context);
            case '(':
                if (expr.second) {
                    var callable = py.evaluate(expr.first, context);
                    var args = [], kwargs = {};
                    for (var jj = 0; jj < expr.second.length; ++jj) {
                        var arg = expr.second[jj];
                        if (arg.id !== '=') {
                            // arg
                            args.push(py.evaluate(arg, context));
                        } else {
                            // kwarg
                            kwargs[arg.first.value] =
                                py.evaluate(arg.second, context);
                        }
                    }
                    return py.PY_call(callable, args, kwargs);
                }
                var tuple_exprs = expr.first,
                    tuple_values = [];
                for (var j = 0, len = tuple_exprs.length; j < len; ++j) {
                    tuple_values.push(py.evaluate(
                        tuple_exprs[j], context));
                }
                return py.tuple.fromJSON(tuple_values);
            case '[':
                if (expr.second) {
                    return py.PY_getItem(
                        py.evaluate(expr.first, context),
                        py.evaluate(expr.second, context));
                }
                var list_exprs = expr.first, list_values = [];
                for (var k = 0; k < list_exprs.length; ++k) {
                    list_values.push(py.evaluate(
                        list_exprs[k], context));
                }
                return py.list.fromJSON(list_values);
            case '{':
                var dict_exprs = expr.first, dict = py.PY_call(py.dict);
                for (var l = 0; l < dict_exprs.length; ++l) {
                    py.PY_setItem(dict,
                        py.evaluate(dict_exprs[l][0], context),
                        py.evaluate(dict_exprs[l][1], context));
                }
                return dict;
            case '.':
                if (expr.second.id !== '(name)') {
                    throw new Error('SyntaxError: ' + expr);
                }
                return py.PY_getAttr(py.evaluate(expr.first, context),
                    expr.second.value);
            // numerical operators
            case '~':
                return (py.evaluate(expr.first, context)).__invert__();
            case '+':
                if (!expr.second) {
                    return py.PY_positive(py.evaluate(expr.first, context));
                }
            case '-':
                if (!expr.second) {
                    return py.PY_negative(py.evaluate(expr.first, context));
                }
            case '*': case '/': case '//':
            case '%':
            case '**':
            case '<<': case '>>':
            case '&': case '^': case '|':
                return PY_op(
                    py.evaluate(expr.first, context),
                    py.evaluate(expr.second, context),
                    expr.id);

            default:
                throw new Error('SyntaxError: Unknown node [[' + expr.id + ']]');
        }
    };
    py.eval = function (str, context) {
        return py.evaluate(
            py.parse(
                py.tokenize(
                    str)),
            context).toJSON();
    }
}

function pyeval() {
    // var core = require('web.core');
    // var utils = require('web.utils');

    // var _t = core._t;
    // var py = window.py; // to silence linters
    /*
     * py.js helpers and setup
     */

    var utils = makeUtils();
    var py = {};
    makePy(py);
    var obj = function () { };
    obj.prototype = py.object;
    var asJS = function (arg) {
        if (arg instanceof obj) {
            return arg.toJSON();
        }
        return arg;
    };

    var datetime = py.PY_call(py.object);

    var zero = py.float.fromJSON(0);

    // Port from pypy/lib_pypy/datetime.py
    var DAYS_IN_MONTH = [null, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var DAYS_BEFORE_MONTH = [null];
    var dbm = 0;

    for (var i = 1; i < DAYS_IN_MONTH.length; ++i) {
        DAYS_BEFORE_MONTH.push(dbm);
        dbm += DAYS_IN_MONTH[i];
    }

    function is_leap(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    function days_before_year(year) {
        var y = year - 1;
        return y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
    }

    function days_in_month(year, month) {
        if (month === 2 && is_leap(year)) {
            return 29;
        }
        return DAYS_IN_MONTH[month];
    }

    function days_before_month(year, month) {
        var post_leap_feb = month > 2 && is_leap(year);
        return DAYS_BEFORE_MONTH[month] + (post_leap_feb ? 1 : 0);
    }

    function ymd2ord(year, month, day) {
        var dim = days_in_month(year, month);
        if (!(1 <= day && day <= dim)) {
            throw new Error("ValueError: day must be in 1.." + dim);
        }
        return days_before_year(year) +
            days_before_month(year, month) +
            day;
    }

    var DI400Y = days_before_year(401);
    var DI100Y = days_before_year(101);
    var DI4Y = days_before_year(5);

    function ord2ymd(n) {
        --n;
        var n400, n100, n4, n1, n0;
        utils.divmod(n, DI400Y, function (_n400, n) {
            n400 = _n400;
            utils.divmod(n, DI100Y, function (_n100, n) {
                n100 = _n100;
                utils.divmod(n, DI4Y, function (_n4, n) {
                    n4 = _n4;
                    utils.divmod(n, 365, function (_n1, n) {
                        n1 = _n1;
                        n0 = n;
                    });
                });
            });
        });

        n = n0;
        var year = n400 * 400 + 1 + n100 * 100 + n4 * 4 + n1;
        if (n1 == 4 || n100 == 100) {
            utils.assert(n0 === 0);
            return {
                year: year - 1,
                month: 12,
                day: 31
            };
        }

        var leapyear = n1 === 3 && (n4 !== 24 || n100 == 3);
        utils.assert(leapyear == is_leap(year));
        var month = (n + 50) >> 5;
        var preceding = DAYS_BEFORE_MONTH[month] + ((month > 2 && leapyear) ? 1 : 0);
        if (preceding > n) {
            --month;
            preceding -= DAYS_IN_MONTH[month] + ((month === 2 && leapyear) ? 1 : 0);
        }
        n -= preceding;
        return {
            year: year,
            month: month,
            day: n + 1
        };
    }

    /**
     * Converts the stuff passed in into a valid date, applying overflows as needed
     */
    function tmxxx(year, month, day, hour, minute, second, microsecond) {
        hour = hour || 0; minute = minute || 0; second = second || 0;
        microsecond = microsecond || 0;

        if (microsecond < 0 || microsecond > 999999) {
            utils.divmod(microsecond, 1000000, function (carry, ms) {
                microsecond = ms;
                second += carry;
            });
        }
        if (second < 0 || second > 59) {
            utils.divmod(second, 60, function (carry, s) {
                second = s;
                minute += carry;
            });
        }
        if (minute < 0 || minute > 59) {
            utils.divmod(minute, 60, function (carry, m) {
                minute = m;
                hour += carry;
            });
        }
        if (hour < 0 || hour > 23) {
            utils.divmod(hour, 24, function (carry, h) {
                hour = h;
                day += carry;
            });
        }
        // That was easy.  Now it gets muddy:  the proper range for day
        // can't be determined without knowing the correct month and year,
        // but if day is, e.g., plus or minus a million, the current month
        // and year values make no sense (and may also be out of bounds
        // themselves).
        // Saying 12 months == 1 year should be non-controversial.
        if (month < 1 || month > 12) {
            utils.divmod(month - 1, 12, function (carry, m) {
                month = m + 1;
                year += carry;
            });
        }
        // Now only day can be out of bounds (year may also be out of bounds
        // for a datetime object, but we don't care about that here).
        // If day is out of bounds, what to do is arguable, but at least the
        // method here is principled and explainable.
        var dim = days_in_month(year, month);
        if (day < 1 || day > dim) {
            // Move day-1 days from the first of the month.  First try to
            // get off cheap if we're only one day out of range (adjustments
            // for timezone alone can't be worse than that).
            if (day === 0) {
                --month;
                if (month > 0) {
                    day = days_in_month(year, month);
                } else {
                    --year; month = 12; day = 31;
                }
            } else if (day == dim + 1) {
                ++month;
                day = 1;
                if (month > 12) {
                    month = 1;
                    ++year;
                }
            } else {
                var r = ord2ymd(ymd2ord(year, month, 1) + (day - 1));
                year = r.year;
                month = r.month;
                day = r.day;
            }
        }
        return {
            year: year,
            month: month,
            day: day,
            hour: hour,
            minute: minute,
            second: second,
            microsecond: microsecond
        };
    }

    datetime.timedelta = py.type('timedelta', null, {
        __init__: function () {
            var args = py.PY_parseArgs(arguments, [
                ['days', zero], ['seconds', zero], ['microseconds', zero],
                ['milliseconds', zero], ['minutes', zero], ['hours', zero],
                ['weeks', zero]
            ]);

            var d = 0, s = 0, m = 0;
            var days = args.days.toJSON() + args.weeks.toJSON() * 7;
            var seconds = args.seconds.toJSON()
                + args.minutes.toJSON() * 60
                + args.hours.toJSON() * 3600;
            var microseconds = args.microseconds.toJSON()
                + args.milliseconds.toJSON() * 1000;

            // Get rid of all fractions, and normalize s and us.
            // Take a deep breath <wink>.
            var daysecondsfrac = utils.modf(days, function (dayfrac, days) {
                d = days;
                if (dayfrac) {
                    return utils.modf(dayfrac * 24 * 3600, function (dsf, dsw) {
                        s = dsw;
                        return dsf;
                    });
                }
                return 0;
            });

            var secondsfrac = utils.modf(seconds, function (sf, s) {
                seconds = s;
                return sf + daysecondsfrac;
            });
            utils.divmod(seconds, 24 * 3600, function (days, seconds) {
                d += days;
                s += seconds;
            });
            // seconds isn't referenced again before redefinition

            microseconds += secondsfrac * 1e6;
            utils.divmod(microseconds, 1000000, function (seconds, microseconds) {
                utils.divmod(seconds, 24 * 3600, function (days, seconds) {
                    d += days;
                    s += seconds;
                    m += Math.round(microseconds);
                });
            });

            // Carrying still possible here?

            this.days = d;
            this.seconds = s;
            this.microseconds = m;
        },
        __str__: function () {
            var hh, mm, ss;
            utils.divmod(this.seconds, 60, function (m, s) {
                utils.divmod(m, 60, function (h, m) {
                    hh = h;
                    mm = m;
                    ss = s;
                });
            });
            var s = _.str.sprintf("%d:%02d:%02d", hh, mm, ss);
            if (this.days) {
                s = _.str.sprintf("%d day%s, %s",
                    this.days,
                    (this.days != 1 && this.days != -1) ? 's' : '',
                    s);
            }
            if (this.microseconds) {
                s = _.str.sprintf("%s.%06d", s, this.microseconds);
            }
            return py.str.fromJSON(s);
        },
        __eq__: function (other) {
            if (!py.PY_isInstance(other, datetime.timedelta)) {
                return py.False;
            }

            return (this.days === other.days
                && this.seconds === other.seconds
                && this.microseconds === other.microseconds)
                ? py.True : py.False;
        },
        __add__: function (other) {
            if (!py.PY_isInstance(other, datetime.timedelta)) {
                return py.NotImplemented;
            }
            return py.PY_call(datetime.timedelta, [
                py.float.fromJSON(this.days + other.days),
                py.float.fromJSON(this.seconds + other.seconds),
                py.float.fromJSON(this.microseconds + other.microseconds)
            ]);
        },
        __radd__: function (other) { return this.__add__(other); },
        __sub__: function (other) {
            if (!py.PY_isInstance(other, datetime.timedelta)) {
                return py.NotImplemented;
            }
            return py.PY_call(datetime.timedelta, [
                py.float.fromJSON(this.days - other.days),
                py.float.fromJSON(this.seconds - other.seconds),
                py.float.fromJSON(this.microseconds - other.microseconds)
            ]);
        },
        __rsub__: function (other) {
            if (!py.PY_isInstance(other, datetime.timedelta)) {
                return py.NotImplemented;
            }
            return this.__neg__().__add__(other);
        },
        __neg__: function () {
            return py.PY_call(datetime.timedelta, [
                py.float.fromJSON(-this.days),
                py.float.fromJSON(-this.seconds),
                py.float.fromJSON(-this.microseconds)
            ]);
        },
        __pos__: function () { return this; },
        __mul__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            var n = other.toJSON();
            return py.PY_call(datetime.timedelta, [
                py.float.fromJSON(this.days * n),
                py.float.fromJSON(this.seconds * n),
                py.float.fromJSON(this.microseconds * n)
            ]);
        },
        __rmul__: function (other) { return this.__mul__(other); },
        __div__: function (other) {
            if (!py.PY_isInstance(other, py.float)) {
                return py.NotImplemented;
            }
            var usec = ((this.days * 24 * 3600) + this.seconds) * 1000000
                + this.microseconds;
            return py.PY_call(
                datetime.timedelta, [
                    zero, zero, py.float.fromJSON(usec / other.toJSON())]);
        },
        __floordiv__: function (other) { return this.__div__(other); },
        total_seconds: function () {
            return py.float.fromJSON(
                this.days * 86400
                + this.seconds
                + this.microseconds / 1000000);
        },
        __nonzero__: function () {
            return (!!this.days || !!this.seconds || !!this.microseconds)
                ? py.True
                : py.False;
        }
    });

    datetime.datetime = py.type('datetime', null, {
        __init__: function () {
            var zero = py.float.fromJSON(0);
            var args = py.PY_parseArgs(arguments, [
                'year', 'month', 'day',
                ['hour', zero], ['minute', zero], ['second', zero],
                ['microsecond', zero], ['tzinfo', py.None]
            ]);
            for (var key in args) {
                if (!args.hasOwnProperty(key)) { continue; }
                this[key] = asJS(args[key]);
            }
        },
        replace: function () {
            var args = py.PY_parseArgs(arguments, [
                ['year', py.None], ['month', py.None], ['day', py.None],
                ['hour', py.None], ['minute', py.None], ['second', py.None],
                ['microsecond', py.None] // FIXME: tzinfo, can't use None as valid input
            ]);
            var params = {};
            for (var key in args) {
                if (!args.hasOwnProperty(key)) { continue; }

                var arg = args[key];
                params[key] = (arg === py.None ? this[key] : asJS(arg));
            }
            return py.PY_call(datetime.datetime, params);
        },
        strftime: function () {
            var self = this;
            var args = py.PY_parseArgs(arguments, 'format');
            return py.str.fromJSON(args.format.toJSON()
                .replace(/%([A-Za-z])/g, function (m, c) {
                    switch (c) {
                        case 'Y': return _.str.sprintf('%04d', self.year);
                        case 'm': return _.str.sprintf('%02d', self.month);
                        case 'd': return _.str.sprintf('%02d', self.day);
                        case 'H': return _.str.sprintf('%02d', self.hour);
                        case 'M': return _.str.sprintf('%02d', self.minute);
                        case 'S': return _.str.sprintf('%02d', self.second);
                    }
                    throw new Error('ValueError: No known conversion for ' + m);
                }));
        },
        now: py.classmethod.fromJSON(function () {
            var d = new Date();
            return py.PY_call(datetime.datetime, [
                d.getFullYear(), d.getMonth() + 1, d.getDate(),
                d.getHours(), d.getMinutes(), d.getSeconds(),
                d.getMilliseconds() * 1000]);
        }),
        today: py.classmethod.fromJSON(function () {
            var dt_class = py.PY_getAttr(datetime, 'datetime');
            return py.PY_call(py.PY_getAttr(dt_class, 'now'));
        }),
        utcnow: py.classmethod.fromJSON(function () {
            var d = new Date();
            return py.PY_call(datetime.datetime,
                [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(),
                d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(),
                d.getUTCMilliseconds() * 1000]);
        }),
        combine: py.classmethod.fromJSON(function () {
            var args = py.PY_parseArgs(arguments, 'date time');
            return py.PY_call(datetime.datetime, [
                py.PY_getAttr(args.date, 'year'),
                py.PY_getAttr(args.date, 'month'),
                py.PY_getAttr(args.date, 'day'),
                py.PY_getAttr(args.time, 'hour'),
                py.PY_getAttr(args.time, 'minute'),
                py.PY_getAttr(args.time, 'second')
            ]);
        }),
        toJSON: function () {
            return new Date(
                this.year,
                this.month - 1,
                this.day,
                this.hour,
                this.minute,
                this.second,
                this.microsecond / 1000);
        },
        __add__: function (other) {
            if (!py.PY_isInstance(other, datetime.timedelta)) {
                return py.NotImplemented;
            }
            var s = tmxxx(this.year, this.month, this.day + other.days, this.hour, this.minute, this.second + other.seconds);
            return datetime.datetime.fromJSON(s.year, s.month, s.day, s.hour, s.minute, s.second);
        },
        __sub__: function (other) {
            if (py.PY_isInstance(other, datetime.timedelta)) {
                return py.PY_add(this, py.PY_negative(other));
            }
            return py.NotImplemented;
        },
        fromJSON: function (year, month, day, hour, minute, second) {
            return py.PY_call(datetime.datetime, [year, month, day, hour, minute, second]);
        },
    });

    datetime.date = py.type('date', null, {
        __init__: function () {
            var args = py.PY_parseArgs(arguments, 'year month day');
            this.year = asJS(args.year);
            this.month = asJS(args.month);
            this.day = asJS(args.day);
        },
        strftime: function () {
            var self = this;
            var args = py.PY_parseArgs(arguments, 'format');
            return py.str.fromJSON(args.format.toJSON()
                .replace(/%([A-Za-z])/g, function (m, c) {
                    switch (c) {
                        case 'Y': return self.year;
                        case 'm': return _.str.sprintf('%02d', self.month);
                        case 'd': return _.str.sprintf('%02d', self.day);
                    }
                    throw new Error('ValueError: No known conversion for ' + m);
                }));
        },
        __eq__: function (other) {
            return (this.year === other.year
                && this.month === other.month
                && this.day === other.day)
                ? py.True : py.False;
        },
        replace: function () {
            var args = py.PY_parseArgs(arguments, [
                ['year', py.None], ['month', py.None], ['day', py.None]
            ]);
            var params = {};
            for (var key in args) {
                if (!args.hasOwnProperty(key)) { continue; }

                var arg = args[key];
                params[key] = (arg === py.None ? this[key] : asJS(arg));
            }
            return py.PY_call(datetime.date, params);
        },
        __add__: function (other) {
            if (!py.PY_isInstance(other, datetime.timedelta)) {
                return py.NotImplemented;
            }
            var s = tmxxx(this.year, this.month, this.day + other.days);
            return datetime.date.fromJSON(s.year, s.month, s.day);
        },
        __radd__: function (other) { return this.__add__(other); },
        __sub__: function (other) {
            if (py.PY_isInstance(other, datetime.timedelta)) {
                return py.PY_add(this, py.PY_negative(other));
            }
            if (py.PY_isInstance(other, datetime.date)) {
                // FIXME: getattr and sub API methods
                return py.PY_call(datetime.timedelta, [
                    py.PY_subtract(
                        py.PY_call(py.PY_getAttr(this, 'toordinal')),
                        py.PY_call(py.PY_getAttr(other, 'toordinal')))
                ]);
            }
            return py.NotImplemented;
        },
        toordinal: function () {
            return py.float.fromJSON(ymd2ord(this.year, this.month, this.day));
        },
        weekday: function () {
            return py.float.fromJSON((this.toordinal().toJSON() + 6) % 7);
        },
        fromJSON: function (year, month, day) {
            return py.PY_call(datetime.date, [year, month, day]);
        },
        today: py.classmethod.fromJSON(function () {
            var d = new Date();
            return py.PY_call(datetime.date, [
                d.getFullYear(), d.getMonth() + 1, d.getDate()]);
        }),
    });
    /**
     * Returns the current local date, which means the date on the client (which can be different
     * compared to the date of the server).
     *
     * @return {datetime.date}
     */
    function context_today() {
        var d = new Date();
        return py.PY_call(
            datetime.date, [d.getFullYear(), d.getMonth() + 1, d.getDate()]);
    }

    datetime.time = py.type('time', null, {
        __init__: function () {
            var zero = py.float.fromJSON(0);
            var args = py.PY_parseArgs(arguments, [
                ['hour', zero], ['minute', zero], ['second', zero], ['microsecond', zero],
                ['tzinfo', py.None]
            ]);

            for (var k in args) {
                if (!args.hasOwnProperty(k)) { continue; }
                this[k] = asJS(args[k]);
            }
        }
    });

    var time = py.PY_call(py.object);
    time.strftime = py.PY_def.fromJSON(function () {
        var args = py.PY_parseArgs(arguments, 'format');
        var dt_class = py.PY_getAttr(datetime, 'datetime');
        var d = py.PY_call(py.PY_getAttr(dt_class, 'utcnow'));
        return py.PY_call(py.PY_getAttr(d, 'strftime'), [args.format]);
    });

    var args = _.map(('year month day '
        + 'years months weeks days '
        + 'weekday leapdays yearday nlyearday').split(' '), function (arg) {
            switch (arg) {
                case 'years': case 'months': case 'days': case 'leapdays': case 'weeks':
                    return [arg, zero];
                case 'year': case 'month': case 'day': case 'weekday':
                case 'yearday': case 'nlyearday':
                    return [arg, null];
                default:
                    throw new Error("Unknown relativedelta argument " + arg);
            }
        });
    args.unshift('*');

    var _utils = {
        monthrange: function (year, month) {
            if (month < 1 || month > 12) {
                throw new Error("Illegal month " + month);
            }

            var day1 = this.weekday(year, month, 1);
            var ndays = this.mdays[month] + (month == this.February && this.isleap(year));
            return [day1, ndays];
        },
        weekday: function (year, month, day) {
            var date = py.PY_call(datetime.date, [year, month, day]);
            return py.PY_call(py.PY_getAttr(date, 'weekday'));
        },
        isleap: function (year) {
            return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        },
        mdays: [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        January: 1,
        February: 2
    };

    var relativedelta = py.type('relativedelta', null, {
        __init__: function () {
            this.ops = py.PY_parseArgs(arguments, args);
            this.ops.days = py.float.fromJSON(
                asJS(this.ops.days) + asJS(this.ops.weeks) * 7
            );

            var yday = zero;
            if (this.ops.nlyearday) {
                yday = this.ops.nlyearday;
            } else if (this.ops.yearday) {
                yday = this.ops.yearday;
                if (asJS(this.ops.yearday) > 59) {
                    this.ops.leapdays = py.float.fromJS(-1);
                }
            }
            if (py.PY_isTrue(yday)) {
                var ydayidx = [31, 59, 90, 120, 151, 181, 212,
                    243, 273, 304, 334, 366];
                for (var idx = 0; idx < ydayidx.length; ++idx) {
                    var ydays = ydayidx[idx];
                    if (asJS(yday) <= ydays) {
                        this.ops.month = py.float.fromJSON(idx + 1);
                        if (!idx) {
                            this.ops.day = yday;
                        } else {
                            this.ops.day = py.PY_subtract(
                                yday,
                                py.float.fromJSON(ydayidx[idx - 1])
                            );
                        }
                        break;
                    }
                }
                if (idx === ydayidx.length) {
                    throw new Error("Invalid year day (" + asJS(yday) + ")");
                }
            }
            this._fix();
        },
        _fix: function () {
            var months = asJS(this.ops.months);
            if (Math.abs(months) > 11) {
                var s = months > 0 ? 1 : -1;
                var r = utils.divmod(months * s, 12);
                this.ops.months = py.float.fromJSON(r.mod * s);
                this.ops.years = py.float.fromJSON(
                    asJS(this.ops.years) + r.div * s);
            }
            this._has_time = 0;
        },
        __add__: function (other) {
            if (!py.PY_isInstance(other, datetime.date)) {
                return py.NotImplemented;
            }
            // TODO: test this whole mess
            var year = (asJS(this.ops.year) || asJS(other.year)) + asJS(this.ops.years);
            var month = asJS(this.ops.month) || asJS(other.month);
            var months;
            if (months = asJS(this.ops.months)) {
                if (Math.abs(months) < 1 || Math.abs(months) > 12) {
                    throw new Error("Can only use relative months between -12 and +12");
                }
                month += months;
                if (month > 12) {
                    year += 1;
                    month -= 12;
                }
                if (month < 1) {
                    year -= 1;
                    month += 12;
                }
            }

            var day = Math.min(_utils.monthrange(year, month)[1],
                asJS(this.ops.day) || asJS(other.day));

            var repl = {
                year: py.float.fromJSON(year),
                month: py.float.fromJSON(month),
                day: py.float.fromJSON(day)
            };

            var days = asJS(this.ops.days);
            if (py.PY_isTrue(this.ops.leapdays) && month > 2 && _utils.isleap(year)) {
                days += asJS(this.ops.leapdays);
            }

            var ret = py.PY_add(
                py.PY_call(py.PY_getAttr(other, 'replace'), repl),
                py.PY_call(datetime.timedelta, {
                    days: py.float.fromJSON(days)
                })
            );

            if (this.ops.weekday) {
                // FIXME: only handles numeric weekdays, not decorated
                var weekday = asJS(this.ops.weekday), nth = 1;
                var jumpdays = (Math.abs(nth) - 1) * 7;

                var ret_weekday = asJS(py.PY_call(py.PY_getAttr(ret, 'weekday')));
                if (nth > 0) {
                    jumpdays += (7 - ret_weekday + weekday) % 7;
                } else {
                    jumpdays += (ret_weekday - weekday) % 7;
                    jumpdays *= -1;
                }
                ret = py.PY_add(
                    ret,
                    py.PY_call(datetime.timedelta, {
                        days: py.float.fromJSON(jumpdays)
                    })
                );
            }

            return ret;
        },
        __radd__: function (other) {
            return this.__add__(other);
        },
        __rsub__: function (other) {
            return this.__neg__().__radd__(other);
        },
        __neg__: function () {
            return py.PY_call(relativedelta, {
                years: py.PY_negative(this.ops.years),
                months: py.PY_negative(this.ops.months),
                days: py.PY_negative(this.ops.days),
                leapdays: this.ops.leapdays,
                year: this.ops.year,
                month: this.ops.month,
                day: this.ops.day,
                weekday: this.ops.weekday
            });
        }
    });

    // recursively wraps JS objects passed into the context to attributedicts
    // which jsonify back to JS objects
    function wrap(value) {
        if (value === null) { return py.None; }

        switch (typeof value) {
            case 'undefined': throw new Error("No conversion for undefined");
            case 'boolean': return py.bool.fromJSON(value);
            case 'number': return py.float.fromJSON(value);
            case 'string': return py.str.fromJSON(value);
        }

        switch (value.constructor) {
            case Object: return wrapping_dict.fromJSON(value);
            case Array: return wrapping_list.fromJSON(value);
        }

        throw new Error("ValueError: unable to wrap " + value);
    }

    var wrapping_dict = py.type('wrapping_dict', null, {
        __init__: function () {
            this._store = {};
        },
        __getitem__: function (key) {
            var k = key.toJSON();
            if (!(k in this._store)) {
                throw new Error("KeyError: '" + k + "'");
            }
            return wrap(this._store[k]);
        },
        __getattr__: function (key) {
            return this.__getitem__(py.str.fromJSON(key));
        },
        __len__: function () {
            return Object.keys(this._store).length;
        },
        __nonzero__: function () {
            return py.PY_size(this) > 0 ? py.True : py.False;
        },
        get: function () {
            var args = py.PY_parseArgs(arguments, ['k', ['d', py.None]]);

            if (!(args.k.toJSON() in this._store)) { return args.d; }
            return this.__getitem__(args.k);
        },
        fromJSON: function (d) {
            var instance = py.PY_call(wrapping_dict);
            instance._store = d;
            return instance;
        },
        toJSON: function () {
            return this._store;
        },
    });

    var wrapping_list = py.type('wrapping_list', null, {
        __init__: function () {
            this._store = [];
        },
        __getitem__: function (index) {
            return wrap(this._store[index.toJSON()]);
        },
        __len__: function () {
            return this._store.length;
        },
        __nonzero__: function () {
            return py.PY_size(this) > 0 ? py.True : py.False;
        },
        fromJSON: function (ar) {
            var instance = py.PY_call(wrapping_list);
            instance._store = ar;
            return instance;
        },
        toJSON: function () {
            return this._store;
        },
    });

    function wrap_context(context) {
        for (var k in context) {
            if (!context.hasOwnProperty(k)) { continue; }
            var val = context[k];

            if (val === null) { continue; }
            if (val.constructor === Array) {
                context[k] = wrapping_list.fromJSON(val);
            } else if (val.constructor === Object
                && !py.PY_isInstance(val, py.object)) {
                context[k] = wrapping_dict.fromJSON(val);
            }
        }
        return context;
    }

    function eval_contexts(contexts, evaluation_context) {
        evaluation_context = _.extend(pycontext(), evaluation_context || {});
        return _(contexts).reduce(function (result_context, ctx) {
            // __eval_context evaluations can lead to some of `contexts`'s
            // values being null, skip them as well as empty contexts
            if (_.isEmpty(ctx)) { return result_context; }
            if (_.isString(ctx)) {
                // wrap raw strings in context
                ctx = { __ref: 'context', __debug: ctx };
            }
            var evaluated = ctx;
            switch (ctx.__ref) {
                case 'context':
                    evaluation_context.context = evaluation_context;
                    evaluated = py.eval(ctx.__debug, wrap_context(evaluation_context));
                    break;
                case 'compound_context':
                    var eval_context = eval_contexts([ctx.__eval_context]);
                    evaluated = eval_contexts(
                        ctx.__contexts, _.extend({}, evaluation_context, eval_context));
                    break;
            }
            // add newly evaluated context to evaluation context for following
            // siblings
            _.extend(evaluation_context, evaluated);
            return _.extend(result_context, evaluated);
        }, {});
    }

    function eval_domains(domains, evaluation_context) {
        evaluation_context = _.extend(pycontext(), evaluation_context || {});
        var result_domain = [];
        // Normalize only if the first domain is the array ["|"] or ["!"]
        var need_normalization = (
            domains &&
            domains.length > 0 &&
            domains[0].length === 1 &&
            (domains[0][0] === "|" || domains[0][0] === "!")
        );
        _(domains).each(function (domain) {
            if (_.isString(domain)) {
                // wrap raw strings in domain
                domain = { __ref: 'domain', __debug: domain };
            }
            var domain_array_to_combine;
            switch (domain.__ref) {
                case 'domain':
                    evaluation_context.context = evaluation_context;
                    domain_array_to_combine = py.eval(domain.__debug, wrap_context(evaluation_context));
                    break;
                default:
                    domain_array_to_combine = domain;
            }
            if (need_normalization) {
                domain_array_to_combine = get_normalized_domain(domain_array_to_combine);
            }
            result_domain.push.apply(result_domain, domain_array_to_combine);
        });
        return result_domain;
    }

    /**
     * Returns a normalized copy of the given domain array. Normalization is
     * is making the implicit "&" at the start of the domain explicit, e.g.
     * [A, B, C] would become ["&", "&", A, B, C].
     *
     * @param {Array} domain_array
     * @returns {Array} normalized copy of the given array
     */
    function get_normalized_domain(domain_array) {
        var expected = 1; // Holds the number of expected domain expressions
        _.each(domain_array, function (item) {
            if (item === "&" || item === "|") {
                expected++;
            } else if (item !== "!") {
                expected--;
            }
        });
        var new_explicit_ands = _.times(-expected, _.constant("&"));
        return new_explicit_ands.concat(domain_array);
    }

    function eval_groupbys(contexts, evaluation_context) {
        evaluation_context = _.extend(pycontext(), evaluation_context || {});
        var result_group = [];
        _(contexts).each(function (ctx) {
            if (_.isString(ctx)) {
                // wrap raw strings in context
                ctx = { __ref: 'context', __debug: ctx };
            }
            var group;
            var evaluated = ctx;
            switch (ctx.__ref) {
                case 'context':
                    evaluation_context.context = evaluation_context;
                    evaluated = py.eval(ctx.__debug, wrap_context(evaluation_context));
                    break;
                case 'compound_context':
                    var eval_context = eval_contexts([ctx.__eval_context]);
                    evaluated = eval_contexts(
                        ctx.__contexts, _.extend({}, evaluation_context, eval_context));
                    break;
            }
            group = evaluated.group_by;
            if (!group) { return; }
            if (typeof group === 'string') {
                result_group.push(group);
            } else if (group instanceof Array) {
                result_group.push.apply(result_group, group);
            } else {
                throw new Error('Got invalid groupby {{'
                    + JSON.stringify(group) + '}}');
            }
            _.extend(evaluation_context, evaluated);
        });
        return result_group;
    }


    function pycontext() {
        return {
            datetime: datetime,
            context_today: context_today,
            time: time,
            relativedelta: relativedelta,
            current_date: py.PY_call(
                time.strftime, [py.str.fromJSON('%Y-%m-%d')]),
        };
    }

    /**
     * @param {String} type "domains", "contexts" or "groupbys"
     * @param {Array} object domains or contexts to evaluate
     * @param {Object} [context] evaluation context
     */
    function pyeval(type, object, context) {
        context = _.extend(pycontext(), context || {});

        //noinspection FallthroughInSwitchStatementJS
        switch (type) {
            case 'context':
            case 'contexts':
                if (type === 'context') {
                    object = [object];
                }
                return eval_contexts(object, context);
            case 'domain':
            case 'domains':
                if (type === 'domain')
                    object = [object];
                return eval_domains(object, context);
            case 'groupbys':
                return eval_groupbys(object, context);
        }
        throw new Error("Unknow evaluation type " + type);
    }

    function eval_arg(arg) {
        if (typeof arg !== 'object' || !arg.__ref) { return arg; }
        switch (arg.__ref) {
            case 'domain':
                return pyeval('domains', [arg]);
            case 'context': case 'compound_context':
                return pyeval('contexts', [arg]);
            default:
                throw new Error("Unknown nonliteral type " + ' ' + arg.__ref);
        }
    }

    /**
     * If args or kwargs are unevaluated contexts or domains (compound or not),
     * evaluated them in-place.
     *
     * Potentially mutates both parameters.
     *
     * @param args
     * @param kwargs
     */
    function ensure_evaluated(args, kwargs) {
        for (var i = 0; i < args.length; ++i) {
            args[i] = eval_arg(args[i]);
        }
        for (var k in kwargs) {
            if (!kwargs.hasOwnProperty(k)) { continue; }
            kwargs[k] = eval_arg(kwargs[k]);
        }
    }

    function eval_domains_and_contexts(source) {
        // see Session.eval_context in Python
        return {
            context: pyeval('contexts', source.contexts || [], source.eval_context),
            domain: pyeval('domains', source.domains, source.eval_context),
            group_by: pyeval('groupbys', source.group_by_seq || [], source.eval_context),
        };
    }

    function py_eval(expr, context) {
        return py.eval(expr, _.extend({}, context || {}, { "true": true, "false": false, "null": null }));
    }


    return {
        context: pycontext,
        ensure_evaluated: ensure_evaluated,
        eval: pyeval,
        eval_domains_and_contexts: eval_domains_and_contexts,
        py_eval: py_eval,
    };
}