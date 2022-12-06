export class ModelClientError extends Error {
  constructor(
    public readonly code: 'entity_not_found' | 'key_not_found',
    message = 'ModelClientError occurred'
  ) {
    super(message);
  }
}
