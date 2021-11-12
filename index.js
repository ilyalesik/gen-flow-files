var fs = require("fs");

var babelrc = fs.readFileSync("./babel.config.json");
var config;

try {
    config = JSON.parse(babelrc);
} catch (err) {
    console.error("==>     ERROR: Error parsing your babel.config.json.");
    console.error(err);
}

require("@babel/register")(config);
require("@babel/polyfill");

const inputDir = process.argv[2];
const outputDir = process.argv[3];

const genFlowFiles = require("./src/cli").default;
genFlowFiles({
    inputDir,
    outputDir
});
