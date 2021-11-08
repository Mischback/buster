// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("path");

/* import the subject under test (SUT) */

/* additional imports */
import { logger } from "./logging";

/* Run these before actually starting the test suite */
beforeAll(() => {
  /* The test subject relies on "tslog" to provide log messages.
   * For running the test-suite, actually printing the log messages to the
   * console is unwanted, so the output is suppressed.
   */
  logger.setSettings({
    suppressStdOutput: true,
  });
});

describe("checkConfig()...", () => {
  it("...", () => {
    /* define the parameter */

    /* setup mocks and spies */

    /* make the assertions */
    expect(1).toBe(2);
  });
});

// describe("getConfig()...", () => {});
