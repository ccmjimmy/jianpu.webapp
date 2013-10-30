# Synths [![Build Status](https://travis-ci.org/malcomwu/synths.png)](https://travis-ci.org/malcomwu/synths) [![NPM version](https://badge.fury.io/js/synths.png)](http://badge.fury.io/js/synths)

**Synths** is a JavaScript library that synthesize properties with type, methods, operators and more.

Development is ongoing. Test documentation is available in [docs/test.md](https://github.com/malcomwu/synths/blob/master/docs/test.md) or in http://malcomwu.github.io/synths/

## Usage

```js
var synthesize = require('synths').synthesize;
var john = {
    name: synthesize(),
    age: synthesize('integer'),
    sex: synthesize({ constant: 'male' }),
    weight: synthesize({ default: 80 })
};
john.name('John').age(25.5).sex('female');
console.log(john.name());           // 'John'
console.log(john.age());            // 25
console.log(john.sex());            // 'male'
console.log(john.weight());         // 80
```

## Syntax

- Chainable setter `john.name('John').age(25)`
- Getter `john.name()` returns `'John'`
- Binary operator `obj.prop('+', val)` is equivalent to `obj.prop() + val`.
- Assignment operator `obj.prop('+=', val)` is equivalent to `obj.prop(obj.prop() + val)`.
- Method of property `obj.prop('#toString')`, and aliases: `obj.prop('#to string')`, `obj.prop('#to-string')`, or `obj.prop('#to_string')`, are equivalent to `obj.prop().toString()`.
- Lodash method `obj.prop('#forEach', getName)` and aliases `obj.prop('#for each', getName)`, `obj.prop('#for-each', getName)`, or `obj.prop('#for_each', getName)` are equivalent to `_.forEach(obj.prop(), getName)`.
- Property's property `obj.prop('subProp')` and aliases: `obj.prop('sub prop')`, `obj.prop('sub-prop')``obj.prop('sub_prop')`, are equivalent to `obj.prop().subProp()`. Setter `obj.prop('subProp', 123)` is equivalent to `obj.prop().subProp(123)`.
- Property's key, `obj.prop('key')` is equivalent to `obj.prop().key`. Setter `obj.prop('key', val)` is equivalent to `obj.prop().key = val`.
- Property's index `obj.prop(1)`, equivalent to `obj.prop()[1]`. `obj.prop(1, 'foo')` is equivalent to `obj.prop()[1] = 'foo'`. Negative index: `obj.prop(-1)` is equivalent to `obj.prop(obj.prop().length -1)`.

More details can be found in the aforementioned test documentation.
