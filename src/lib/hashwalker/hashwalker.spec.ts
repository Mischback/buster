// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("fs/promises");
jest.mock("path");
jest.mock("./walker");

/* import the subject under test (SUT) */
import { hashWalker } from "./hashwalker";

/* additional imports */
import { logger } from "../logging";
import { BusterConfig } from "../configure";
import { fileObjectWalker } from "./walker";

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
  it("...wraps around fileObjectWalker() and passes the config on", () => {
    /* define the parameter */
    const testRejection = "foobar";
    const testConfig = {
      input: "test",
    } as unknown as BusterConfig;

    /* setup mocks and spies */
    (fileObjectWalker as jest.Mock).mockRejectedValue(testRejection);

    return hashWalker(testConfig).catch((err) => {
      expect(err).toBe(testRejection);
      expect(fileObjectWalker).toHaveBeenCalledWith(
        testConfig.input,
        expect.anything(),
        testConfig
      );
    });
  });
});
