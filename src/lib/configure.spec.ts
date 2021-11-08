// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("stdio");

/* import the subject under test (SUT) */
import { BusterConfigError, getConfig } from "./configure";

/* additional imports */
import { getopt } from "stdio";
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

describe("getConfig()...", () => {
  it("...rejects if getopt() returned null", () => {
    /* define the parameter */
    const testArgv = ["does", "not", "matter"];

    /* setup mocks and spies */
    (getopt as jest.Mock).mockReturnValue(null);

    /* make the assertions */
    return getConfig(testArgv).catch((err) => {
      expect(getopt).toHaveBeenCalledTimes(1);
      expect(err).toBeInstanceOf(BusterConfigError);
    });
  });
});

// describe("checkConfig()...", () => {});
