// @flow

type ResponseObject = {
    body: mixed,
    callback: () => void,
    error: string,
    statusCode: number
};

class RandomUtil {
    RandomUtilReturn({ body, callback, error, statusCode }: ResponseObject) {}
}
