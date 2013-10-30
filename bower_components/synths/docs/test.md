Synths
======

**Synths** is short for **synthesize** that produce a *synthesized property* with getter, setter, constant, default, type, methods, and operators (not fully implemented yet).

This documentation is produced using the **mocha** testing framework.

## Contents
   - [Basic property](#basic-property)
     - [Instance variable](#basic-property-instance-variable)
     - [Default value](#basic-property-default-value)
   - [Constant property](#constant-property)
     - [General](#constant-property-general)
     - [constant undefined](#constant-property-constant-undefined)
     - [constant null](#constant-property-constant-null)
   - [Custom property](#custom-property)
   - [Read only property](#read-only-property)
   - [Write only property](#write-only-property)
   - [synthesize(options)](#synthesizeoptions)
     - [options](#synthesizeoptions-options)
     - [returned value](#synthesizeoptions-returned-value)
   - [Synthesized property](#synthesized-property)
     - [Setter](#synthesized-property-setter)
     - [Getter](#synthesized-property-getter)
     - [Type checking](#synthesized-property-type-checking)
     - [Error reporting](#synthesized-property-error-reporting)
   - [Property's property](#propertys-property)
   - [Array property's index and value](#array-propertys-index-and-value)
   - [Object property's key and value](#object-propertys-key-and-value)
   - [Method of property](#method-of-property)
   - [Operator of property](#operator-of-property)
   - [Nested property, method and operator](#nested-property-method-and-operator)
   - [synthesize('toJSON')](#synthesizetojson)
     - [Basic mode](#synthesizetojson-basic-mode)
     - [Key inclusive mode](#synthesizetojson-key-inclusive-mode)
     - [Key map mode](#synthesizetojson-key-map-mode)
     - [Key exclusive mode](#synthesizetojson-key-exclusive-mode)
   - [Constructor type](#constructor-type)
   - [Name type](#name-type)
<a name=""></a>
 
<a name="basic-property"></a>
## Basic property
should be defined by `synthesize()` or `synthesize({})`.

```js
person = {};
expect(person.name = synthesize()).to.be.a('function');
expect(person.age = synthesize({})).to.be.a('function');
```

should get the default value: `undefined`.

```js
expect(person.name()).to.equal(undefined);
expect(person.age()).to.equal(undefined);
```

should get the identical value as been set.

```js
var johnName = { first: 'John', last: 'Smith' };

person.name('John').age(30);
expect(person.name('John')).to.equal(person);
expect(person.age(30)).to.equal(person);
person.name(johnName);
expect(person.name()).to.equal(johnName);
```

<a name="basic-property-instance-variable"></a>
### Instance variable
should be defined by `synthesize(_var)`.

```js
expect(person.sex = synthesize('_sex')).to.be.a('function');
expect(person.sex()).to.equal(undefined);
expect(person._sex).to.equal(undefined);
person.sex('male');

// The synthesized property and the 'instance variable'.
expect(person.sex()).to.equal('male');
expect(person._sex).to.equal('male');
```

should have varName `_var` starting with an underscore `_`.

```js
person.sex = synthesize('_sex');
expect(function () {
    person.sex = synthesize('sex');
}).to.throw(Error);
expect(function () {
    person.sex = synthesize('@sex');
}).to.throw(Error);
```

should not have varName to be `'_[0-9]+'`.

```js
expect(function () {
    synthesize('_1');
}).to.throw(Error);
expect(function () {
    synthesize('_25');
}).to.throw(Error);
```

<a name="basic-property-default-value"></a>
### Default value
should be be defined by `synthesize({ default: value })`.

```js
defaultParents = { father: 'papa', mother: 'mama' };
defaultCourses = ['JavaScript', 'Python', 'Ruby'];
student = {
    name: synthesize({ default: 'unknown' }),
    age: synthesize({ default: 15 }),
    isStudent: synthesize({ default: true }),
    parents: synthesize({ default: defaultParents }),
    courses: synthesize({ default: defaultCourses })
};
```

should not be a constructed object or inherit object.

```js
// OK but not recommended, use object literal instead.
student.birthday = synthesize({ default: new Object() });

// Not OK; default value today is constructed by Date.
// Use default with type instead.
expect(function () {
    var today = new Date('2014-8-22');
    student.birthday = synthesize({ default: today });
}).to.throw(Error);

// OK
student.birthday = synthesize({ default: Object.create(null) });
// Not OK
expect(function () {
    synthesize({ default: Object.create({}) });
}).to.throw(Error);

// Default value specialCourses inherit defaultCourse
expect(function () {
    var specialCourses = Object.create(defaultCourses);
    student.courses = synthesize({ default: specialCourses });
}).to.throw(Error);
```

should be gotten by default correctly.

```js
expect(student.name()).to.equal('unknown');
expect(student.age()).to.equal(15);
expect(student.isStudent()).to.equal(true);
```

should be overridden by the setter.

```js
student.name('Joe').age(5).isStudent(false).parents(null).courses(null);
expect(student.name()).to.equal('Joe');
expect(student.age()).to.equal(5);
expect(student.isStudent()).to.equal(false);
expect(student.parents()).to.equal(null);
expect(student.courses()).to.equal(null);
```

should be reset by setting `undefined` to the property.

```js
student.name(undefined).age(undefined).isStudent(undefined)
       .parents(undefined).courses(undefined);
expect(student.name()).to.equal('unknown');
expect(student.age()).to.equal(15);
expect(student.isStudent()).to.equal(true);
expect(student.parents()).to.eql(defaultParents);
expect(student.courses()).to.eql(defaultCourses);
expect(student.parents()).to.not.equal(defaultParents);
expect(student.courses()).to.not.equal(defaultCourses);
```

should be gotten as a cloned value for an object or an array.

```js
expect(student.parents()).to.eql(defaultParents);
expect(student.courses()).to.eql(defaultCourses);
expect(student.parents()).to.not.equal(defaultParents);
expect(student.courses()).to.not.equal(defaultCourses);
```

<a name="constant-property"></a>
## Constant property
<a name="constant-property-general"></a>
### General
should be defined by `synthesize({ constant: c })`.

```js
synthesize({ constant: 1 });
```

should not be defined together with any other option.

```js
expect(function () {
    synthesize({ constant: 1, type: 'number' });
}).to.throw(Error);
```

should have setter triggering `typeError` and return self.

```js
var spy = sinon.spy();
person = {
    mode: synthesize({ constant: 'super' }),
    type: synthesize({ constant: undefined }),
    immortal: synthesize({ constant: false })
};
synths.on('typeError', spy);
expect(person.mode('superb')).to.equal(person);
expect(spy.calledOnce).is.equal(true);
```

should have getter always returning the constant.

```js
expect(person.mode()).to.equal('super');
expect(person.type()).to.equal(undefined);

// Setting the constant will not change the value.
person.mode('superb').type('superman').immortal(true);
expect(person.mode()).to.equal('super');
expect(person.type()).to.equal(undefined);
expect(person.immortal()).to.equal(false);
```

should be the same function for the same constant.

```js
var a = synthesize({ constant: 5 }),
    b = synthesize({ constant: 5 });
expect(a).is.a('function');
expect(a).to.equal(b);
```

<a name="constant-property-constant-undefined"></a>
### constant undefined
should be defined shortly by `synthesize(undefined)` or `synthesize('undefined')`.

```js
// It can thought of as a constant undefined or a type 'undefined'
var person = {
    mode: synthesize(undefined),
    type: synthesize('undefined'),
    age: synthesize({ constant: undefined })
};

// The above three are just the same property.
expect(person.mode).is.a('function');
expect(person.mode).is.equal(person.type);
expect(person.mode).is.equal(person.age);
```

<a name="constant-property-constant-null"></a>
### constant null
should be defined shortly by `synthesize(null)` or `synthesize('null')`.

```js
// It can thought of as a constant null or a type 'null'
var person = {
    mode: synthesize(null),
    type: synthesize('null'),
    age: synthesize({ constant: null })
};

// The above three are just the same property.
expect(person.mode).is.a('function');
expect(person.mode).is.equal(person.type);
expect(person.mode).is.equal(person.age);
```

<a name="custom-property"></a>
## Custom property
should be defined by `synthesize({ get: getter, set: setter })`.

```js
john = {
    firstName: synthesize(),
    lastName: synthesize(),

    // Synthesize custom property
    fullName: synthesize({
        get: function () {
            return this.firstName() + ' ' + this.lastName();
        },
        set: function (name) {
            var names = name.split(' ');
            this.firstName(names[0]);
            this.lastName(names[1]);
        }
    })
};
```

should work correctly.

```js
john.firstName('John').lastName('Smith');

// Custom getter
expect(john.fullName()).to.equal('John Smith');

// Custom setter
expect(john.fullName('J S')).to.equal(john);
expect(john.firstName()).to.equal('J');
expect(john.lastName()).to.equal('S');
```

<a name="read-only-property"></a>
## Read only property
should be defined by `synthesize({ get: getter })` @param `{Function} getter`.

```js
Person = function () {};
Person.prototype.firstName = synthesize();
Person.prototype.lastName = synthesize();

// Synthesize read-only property
Person.prototype.fullName = synthesize({
    get: function () {
        return this.firstName() + ' ' + this.lastName();
    }
});
john = new Person();
mary = new Person();

expect(function () {
    synthesize({ get: 1 });
}).to.throw(TypeError);
```

should also be defined by `synthesize({ get: _var })` @param `{String} _var`.

```js
expect(function () {
    Person.prototype.mentor = synthesize({ get: '_mentor' });
}).to.not.throw(Error).and.throw(TypeError);
```

should have the name `_var` starting with an underscore `_`.

```js
expect(function () {
    Person.father = synthesize({ get: 'pa' });
}).to.throw(Error);
```

should get the correct value from the custom getter function.

```js
john.firstName('John').lastName('Smith');
expect(john.fullName()).to.equal('John Smith');
```

should get the correct value from `obj[_var]`.

```js
expect(john.mentor()).to.equal(undefined);
john._mentor = mary;
expect(john.mentor()).to.equal(mary);
```

should have setter triggering a `typeError` and returning self `this`.

```js
var spy = sinon.spy();
synths.on('typeError', spy);
expect(john.fullName('Tom')).to.equal(john);
expect(john.fullName()).to.equal('John Smith');
john.mentor(john);
expect(john.mentor()).to.equal(mary);
expect(spy.calledTwice).is.equal(true);
```

<a name="write-only-property"></a>
## Write only property
should be defined by `synthesize({ set: setter })` @param `{Function} setter`.

```js
Person = function () {};
_.extend(Person.prototype, {
    firstName: synthesize(),
    lastName: synthesize(),

    // Synthesize write-only property
    fullName: synthesize({
        set: function (value) {
            var names = ('' + value).split(' ');
            this.firstName(names[0]);
            this.lastName(names[1]);
        }
    })
});
john = new Person();
expect(function () {
    synthesize({ set: 1 });
}).to.throw(TypeError);
```

should also be defined by `synthesize({ set: _var })` @param `{String} _var`.

```js
Person.prototype.weight = synthesize({ set: '_www' });
```

should have the name `_var` starting with underscore `_`.

```js
expect(function () {
    Person.father = synthesize({ set: 'pa' });
}).to.throw(Error);
```

should have the custom getter function working correctly.

```js
john.fullName('John Smith');
expect(john.firstName()).to.equal('John');
expect(john.lastName()).to.equal('Smith');
```

should set the correct value to `obj[_var]`.

```js
expect(john.weight()).to.equal(undefined);
john.weight(90);
expect(john.weight()).to.equal(undefined);
expect(john._www).to.equal(90);
```

should have getter triggering a `typeError` and returning undefined.

```js
var spy = sinon.spy();
synths.on('typeError', spy);
expect(john.fullName()).to.equal(undefined);
expect(john.weight()).to.equal(undefined);
expect(spy.calledTwice).is.equal(true);
```

<a name="synthesizeoptions"></a>
## synthesize(options)
<a name="synthesizeoptions-options"></a>
### options
should be nothing, `null`, `undefined` or `{Object} options`.

```js
synthesize();
synthesize(null);
synthesize(undefined);
synthesize({
    // valid options
});
```

should also be a valid `{String} typeName` or a valid `{String} _varName`.

```js
synthesize('string');       // a valid type name
synthesize('_aName');       // a valid instance variable name, starting with '_'
```

should also be a `{Function} constructor`.

```js
synthesize(function () {});
synthesize(Date);
synthesize(RegExp);
```

should be forbidden for anything else.

```js
expect(function () { synthesize(null, null); }).to.throw(Error);
expect(function () { synthesize([]); }).to.throw(Error);
expect(function () { synthesize(new Date()); }).to.throw(Error);
expect(function () { synthesize(true); }).to.throw(Error);
expect(function () { synthesize(false); }).to.throw(Error);
```

<a name="synthesizeoptions-returned-value"></a>
### returned value
should be a synthesized property, which is a `{Function} method` for object.

```js
expect(synthesize()).to.be.a('function');
expect(synthesize(null)).to.be.a('function');
expect(synthesize(undefined)).to.be.a('function');
expect(synthesize({})).to.be.a('function');
```

<a name="synthesized-property"></a>
## Synthesized property
<a name="synthesized-property-setter"></a>
### Setter
is invoked with a parameter `obj.prop(val)`, and should return the object itself `this`.

```js
person = {
    name: synthesize(),
    age: synthesize(),
    type: synthesize(null),
    mode: synthesize(undefined)
};
expect(person.name('John')).to.equal(person);
```

should therefore be always chainable.

```js
expect(person.name('Tom').age(25).type('what').mode('ever')).to.equal(person);
```

<a name="synthesized-property-getter"></a>
### Getter
is invoked without any parameter, `obj.prop()`, and should return the correct value.

```js
var person = {
    name: synthesize(),
    age: synthesize(),
    type: synthesize(null),
    mode: synthesize(undefined)
};
person.name('Tom').age(25);
expect(person.name()).to.equal('Tom');
expect(person.age()).to.equal(25);
person.name(undefined).age(null);
expect(person.name()).to.equal(undefined);
expect(person.age()).to.equal(null);
```

<a name="synthesized-property-type-checking"></a>
### Type checking
<a name="synthesized-property-error-reporting"></a>
### Error reporting
should be by default doing nothing.

```js
person = { type: synthesize(null) };
synths.trigger('typeError');
person.type(1);                         // write to a constant
```

should work by overriding `synths.trigger`.

```js
// Throw an error
synths.trigger = function (name, message) {
    throw new Error(name + ': ' + message);
};
expect(function () { person.type(1); }).to.throw(Error);

// Mixin Backbone.Events
_.extend(synths, Events);

var spy = sinon.spy();
synths.on('typeError', spy);
synths.trigger('typeError');
person.type(1);                         // write to a constant
expect(spy.calledTwice).is.equal(true);
```

<a name="propertys-property"></a>
## Property's property
should be invoked by `obj.prop('subProp', [value])`.

```js
// x and y are both synthesized properties of the from and the to property
var Vector = function (x, y) { this.x(x); this.y(y); };
Vector.prototype.x = synthesize();
Vector.prototype.y = synthesize();

var line = {
    from: synthesize(),
    to: synthesize()
};
line.from(new Vector(1, 2)).to(new Vector(3, 4));

// Getter with key
expect(line.from('x')).to.equal(1);
expect(line.from('y')).to.equal(2);
expect(line.to('x')).to.equal(3);
expect(line.to('y')).to.equal(4);

// Setter with key, value; setters are chainable.
line.from('x', 5).from('y', 6).to('x', 7).to('y', 8);

expect(line.from('x')).to.equal(5);
expect(line.from('y')).to.equal(6);
expect(line.to('x')).to.equal(7);
expect(line.to('y')).to.equal(8);
```

<a name="array-propertys-index-and-value"></a>
## Array property's index and value
should be invoked by `obj.prop(index, [value])`.

```js
var family = {
    members: synthesize()
};
family.members(['John', 'Mary', 'Tom', 'Sue']);

// The original way
expect(family.members()[0]).to.equal('John');
family.members()[0] = 'Joey';
expect(family.members()[0]).to.equal('Joey');

// Getter with index
expect(family.members(1)).to.equal('Mary');

// Setter with index, value; setters are chainable.
family.members(1, 'Amy').members(2, 'Tommy');

expect(family.members(1)).to.equal('Amy');
expect(family.members(2)).to.equal('Tommy');
expect(family.members()).to.eql(['Joey', 'Amy', 'Tommy', 'Sue']);

// Negative index
expect(family.members(-1)).to.equal('Sue');
expect(family.members(-2)).to.equal('Tommy');

// Floating point index
expect(family.members(-2.8)).to.equal('Tommy');
expect(family.members('-2.3')).to.equal('Tommy');
expect(family.members(2.8)).to.equal('Tommy');
expect(family.members('2.3')).to.equal('Tommy');
```

<a name="object-propertys-key-and-value"></a>
## Object property's key and value
should be invoked by `obj.prop('key', [value])`.

```js
var john = {
    parents: synthesize()
};
john.parents({
    father: 'Tom',
    mother: 'Sue',
});
expect(john.parents('father')).to.equal('Tom');
expect(john.parents('mother')).to.equal('Sue');
```

<a name="method-of-property"></a>
## Method of property
should be invoked by `obj.prop('#method')`.

```js
john = {
    weight: synthesize(),
    birthday: synthesize(),
    courses: synthesize()
};
john.weight(50).birthday(new Date('2010-6-6'))
    .courses(['JavaScript']);

expect(john.weight()).to.equal(50);

// Method of Number
expect(john.weight('#toString')).to.equal('50');
// Alias name of the the method
expect(john.weight('#to string')).to.equal('50');
expect(john.weight('#to-string')).to.equal('50');
expect(john.weight('#to_string')).to.equal('50');

// Methods of Date
expect(john.birthday('#getFullYear')).to.equal(2010);
expect(john.birthday('#get full year')).to.equal(2010);
expect(john.birthday('#getMonth')).to.equal(5);
expect(john.birthday('#getDate')).to.equal(6);
john.birthday('#setDate', 7);
expect(john.birthday('#getDate')).to.equal(7);

// Methods of Array
john.courses('#push', 'Ruby');
expect(john.courses()).to.eql(['JavaScript', 'Ruby']);
```

should be assignment with an `=` suffix.

```js
// Method with an assignment operator
john.courses('#concat=', ['Python', 'Java']);
expect(john.courses()).to.eql(['JavaScript', 'Ruby', 'Python', 'Java']);

// Methods of lodash
john.courses('#filter=', function (course) {
    return course.charAt(0) === 'J';
}).courses('#reject=', function (course) {
    return course.length === 4;
});
expect(john.courses()).to.eql(['JavaScript']);

// Escape the '#'
expect(john.birthday('##').courses('##text')).to.equal(john);
expect(john.birthday()).to.equal('#');
expect(john.courses()).to.equal('#text');
```

<a name="operator-of-property"></a>
## Operator of property
should have binary operator shortcut.

```js
var john = {
    name: synthesize(),
    age: synthesize()
};
john.name('Jo').age(10);

john.name('+=', 'hn').age('+=', 5);
expect(john.name()).to.equal('John');

john.name('r+=', '. ', 'Mr').name('+=', ' ', 'Smi', 'th');
expect(john.name()).to.equal('Mr. John Smith');

john.age('-=', 5, 5).age('**=', 2);
expect(john.age()).to.equal(25);
```

should be overloaded by custom operator.

```js
// x and y are both synthesized properties of the from and the to property
var Vector = function (x, y) { this.x(x); this.y(y); };

// Static method
Vector['-'] = function (v1, v2) {
    return new Vector(v1.x() - v2.x(), v1.y() - v2.y());
};
_.extend(Vector.prototype, {
    x: synthesize(),
    y: synthesize(),

    // Dynamic method
    '+': function (v) {
        return new Vector(this.x() + v.x(), this.y() + v.y());
    },
});

var v1 = new Vector(5, 10),
    v2 = new Vector(15, 20),
    v3;

// Dynamic method
v3 = v1['+'](v2);
expect(v3.x()).to.equal(20);
expect(v3.y()).to.equal(30);

// Static method
v3 = Vector['-'](v1, v2);
expect(v3.x()).to.equal(-10);
expect(v3.y()).to.equal(-10);

var line = {
    from: synthesize(),
    to: synthesize(Vector)  // type needed for the static method
};
line.from(new Vector(1, 2)).to('#new', 3, 4);

// Property's operator is overloaded.
// Dynamic method
v3 = line.from('+', v1);
expect(v3.x()).to.equal(6);
expect(v3.y()).to.equal(12);

// Static method
v3 = line.to('-', v1);
expect(v3.x()).to.equal(-2);
expect(v3.y()).to.equal(-6);

// Assignment operator
line.from('+=', v1, v2).to('-=', v1, v2);
expect(line.from('x')).to.equal(21);
expect(line.from('y')).to.equal(32);
expect(line.to('x')).to.equal(-17);
expect(line.to('y')).to.equal(-26);
```

<a name="nested-property-method-and-operator"></a>
## Nested property, method and operator
should be invoked by such as `obj.prop(subprop, key, index, ...)`.

```js
var john = {
    relatives: synthesize()
};

// Normal setter
john.relatives({
    sisters: [
        {
            name: 'Mary',
            age: synthesize()
        },
        {
            name: 'Jane',
            birthday: synthesize()
        }
    ],
    children: synthesize(),
});

// Object (key, value) setter
john.relatives('children', {
    girl: 'Amy',
    boy: 'Tommy'
});

// Nested getters
expect(john.relatives('sisters', 0, 'name')).to.equal('Mary');
expect(john.relatives('sisters', 1, 'name')).to.equal('Jane');
expect(john.relatives('children', 'girl')).to.equal('Amy');
expect(john.relatives('children', 'boy')).to.equal('Tommy');

// Nested setters
john.relatives('sisters', 0, 'name', 'M').relatives('sisters', 1, 'name', 'J')
    .relatives('children', 'girl', 'A').relatives('children', 'boy', 'T')
    .relatives('sisters', 0, 'age', 15)
    .relatives('sisters', 1, 'birthday', new Date('2013-8-25'));

// Nested getters
expect(john.relatives('sisters', 0, 'name')).to.equal('M');
expect(john.relatives('sisters', 1, 'name')).to.equal('J');
expect(john.relatives('sisters', 0, 'age')).to.equal(15);
expect(john.relatives('children', 'girl')).to.equal('A');
expect(john.relatives('children', 'boy')).to.equal('T');

// Nested getters and methods
expect(john.relatives('sisters', 0, 'age', '#toString')).to.equal('15');
expect(john.relatives('sisters', 1, 'birthday', '#getDate')).to.equal(25);
expect(john.relatives('sisters', 0, 'age', '#to string')).to.equal('15');
expect(john.relatives('sisters', 1, 'birthday', '#get date')).to.equal(25);

john.courses = synthesize();
john.courses([{
    name: 'JS',
    book: synthesize(),
    credit: synthesize()
}]);
john.courses(0, 'book', 'JavaScript');
expect(john.courses(0, 'book')).to.equal('JavaScript');
john.courses(0, 'book', 'r+=', 'Eloquent ');
expect(john.courses(0, 'book')).to.equal('Eloquent JavaScript');
expect(john.courses(0, 'name')).to.equal('JS');
john.courses(0, 'credit', 3);
expect(john.courses(0, 'credit')).to.equal(3);
expect(john.courses(0, 'credit', '#to string')).to.equal('3');
john.courses(0, 'credit', '+=', 2);
expect(john.courses(0, 'credit')).to.equal(5);

john.wife = synthesize();
var mary = { husband: synthesize() };
john.wife(mary).wife('husband', john);
expect(mary.husband()).to.equal(john);
expect(mary.husband('wife', 'husband', 'courses', 0, 'name')).to.equal('JS');
expect(mary.husband('wife', 'husband', 'courses', 0, 'credit')).to.equal(5);
mary.husband('wife', 'husband', 'wife', 'husband', 'courses', 0, 'credit', '+=', 1);
expect(mary.husband('courses', 0, 'credit')).to.equal(6);
```

<a name="synthesizetojson"></a>
## synthesize('toJSON')
<a name="synthesizetojson-basic-mode"></a>
### Basic mode
should be defined by `synthesize('toJSON')`.

```js
Person = function (n) { this.fullName(n); };
_.extend(Person.prototype, {
    firstName: synthesize(),                        // basic property is readable
    lastName: synthesize(),                         // readable
    fullName: synthesize({                          // write only
        set: function (value) {
            var names = ('' + value).split(' ');
            this.firstName(names[0]);
            this.lastName(names[1]);
        }
    }),
    weight: synthesize({ set: '_www' }),            // write only
    type: synthesize({ constant: 1 }),              // constant is readable
    isHappy: synthesize({                           // read only
        get: function () {
            return this._www < 85 && this._www > 75;
        }
    }),
    wife: synthesize({ get: '_wife' }),             // Read only

    // Synthesize a toJSON method, which is not a synthesized property.
    toJSON: synthesize('toJSON')
});

john = new Person('John Smith');
john.weight(80);
john._wife = 'Mary';    // write to a read-only internally
expect(Person.prototype.toJSON).to.be.a('function');
```

should convert all readable synthesized properties to typical properties.

```js
var result = {
    firstName: 'John',
    lastName: 'Smith',
    type: 1,
    isHappy: true,
    wife: 'Mary'
};
expect(john.toJSON()).to.eql(result);
```

<a name="synthesizetojson-key-inclusive-mode"></a>
### Key inclusive mode
should be defined by `synthesize('toJSON', key1, key2, ...)`.

```js
Person.prototype.toJSON = synthesize('toJSON', 'firstName', 'wife');
expect(Person.prototype.toJSON).to.be.a('function');
```

should get only included properties.

```js
var result = {
    firstName: 'John',
    wife: 'Mary'
};
expect(john.toJSON()).to.eql(result);
```

should trigger an error if that key is not a synthesized property.

```js
var spy = sinon.spy();
synths.on('error', spy);
john.toJSON();
expect(spy.called).to.equal(false);

Person.prototype.toJSON = synthesize('toJSON', 'firstName', 'wifi', 'haha');
expect(john.toJSON()).to.eql({ firstName: 'John' });
expect(spy.calledTwice).to.equal(true);
```

<a name="synthesizetojson-key-map-mode"></a>
### Key map mode
should be defined by `synthesize('toJSON', { key1: prop1, key2: prop2, ... })`.

```js
Person.prototype.toJSON = synthesize('toJSON', {
    name: 'firstName',
    love: 'wife'
});
expect(Person.prototype.toJSON).to.be.a('function');
```

should get the mapped properties.

```js
var result = {
    name: 'John',
    love: 'Mary'
};
expect(john.toJSON()).to.eql(result);
```

should trigger an error if that property is not a synthesized property.

```js
var spy = sinon.spy();
synths.on('error', spy);
john.toJSON();
expect(spy.called).to.equal(false);

Person.prototype.toJSON = synthesize('toJSON', {
    name: 'firstName',
    love: 'wifi',           // wifi is not in the prototype chain
    firstName: 'name'       // name is not in the prototype chain
});
expect(john.toJSON()).to.eql({ name: 'John' });
expect(spy.calledTwice).to.equal(true);
```

<a name="synthesizetojson-key-exclusive-mode"></a>
### Key exclusive mode
should be defined by `synthesize('toJSON', '-', key1, key2, ...)`.

```js
Person.prototype.toJSON = synthesize('toJSON', '-', 'firstName', 'wife');
expect(Person.prototype.toJSON).to.be.a('function');
```

should get all readable properties other than excluded.

```js
var result = {
    lastName: 'Smith',
    type: 1,
    isHappy: true
};
expect(john.toJSON()).to.eql(result);
```

<a name="constructor-type"></a>
## Constructor type
should be defined by `synthesize(Constructor)`.

```js
Vector = function (x, y) {
    this.x(x);
    this.y(y);
};
Vector.prototype.x = synthesize();
Vector.prototype.y = synthesize();

line = {
    from: synthesize(Vector),
    to: synthesize(Vector)
};
birth = { date: synthesize(Date) };
```

should have setter working as normal.

```js
var v1 = new Vector(1, 2),
    v2 = new Vector(3, 4);
line.from(v1).to(v2);
expect(line.from()).to.equal(v1);
expect(line.to()).to.equal(v2);
```

should have `new` method to invoke the constructor.

```js
line.from('#new', 5, 6).to('#new', 7, 8);
birth.date('#new', 2013, 7, 17);
```

should have getter getting a correct type and value.

```js
// Type is referred to as an instance of the given constructor.
expect(line.from()).to.be.an.instanceof(Vector);
expect(line.to()).to.be.an.instanceof(Vector);
expect(birth.date()).to.be.an.instanceof(Date);
expect(birth.date()).to.be.an.instanceof(Object);

expect(line.from().x()).to.equal(5);
expect(line.from().y()).to.equal(6);
expect(line.to().x()).to.equal(7);
expect(line.to().y()).to.equal(8);
expect(birth.date().getFullYear()).to.equal(2013);
expect(birth.date().getMonth()).to.equal(7);
expect(birth.date().getDate()).to.equal(17);
expect(birth.date().getDay()).to.equal(6);
birth.date('#new', '2010-6-6');
expect(birth.date()).to.be.an.instanceof(Date);
expect(birth.date().getFullYear()).to.equal(2010);
expect(birth.date().getMonth()).to.equal(5);
expect(birth.date().getDate()).to.equal(6);
```

<a name="name-type"></a>
## Name type
should be defined by a valid type name: `synthesize('typeName')`.

```js
person = {
    name: synthesize('string'),
    age: synthesize('integer'),
    weight: synthesize('number'),
    isStudent: synthesize('boolean'),
    parents: synthesize('object'),
    options: synthesize('plainObject'),
    courses: synthesize('array')
};
expect(function () {
    synthesize('unknownType');
}).to.throw(Error);
```

should have primitive types.

```js
person.name(5).age('20.9').weight('30.5').isStudent('abc');
expect(person.name()).to.equal('5');
expect(person.age()).to.equal(20);
expect(person.age('#to string')).to.equal('20');
expect(person.weight()).to.equal(30.5);
expect(person.isStudent()).to.equal(true);
person.isStudent(0);
expect(person.isStudent()).to.equal(false);
expect(person.isStudent('#to string')).to.equal('false');
```

should have plain object type.

```js
synthesize('plainObject');
synthesize('plain object');
```

should have array type.

```js
person.courses(['JS', 'PHP', 'JSP']);
expect(person.courses()).to.eql(['JS', 'PHP', 'JSP']);

// Array index and value
expect(person.courses(0)).to.equal('JS');
person.courses(0, 'JavaScript');
expect(person.courses()).to.eql(['JavaScript', 'PHP', 'JSP']);

// Lodash method
expect(person.courses('#filter', function (c) {
    return c.charAt(0) === 'J';
})).to.eql(['JavaScript', 'JSP']);

// Constructor
person.courses('#new', 'JS', 'C++', 'C#');
expect(person.courses()).to.eql(['JS', 'C++', 'C#']);
person.courses('#new', 123);
expect(person.courses()).to.eql([123]);

// Construct from object to array
person.courses({ a: 'JS', b: 'COFFEE' });
expect(person.courses()).to.eql(['JS', 'COFFEE']);

// Construct from string to array
person.courses('#new', 'abcde');
expect(person.courses()).to.eql(['a', 'b', 'c', 'd', 'e']);

// Array method
person.courses('#slice=', 1, -1);
expect(person.courses()).to.eql(['b', 'c', 'd']);
```

should have date type.

```js
var person = { birthday: synthesize('date') };
person.birthday('#new', '2011-1-2');
expect(person.birthday('date')).to.equal(2);
expect(person.birthday('month')).to.equal(1);
person.birthday('month', 3);
expect(person.birthday('month')).to.equal(3);
```

