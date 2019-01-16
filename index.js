var fs = require("fs");

var babelrc = fs.readFileSync("./.babelrc");
var config;

try {
    config = JSON.parse(babelrc);
} catch (err) {
    console.error("==>     ERROR: Error parsing your .babelrc.");
    console.error(err);
}

require("@babel/register")(config);
require("@babel/polyfill");
const plugin = require("./plugin");

const code = `
// @flow

function foo(one: any, two: number, three?): string {}
`;

require("@babel/core").transform(code, {
    plugins: [plugin]
}, function(err, result) {
    console.log(result.code);
});
