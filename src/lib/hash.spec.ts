// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("crypto");
jest.mock("fs");

/* import the subject under test (SUT) */
import { hashFileContent } from "./hash";

/* additional imports */
import { createHash } from "crypto";
import { createReadStream } from "fs";
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

class TestError extends Error {
  constructor() {
    super("TestError of hash.spec.ts");
  }
}

describe("hashFileContent()...", () => {
  it("...just raises error of createHash()", () => {
    /* define the parameter */
    const testFile = "file.ext";

    /* setup mocks and spies */
    (createHash as jest.Mock).mockImplementation(() => {
      throw new TestError();
    });

    /* make the assertions */
    return hashFileContent(testFile)
      .then((retVal) => {
        // should not be reached; FAIL HARD!
        console.log(retVal);
        expect(1).toBe(2);
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(TestError);
      });
  });

  it("...just raises error of createReadStream()", () => {
    /* define the parameter */
    const testFile = "file.ext";

    /* setup mocks and spies */
    (createHash as jest.Mock).mockReturnValue({});
    (createReadStream as jest.Mock).mockImplementation(() => {
      throw new TestError();
    });

    /* make the assertions */
    return hashFileContent(testFile)
      .then((retVal) => {
        // should not be reached; FAIL HARD!
        console.log(retVal);
        expect(1).toBe(2);
      })
      .catch((err) => {
        expect(err).toBeInstanceOf(TestError);
      });
  });
});
