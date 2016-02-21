function StringIterator(string) {
  this.string = string;
  this.index = 0;
  this.length = string.length;
  this.done = false;
}

StringIterator.prototype.next = function() {
  if (this.done)
    throw new Error('string iterator overflow');

  this.done = this.index + 1 === this.length;
  var map = {
    value: this.string[this.index],
    done: this.done
  };

  this.index++;
  return map;
};

StringIterator.prototype.nextUntil = function(cb) {
  if (this.done)
    return '';

  var test = false;
  var letters = [];

  while(!test) {
    var next = this.next();
    test = cb(next.value);
    if (!test)
      letters.push(next.value);

    if (next.done) {
      break;
    }
  }

  this.index--;

  return letters.join('');
};

function createEnum(names) {
  var map = {};
  var index = 0, length = names.length;

  for(; index < length; index++) {
    map[names[index]] = names[index];
  }

  return map;
}

// for completely non-technical referencing reasons
var OPCODES = createEnum([
  'OPEN_BRACE', // {
  'CLOSE_BRACE', // }
  'OPEN_PAREN', // (
  'CLOSE_PAREN', // )
  'OPEN_BRACKET', // [
  'CLOSE_BRACKET', // ]
  'EQUALS', // =
  'COMMA', // ,

  'IDENTIFIER', // anything text that isn't surrounded by quotes
  'BOOLEAN', // true/false
  'NUMBER', // [0-9]+.[0-9]
  'STRING', // "

  'TEMPLATE' // indicates a 'native' value that was inserted, i.e. ES2015/ES6
]);

module.exports = {
  StringIterator: StringIterator,
  OPCODES: OPCODES,
  createEnum: createEnum
};
