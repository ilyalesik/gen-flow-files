import glob from "glob";
import path from "path";
import fs from "fs";
import { parse } from "@babel/parser";
import { _traverse as traverse } from "./traverse";
import generate from "@babel/generator";
import mkdirp from "mkdirp";

export default options => {
    const { inputDir: inputDirOrFile, outputDir: outputDirOrFile } = options;

    const inputIsDir = fs.statSync(inputDirOrFile).isDirectory();
    const outputIsDir = fs.statSync(outputDirOrFile).isDirectory(); // TODO Instead check if there's a file extension? E.g. .js.flow
    const inputDir = inputIsDir ? inputDirOrFile : path.dirname(inputDirOrFile);

    glob(
        inputIsDir ? "**/*.js" : inputDirOrFile,
        inputIsDir
            ? {
                  cwd: path.resolve(process.cwd(), inputDir)
              }
            : undefined,
        function(er, files) {
            for (let file of files) {
                fs.readFile(path.resolve(inputDir, file), "utf8", (err, code) => {
                    if (err) throw err;

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
                        const outputFile = outputIsDir ? path.resolve(outputDir, file + ".flow") : outputDirOrFile;
                        const outputFileDir = path.dirname(outputFile);

                        const createFile = () => {
                            fs.writeFile(outputFile, output.code, "utf8", err => {
                                if (err) throw err;
                            });
                        };

                        if (outputIsDir && !fs.existsSync(outputFileDir)) {
                            mkdirp(outputFileDir, function(err) {
                                if (err) throw err;
                                createFile();
                            });
                        } else {
                            createFile();
                        }
                    }
                });
            }
        }
    );
};
