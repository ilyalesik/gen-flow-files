// @flow

function foo(one: any, two: number, three?): string {
    const one1 = "" + one;
    const two1 = "" + two;
    return one1 + two1;
}
