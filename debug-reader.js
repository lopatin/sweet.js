/*
This file makes debugging sweet.js easier. Uses the built version of sweet.js
to compile "test.js". You can use node-inspector to step through the expansion
process:

	npm install -g node-inspector
	node-debug debug.js
*/

var Reader = require("./build/src/reader").default;

var fs = require("fs");

var source = fs.readFileSync("./test.js", "utf8");

debugger;

var result = new Reader(source).read();
console.log(result);
