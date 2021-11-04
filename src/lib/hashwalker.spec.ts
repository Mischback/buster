// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("fs/promises");

/* import the subject under test (SUT) */
import { BusterHashWalkerError, hashWalker } from "./hashwalker";

/* additional imports */
import { readdir } from "fs/promises";
import { logger } from "./logging";
import { BusterConfig } from "./configure";

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

describe("hashWalker()...", () => {
  it("...rejects if readdir() fails on the provided root directory", () => {
    /* define the parameter */
    const testRejection = "foobar";
    const testExtensions = ["js"];
    const testHashLength = 10;
    const testMode = "copy";
    const testOutFile = "testmanifest.json";
    const testRootDir = "./testing";
    const testConfig: BusterConfig = {
      extensions: testExtensions,
      hashLength: testHashLength,
      mode: testMode,
      outFile: testOutFile,
      rootDirectory: testRootDir,
    };

    /* setup mocks and spies */
    (readdir as jest.Mock).mockRejectedValue(testRejection);
    const loggerDebugSpy = jest.spyOn(logger, "debug");

    /* make the assertions */
    return hashWalker(testConfig)
      .then(() => {
        // This should not be reached, but make sure to FAIL the test
        expect(1).toBe(2);
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(BusterHashWalkerError);
        expect(loggerDebugSpy).toHaveBeenCalledWith(testRejection);
      });
  });

  // it("...rejects if readdir() fails on a subdirectory", () => {});

  // it("...rejects if stat() fails on a given file system item", () => {});
});
