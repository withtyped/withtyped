/* eslint-disable unicorn/prevent-abbreviations */
type P = '/user/:id/password';

type IsParam<Part> = Part extends `:${infer Name}` ? Name : never;

type Parts<Path extends string> = Path extends `/${infer A}`
  ? Parts<A>
  : Path extends `${infer A}/${infer B}`
  ? IsParam<A> | Parts<B>
  : IsParam<Path>;

type Params<Path extends string> = {
  [key in Parts<Path>]: string;
};

type A = Params<'/a/:b/:c'>;

type B = Params<'/user/:id/password'>;

type C = Params<'/'>;

/* eslint-disable @typescript-eslint/ban-types */
type Routes = {
  get: {};
  post: {};
};
/* eslint-enable @typescript-eslint/ban-types */

type ApiGuard<Path extends string, Body = never, Response = never> = {
  params: Params<Path>;
  body: Body;
  response: Response;
};

export declare class Router<T = Routes> {
  get<Path extends string, Body, Response>(
    path: Path,
    guard?: ApiGuard<Path, Body, Response>
  ): Router<{
    [key in keyof T]: key extends 'get'
      ? T[key] & { [key in Path]: ApiGuard<Path, Body, Response> }
      : T[key];
  }>;
  // Post<Path extends string>(
  //   path: Path
  // ): RouterCls<{
  //   [key in keyof T]: key extends 'post' ? T[key] | Path : T[key];
  // }>;
  routes(): T;
}

/*
Backup code 
const router: Router;
const guard: ApiGuard<never, { a: number }>;

const rrr = router.get('/foo/:bar', guard).get('/foo/bar').routes().get['/foo/:bar'].params;
*/

/* eslint-enable unicorn/prevent-abbreviations */
