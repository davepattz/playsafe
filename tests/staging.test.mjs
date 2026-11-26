import assert from "node:assert/strict";
import test from "node:test";
import { isStagingBuild } from "../lib/staging.ts";

test("the staging site and Netlify preview contexts use indexing controls", () => {
  assert.equal(isStagingBuild({ CONTEXT: "production", PLAYSAFE_STAGING: "1" }), true);
  assert.equal(isStagingBuild({ CONTEXT: "branch-deploy" }), true);
  assert.equal(isStagingBuild({ CONTEXT: "deploy-preview" }), true);
  assert.equal(isStagingBuild({ CONTEXT: "production" }), false);
  assert.equal(isStagingBuild({}), false);
});
