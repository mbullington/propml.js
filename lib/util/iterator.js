// loosely inspired by ES6's String.iterator
function Iterator(string) {
  this.string = string;
  this.index = 0;
  this.length = string.length;
  this.done = false;
}

Iterator.prototype.next = function() {
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

Iterator.prototype.nextUntil = function(cb) {
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
      return letters.join('');
    }
  }

  this.index--;

  return letters.join('');
};

module.exports = {
  Iterator: Iterator
};
