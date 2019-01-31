// @flow
declare function foo<T: {
  [string]: number
}, G>(arg: T, arg1: G): T;
