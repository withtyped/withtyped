import compose from './compose.js';
import withBody from './middleware/with-body.js';
import withRequest from './middleware/with-request.js';
import withSystemLog from './middleware/with-system-log.js';

export const createComposer = () => compose(withRequest()).and(withBody()).and(withSystemLog());
