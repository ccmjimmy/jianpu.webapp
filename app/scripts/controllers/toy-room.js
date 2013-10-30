'use strict';

var TYPE_TO_DURATION = {1: 'w', 2: 'h', 4: 'q' };
function dotString (num) {
  return new Array(num + 1).join('d');
}

function draw(note) {
  /*global Vex, $*/

  var accidental = note.pitch('accidental') === '@' ? 'n' : note.pitch('accidental'),
      key = note.pitch('step') + accidental + '/' + note.pitch('octave');

  var canvas = $('canvas')[0];
  var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);

  var ctx = renderer.getContext();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var stave = new Vex.Flow.Stave(10, 80, 200);
  stave.addClef('treble').setContext(ctx).draw();

  // Create the note
  var rawNote = {
    keys: [key],
    duration: (TYPE_TO_DURATION[note.type()] || note.type()) + dotString(note.dot()),
    stem_direction: note.pitch('jpOctave') > 0 ? -1 : 1
  };
  console.log(rawNote, note.duration());
  var staveNote = new Vex.Flow.StaveNote(rawNote);
  if (accidental) {
    staveNote.addAccidental(0, new Vex.Flow.Accidental(accidental));
  }
  if (note.dot()) {
    staveNote.addDotToAll();
  }
  var notes = [staveNote];

  // Create a voice in 4/4
  var voice = new Vex.Flow.Voice({
    num_beats: note.duration(),
    beat_value: 4,
    resolution: Vex.Flow.RESOLUTION
  });

  // Add notes to voice
  voice.addTickables(notes);

  // Format and justify the notes to 500 pixels
  var formatter = new Vex.Flow.Formatter().
    joinVoices([voice]).format([voice], 200);

  // Render voice
  voice.draw(ctx, stave);
}


angular.module('jianpuApp')
  .controller('ToyRoomCtrl', function ($scope) {

    $scope.change = function () {
      var note = $scope.note = new ott.Note($scope.noteString);
      draw(note);
    };
  });
