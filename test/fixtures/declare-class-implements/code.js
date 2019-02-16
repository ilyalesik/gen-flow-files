// @flow
interface Serializable {
    serialize(): string;
}

class Foo implements Serializable {
    serialize() { return '[Foo]'; } // Works!
}
