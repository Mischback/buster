// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("./lib/configure");
jest.mock("./lib/logging");
jest.mock("./lib/hashwalker/hashwalker");

/* import the subject under test (SUT) */
import { busterMain } from "./main";

/* additional imports */
import {
  applyDebugConfiguration,
  logger,
  suppressLogOutput,
} from "./lib/logging";
import { getConfig, BusterConfigError, checkConfig } from "./lib/configure";
import { hashWalker } from "./lib/hashwalker/hashwalker";
import { BusterHashError } from "./lib/hashwalker/hash";
import { BusterFileSystemError } from "./lib/hashwalker/filesystem";
import { FileObjectWalkerError } from "@mischback/fileobject-walker";

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

describe("busterMain()...", () => {
  it("...attaches SIGINT handler", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter", "-q"];

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockRejectedValue(new Error("foo"));
    const processSpy = jest.spyOn(process, "on");

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(70);
      expect(processSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("...correctly activates quiet mode", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter", "-q"];

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockRejectedValue(new Error("foo"));
    (suppressLogOutput as jest.Mock).mockImplementation();

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(70);
      expect(suppressLogOutput).toHaveBeenCalledTimes(1);
    });
  });

  it("...correctly activates debug mode", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter", "-d"];

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockRejectedValue(new Error("foo"));
    (applyDebugConfiguration as jest.Mock).mockImplementation();

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(70);
      expect(applyDebugConfiguration).toHaveBeenCalledTimes(1);
    });
  });

  it("...overrides quiet mode with debug mode", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter", "-q", "-d"];

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockRejectedValue(new Error("foo"));
    (suppressLogOutput as jest.Mock).mockImplementation();
    (applyDebugConfiguration as jest.Mock).mockImplementation();

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(70);
      expect(suppressLogOutput).toHaveBeenCalledTimes(1);
      expect(applyDebugConfiguration).toHaveBeenCalledTimes(1);
    });
  });

  it("...returns EXIT_CONFIG_ERROR on BusterConfigError by getConfig()", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter"];
    const testErrorMessage = "testError";

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockRejectedValue(
      new BusterConfigError(testErrorMessage)
    );
    const loggerErrorSpy = jest.spyOn(logger, "error");
    const loggerFatalSpy = jest.spyOn(logger, "fatal");

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(78);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      // BusterConfigError is mocked aswell, so it does not work to access its
      // message in an expect block.
      // expect(loggerErrorSpy).toHaveBeenCalledWith(testErrorMessage);
      expect(loggerFatalSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("...returns EXIT_CONFIG_ERROR on BusterConfigError by checkConfig()", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter"];
    const testErrorMessage = "testError";

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockResolvedValue("foo");
    (checkConfig as jest.Mock).mockRejectedValue(
      new BusterConfigError(testErrorMessage)
    );
    const loggerErrorSpy = jest.spyOn(logger, "error");
    const loggerFatalSpy = jest.spyOn(logger, "fatal");

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(78);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      // BusterConfigError is mocked aswell, so it does not work to access its
      // message in an expect block.
      // expect(loggerErrorSpy).toHaveBeenCalledWith(testErrorMessage);
      expect(loggerFatalSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("...returns EXIT_PROCESSING_ERROR on BusterHashError", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter"];
    const testErrorMessage = "testError";

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockResolvedValue("foo");
    (checkConfig as jest.Mock).mockResolvedValue("foo");
    (hashWalker as jest.Mock).mockRejectedValue(
      new BusterHashError(testErrorMessage)
    );
    const loggerErrorSpy = jest.spyOn(logger, "error");
    const loggerFatalSpy = jest.spyOn(logger, "fatal");

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(10);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(testErrorMessage);
      expect(loggerFatalSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("...returns EXIT_PROCESSING_ERROR on BusterFileSystemError", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter"];
    const testErrorMessage = "testError";

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockResolvedValue("foo");
    (checkConfig as jest.Mock).mockResolvedValue("foo");
    (hashWalker as jest.Mock).mockRejectedValue(
      new BusterFileSystemError(testErrorMessage)
    );
    const loggerErrorSpy = jest.spyOn(logger, "error");
    const loggerFatalSpy = jest.spyOn(logger, "fatal");

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(10);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(testErrorMessage);
      expect(loggerFatalSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("...returns EXIT_PROCESSING_ERROR on FileObjectWalkerError", () => {
    /* define the parameter */
    const testArgv: string[] = ["doesn't", "matter"];
    const testErrorMessage = "testError";

    /* setup mocks and spies */
    (getConfig as jest.Mock).mockResolvedValue("foo");
    (checkConfig as jest.Mock).mockResolvedValue("foo");
    (hashWalker as jest.Mock).mockRejectedValue(
      new FileObjectWalkerError(testErrorMessage)
    );
    const loggerErrorSpy = jest.spyOn(logger, "error");
    const loggerFatalSpy = jest.spyOn(logger, "fatal");

    /* make the assertions */
    return busterMain(testArgv).catch((err) => {
      expect(err).toBe(10);
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(testErrorMessage);
      expect(loggerFatalSpy).toHaveBeenCalledTimes(1);
    });
  });
});
