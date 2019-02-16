// @flow

class URL<T> {
    constructor(urlStr: string): URL {
        this.urlStr = urlStr;
    }
    toString(): string {
        return this.urlStr;
    }

    render() {}

    static compare(url1: URL, url2: URL): boolean {
        return url1 === url2;
    }
}
