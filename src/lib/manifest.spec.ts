// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("./json-interface");

/* import the subject under test (SUT) */
import { BusterManifestError, createManifestFile } from "./manifest";

/* additional imports */
import { BusterConfig, MODE_COPY } from "./configure";
import { writeJsonToFile } from "./json-interface";
import { logger } from "./logging";
import { HashWalkerResult } from "./hashwalker/hashwalker";

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

describe("createManifestFile()...", () => {
  it("...rejects with an error if the outputFile could not be written to", () => {
    /* define the parameter */
    const testFilename = "testing.ext";
    const testConfig: BusterConfig = {
      commonPathLength: -1,
      input: "foo",
      outFile: testFilename,
      hashLength: 10,
      mode: MODE_COPY,
      extensions: ["ext"],
    };
    const testResult: HashWalkerResult = {};
    const testError = new Error("foo");

    /* setup mocks and spies */
    (writeJsonToFile as jest.Mock).mockRejectedValue(testError);
    const loggerDebugSpy = jest.spyOn(logger, "debug");

    /* make the assertions */
    return createManifestFile(testResult, testConfig).catch((err) => {
      expect(err).toBeInstanceOf(BusterManifestError);
      expect(writeJsonToFile).toHaveBeenCalledTimes(1);
      expect(writeJsonToFile).toHaveBeenCalledWith(testFilename, testResult);
      expect(loggerDebugSpy).toHaveBeenCalledTimes(1);
      expect(loggerDebugSpy).toHaveBeenCalledWith(testError);
    });
  });

  it("...resolves if writing to outputFile completes successfully", () => {
    /* define the parameter */
    const testFilename = "testing.ext";
    const testConfig: BusterConfig = {
      commonPathLength: -1,
      input: "foo",
      outFile: testFilename,
      hashLength: 10,
      mode: MODE_COPY,
      extensions: ["ext"],
    };
    const testResult: HashWalkerResult = {};

    /* setup mocks and spies */
    (writeJsonToFile as jest.Mock).mockResolvedValue(undefined);

    /* make the assertions */
    return createManifestFile(testResult, testConfig).then((retVal) => {
      expect(retVal).toBe(undefined);
      expect(writeJsonToFile).toHaveBeenCalledTimes(1);
      expect(writeJsonToFile).toHaveBeenCalledWith(testFilename, testResult);
    });
  });
});
