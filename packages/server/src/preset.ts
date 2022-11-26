import compose from './compose.js';
import withBody from './middleware/with-body.js';
import withRequest from './middleware/with-request.js';

export const createComposer = () => compose().and(withRequest()).and(withBody());
