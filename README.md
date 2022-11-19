# withtyped

Type-safe RESTful framework for fullstack. Zero dependency.

- 😄 No mind-switch, still RESTful
- 🎁 Write typed API, get typed client free
- 🛡️ Guard request input (path params, query, body) and output (response)
- ⚪ Minimalism, zero dependency and framework-agnostic
- 📖 Auto OpenAPI JSON generation[^openapi]

## Even without APIs...

- Withtyped is a succinct web framework with fully typed middleware functions
- Immutable context (say goodbye to `ctx.body = {}`, huh)

## Credit

Heavily inspired by [trpc](https://github.com/trpc/trpc) and [koajs](https://github.com/koajs/koa) with two pain points:

- Existing services and components are mainly based on RESTful, hard to gradually migrate to a new framework
- KoaJS is written in JavaScript and its ecosystem is lack of maintenance

[^openapi]: Needs a simple transformer function that parses your type guard to OpenAPI schema. See sample project for details.
