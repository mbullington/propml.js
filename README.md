propml.js
===

JavaScript reference parser for PropML, built for node.js and browser, currently
beta quality.
Exposes a function that can be used as a tagged template string in ES6, or as
a normal function.

Function will return a list of PropML root nodes, each with a `properties` object
and list of `children`. While this tree structure isn't very useful on it's own,
various middleware can consume it and transform it into something useful, like
`propml-dslink`, `propml-xml`, or `propml-react` (all coming soon). Most likely,
you should use a middleware, and not interact with this library directly.

When using ES6 tagged template strings, this PropML parser will treat templated
values in a special way as 'native' property values, akin to JSX, not simply
concatenating strings.

Specification for PropML can be found [here](https://www.github.com/mbullington/propml).

## TODO

* [x] Literal strings, `r""`, don't work as intended, but should be parsed without error.
* [x] Support escaping in strings.
* [x] List support for values.
* [x] Inline map support for values.
* [ ] Better error handling.
* [ ] Unit testing.
* [ ] 1.0.0 release, via npm.

## Examples

```js
// normal usage
var propml = require('propml');

propml('my@test() {}');
```

```js
// using with ES6
var propml = require('propml');

var native = Date.now();

propml`
  my@test(time = ${native}) {

  }
`;
```
