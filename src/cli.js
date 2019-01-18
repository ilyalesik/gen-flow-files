import glob from "glob";
import path from "path";
import fs from "fs";
const parser = require("@babel/parser");
import { _traverse as traverse } from "./traverse";
import generate from "@babel/generator";
import mkdirp from "mkdirp";

export default options => {
    const { inputDir, outputDir } = options;

    glob(
        "**/*.js",
        {
            cwd: path.resolve(process.cwd(), inputDir)
        },
        function(er, files) {
            for (let file of files) {
                fs.readFile(path.resolve(inputDir, file), "utf8", (err, code) => {
                    if (err) throw err;

                    const ast = parser.parse(code, {
                        sourceType: "module",

                        plugins: [
                            // enable jsx and flow syntax
                            "jsx",
                            "flow"
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
                        const outputFile = path.resolve(outputDir, file);
                        const outputFileDir = path.dirname(outputFile);

                        const createFile = () => {
                            fs.writeFile(outputFile, output.code, "utf8", err => {
                                if (err) throw err;
                            });
                        };

                        if (!fs.existsSync(outputFileDir)) {
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
