#!/usr/bin/env node
const genFlowFiles = require("..").default;

var argv = require("yargs").argv;
console.log(argv);
var outputDir = argv.outDir;
var inputDir = argv._[0];

genFlowFiles({
    outputDir,
    inputDir
});
