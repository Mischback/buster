// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("path");

/* import the subject under test (SUT) */
import { filterByExtension, BusterExtensionFilterError } from "./filter";

/* additional imports */
import { extname } from "path";
import { logger } from "../logging";

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

describe("filterByExtension()...", () => {
  it("...resolves to the input filename if extension matches", () => {
    /* define the parameter */
    const testFilename = "testing.ext";
    const testExtensions = ["ext"];

    /* setup mocks and spies */
    (extname as jest.Mock).mockReturnValue(".ext");

    /* make the assertions */
    return filterByExtension(testFilename, testExtensions).then((retVal) => {
      expect(retVal).toBe(testFilename);
    });
  });

  it("...rejects with BusterExtensionFilterError if extension does not match", () => {
    /* define the parameter */
    const testFilename = "testing.ext";
    const testExtensions = ["txe"];

    /* setup mocks and spies */
    (extname as jest.Mock).mockReturnValue(".ext");

    /* make the assertions */
    return filterByExtension(testFilename, testExtensions).catch((err) => {
      expect(err).toBeInstanceOf(BusterExtensionFilterError);
    });
  });
});
