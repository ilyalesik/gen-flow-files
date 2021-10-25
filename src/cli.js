import glob from "glob";
import path from "path";
import os from "os";
import fs, { promises as fsp } from "fs";
import { parse } from "@babel/parser";
import { _traverse as traverse } from "./traverse";
import generate from "@babel/generator";
import mkdirp from "mkdirp";
import pLimit from "p-limit";

const limit = pLimit(os.cpus().length);

const generateDefinitionFile = (inputDir, outputDir, file) =>
    fsp.readFile(path.resolve(inputDir, file), "utf8").then(code => {
        const ast = parse(code, {
            sourceType: "module",

            plugins: [
                // enable common plugins
                "flow",
                "jsx",
                "asyncFunctions",
                "asyncGenerators",
                "classConstructorCall",
                "classProperties",
                "decorators-legacy",
                "doExpressions",
                "exponentiationOperator",
                "exportExtensions",
                "functionBind",
                "functionSent",
                "objectRestSpread",
                "trailingFunctionCommas",
                "dynamicImport",
                "numericSeparator",
                "optionalChaining",
                "importMeta",
                "classPrivateProperties",
                "bigInt",
                "optionalCatchBinding",
                "partialApplication",
                "throwExpressions"
            ]
        });

        const result = traverse(ast);
        if (result && !result.skipTransform) {
            const output = generate(
                ast,
                {
                    /* options */
                },
                code
            );
            const outputFile = path.resolve(outputDir, file + ".flow");
            const outputFileDir = path.dirname(outputFile);

            const createFile = () => fsp.writeFile(outputFile, output.code, "utf8");

            return !fs.existsSync(outputFileDir) ? mkdirp(outputFileDir).then(createFile) : createFile();
        }
    });

export default options => {
    const { inputDir, outputDir } = options;

    glob(
        "**/*.js",
        {
            cwd: path.resolve(process.cwd(), inputDir)
        },
        function(er, files) {
            Promise.all(files.map(file => limit(() => generateDefinitionFile(inputDir, outputDir, file)))).catch(
                console.error
            );
        }
    );
};
