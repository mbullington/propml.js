var OPCODES = require('./opcodes').OPCODES;

function Pattern(delimiter, closingBracket, pattern) {
  this.closingBracket = closingBracket;
  pattern.push([delimiter, this.closingBracket]);

  this.pattern = pattern;
  this.patternIndex = 0;
  this.formedPattern = [];

  this.cb = null;
};

Pattern.prototype.insert = function(token) {
  if(this.childPattern)
    return this.childPattern.insert(token);

  var logic = function(token) {
    if((this.patternIndex + 1) % this.pattern.length === 0) {
      if(this.mold)
        this.mold(this.formedPattern);
      this.formedPattern.splice(0, this.formedPattern.length);

      if(token.type === this.closingBracket && this.cb && this.serialize) {
        this.cb(this.serialize());
      } else {
        this.patternIndex = 0;
      }
    } else {
      this.formedPattern.push(token);
      this.patternIndex++;
    }
  }.bind(this);

  var patternValue = this.pattern[this.patternIndex];
  var pattern;

  if(Array.isArray(patternValue) && patternValue.indexOf('PATTERN') > 0 && (pattern = this.createPattern(token))) {
    this.childPattern = pattern;
    pattern.done(function(value) {
      this.childPattern = null;
      logic({
        type: pattern.constructor.name,
        value: value
      });
    }.bind(this));

    return;
  }

  if(patternValue !== token.type && (!Array.isArray(patternValue) || patternValue.indexOf(token.type) === -1))
    throw new Error('error;\nunexpected ' + token.type + ' in pattern ' + this.friendlyName +';\nexpected ' + patternValue.toString() + ';\nfrom characters ' + token.start + ' to ' + token.end);

  logic(token);
};

Pattern.prototype.done = function(cb) {
  this.cb = cb;
};

var VALUE_OPCODES = [OPCODES.IDENTIFIER, OPCODES.STRING, OPCODES.NUMBER, OPCODES.BOOLEAN, OPCODES.TEMPLATE, 'PATTERN'];

function MapPattern(current) {
  Pattern.call(this, OPCODES.COMMA, OPCODES.CLOSE_PAREN,
    [
      OPCODES.IDENTIFIER,
      OPCODES.EQUALS,
      VALUE_OPCODES
    ]);

  this.friendlyName = 'Map';
  this.map = {};
}

MapPattern.prototype = Object.create(Pattern.prototype);

MapPattern.prototype.mold = function(formedPattern) {
  this.map[formedPattern[0].value] = formedPattern[2].value;
};

MapPattern.prototype.serialize = function() {
  return this.map;
};

function ListPattern(current) {
  Pattern.call(this, OPCODES.COMMA, OPCODES.CLOSE_BRACKET, [VALUE_OPCODES]);

  this.friendlyName = 'List';
  this.list = [];
}

ListPattern.prototype = Object.create(Pattern.prototype);

ListPattern.prototype.mold = function(formedPattern) {
  this.list.push(formedPattern[0].value);
};

ListPattern.prototype.serialize = function() {
  return this.list;
};

function ParametersPattern(current) {
  Pattern.call(this, OPCODES.COMMA, OPCODES.CLOSE_PAREN,
    [
      OPCODES.IDENTIFIER,
      OPCODES.EQUALS,
      VALUE_OPCODES
    ]);

  this.friendlyName = 'Properties';
  this.current = current;
}

ParametersPattern.prototype = Object.create(Pattern.prototype);

ParametersPattern.prototype.mold = function(formedPattern) {
  this.current.properties[formedPattern[0].value] = formedPattern[2].value;
};

ParametersPattern.prototype.serialize = function() {
  return this.current;
};

function createPattern(token) {
  switch(token.type) {
    case OPCODES.OPEN_PAREN:
      return new MapPattern();
    case OPCODES.OPEN_BRACKET:
      return new ListPattern();
    default:
      return null;
  }
}

MapPattern.prototype.createPattern = createPattern;
ListPattern.prototype.createPattern = createPattern;
ParametersPattern.prototype.createPattern = createPattern;

module.exports = {
  Pattern: Pattern,
  MapPattern: MapPattern,
  ListPattern: ListPattern,
  ParametersPattern: ParametersPattern
};
