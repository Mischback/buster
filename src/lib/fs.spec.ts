// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("fs/promises");

/* import the subject under test (SUT) */
import { BusterFileSystemError, createHashedFile } from "./fs";

/* additional imports */
import { copyFile, rename } from "fs/promises";
import { logger } from "./logging";
import { BusterConfigMode, MODE_COPY, MODE_RENAME } from "./configure";

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

describe("createHashedFile()...", () => {
  it("...rejects if an unsupported mode is used", () => {
    /* define the parameter */
    const testSource = "testSource.ext";
    const testDest = "testDest.ext";
    const testMode = "foo" as BusterConfigMode;

    /* make the assertions */
    return createHashedFile(testSource, testDest, testMode)
      .then((retVal) => {
        // should not be reached; FAIL HARD!
        console.log(retVal);
        expect(1).toBe(2);
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(BusterFileSystemError);
      });
  });

  it("...rejects with the error raised by copyFile()", () => {
    /* define the parameter */
    const testSource = "testSource.ext";
    const testDest = "testDest.ext";
    const testMode = MODE_COPY;
    const testRejection = "foobar";

    /* setup mocks and spies */
    (copyFile as jest.Mock).mockRejectedValue(testRejection);
    const loggerDebugSpy = jest.spyOn(logger, "debug");

    /* make the assertions */
    return createHashedFile(testSource, testDest, testMode)
      .then((retVal) => {
        // should not be reached; FAIL HARD!
        console.log(retVal);
        expect(1).toBe(2);
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(BusterFileSystemError);
        expect(loggerDebugSpy).toHaveBeenCalledTimes(1);
        expect(loggerDebugSpy).toHaveBeenCalledWith(testRejection);
      });
  });

  it("...rejects with the error raised by renameFile()", () => {
    /* define the parameter */
    const testSource = "testSource.ext";
    const testDest = "testDest.ext";
    const testMode = MODE_RENAME;
    const testRejection = "foobar";

    /* setup mocks and spies */
    (rename as jest.Mock).mockRejectedValue(testRejection);
    const loggerDebugSpy = jest.spyOn(logger, "debug");

    /* make the assertions */
    return createHashedFile(testSource, testDest, testMode)
      .then((retVal) => {
        // should not be reached; FAIL HARD!
        console.log(retVal);
        expect(1).toBe(2);
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(BusterFileSystemError);
        expect(loggerDebugSpy).toHaveBeenCalledTimes(1);
        expect(loggerDebugSpy).toHaveBeenCalledWith(testRejection);
      });
  });

  it("...resolved on successful copyFile()", () => {
    /* define the parameter */
    const testSource = "testSource.ext";
    const testDest = "testDest.ext";
    const testMode = MODE_COPY;

    /* setup mocks and spies */
    (copyFile as jest.Mock).mockResolvedValue(undefined);

    /* make the assertions */
    return createHashedFile(testSource, testDest, testMode)
      .then((retVal) => {
        expect(retVal).toBe(testDest);
      })
      .catch((err) => {
        // should not be reached; FAIL HARD!
        console.log(err);
        expect(1).toBe(2);
      });
  });

  it("...resolved on successful renameFile()", () => {
    /* define the parameter */
    const testSource = "testSource.ext";
    const testDest = "testDest.ext";
    const testMode = MODE_RENAME;

    /* setup mocks and spies */
    (rename as jest.Mock).mockResolvedValue(undefined);

    /* make the assertions */
    return createHashedFile(testSource, testDest, testMode)
      .then((retVal) => {
        expect(retVal).toBe(testDest);
      })
      .catch((err) => {
        // should not be reached; FAIL HARD!
        console.log(err);
        expect(1).toBe(2);
      });
  });
});
