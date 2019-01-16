import { declare } from "@babel/helper-plugin-utils";
import syntaxFlow from "@babel/plugin-syntax-flow";
import { types as t } from "@babel/core";

export default declare(api => {
    api.assertVersion(7);

    const FLOW_DIRECTIVE = /(@flow(\s+(strict(-local)?|weak))?|@noflow)/;

    let skipStrip = false;

    return {
        name: "transform-flow-strip-types",
        inherits: syntaxFlow,

        visitor: {
            Program(
                path,
                {
                    file: {
                        ast: { comments },
                    },
                    opts,
                },
            ) {
                skipStrip = false;
                let directiveFound = false;

                if (comments) {
                    for (const comment of (comments: Array<Object>)) {
                        if (FLOW_DIRECTIVE.test(comment.value)) {
                            directiveFound = true;

                            // remove flow directive
                            comment.value = comment.value.replace(FLOW_DIRECTIVE, "");

                            // remove the comment completely if it only consists of whitespace and/or stars
                            if (!comment.value.replace(/\*/g, "").trim()) {
                                comment.ignore = true;
                            }
                        }
                    }
                }

                if (!directiveFound && opts.requireDirective) {
                    skipStrip = true;
                }
            },
            ImportDeclaration(path) {
                if (skipStrip) return;
                if (!path.node.specifiers.length) return;

                let typeCount = 0;

                path.node.specifiers.forEach(({ importKind }) => {
                    if (importKind === "type" || importKind === "typeof") {
                        typeCount++;
                    }
                });

                if (typeCount === path.node.specifiers.length) {
                    path.remove();
                }
            },

            FunctionDeclaration(path) {
                if (skipStrip) return;
                const declareFunction = t.declareFunction(path.node.id);
                const functionTypeAnnotation = t.functionTypeAnnotation(null, path.node.params.map((param) =>
                    t.functionTypeParam(
                        t.identifier(param.name),
                        param.typeAnnotation && param.typeAnnotation.typeAnnotation || t.anyTypeAnnotation())
                    ),
                    null,
                    path.node.returnType.typeAnnotation
                );
                declareFunction.id.typeAnnotation = t.typeAnnotation(functionTypeAnnotation);
                path.replaceWith(
                    declareFunction
                );
            }
        },
    };
});
