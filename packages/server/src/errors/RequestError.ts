export default class RequestError extends Error {
  constructor(
    message = 'Request error occurred',
    public readonly status = 400,
    public readonly original?: unknown
  ) {
    super(message);
    this.name = 'RequestError';
    this.cause = original;
  }
}
