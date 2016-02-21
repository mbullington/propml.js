var Iterator = require('./util/iterator').Iterator;
var OPCODES = require('./util/opcodes').OPCODES;

function handleWhitespace(tokens, char, iterator) {
  function isWhitespace(char) {
    return char === '\n' || char === '\t' || char === ' ';
  }

  if (isWhitespace(char)) {
    iterator.nextUntil(function(char) { return !isWhitespace(char); });
    return true;
  }

  return false;
}

var IDENTIFIER_BLACKLIST = ['(', ')', '[', ']', '{', '}', '=', ',', '"', '#', ' ', '\t', '\n'];

function handleIdentifier(tokens, char, iterator) {
  var start = iterator.index - 1;

  function isIdentifier(char) {
    if(char === 'r' && iterator.string[iterator.index] === '"')
      // not an identifier, it's a string, abort
      return false;
    return IDENTIFIER_BLACKLIST.indexOf(char) === -1;
  }

  if (isIdentifier(char)) {
    var value = char + iterator.nextUntil(function(char) { return !isIdentifier(char); });
    var number = parseFloat(value);

    tokens.push({
      type: !isNaN(number) ? OPCODES.NUMBER :
        (value === 'true' || value === 'false') ? OPCODES.BOOLEAN : OPCODES.IDENTIFIER,
      value: !isNaN(number) ? number : value.trim(),
      start: start,
      end: iterator.index - 1
    });

    return true;
  }

  return false;
}

var ESCAPE_MAP = {
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  '"': '"'
};

function formatString(value, literal) {
  // no potential escaped or unicode values
  if(value.indexOf('\\') === -1 || literal)
    return value;

  var stringIterator = new Iterator(value);
  var newString = '';

  var char, done = false;

  while(!done) {
    char = stringIterator.next().value;

    if(char === '\\') {
      var peek = !done ? stringIterator.string[stringIterator.index] : '';
      if(!done && peek === '\\') {
        stringIterator.next();
        newString += '\\';
      } else if(!done && ESCAPE_MAP[peek]) {
        stringIterator.next();
        newString += ESCAPE_MAP[peek];
      } else if(!done && peek === 'u') {
        if(stringIterator.length <= stringIterator.index + 4)
          throw new Error('invalid unicode character (\\u) in string.');
        stringIterator.next();

        var count = 0;
        var characters = stringIterator.nextUntil(function(s) {
          count++;
          return count === 5;
        });

        // convert to unicode value
        var unicodeChar = String.fromCharCode(parseInt(characters, 16));

        if(unicodeChar.indexOf('\\u') === 0)
          throw new Error('invalid unicode character (\\u' + characters + ') in string.');

        newString += unicodeChar;
      } else {
        throw new Error('unescaped backslash');
      }
    } else {
      console.log(newString);
      newString += char;
      console.log(newString);
    }

    done = stringIterator.done;
  }

  return newString;
}

// normal and multiline
function handleString(tokens, char, iterator) {
  var literal = false;
  var start = iterator.index - 1;

  // literal string
  if (char === 'r' && iterator.string[iterator.index] === '"') {
    literal = true;
    char = iterator.next().value;
  }

  // only support "" for strings.
  if (char === '"') {
    // multiline string
    if (iterator.string[iterator.index] === '"' &&
        iterator.string[iterator.index + 1] === '"') {
      iterator.index += 2;
      var value = iterator.nextUntil(function(char) {
        return iterator.done || (
            iterator.string[iterator.index - 2] !== '\\' &&
            char === '"' &&
            iterator.string[iterator.index] === '"' &&
            iterator.string[iterator.index + 1] === '"');
      });

      if(iterator.done)
        throw new Error('multiline string not terminated');
      iterator.index += 3;

      tokens.push({
        type: OPCODES.STRING,
        value: formatString(value.trim(), literal),
        start: start,
        end: iterator.index - 1
      });
    } else {
      var value = iterator.nextUntil(function(char) {
        return (char === '"' && iterator.string[iterator.index - 2] !== '\\') ||
            char === '\n' ||
            iterator.done;
      });

      if(iterator.done || iterator[iterator.index] === '\n')
        throw new Error('string not terminated');
      iterator.index++;

      tokens.push({
        type: OPCODES.STRING,
        value: formatString(value, literal),
        start: start,
        end: iterator.index - 1
      });
    }

    return true;
  }

  return false;
}

function handleComment(tokens, char, iterator) {
  // strip comments in lexer
  if (char === '#') {
    var value = iterator.nextUntil(function(char) { return char === '\n'; }).trim();
    return true;
  }

  return false;
}

var OPCODE_MAP = {
  ',': OPCODES.COMMA,
  '=': OPCODES.EQUALS,
  '{': OPCODES.OPEN_BRACE,
  '}': OPCODES.CLOSE_BRACE,
  '(': OPCODES.OPEN_PAREN,
  ')': OPCODES.CLOSE_PAREN,
  '[': OPCODES.OPEN_BRACKET,
  ']': OPCODES.CLOSE_BRACKET
};

function lexer(strings) {
  var values = [];
  var index = 1, length = arguments.length;

  for(; index < length; index++) {
    values.push(arguments[index]);
  }

  var tokens = [];

  index = 0, length = strings.length;
  for(; index < length; index++) {
    if (!strings[index].length)
      continue;

    var iterator = new Iterator(strings[index]);
    var char, done = false;

    while(!done) {
      char = iterator.next();

      if (OPCODE_MAP[char.value] != null) {
        tokens.push({
          type: OPCODE_MAP[char.value],
          start: iterator.index - 1,
          end: iterator.index - 1
        });
        continue;
      }

      var handlers = [
        handleWhitespace,
        handleComment,
        handleString,
        handleIdentifier
      ];

      var iindex = 0, llength = handlers.length, test = false;
      for(; iindex < llength; iindex++) {
        if (test)
          continue;
        var result = handlers[iindex](tokens, char.value, iterator);
        test = test || result;
      }

      // TODO: Better error logging.
      if (!test)
        throw new Error('Unknown PropML syntax: ' + char.value);

      done = iterator.done;
    }

    if (index + 1 !== length)
      tokens.push({
        type: OPCODES.TEMPLATE,
        start: iterator.index - 1,
        end: iterator.index - 1
      });
  }

  return {
    tokens: tokens,
    values: values
  };
}

module.exports = lexer;
