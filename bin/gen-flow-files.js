#!/usr/bin/env node
const genFlowFiles = require("..").default;

var argv = require("yargs").argv;
var outputDir = argv.outDir;
var inputDir = argv._[0];

genFlowFiles({
    outputDir,
    inputDir
});
