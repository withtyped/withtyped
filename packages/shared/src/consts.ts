import { RequestMethod } from './types.js';

export const requestMethods = Object.freeze(Object.values(RequestMethod));
export const lowerRequestMethods = Object.freeze(
  requestMethods.map(
    // Cannot change the return type of `.toLowerCase()`
    // eslint-disable-next-line no-restricted-syntax
    (value) => value.toLowerCase() as Lowercase<RequestMethod>
  )
);
