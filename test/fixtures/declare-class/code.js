// @flow

class URL {
    constructor(urlStr: string): URL {
        this.urlStr = urlStr;
    }
    toString(): string {
        return this.urlStr;
    }

    static compare(url1: URL, url2: URL): boolean {
        return url1 === url2;
    }
}
