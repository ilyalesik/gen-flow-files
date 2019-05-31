// @flow

type ResponseObject = {
    body: mixed,
    callback: () => void,
    error: string,
    statusCode: number,
};

class RandomUtil {
    static RandomUtilReturn({body, callback, error, statusCode}: ResponseObject) {
    }
}
