/* 123 notation */

var ott = (function (_, synths) {
  'use strict';

  var
    NUMBER_TO_STEP = [null, 'C', 'D', 'E', 'F', 'G', 'A', 'B'],
    ACCIDENTAL_TO_ALTER = { '#' : 1, '##': 2, '@': 0, 'b' : -1, 'bb': -2 },
    ALTER_TO_ACCIDENTAL = { 1: '#', 2: '##', 0: '', '-1': 'b', '-2': 'bb' },
    NOTE_TYPE = {
      1024 : '1024th',
      512 : '512th',
      256 : '256th',
      128 : '128th',
      64 : '64th',
      32 : '32nd',
      16 : '16th',
      8 : 'eighth',
      4 : 'quarter',
      2 : 'half',
      1 : 'whole',
      0.5 : 'breve',
      0.25 : 'long',
      0.125 : 'maxima'
    };

  var rules = {
    note: /^(?:#{0,2}|b{0,2}|@?)[1-7](?:'{0,4}|,{0,4})(?:[\- ]*|=*_?)\.{0,2}$/
  };

  var synthesize = synths.synthesize,
      ott = {};


  function fraction(num) {
    var denom = 1, numer = num;

    function isInt(x) { return x === parseInt(x, 10); }

    while (!isInt(numer)) {
      denom *= 2;
      numer *= 2;
    }

    return denom === 1 ? numer : numer + '/' + denom;
  }



  /** @class  */
  var Pitch = ott.Pitch = function (jpNumber, alter, jpOctave) {
    // this.jpNumber(jpNumber);
    // this.alter(alter);
    // this.jpOctave(jpOctave);
  };
  _.extend(Pitch.prototype, {
    step: synthesize({
      get: function () { return NUMBER_TO_STEP[this.jpNumber()]; },
      set: function (s) {}
    }),
    alter: synthesize({ default: 0 }),
    octave: synthesize({
      get: function () { return this.jpOctave() + 4; },
      set: function (oct) { this.jpOctave(oct - 4); }
    }),
    jpNumber: synthesize({ default: 1 }),
    jpOctave: synthesize({ default: 0 }),
    accidental: synthesize({
      get: function () { return ALTER_TO_ACCIDENTAL[this.alter()]; },
      set: function (acc) { this.alter(ACCIDENTAL_TO_ALTER[acc]); }
    }),
    toJSON: synthesize('toJSON')
  });

  /** @class  */
  var Note = ott.Note = function (str) {
    this.parse(str);
  };
  _.extend(Note.prototype, {
    pitch: synthesize({ type: Pitch }),
    typeName: synthesize({
      get: function () { return NOTE_TYPE[this.type()]; },
      set: function (t) {}
    }),
    type: synthesize(),
    dot: synthesize(),
    duration: synthesize(),

    parse: function (str) {
      str = str || '';

      var numRaiseOctave, numLowerOctave,           // "'", ",": octave
          accidental,
          numOne = (str.match(/-/g) || []).length,  // '-': durations of a quarter
          numHalf, numQuarter,                      // '_', '=': durations
          numDot;                                   // '.': augmentation dot

      if (numOne > 1 && numOne !== 3 || !rules.note.test(str)) {
        return;
      }

      numRaiseOctave = (str.match(/'/g) || []).length;
      numLowerOctave = (str.match(/,/g) || []).length;

      numOne = (str.match(/-/g) || []).length;
      numQuarter = (str.match(/=/g) || []).length;
      numHalf = (/_/.test(str) ? 1 : 0) + numQuarter * 2;
      numDot = (str.match(/\./g) || []).length;

      this.pitch('jpNumber', +str.match(/\d/)[0]);
      accidental = (str.match(/[#b@]*/) || [''])[0];
      accidental = accidental.charAt(0) === '#' ? '#' + accidental : accidental;
      this.pitch('accidental', accidental);
      this.pitch('jpOctave', +numRaiseOctave - numLowerOctave);
      this.type(numOne === 1 ? 2 :
                numOne === 3 ? 1 :
                Math.pow(2, numHalf) * 4);
      this.dot(numDot);
      this.duration((1 + numOne) / Math.pow(2, numHalf) *
                      (numDot === 1 ? 1.5 :
                       numDot === 2 ? 1.75 : 1));
    },
    toJSON: synthesize('toJSON')
  });

  return ott;

}(_, synths));
