var fs = require('fs'), path = require('path');
var propml = require('../');

var time = Date.now();

var str = fs.readFileSync(path.join(__dirname, 'test.propml'), 'utf8');
var ast = propml([str]);
console.log(Date.now() - time);

console.log(JSON.stringify(ast));
