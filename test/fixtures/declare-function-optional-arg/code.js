// @flow

function foo(one: any, two: number, three?: string): string {
    const one1 = "" + one;
    const two1 = "" + two;
    return one1 + two1;
}
