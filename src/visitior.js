const t = require("@babel/types");

const FLOW_DIRECTIVE = /(@flow(\s+(strict(-local)?|weak))?|@noflow)/;
const emptyIdentifier = { type: "Identifier", name: "" };

const transformFunctionExpressionParam = (param, id) => {
    if (t.isAssignmentPattern(param)) {
        return transformFunctionExpressionParam(param.left, id);
    }
    const functionTypeParam = t.functionTypeParam(
        t.identifier(t.isObjectPattern(param) ? "arg" + id : param.name),
        (param.typeAnnotation && param.typeAnnotation.typeAnnotation) || t.anyTypeAnnotation()
    );
    functionTypeParam.optional = param.optional;
    return functionTypeParam;
};

const transformToFunctionTypeAnnotation = functionDeclaration => {
    const functionTypeAnnotation = t.functionTypeAnnotation(
        functionDeclaration.typeParameters,
        functionDeclaration.params
            .filter(param => !t.isRestElement(param))
            .map((param, id) => transformFunctionExpressionParam(param, id)),
        null,
        (functionDeclaration.returnType && functionDeclaration.returnType.typeAnnotation) || t.anyTypeAnnotation()
    );
    if (
        functionDeclaration.params.length >= 1 &&
        t.isRestElement(functionDeclaration.params[functionDeclaration.params.length - 1])
    ) {
        const restElement = functionDeclaration.params[functionDeclaration.params.length - 1];
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
            const declareFunction = t.declareFunction(path.node.id || emptyIdentifier);
            const functionTypeAnnotation = transformToFunctionTypeAnnotation(path.node);
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
            const properties = body
                .map(bodyMember => {
                    if (t.isClassMethod(bodyMember)) {
                        const functionTypeAnnotation = transformToFunctionTypeAnnotation(bodyMember);

                        const objectTypeProperty = t.objectTypeProperty(bodyMember.key, functionTypeAnnotation);
                        objectTypeProperty.method = true;
                        objectTypeProperty.static = bodyMember.static;
                        return objectTypeProperty;
                    }
                    if (t.isClassProperty(bodyMember)) {
                        const objectTypeProperty = t.objectTypeProperty(
                            bodyMember.key,
                            (bodyMember.typeAnnotation && bodyMember.typeAnnotation.typeAnnotation) ||
                                t.anyTypeAnnotation()
                        );
                        objectTypeProperty.method = false;
                        objectTypeProperty.static = bodyMember.static;
                        return objectTypeProperty;
                    }
                })
                .filter(member => !!member);
            const objectTypeAnnotation = t.objectTypeAnnotation(properties);
            const declareClass = t.declareClass(
                path.node.id || emptyIdentifier,
                path.node.typeParameters,
                [],
                objectTypeAnnotation
            );

            if (path.node.superClass) {
                declareClass.extends = [
                    t.interfaceExtends(
                        t.identifier(path.node.superClass.name),
                        (path.node.superTypeParameters &&
                            t.typeParameterInstantiation(path.node.superTypeParameters.params)) ||
                            undefined
                    )
                ];
            }
            if (path.node.implements) {
                declareClass.implements = path.node.implements;
            }

            if (isExportDeclaration(path.parentPath)) {
                const declareExportDeclaration = transformToDeclareExportDeclaration(path.parentPath, declareClass);
                path.parentPath.replaceWith(declareExportDeclaration);
            }

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
            declareVariable.id.typeAnnotation = t.typeAnnotation(transformToFunctionTypeAnnotation(path.node));

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
