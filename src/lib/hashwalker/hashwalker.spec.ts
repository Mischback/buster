// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("path");
jest.mock("./filesystem");
jest.mock("./filter");
jest.mock("./hash");
jest.mock("./walker");

/* import the subject under test (SUT) */
import { hashWalker, HashWalkerResult } from "./hashwalker";

/* additional imports */
import { join } from "path";
import { logger } from "../logging";
import { BusterConfig } from "../configure";
import { BusterFileSystemError, createFile } from "./filesystem";
import { BusterExtensionFilterError, filterByExtension } from "./filter";
import { hashFileContent, BusterHashError } from "./hash";
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

describe("createHashedFile()...", () => {
  it("...resolves with an empty result if filterByExtension() rejects", () => {
    /* define the parameter */
    const testCommonPathLength = 5;
    const testExtensions = ["js"];
    const testHashLength = 10;
    const testInput = "testing.ext";
    const testMode = "copy";
    const testOutfile = "testout.json";
    const testConfig: BusterConfig = {
      commonPathLength: testCommonPathLength,
      extensions: testExtensions,
      hashLength: testHashLength,
      input: testInput,
      mode: testMode,
      outFile: testOutfile,
    };

    /* setup mocks and spies */
    (fileObjectWalker as jest.Mock).mockImplementation(
      (
        input: string,
        payload: (
          filename: string,
          payloadConfig: BusterConfig
        ) => Promise<HashWalkerResult>,
        payloadConfig: BusterConfig
      ) => {
        return payload(input, payloadConfig);
      }
    );
    (filterByExtension as jest.Mock).mockRejectedValue(
      new BusterExtensionFilterError("test")
    );

    /* make the assertions */
    return hashWalker(testConfig).then((retVal) => {
      expect(retVal).toStrictEqual({});
    });
  });

  it("...rejects with BusterHashError if hashFileContent() rejects", () => {
    /* define the parameter */
    const testCommonPathLength = 5;
    const testExtensions = ["js"];
    const testHashLength = 10;
    const testInput = "testing.ext";
    const testMode = "copy";
    const testOutfile = "testout.json";
    const testConfig: BusterConfig = {
      commonPathLength: testCommonPathLength,
      extensions: testExtensions,
      hashLength: testHashLength,
      input: testInput,
      mode: testMode,
      outFile: testOutfile,
    };

    /* setup mocks and spies */
    (fileObjectWalker as jest.Mock).mockImplementation(
      (
        input: string,
        payload: (
          filename: string,
          payloadConfig: BusterConfig
        ) => Promise<HashWalkerResult>,
        payloadConfig: BusterConfig
      ) => {
        return payload(input, payloadConfig);
      }
    );
    (filterByExtension as jest.Mock).mockResolvedValue(testInput);
    (hashFileContent as jest.Mock).mockRejectedValue(
      new BusterHashError("test")
    );

    /* make the assertions */
    return hashWalker(testConfig).catch((err) => {
      expect(err).toBeInstanceOf(BusterHashError);
      expect(hashFileContent).toHaveBeenCalledTimes(1);
      expect(hashFileContent).toHaveBeenCalledWith(testInput);
    });
  });

  it("...rejects with whatever error is thrown while determining the new filename", () => {
    /* define the parameter */
    const testCommonPathLength = 5;
    const testExtensions = ["js"];
    const testHashLength = 10;
    const testInput = "testing.ext";
    const testMode = "copy";
    const testOutfile = "testout.json";
    const testConfig: BusterConfig = {
      commonPathLength: testCommonPathLength,
      extensions: testExtensions,
      hashLength: testHashLength,
      input: testInput,
      mode: testMode,
      outFile: testOutfile,
    };

    /* setup mocks and spies */
    (fileObjectWalker as jest.Mock).mockImplementation(
      (
        input: string,
        payload: (
          filename: string,
          payloadConfig: BusterConfig
        ) => Promise<HashWalkerResult>,
        payloadConfig: BusterConfig
      ) => {
        return payload(input, payloadConfig);
      }
    );
    (filterByExtension as jest.Mock).mockResolvedValue(testInput);
    (hashFileContent as jest.Mock).mockResolvedValue(
      "someHashWithAGivenLength"
    );
    (join as jest.Mock).mockImplementation(() => {
      throw "foobar";
    });

    /* make the assertions */
    return hashWalker(testConfig).catch((err) => {
      expect(err).toBe("foobar");
    });
  });

  it("...rejects with BusterFileSystemError if createFile() rejects", () => {
    /* define the parameter */
    const testNewFilename = "newTesting.ext";
    const testCommonPathLength = 5;
    const testExtensions = ["js"];
    const testHashLength = 10;
    const testInput = "testing.ext";
    const testMode = "copy";
    const testOutfile = "testout.json";
    const testConfig: BusterConfig = {
      commonPathLength: testCommonPathLength,
      extensions: testExtensions,
      hashLength: testHashLength,
      input: testInput,
      mode: testMode,
      outFile: testOutfile,
    };

    /* setup mocks and spies */
    (fileObjectWalker as jest.Mock).mockImplementation(
      (
        input: string,
        payload: (
          filename: string,
          payloadConfig: BusterConfig
        ) => Promise<HashWalkerResult>,
        payloadConfig: BusterConfig
      ) => {
        return payload(input, payloadConfig);
      }
    );
    (filterByExtension as jest.Mock).mockResolvedValue(testInput);
    (hashFileContent as jest.Mock).mockResolvedValue(
      "someHashWithAGivenLength"
    );
    (join as jest.Mock).mockReturnValue(testNewFilename);
    (createFile as jest.Mock).mockRejectedValue(
      new BusterFileSystemError("test")
    );

    /* make the assertions */
    return hashWalker(testConfig).catch((err) => {
      expect(err).toBeInstanceOf(BusterFileSystemError);
      expect(createFile).toHaveBeenCalledTimes(1);
      expect(createFile).toHaveBeenCalledWith(
        testInput,
        testNewFilename,
        testMode
      );
    });
  });

  it("...applies commonPathLength to inputFile and outputFile on resolve()", () => {
    /* define the parameter */
    const testNewFilename = "newTesting.ext";
    const testCommonPathLength = 5;
    const testExtensions = ["js"];
    const testHashLength = 10;
    const testInput = "testing.ext";
    const testMode = "copy";
    const testOutfile = "testout.json";
    const testConfig: BusterConfig = {
      commonPathLength: testCommonPathLength,
      extensions: testExtensions,
      hashLength: testHashLength,
      input: testInput,
      mode: testMode,
      outFile: testOutfile,
    };

    /* setup mocks and spies */
    (fileObjectWalker as jest.Mock).mockImplementation(
      (
        input: string,
        payload: (
          filename: string,
          payloadConfig: BusterConfig
        ) => Promise<HashWalkerResult>,
        payloadConfig: BusterConfig
      ) => {
        return payload(input, payloadConfig);
      }
    );
    (filterByExtension as jest.Mock).mockResolvedValue(testInput);
    (hashFileContent as jest.Mock).mockResolvedValue(
      "someHashWithAGivenLength"
    );
    (join as jest.Mock).mockReturnValue(testNewFilename);
    (createFile as jest.Mock).mockResolvedValue(testNewFilename);

    /* make the assertions */
    return hashWalker(testConfig).then((retVal) => {
      expect(retVal).toStrictEqual({
        [testInput.substring(testCommonPathLength)]:
          testNewFilename.substring(testCommonPathLength),
      });
    });
  });
});
