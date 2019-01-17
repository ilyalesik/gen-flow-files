import { declare } from "@babel/helper-plugin-utils";
import syntaxFlow from "@babel/plugin-syntax-flow";
import { types as t } from "@babel/core";
import traverse from "@babel/traverse";

export const _traverse=  ast => {

    const FLOW_DIRECTIVE = /(@flow(\s+(strict(-local)?|weak))?|@noflow)/;

    let skipTransform = false;

    const comments = ast.comments;

    traverse(ast, {
        Program(
            path,
        ) {
            skipTransform = false;
            let directiveFound = false;

            if (comments) {
                for (const comment of (comments)) {
                    if (FLOW_DIRECTIVE.test(comment.value)) {
                        directiveFound = true;
                    }
                }
            }

            if (!directiveFound) {
                skipTransform = true;
            }
        },
        FunctionDeclaration(path) {
            if (skipTransform) return;
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

            if (t.isExportDefaultDeclaration(path.parentPath) || t.isExportNamedDeclaration(path.parentPath)) {
                const declareExportDeclaration = t.declareExportDeclaration(
                    declareFunction
                );
                declareExportDeclaration.default = t.isExportDefaultDeclaration(path.parentPath);
                path.parentPath.replaceWith(
                    declareExportDeclaration
                )
            }

            path.replaceWith(
                declareFunction
            );


        }
    });

    return {
        skipTransform
    }
};
