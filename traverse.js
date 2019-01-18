import traverse from "@babel/traverse";
import {visitor} from "./visitior";

export const _traverse=  ast => {
    let skipTransform = false;

    traverse(ast, visitor({onChangeSkipTransform: (v) => skipTransform = v}));

    return {
        skipTransform
    }
};
