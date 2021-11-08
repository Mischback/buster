// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("fs");
jest.mock("path");
jest.mock("stdio");

/* import the subject under test (SUT) */
import {
  BusterConfig,
  BusterConfigError,
  checkConfig,
  getConfig,
  MODE_COPY,
  MODE_RENAME,
} from "./configure";

/* additional imports */
import { accessSync } from "fs";
import { normalize } from "path";
import { getopt } from "stdio";
import { logger } from "./logging";
import { GetoptResponse } from "stdio/dist/getopt";

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
    return getConfig(testArgv).catch((err: Error) => {
      expect(getopt).toHaveBeenCalledTimes(1);
      expect(err).toBeInstanceOf(BusterConfigError);
      expect(err.message).toBe("Could not parse command line parameters");
    });
  });

  it("...rejects if no input was provided", () => {
    /* define the parameter */
    const testArgv = ["does", "not", "matter"];

    /* setup mocks and spies */
    (getopt as jest.Mock).mockReturnValue({
      input: false,
    } as GetoptResponse);

    /* make the assertions */
    return getConfig(testArgv).catch((err: Error) => {
      expect(getopt).toHaveBeenCalledTimes(1);
      expect(err).toBeInstanceOf(BusterConfigError);
      expect(err.message).toBe("Missing parameter input");
    });
  });

  it("...applies default values for all parameters", () => {
    /* define the parameter */
    const testArgv = ["does", "not", "matter"];
    const defaultCommonPathLength = -1;
    const defaultExtensions = ["css", "js"];
    const defaultHashLength = 10;
    const testInput = "test.ext";
    const defaultMode = MODE_COPY;
    const defaultOutFile = "asset-manifest.json";

    /* setup mocks and spies */
    (getopt as jest.Mock).mockReturnValue({
      commonPathLength: false,
      extension: false,
      hashLength: false,
      input: testInput,
      mode: false,
      outFile: false,
    } as GetoptResponse);
    const loggerInfoSpy = jest.spyOn(logger, "info");
    const loggerDebugSpy = jest.spyOn(logger, "debug");

    /* make the assertions */
    return getConfig(testArgv).then((retVal) => {
      expect(retVal.commonPathLength).toBe(defaultCommonPathLength);
      expect(retVal.extensions).toStrictEqual(defaultExtensions);
      expect(retVal.hashLength).toBe(defaultHashLength);
      expect(retVal.input).toBe(testInput);
      expect(retVal.mode).toBe(defaultMode);
      expect(retVal.outFile).toBe(defaultOutFile);
      expect(loggerInfoSpy).toHaveBeenCalledTimes(2);
      expect(loggerDebugSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("...applies provided values for the parameters", () => {
    /* define the parameter */
    const testArgv = ["does", "not", "matter"];
    const testCommonPathLength = 13;
    const testExtensions = ["txt", "html"];
    const testHashLength = 3;
    const testInput = "test.ext";
    const testMode = MODE_RENAME;
    const testOutFile = "test-manifest.json";

    /* setup mocks and spies */
    (getopt as jest.Mock).mockReturnValue({
      commonPathLength: testCommonPathLength,
      extension: testExtensions,
      hashLength: testHashLength,
      input: testInput,
      mode: testMode,
      outFile: testOutFile,
    } as GetoptResponse);
    const loggerInfoSpy = jest.spyOn(logger, "info");
    const loggerDebugSpy = jest.spyOn(logger, "debug");

    /* make the assertions */
    return getConfig(testArgv).then((retVal) => {
      expect(retVal.commonPathLength).toBe(testCommonPathLength);
      expect(retVal.extensions).toStrictEqual(testExtensions);
      expect(retVal.hashLength).toBe(testHashLength);
      expect(retVal.input).toBe(testInput);
      expect(retVal.mode).toBe(testMode);
      expect(retVal.outFile).toBe(testOutFile);
      expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
      expect(loggerDebugSpy).toHaveBeenCalledTimes(0);
    });
  });

  it("...wraps a single extension into a list", () => {
    /* define the parameter */
    const testArgv = ["does", "not", "matter"];
    const testCommonPathLength = 13;
    const testExtensions = "html";
    const testHashLength = 3;
    const testInput = "test.ext";
    const testMode = MODE_RENAME;
    const testOutFile = "test-manifest.json";

    /* setup mocks and spies */
    (getopt as jest.Mock).mockReturnValue({
      commonPathLength: testCommonPathLength,
      extension: testExtensions,
      hashLength: testHashLength,
      input: testInput,
      mode: testMode,
      outFile: testOutFile,
    } as GetoptResponse);
    const loggerInfoSpy = jest.spyOn(logger, "info");
    const loggerDebugSpy = jest.spyOn(logger, "debug");

    /* make the assertions */
    return getConfig(testArgv).then((retVal) => {
      expect(retVal.commonPathLength).toBe(testCommonPathLength);
      expect(retVal.extensions).toStrictEqual([testExtensions]);
      expect(retVal.hashLength).toBe(testHashLength);
      expect(retVal.input).toBe(testInput);
      expect(retVal.mode).toBe(testMode);
      expect(retVal.outFile).toBe(testOutFile);
      expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
      expect(loggerDebugSpy).toHaveBeenCalledTimes(0);
    });
  });
});

describe("checkConfig()...", () => {
  it("...rejects with a BusterConfigError if the input can not be read/written to", () => {
    /* define the parameter */
    const testCommonPathLength = 13;
    const testExtensions = ["html"];
    const testHashLength = 3;
    const testInput = "test.ext";
    const testMode = MODE_RENAME;
    const testOutFile = "test-manifest.json";

    const testConfig: BusterConfig = {
      commonPathLength: testCommonPathLength,
      extensions: testExtensions,
      hashLength: testHashLength,
      input: testInput,
      mode: testMode,
      outFile: testOutFile,
    };

    const testNormalizedInput = "test.txe";
    const testRejection = "testRejection";

    /* setup mocks and spies */
    (normalize as jest.Mock).mockReturnValue(testNormalizedInput);
    (accessSync as jest.Mock).mockImplementation(() => {
      throw new Error(testRejection);
    });

    /* make the assertions */
    return checkConfig(testConfig).catch((err: Error) => {
      expect(err).toBeInstanceOf(BusterConfigError);
      expect(err.message).toBe(
        "The specified input can not be read/written to"
      );
    });
  });
});
