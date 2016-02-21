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
  createEnum: createEnum,
  OPCODES: OPCODES
};
