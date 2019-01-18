var glob = require("glob");
var path = require("path");
var fs = require("fs");

var parser = require("@babel/parser");
var traverse = require("./traverse")._traverse;
const generate = require("@babel/generator").default;
var mkdirp = require("mkdirp");

const src = process.argv[2];
const dist = process.argv[3];

if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
}

glob(
    "**/*.js",
    {
        cwd: path.resolve(process.cwd(), src)
    },
    function(er, files) {
        console.log(files.map(file => path.resolve(src, file)));

        for (let file of files) {
            fs.readFile(path.resolve(src, file), "utf8", (err, code) => {
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
                    console.log(output.code);
                    const outputFile = path.resolve(dist, file);
                    const outputFileDir = path.dirname(outputFile);

                    const createFile = () => {
                        fs.writeFile(outputFile, output.code, "utf8", err => {
                            if (err) throw err;
                            console.log(outputFile);
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
