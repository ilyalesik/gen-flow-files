# gen-flow-files
This is a script which finds `.js` files with @flow annotation, extract flow definitions and save to specific folder.

## Installation

Install it with yarn:

```
yarn add gen-flow-files
```

Or with npm:

```
npm i gen-flow-files --save
```

## Usage
Command
```
npx gen-flow-files <inputDir> --out-dir <outputDir>
```
transfrom all *.js* files from `<inputDir>` to *.js.flow* files and save them at `<outputDir>`. 

As example, `<inputDir>/example.js`
```javascript
// @flow

extract function foo(arg1: number: arg2: string): string {
    // some code here
}
```
will be transformed to `<outputDir>/example.js.flow`:
```javascript
// @flow

declare extract function foo(arg1: number: arg2: string): string;
```
