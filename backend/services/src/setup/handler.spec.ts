import { handler as setupHandler } from "./handler";
import { handler as sharedHandler } from "../shared/handler";

// serverless.yml resolves every function to a handler file under src/.
// src/setup/handler and src/shared/handler went missing, breaking
// `serverless invoke local --function setup` and `sls offline` outright
// (undp/undp-national-carbon-registry#345). Guard against regressions.
describe("serverless handler wrappers", () => {
  it("setup wrapper exposes a callable handler", () => {
    expect(typeof setupHandler).toBe("function");
  });

  it("shared (default catch-all) wrapper exposes a callable handler", () => {
    expect(typeof sharedHandler).toBe("function");
  });
});
