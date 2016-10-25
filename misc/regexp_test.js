"use strict";

var tests = [
  /./, "\t",
  /./, "\r",
  /./, "\n",
  /\s/, "\t",
  /\s/, "\r",
  /\s/, "\n",
  /\s/, "\t",
  /\s/, "", // XML Schema regexp would not match this.
  /\s/, "\u180e", // XML Schema regexp would not match this.
  /(?!a)./, "a",
  /ab(?:(?![bc])[abcd])cd/, "abdcd",
  /(?!(?!a))./, "a",
  /(?:(?!(?![c])[bc])[abcd])/, "a",
  /(?:(?!(?![c])[bc])[abcd])/, "b",
  /(?:(?!(?![c])[bc])[abcd])/, "c",
  /(?:(?!(?![c])[bc])[abcd])/, "d",
];

for (var i = 0; i < tests.length; i += 2) {
  var re = tests[i];
  var text = tests[i + 1];
  // eslint-disable-next-line no-console
  console.log("running:", re, "on", JSON.stringify(text), "result",
                text.match(re));
}
