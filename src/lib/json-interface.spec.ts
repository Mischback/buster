// SPDX-License-Identifier: MIT

/* test specific imports */
import { describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("fs/promises");

/* import the subject under test (SUT) */
import { JsonInterfaceError, loadJsonFromFile } from "./json-interface";

/* additional imports */
import { readFile } from "fs/promises";

describe("loadJsonFromFile()...", () => {
  it("...rejects with an error if readFile() fails", () => {
    /* define the parameter */
    const testFile = "testfile";

    /* setup mocks and spies */
    (readFile as jest.Mock).mockRejectedValue(new Error("foo"));

    /* make the assertions */
    return loadJsonFromFile(testFile).catch((err) => {
      expect(err).toBeInstanceOf(JsonInterfaceError);
      expect(readFile).toHaveBeenCalledTimes(1);
      expect(readFile).toHaveBeenCalledWith(testFile, expect.anything());
    });
  });
});
