import { types as t } from "@babel/core";

const FLOW_DIRECTIVE = /(@flow(\s+(strict(-local)?|weak))?|@noflow)/;

export const visitor = options => {
    let skipTransform = false;
    const changeSkipTransform = newValue => {
        skipTransform = newValue;
        if (options && options.onChangeSkipTransform) {
            options.onChangeSkipTransform(skipTransform);
        }
    };

    return {
        Program(path) {
            changeSkipTransform(false);
            let directiveFound = false;

            const comments = path.container.comments;

            if (comments) {
                for (const comment of comments) {
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
            const functionTypeAnnotation = t.functionTypeAnnotation(
                path.node.typeParameters,
                path.node.params
                    .filter(param => t.isIdentifier(param))
                    .map(param => {
                        const functionTypeParam = t.functionTypeParam(
                            t.identifier(param.name),
                            (param.typeAnnotation && param.typeAnnotation.typeAnnotation) || t.anyTypeAnnotation()
                        );
                        functionTypeParam.optional = param.optional;
                        return functionTypeParam;
                    }),
                null,
                path.node.returnType.typeAnnotation
            );
            if (path.node.params.length >= 1 && t.isRestElement(path.node.params[path.node.params.length - 1])) {
                const restElement = path.node.params[path.node.params.length - 1];
                functionTypeAnnotation.rest = t.functionTypeParam(
                    t.identifier(restElement.argument.name),
                    (restElement.typeAnnotation && restElement.typeAnnotation.typeAnnotation) || t.anyTypeAnnotation()
                );
            }
            declareFunction.id.typeAnnotation = t.typeAnnotation(functionTypeAnnotation);

            if (t.isExportDefaultDeclaration(path.parentPath) || t.isExportNamedDeclaration(path.parentPath)) {
                const declareExportDeclaration = t.declareExportDeclaration(declareFunction);
                declareExportDeclaration.default = t.isExportDefaultDeclaration(path.parentPath);
                path.parentPath.replaceWith(declareExportDeclaration);
            }

            path.replaceWith(declareFunction);
        }
    };
};
