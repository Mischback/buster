// SPDX-License-Identifier: MIT

/* test specific imports */
import { describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("fs/promises");

/* import the subject under test (SUT) */
import {
  JsonInterfaceError,
  loadJsonFromFile,
  writeJsonToFile,
} from "./json-interface";

/* additional imports */
import { readFile, writeFile } from "fs/promises";

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

  it("...rejects with an error if JSON.parse() fails", () => {
    /* define the parameter */
    const testFile = "testfile";

    /* setup mocks and spies */
    (readFile as jest.Mock).mockResolvedValue("foo");
    JSON.parse = jest.fn(() => {
      throw new Error("foo");
    });

    /* make the assertions */
    return loadJsonFromFile(testFile).catch((err) => {
      expect(err).toBeInstanceOf(JsonInterfaceError);
      expect(readFile).toHaveBeenCalledTimes(1);
      expect(readFile).toHaveBeenCalledWith(testFile, expect.anything());
      expect(JSON.parse).toHaveBeenCalledTimes(1);
      expect(JSON.parse).toHaveBeenCalledWith("foo");
    });
  });

  it("...resolves with parsed JSON object", () => {
    /* define the parameter */
    const testFile = "testfile";
    const testResult = { foo: "bar" };

    /* setup mocks and spies */
    (readFile as jest.Mock).mockResolvedValue("foo");
    JSON.parse = jest.fn().mockReturnValue(testResult);

    /* make the assertions */
    return loadJsonFromFile(testFile).then((retVal) => {
      expect(retVal).toStrictEqual(testResult);
      expect(readFile).toHaveBeenCalledTimes(1);
      expect(readFile).toHaveBeenCalledWith(testFile, expect.anything());
      expect(JSON.parse).toHaveBeenCalledTimes(1);
      expect(JSON.parse).toHaveBeenCalledWith("foo");
    });
  });
});

describe("writeJsonToFile()...", () => {
  it("...rejects with an error if writeFile() fails", () => {
    /* define the parameter */
    const testFile = "testfile";
    const testJson = { foo: "bar" } as unknown;

    /* setup mocks and spies */
    (writeFile as jest.Mock).mockRejectedValue(new Error("foo"));

    /* make the assertions */
    return writeJsonToFile(testFile, testJson).catch((err) => {
      expect(err).toBeInstanceOf(JsonInterfaceError);
      expect(writeFile).toHaveBeenCalledTimes(1);
      expect(writeFile).toHaveBeenCalledWith(testFile, expect.anything());
    });
  });

  it("...resolves if writeFile() succeeds", () => {
    /* define the parameter */
    const testFile = "testfile";
    const testJson = { foo: "bar" } as unknown;

    /* setup mocks and spies */
    (writeFile as jest.Mock).mockResolvedValue(undefined);
    JSON.stringify = jest.fn((_value: any) => {
      return "foo";
    });

    /* make the assertions */
    return writeJsonToFile(testFile, testJson).then((retVal) => {
      expect(retVal).toBe(undefined);
      expect(writeFile).toHaveBeenCalledTimes(1);
      expect(writeFile).toHaveBeenCalledWith(testFile, expect.anything());
      expect(JSON.stringify).toHaveBeenCalledTimes(1);
      expect(JSON.stringify).toHaveBeenCalledWith(testJson);
    });
  });
});
