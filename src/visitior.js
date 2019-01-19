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
                null,
                path.node.params.map(param => {
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
            if (path.node.typeParameters) {
                functionTypeAnnotation.typeParameters = path.node.typeParameters;
            }
            declareFunction.id.typeAnnotation = t.typeAnnotation(functionTypeAnnotation);

            if (t.isExportDefaultDeclaration(path.parentPath) || t.isExportNamedDeclaration(path.parentPath)) {
                const declareExportDeclaration = t.declareExportDeclaration(declareFunction);
                declareExportDeclaration.default = t.isExportDefaultDeclaration(path.parentPath);
                path.parentPath.replaceWith(declareExportDeclaration);
            }

            path.replaceWith(declareFunction);
        },
        ClassDeclaration(path) {
            if (skipTransform) return;
            const body = path.node.body.body;
            const properties = body.map(bodyMember => {
                if (t.isClassMethod(bodyMember)) {
                    const functionExpression = bodyMember;
                    const functionTypeAnnotation = t.functionTypeAnnotation(
                        functionExpression.typeParameters,
                        functionExpression.params.map(param => {
                            const functionTypeParam = t.functionTypeParam(
                                t.identifier(param.name),
                                (param.typeAnnotation && param.typeAnnotation.typeAnnotation) || t.anyTypeAnnotation()
                            );
                            functionTypeParam.optional = param.optional;
                            return functionTypeParam;
                        }),
                        null,
                        functionExpression.returnType && functionExpression.returnType.typeAnnotation
                    );

                    const objectTypeProperty = t.objectTypeProperty(bodyMember.key, functionTypeAnnotation);
                    objectTypeProperty.method = true;
                    objectTypeProperty.static = bodyMember.static;
                    return objectTypeProperty;
                }
            });
            const objectTypeAnnotation = t.objectTypeAnnotation(properties);
            const declareClass = t.declareClass(path.node.id, path.node.typeParameters, [], objectTypeAnnotation);
            path.replaceWith(declareClass);
        }
    };
};
