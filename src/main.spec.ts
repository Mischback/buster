// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("./lib/configure");
jest.mock("./lib/logging");

/* import the subject under test (SUT) */
import { busterMain } from "./main";

/* additional imports */
import {
  applyDebugConfiguration,
  logger,
  suppressLogOutput,
} from "./lib/logging";
import { getConfig } from "./lib/configure";

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
});
