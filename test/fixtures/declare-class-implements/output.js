// @flow
interface Serializable {
  serialize(): string
}
declare class Foo implements Serializable {
  serialize(): any
}
