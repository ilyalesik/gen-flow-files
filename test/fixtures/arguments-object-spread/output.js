// @flow
type ResponseObject = {
  body: mixed,
  callback: () => void,
  error: string,
  statusCode: number,
};
declare class RandomUtil {
  static RandomUtilReturn(arg0: ResponseObject): any
}
