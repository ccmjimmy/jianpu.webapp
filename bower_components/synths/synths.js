/* global define */

// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
    'use strict';

    // AMD
    if (typeof define === 'function' && define.amd) {
        define(['lodash'], factory);

    // Node
    } else if (typeof exports === 'object') {
        module.exports = factory(require('lodash'));

    // Browser globals
    } else {
        root.synths = factory(root._);
    }
}(this, function (_) {
    'use strict';

    var slice = Array.prototype.slice;

    /* Helper functions
       ================================================================================= */

    function id() { return _.uniqueId('_'); }
    function emptyFunction() {}
    var camel = _.memoize(function (name) {
        return name.replace(/[ _-]\w/g, function (match) {
            return match.slice(-1).toUpperCase();
        });
    });

    function isValidTypeName(name) {
        return !!types[name];
    }
    function isVarName(str) { return str.charAt(0) === '_'; }

    function validateVarName(_var) {
        function isNotValid(_var) {
            return (/^_\d+$/).test(_var);
        }
        if (!isVarName(_var)) {
            throw new Error('Var name must start with\'_\'');
        }
        if (isNotValid(_var)) {
            throw new Error('Var name cannot be \'_[0-9]+\'');
        }
    }

    // Binary operator
    var binOp = {
        '+':  function (a, b) { return a + b; },
        'r+': function (a, b) { return b + a; },
        '-':  function (a, b) { return a - b; },
        '*':  function (a, b) { return a * b; },
        '**': function (a, b) { return Math.pow(a, b); },
        '/':  function (a, b) { return a / b; },
        '//': function (a, b) { return Math.floor(a / b); },
        '%':  function (a, b) { return a % b; },
        '||': function (a, b) { return a || b; },
        '&&': function (a, b) { return a && b; }
    };


    /* Eval / Apply
       ================================================================================= */

    function hasObjectKey(obj, k) {
        return _.isObject(obj) && k in obj;
    }

    function isObjectAndKey(obj, k) {
        var t = typeof k;
        return _.isObject(obj) && (t === 'string' || t === 'number');
    }
    function isMethodName(name) { return name.charAt(0) === '#' && name.charAt(1) !== '#'; }
    function isAssignment(name) { return (/=$/).test(name); }
    function isBinOp(name, args) { return binOp[name.replace(/=$/, '')] && args.length > 0; }
    function isProperty(obj, name, Constructor) {
        var prop = obj[name] || (Constructor ? Constructor.prototype[name] : undefined);
        return prop && prop.__mode;
    }


    // Triangle of hackery
    // http://stackoverflow.com/questions/4226646/how-to-construct-javascript-object-using-apply
    function applyConstructor(Constructor, args) {
        switch (args.length) {
        case 0:
            return new Constructor();
        case 1:
            return new Constructor(args[0]);
        case 2:
            return new Constructor(args[0], args[1]);
        case 3:
            return new Constructor(args[0], args[1], args[2]);
        case 4:
            return new Constructor(args[0], args[1], args[2], args[3]);
        case 5:
            return new Constructor(args[0], args[1], args[2], args[3], args[4]);
        case 6:
            return new Constructor(args[0], args[1], args[2], args[3], args[4], args[5]);
        case 7:
            return new Constructor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        case 8:
            return new Constructor(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        case 9:
            return new Constructor(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
        }
    }

    function applyMethod(object, name, args, Constructor) {
        var isAssign, method, result;

        name = camel(name);
        isAssign = isAssignment(name);
        name = isAssign ? name.slice(0, -1) : name;

        // Construct a new instance.
        if (name === 'new') {
            return { w: applyConstructor(Constructor, args) };
        }

        // Method of the object or the constructor
        method = object[name] || (Constructor && Constructor.prototype[name]);
        if (typeof method === 'function') {
            result = method.apply(object, args);
            return isAssign ? { w: result } : { r: result };
        }

        // Lodash method
        method = _[name];
        if (typeof method === 'function') {
            args.unshift(object);
            result = method.apply(_, args);
            return isAssign ? { w: result } : { r: result };
        }
        throw new Error('Invalid method ' + name);
    }

    function applyBinOp(object, op, args, Constructor) {
        var isAssign = isAssignment(op), method, result;
        op = isAssign ? op.slice(0, -1) : op;
        method = typeof object[op] === 'function' ?
                function (obj, val) { return obj[op](val); } :
                Constructor && typeof Constructor[op] === 'function' ?
                Constructor[op] : binOp[op];

        result = _.reduce(args, method, object);
        return isAssign ? { w: result } : { r: result };
    }

    function applyProperty(object, prop, args, Constructor) {
        var method = object[prop] || (Constructor ? Constructor.prototype[prop] : undefined),
            result = method.apply(object, args);
        return result === object ? {} : { r: result };
    }

    // Convert index -1 -> length -1, -2 -> length -2
    function getKeyOrIndex(object, key) {
        var index;
        if ('length' in object) {
            index = _.parseInt(key);
            if (index >= 0) { return index; }
            if (index < 0) { return object.length + index; }
        }
        return key;
    }

    function evaluateObject(object, key, args) {
        var current;

        key = getKeyOrIndex(object, key);

        switch (args.length) {

        // get the object's key
        case 0:
            return { r: object[key] };

        case 1:
            current = object[key];
            // Nested property, key, index or method
            if (hasObjectKey(current, args[0])) {
                return evaluate(current, args[0], []);
            }

            // Set the object's key, value
            object[key] = args[0];
            return {};

        // Nested
        default:
            current = object[key];
            if (current === undefined) {
                throw new Error('Invalid key: ' + key);
            }
            key = args[0];
            args.shift();
            return evaluate(current, key, args);
        }
    }

    function evaluate(current, name, args, Constructor) {

        // Nothing to be evaluated if current is undefined or null.
        if (current === undefined || current === null) {
            return 'w';
        }

        if (typeof name === 'string') {

            // Method
            if (isMethodName(name)) {
                return applyMethod(current, name.slice(1), args, Constructor);
            }
            if (name.charAt(0) === '#') {
                if (args.length > 0) {
                    throw new Error('Wrong arguments.');
                }
                return { w: name.slice(1) };
            }

            // Binary operator
            if (isBinOp(name, args)) {
                return applyBinOp(current, name, args, Constructor);
            }

            // Property
            if (isProperty(current, name, Constructor)) {
                return applyProperty(current, name, args, Constructor);
            }
        }

        // Object key, value, or array index, value
        if (isObjectAndKey(current, name)) {
            return evaluateObject(current, name, args, Constructor);
        }
        return 'w';
    }


    /* Property constructs
       ================================================================================= */

    // Invalid operation on the synthesized property will trigger an error event.
    var error = {
        writeToConstant: function (c) {
            synths.trigger('typeError', 'Write to a constant property, which is always ' + c);
        },
        writeToReadOnly: function () {
            synths.trigger('typeError', 'Write to a read only property');
        },
        writeMoreThanOneArg: function () {
            synths.trigger('typeError', 'Write more than one argument');
        },
        readAWriteOnly: function () {
            synths.trigger('typeError', 'Read a write only property');
        },
        invalid: function (value, type) {
            synths.trigger('typeError', 'Invalid type of ' + value + ', ' + type + 'expected');
        },
        notAPropToJSON: function (key) {
            synths.trigger('error', 'Invalid key for toJSON: ' + key + ' is not a property');
        }
    };

    var warning = {

    };

    var property = {
        error: error,
        warning: warning
    };

    // Constant property
    // getter will return the constant defined by option.constant
    // setter will trigger a typeError and return this.
    property.constant = _.memoize(function (c) {
        return function () {
            if (arguments.length === 0) { return c; }
            error.writeToConstant(c);
            return this;
        };
    });

    // Read only property
    property.readOnly = {

        // Defined by a getter
        // getter is the custom getter bound this
        // setter will trigger a typeError and return this.
        getter: function (get) {
            return function (value) {
                if (arguments.length === 0) { return get.call(this); }

                value = evaluate(get.call(this), value, slice.call(arguments, 1));
                if (value.hasOwnProperty('r')) { return value.r; }

                // Setter
                if (value.hasOwnProperty('w') || value === 'w') {
                    error.writeToReadOnly();
                }
                return this;
            };
        },

        // Defined by a variable name
        // getter will return this[_var]
        // setter will trigger a typeError and return this.
        varName: _.memoize(function (_var) {
            return function (value) {
                if (arguments.length === 0) { return this[_var]; }

                value = evaluate(this[_var], value, slice.call(arguments, 1));
                if (value.hasOwnProperty('r')) { return value.r; }

                // Setter
                if (value.hasOwnProperty('w') || value === 'w') {
                    error.writeToReadOnly();
                }
                return this;
            };
        })
    };

    // Write only property
    property.writeOnly = {

        // Defined by a setter
        // getter will trigger a typeError and return undefined.
        // setter is the custom setter bound this, and return this.
        setter: function (set) {
            return function (value) {
                switch (arguments.length) {
                case 0:
                    error.readAWriteOnly();
                    return;
                case 1:
                    set.call(this, value);
                    return this;
                default:
                    error.writeMoreThanOneArg();
                }
            };
        },

        // Defined by a variable name
        // getter will trigger a typeError and return undefined.
        // setter will invoke the custom setter bound this, and return this.
        varName: _.memoize(function (_var) {
            return function (value) {
                switch (arguments.length) {
                case 0:
                    error.readAWriteOnly();
                    return;
                case 1:
                    this[_var] = value;
                    return this;
                default:
                    error.writeMoreThanOneArg();
                }
            };
        })
    };

    // Custom property
    // getter is the custom getter bound this
    // setter is the custom setter bound this, and return this.
    property.custom = function (get, set) {
        return function (value) {

            // Getter
            if (arguments.length === 0) {
                return get.call(this);
            }
            value = evaluate(get.call(this), value, slice.call(arguments, 1));
            if (value.hasOwnProperty('r')) { return value.r; }

            // Setter
            if (value.hasOwnProperty('w')) { set.call(this, value.w); }
            else if (value === 'w') { set.call(this, arguments[0]); }
            return this;
        };
    };

    // Basic property
    // getter will return the value or lazily initialize the default value
    // setter will set the value and return this
    property.basic = function (_var, defaultVal, clone) {
        var prop = function (value) {

            // Getter
            if (arguments.length === 0) {
                value = this[_var];
                return value === undefined ?
                        (this[_var] = prop.clone(defaultVal)) : value;
            }
            value = evaluate(prop.call(this), value, slice.call(arguments, 1));
            if (value.hasOwnProperty('r')) { return value.r; }

            // Setter
            if (value.hasOwnProperty('w')) { this[_var] = value.w; }
            else if (value === 'w') { this[_var] = arguments[0]; }
            return this;
        };
        prop.clone = clone;
        return prop;
    };

    // Property with a type
    property.type = {

        // Type defined by a name
        name: function (_var, Constructor, defaultArgs) {
            var prop = function (value) {

                // Getter
                if (arguments.length === 0) {
                    value = this[_var];
                    if (value === undefined) {
                        value = this[_var] = applyConstructor(Constructor, defaultArgs);
                        if (value.setParent) { value.setParent(this); }
                    }
                    return value.value ? value.value() : value.valueOf();
                }

                value = evaluate(prop.call(this), value, slice.call(arguments, 1), Constructor);
                if (value.hasOwnProperty('r')) { return value.r; }

                // Setter
                if (value.hasOwnProperty('w')) {
                    value = this[_var] = value.w instanceof Constructor ? value.w : new Constructor(value.w);
                    if (value.setParent) { value.setParent(this); }
                } else if (value === 'w') {
                    value = arguments[0];
                    value = this[_var] = value instanceof Constructor ? value : applyConstructor(Constructor, arguments);
                    if (value.setParent) { value.setParent(this); }
                }
                return this;
            };
            return prop;
        },

        // Type defined by a constructor
        // getter will return the value or construct one with defaultArgs if value undefined
        // setter will set or construct the value and return this
        constructor: function (_var, Constructor, defaultArgs) {
            var prop = function (value) {
                // Getter
                if (arguments.length === 0) {
                    value = this[_var];
                    return value === undefined ?
                           (this[_var] = applyConstructor(Constructor, defaultArgs)) :
                           value;
                }
                value = evaluate(prop.call(this), value, slice.call(arguments, 1), Constructor);
                if (value.hasOwnProperty('r')) { return value.r; }

                // Setter
                if (value.hasOwnProperty('w')) {
                    this[_var] = value.w instanceof Constructor ? value.w : new Constructor(value.w);
                } else if (value === 'w') {
                    value = arguments[0];
                    this[_var] = value instanceof Constructor ? value : applyConstructor(Constructor, arguments);
                }
                return this;
            };
            return prop;
        }
    };


    /* toJSON method constructs
       ================================================================================= */

    var toJSON = {

        // Basic mode
        basic: _.memoize(function () {
            return function () {
                var key, prop, result = {};
                for (key in this) {
                    prop = this[key];
                    if (isReadable(prop) && typeof prop === 'function') {
                        result[key] = prop.call(this);
                    }
                }
                return result;
            };
        }),

        // Key inclusive mode
        inclusive: function (keys) {
            return function () {
                var that = this,
                    result = {};

                _.each(keys, function (key) {
                    var prop = that[key];
                    if (prop && isReadable(prop) && typeof prop === 'function') {
                        result[key] = prop.call(that);
                    } else {
                        error.notAPropToJSON(key);
                    }
                });
                return result;
            };
        },

        // Key map mode
        map: function (map) {
            return function () {
                var that = this,
                    result = {};

                _.each(map, function (propName, key) {
                    var prop = that[propName];
                    if (prop && isReadable(prop) && typeof prop === 'function') {
                        result[key] = prop.call(that);
                    } else {
                        error.notAPropToJSON(key);
                    }
                });
                return result;
            };
        },

        // Key exclusive mode
        exclusive: function (keys) {
            return function () {
                var key, prop, result = {};
                for (key in this) {
                    prop = this[key];
                    if (isReadable(prop) && typeof prop === 'function' &&
                            !_.contains(keys, key)) {
                        result[key] = prop.call(this);
                    }
                }
                return result;
            };
        }
    };

    // toJSON converts synthesized properties to an object with typical JavaScript properties.
    function makeToJSON(args) {
        var argLength = args.length;

        // Validate the arguments for the toJSON option
        // return it back if valid, or throw an Error if invalid.
        function validateArgs(args) {
            if (_.some(args, function (arg) { return typeof arg !== 'string'; })) {
                throw new Error('Any key argument for toJSON must be a string');
            }
            return args;
        }

        // Basic mode
        if (argLength === 0) {
            return toJSON.basic();
        }
        // Key exclusive mode
        if (args[0] === '-') {
            return toJSON.exclusive(validateArgs(args.slice(1)));
        }
        // Key mapped mode
        if (_.isPlainObject(args[0])) {
            return toJSON.map(args[0]);
        }
        // Key inclusive mode
        return toJSON.inclusive(validateArgs(args));
    }

    /* synthesize(options)
       ================================================================================= */

    /* Helpers for synthesize */

    function isReadable(prop) {
        return typeof prop === 'function' && (prop.__mode === 'rw' || prop.__mode === 'r');
    }

    // Convert the shortcut definitions to the options object.
    function getOptions(value) {

        // Basic property
        if (arguments.length === 0) {
            return {};
        }
        // Constant undefined property
        if (value === undefined || value === 'undefined') {
            return { constant: undefined };
        }
        // Constant null property
        if (value === null || value === 'null') {
            return { constant: null };
        }

        if (typeof value === 'string') {

            // Basic property with var name
            if (isVarName(value)) {
                return { _var: value };
            }
            // Name type property
            if (isValidTypeName(camel(value))) {
                return { type: value };
            }
            // Bad var name or bad type name
            throw new Error('Invalid type/var name ' + value + ' to be synthesized');

        // Constructor type property
        } else if (typeof value === 'function') {
            value = { type: value };
        }

        // Bad argument
        if (!_.isPlainObject(value)) {
            throw new Error('Invalid argument ' + value + ' for synthesize');
        }
        return value;
    }

    function getType(options) {
        var type = options.type;

        if (typeof type === 'string') {
            type = { name: type };
        } else if (typeof type === 'function') {
            type = { constructor: type };
        }

        if (!_.isPlainObject(type)) {
            throw new Error('Invalid type option');
        }

        if (options.hasOwnProperty('default')) {
            type.default = options.default;
            delete options.default;
        }

        if (_.keys(options).length > 1) {
            throw new Error('Invalid options defined with type.');
        }

        if (type.name) {
            type.name = camel(type.name);
            if (!isValidTypeName(type.name)) {
                throw new Error('Invalid type name: ' + type.name);
            }
        }

        if (type.constructor && typeof type.constructor !== 'function') {
            throw new Error('A function is expected for constructor.');
        }

        return type;
    }

    function makeCustomProperty(get, set) {

        // Read only property
        if (get && !set) {
            // with a custom getter
            if (typeof get === 'function') {
                return property.readOnly.getter(get);
            }
            // with an associated instance variable
            if (typeof get === 'string') {
                validateVarName(get);
                return property.readOnly.varName(get);
            }
            // Invalid
            throw new TypeError('A function or var name is expected for option set.');
        }

        // Write only property
        if (set && !get) {
            if (typeof set === 'function') {
                return property.writeOnly.setter(set);
            }
            if (typeof set === 'string') {
                validateVarName(set);
                return property.writeOnly.varName(set);
            }
            throw new TypeError('Setter need to be a function or a valid var name');
        }

        // Custom property
        if (typeof get !== 'function') {
            throw new TypeError('Getter need to be a function for a custom property');
        }
        if (typeof set !== 'function') {
            throw new TypeError('Setter need to be a function for a custom property');
        }
        return property.custom(get, set);
    }

    function makeBasicProperty(_var, defaultVal) {
        if (_.isArray(defaultVal)) {
            return property.basic(_var || id(), defaultVal, synths.cloneArray);
        }
        if (_.isPlainObject(defaultVal)) {
            return property.basic(_var || id(), defaultVal, synths.cloneObject);
        }
        if (_.isObject(defaultVal)) {
            throw new Error('Default for a constructed or inherited object need a type associated');
        }
        return property.basic(_var || id(), defaultVal, _.identity);
    }

    function makeTypeProperty(_var, t) {

        // Name type
        if (t.name) {
            return property.type.name(_var || id(), types[t.name], t.default || []);
        }

        // Constructor type
        if (t.constructor) {
            return property.type.constructor(_var || id(), t.constructor, t.default || []);
        } else {

        }
    }

    function makePropertyMode(get, set) {
        if (set && !get) { return 'w'; }
        if (get && !set) { return 'r'; }
        return 'rw';
    }

    /* Synthesize: the property generator */
    function synthesize(options) {
        var optionLength, prop;

        if (options === 'toJSON') {
            return makeToJSON.call(null, slice.call(arguments, 1));
        }

        // Bad arguments
        if (arguments.length > 1) {
            throw new Error('Funciton synthesize takes only a single argument');
        }

        options = getOptions.apply(null, arguments);
        var _var = options._var,
            defaultVal = options.default;
        if (_var) { validateVarName(_var); }
        delete options._var;
        delete options.default;
        optionLength = _.keys(options).length;

        // Basic property
        // with a specified var name or automatic generated id
        if (optionLength === 0) {
            prop = makeBasicProperty(_var, defaultVal);

        // Constant property
        } else if (options.hasOwnProperty('constant')) {
            if (optionLength > 1 || _var || defaultVal !== undefined) {
                throw new Error('Constant cannot be defined with any other option');
            }
            prop = property.constant(options.constant);

        // Custom property
        } else if (options.get || options.set) {
            if (optionLength > 2 || _var || defaultVal !== undefined) {
                throw new Error('Invalid options with get and/or set.');
            }
            prop = makeCustomProperty(options.get, options.set);

        // Property with type
        } else if (options.type) {
            prop = makeTypeProperty(_var, getType(options));

        } else {
            throw new Error('Not implemented.');
        }

        prop.__mode = makePropertyMode(options.get, options.set);
        return prop;
    }


    /* Type
       ================================================================================= */

    var valueProp = synthesize();

    function Integer(num) {
        this.value(_.parseInt(num));
    }
    Integer.prototype.value = valueProp;

    function SObject() {
        // TODO
    }
    SObject.prototype.value = valueProp;

    function PlainObject() {
        // TODO
    }
    PlainObject.prototype.value = valueProp;


    function SArray(val) {
        var t = typeof val;
        if (arguments.length === 1 && (t === 'string' || t === 'object')) {
            this.value(_.toArray(val));
        } else {
            this.value(_.toArray(arguments));
        }
    }
    SArray.prototype.value = valueProp;

    function SDate() {
        this.value(applyConstructor(Date, arguments));
    }
    _.extend(SDate.prototype, {
        value: valueProp,
        year: synthesize({
            get: function () { return this.getFullYear(); },
            set: function (m) { this.setFullYear(m); }
        }),
        month: synthesize({
            get: function () { return this.getMonth() + 1; },
            set: function (m) { this.setMonth(m - 1); }
        }),
        date: synthesize({
            get: function () { return this.getDate(); },
            set: function (d) { this.setDate(d); }
        }),
        day: synthesize({
            get: function () { return this.getDay(); }
        }),
        hour: synthesize({
            get: function () { return this.getHours(); },
            set: function (h) { this.setHours(h); }
        }),
        minute: synthesize({
            get: function () { return this.getMinutes(); },
            set: function (m) { this.setMinutes(m); }
        }),
        second: synthesize({
            get: function () { return this.getSeconds(); },
            set: function (s) { this.setSeconds(s); }
        }),
        millisecond: synthesize({
            get: function () { return this.getMilliseconds(); },
            set: function (m) { this.setMilliseconds(m); }
        }),
        time: synthesize({
            get: function () { return this.getTime(); },
            set: function (m) { this.setTime(m); }
        })
    });

    var types = {
        string: String,
        number: Number,
        double: Number,
        boolean: Boolean,
        integer: Integer,
        object: SObject,
        plainObject: PlainObject,
        array: SArray,
        date: SDate
    };

    /* Exports
       ================================================================================= */

    var synths = {
        synthesize: synthesize,
        makeToJSON: makeToJSON,
        _: _, // lodash
        property: property,
        types: types,
        trigger: emptyFunction,
        error: error,
        warning: warning,
        camel: camel,
        cloneObject: function (value) { return _.clone(value, true); },
        cloneArray: function (value) { return value.slice(); },
        binOp: binOp
    };

    return synths;
}));
