import { Handler } from "aws-lambda";

// The setup implementation lives in libs/shared (see libs/shared/src/setup/handler).
// This thin wrapper exists so serverless.yml can resolve `src/setup/handler`
// like every other function in the service — without it, `serverless invoke
// local --function setup` fails with "Cannot locate handler - src/setup/handler"
// (reported in undp/undp-national-carbon-registry#345).
//
// Imported via a relative path (not the @app/* alias) on purpose: the compiled
// wrapper is loaded from .build/src/, where the @app/* alias does not resolve.
export { handler } from "../../libs/shared/src/setup/handler";
