import {types as t} from "@babel/core";

const FLOW_DIRECTIVE = /(@flow(\s+(strict(-local)?|weak))?|@noflow)/;

export const visitor = (options) => {
    let skipTransform = false;
    const changeSkipTransform = (newValue) => {
        skipTransform = newValue;
        if (options && options.onChangeSkipTransform) {
            options.onChangeSkipTransform(skipTransform);
        }
    };

    return {
        Program(
            path,
        ) {
            changeSkipTransform(false);
            let directiveFound = false;

            const comments = path.container.comments;

            if (comments) {
                for (const comment of (comments)) {
                    if (FLOW_DIRECTIVE.test(comment.value)) {
                        directiveFound = true;
                    }
                }
            }

            if (!directiveFound) {
                changeSkipTransform(true);
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
    }
}
