var OPCODES = require('./util').OPCODES;

function Navigator() {
  this.root = {
    properties: {},
    children: []
  };

  this.last = [];
  this.current = this.root;
  this.isProperties = false;

  this.propertyKey = null;
  this.needs = null;
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

Navigator.prototype.startProperties = function() {
  this.push(false);
  if (this.isProperties)
    throw new Error('misplaced starting parenthesis');
  this.isProperties = true;
  this.needs = OPCODES.IDENTIFIER;
};

Navigator.prototype.stopProperties = function() {
  if (!this.isProperties)
    throw new Error('misplaced ending parenthesis');
  this.needs = null;
  this.isProperties = false;
  this.pop();
};

Navigator.prototype.insert = function(value) {
  if(!this.isProperties || !(this.needs === value.type || (Array.isArray(this.needs) && this.needs.indexOf(value.type) > -1)))
    throw new Error('error;\nunexpected ' + value.type + ' in property declaration;\nexpected ' + this.needs.toString() + ';\nfrom characters ' + value.start + ' to ' + value.end);

  // key
  if(this.needs === OPCODES.IDENTIFIER) {
    this.propertyKey = value.value;
    this.needs = OPCODES.EQUALS;
    return;
  }

  var opcodesValue = [OPCODES.IDENTIFIER, OPCODES.STRING, OPCODES.NUMBER, OPCODES.BOOLEAN, OPCODES.TEMPLATE];
  var opcodesEnd = [OPCODES.COMMA, OPCODES.CLOSE_PAREN];

  if(this.needs === OPCODES.EQUALS) {
    this.needs = opcodesValue;
    return;
  }

  if(this.needs.length === opcodesValue.length) {
    this.current.properties[this.propertyKey] = value.value;
    this.propertyKey = null;
    this.needs = opcodesEnd;
    return;
  }

  if(this.needs.length === opcodesEnd.length) {
    this.needs = OPCODES.IDENTIFIER;
    return;
  }
};

var TRAVERSE = {};

TRAVERSE[OPCODES.OPEN_BRACE] = function(navigator) { navigator.push(false); };
TRAVERSE[OPCODES.CLOSE_BRACE] = function(navigator) { navigator.pop(); };
TRAVERSE[OPCODES.OPEN_PAREN] = function(navigator) { navigator.startProperties(); };
TRAVERSE[OPCODES.CLOSE_PAREN] = function(navigator, token) { navigator.insert(token); navigator.stopProperties(); };

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
    navigator.insert(token);
  }
};

TRAVERSE[OPCODES.EQUALS] = function(navigator, token) {
  navigator.insert(token);
};

TRAVERSE[OPCODES.COMMA] = function(navigator, token) {
  navigator.insert(token);
};

TRAVERSE[OPCODES.STRING] = function(navigator, token) {
  navigator.insert(token);
};

TRAVERSE[OPCODES.NUMBER] = function(navigator, token) {
  if (!navigator.isProperties) {
    token.value = token.value.toString();
    return TRAVERSE[OPCODES.IDENTIFIER](navigator, token);
  }

  navigator.insert(token);
};

TRAVERSE[OPCODES.BOOLEAN] = function(navigator, token) {
  token.value = token.value === 'true' ? true : false;
  navigator.insert(token);
};

TRAVERSE[OPCODES.TEMPLATE] = function(navigator, token, values) {
  token.value = values.splice(0, 1)[0];
  navigator.insert(token);
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
