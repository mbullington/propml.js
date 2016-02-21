var OPCODES = require('./util/opcodes').OPCODES;
var ParametersPattern = require('./util/pattern').ParametersPattern;

function Navigator() {
  this.root = {
    properties: {},
    children: []
  };

  this.last = [];
  this.current = this.root;

  this.isProperties = false;
  this.pattern = null;
}

Navigator.prototype.push = function(shouldAdd) {
  shouldAdd = shouldAdd == null ? true : shouldAdd;
  if (this.isProperties)
    throw new Error('misplaced starting bracket');

  if (shouldAdd) {
    this.current.children.push({
      properties: {},
      children: []
    });
  }

  this.last.push(this.current);
  this.current = this.current.children[this.current.children.length - 1];
};

Navigator.prototype.pop = function() {
  if (this.isProperties)
    throw new Error('misplaced ending bracket');
  this.current = this.last.splice(this.last.length - 1, 1)[0];
};

Navigator.prototype.startProperties = function(token) {
  if (this.isProperties)
    return this.pattern.insert(token);
  this.push(false);
  this.isProperties = true;
  this.pattern = new ParametersPattern(this.current);

  this.pattern.done(function() {
    this.pattern = null;
    this.isProperties = false;
    this.pop();
  }.bind(this));
};

function insert(navigator, token) {
  navigator.pattern.insert(token);
}

var TRAVERSE = {};

TRAVERSE[OPCODES.OPEN_BRACE] = function(navigator) { navigator.push(false); };
TRAVERSE[OPCODES.CLOSE_BRACE] = function(navigator) { navigator.pop(); };

TRAVERSE[OPCODES.OPEN_PAREN] = function(navigator, token) { navigator.startProperties(token); };
TRAVERSE[OPCODES.CLOSE_PAREN] = insert;

TRAVERSE[OPCODES.IDENTIFIER] = function(navigator, token) {
  var value = token.value;

  if (!navigator.isProperties) {
    var pieces = value.split('@');
    if (pieces.length > 2)
      throw new Error('more than one @ in node identifier');

    var map = {
      type: pieces[0],
      properties: {},
      children: []
    };

    if (pieces.length === 2)
      map.id = pieces[1];

    navigator.current.children.push(map);
  } else {
    insert(navigator, token);
  }
};

TRAVERSE[OPCODES.EQUALS] = insert;
TRAVERSE[OPCODES.COMMA] = insert;

TRAVERSE[OPCODES.STRING] = insert;

TRAVERSE[OPCODES.OPEN_BRACKET] = insert;
TRAVERSE[OPCODES.CLOSE_BRACKET] = insert;

TRAVERSE[OPCODES.NUMBER] = function(navigator, token) {
  if (!navigator.isProperties) {
    token.value = token.value.toString();
    return TRAVERSE[OPCODES.IDENTIFIER](navigator, token);
  }

  insert(navigator, token);
};

TRAVERSE[OPCODES.BOOLEAN] = function(navigator, token) {
  token.value = token.value === 'true' ? true : false;
  insert(navigator, token);
};

TRAVERSE[OPCODES.TEMPLATE] = function(navigator, token, values) {
  token.value = values.splice(0, 1)[0];
  insert(navigator, token);
};

function parse(obj) {
  var tokens = obj.tokens;
  var values = obj.values;

  var navigator = new Navigator();

  var index = 0, length = tokens.length;
  for(; index < length; index++) {
    var token = tokens[index];
    if (TRAVERSE[token.type || token])
      TRAVERSE[token.type || token](navigator, token, values);
  }

  return navigator.root.children;
};

module.exports = parse;
