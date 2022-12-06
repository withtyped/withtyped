import compose from './compose.js';
import withBody from './middleware/with-body.js';
import withRequest from './middleware/with-request.js';

/** Generate a composer with the default middleware function preset: `withRequest()` and `withBody()`.  */
export const createComposer = () => compose().and(withRequest()).and(withBody());
