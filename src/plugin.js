import { declare } from "@babel/helper-plugin-utils";
import syntaxFlow from "@babel/plugin-syntax-flow";
import { visitor } from "./visitior";

export default declare(api => {
    api.assertVersion(7);

    return {
        name: "transform-flow-extract-definitions",
        inherits: syntaxFlow,

        visitor: visitor()
    };
});
