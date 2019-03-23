# gen-flow-files

[![npm version](https://img.shields.io/npm/v/gen-flow-files.svg)](https://www.npmjs.com/package/gen-flow-files)
[![npm downloads](https://img.shields.io/npm/dt/gen-flow-files.svg)](https://www.npmjs.com/package/gen-flow-files)

This is a script which finds `.js` files with @flow annotation, extract flow definitions and save to specific folder.

As example, `<inputDir>/example.js`
```javascript
// @flow

extract function foo(arg1: number, arg2: string): string {
    // some code here
}
```
will be transformed to `<outputDir>/example.js.flow`:
```javascript
// @flow

declare extract function foo(arg1: number, arg2: string): string;
```

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
#### As part of build process

```json
scripts": {
    ...
    "flow": "flow",
    "build:flow": "gen-flow-files src --out-dir dist",
    ...
  },
```
transfrom all *.js* files from `src` to *.js.flow* files and save them at `dist`. 

#### As command
```
npx gen-flow-files <inputDir> --out-dir <outputDir>
```
transfrom all *.js* files from `<inputDir>` to *.js.flow* files and save them at `<outputDir>`. 


