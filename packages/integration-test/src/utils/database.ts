import { customAlphabet, urlAlphabet } from 'nanoid';

export const createDatabaseName = () => 'withtyped-' + customAlphabet(urlAlphabet, 8)();
