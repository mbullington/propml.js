var lexer = require('./lib/lexer');
var parser = require('./lib/parser');

module.exports = function(strings, values) {
  strings = typeof(strings) === 'string' ? [strings] : strings;
  values = values || [];

  return parser(lexer(strings, values));
};
