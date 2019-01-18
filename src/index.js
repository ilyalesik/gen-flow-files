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

const inputDir = process.argv[2];
const outputDir = process.argv[3];

const genFlowFiles = require("./cli").default;
genFlowFiles({
    inputDir,
    outputDir
});
