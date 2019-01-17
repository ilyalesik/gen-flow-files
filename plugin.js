import { declare } from "@babel/helper-plugin-utils";
import syntaxFlow from "@babel/plugin-syntax-flow";
import { types as t } from "@babel/core";

export default declare(api => {
    api.assertVersion(7);

    const FLOW_DIRECTIVE = /(@flow(\s+(strict(-local)?|weak))?|@noflow)/;

    let skipStrip = false;

    return {
        name: "transform-flow-extract-definitions",
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
                    for (const comment of (comments)) {
                        if (FLOW_DIRECTIVE.test(comment.value)) {
                            directiveFound = true;
                        }
                    }
                }

                if (!directiveFound && opts.requireDirective) {
                    skipStrip = true;
                }
            },
            FunctionDeclaration(path) {
                if (skipStrip) return;
                const declareFunction = t.declareFunction(path.node.id);
                const functionTypeAnnotation = t.functionTypeAnnotation(null, path.node.params.map((param) => {
                        const functionTypeParam = t.functionTypeParam(
                            t.identifier(param.name),
                            param.typeAnnotation && param.typeAnnotation.typeAnnotation || t.anyTypeAnnotation()
                        );
                        functionTypeParam.optional = param.optional;
                        return functionTypeParam;
                    }),
                    null,
                    path.node.returnType.typeAnnotation
                );
                if (path.node.typeParameters) {
                    functionTypeAnnotation.typeParameters = path.node.typeParameters;
                }
                declareFunction.id.typeAnnotation = t.typeAnnotation(functionTypeAnnotation);

                path.replaceWith(
                    declareFunction
                );

                if (t.isExportNamedDeclaration(path.parentPath)) {
                    path.parentPath.replaceWith(
                        t.declareExportDeclaration(
                            declareFunction
                        )
                    )
                }
            }
        },
    };
});
