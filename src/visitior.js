const t = require("@babel/types");

const FLOW_DIRECTIVE = /(@flow(\s+(strict(-local)?|weak))?|@noflow)/;

const transformToFunctionTypeAnnotation = path => {
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
    return functionTypeAnnotation;
};

const isExportDeclaration = path => {
    return t.isExportDefaultDeclaration(path) || t.isExportNamedDeclaration(path);
};

const transformToDeclareExportDeclaration = (path, declaration) => {
    const declareExportDeclaration = t.declareExportDeclaration(declaration);
    declareExportDeclaration.default = t.isExportDefaultDeclaration(path);
    return declareExportDeclaration;
};

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
            const functionTypeAnnotation = transformToFunctionTypeAnnotation(path);
            declareFunction.id.typeAnnotation = t.typeAnnotation(functionTypeAnnotation);

            if (isExportDeclaration(path.parentPath)) {
                const declareExportDeclaration = transformToDeclareExportDeclaration(path.parentPath, declareFunction);
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
                        (functionExpression.returnType && functionExpression.returnType.typeAnnotation) ||
                            t.anyTypeAnnotation()
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
        },
        ArrowFunctionExpression(path) {
            if (skipTransform) return;
            if (
                !path.parentPath ||
                !path.parentPath.parentPath ||
                !t.isVariableDeclarator(path.parentPath) ||
                !t.isVariableDeclaration(path.parentPath.parentPath)
            ) {
                return;
            }

            const variableDeclarator = path.parentPath;
            const variableDeclaration = path.parentPath.parentPath;

            const declareVariable = t.declareVariable(t.identifier(variableDeclarator.node.id.name));
            declareVariable.id.typeAnnotation = t.typeAnnotation(transformToFunctionTypeAnnotation(path));

            if (isExportDeclaration(variableDeclaration.parentPath)) {
                const declareExportDeclaration = transformToDeclareExportDeclaration(
                    variableDeclaration.parentPath,
                    declareVariable
                );
                variableDeclaration.parentPath.replaceWith(declareExportDeclaration);
            }

            variableDeclaration.replaceWith(declareVariable);
        }
    };
};
