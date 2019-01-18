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

export default function foo(one: any, two: number): string {
    const one1 = "" + one;
    const two1 = "" + two;
    return one1 + two1;
}
`;

require("@babel/core").transform(code, {
    plugins: [plugin]
}, function(err, result) {
    if (err) {
        console.log(err);
    }
    console.log(result.code);
});
