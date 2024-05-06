---
"@withtyped/server": patch
---

use `response.setHeader()` to set request id header

This is to fix the `ERR_HTTP_HEADERS_SENT` issue when enabling the `requestId` feature. It happens when the response headers are sent directly without setting the `headers` property of the context object.
