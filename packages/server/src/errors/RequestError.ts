export default class RequestError extends Error {
  constructor(message = 'Request error occurred', public readonly status = 400) {
    super(message);
  }
}
