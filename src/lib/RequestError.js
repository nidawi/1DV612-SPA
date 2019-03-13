export default class RequestError extends Error {
  constructor(code, msg) {
    super(msg);
    this.code = code;
  }
}