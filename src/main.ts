// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

/* library imports */
import { Config } from "stdio/dist/getopt";
import { FileObjectWalkerError } from "@mischback/fileobject-walker";

/* internal imports */
import {
  BusterConfig,
  BusterConfigError,
  checkConfig,
  cmdLineOptions,
  getConfig,
} from "./lib/configure";
import { BusterFileSystemError } from "./lib/hashwalker/filesystem";
import { BusterHashError } from "./lib/hashwalker/hash";
import { hashWalker } from "./lib/hashwalker/hashwalker";
import {
  applyDebugConfiguration,
  logger,
  suppressLogOutput,
} from "./lib/logging";
import { BusterManifestError, createManifestFile } from "./lib/manifest";

/* *** INTERNAL CONSTANTS *** */
const EXIT_SUCCESS = 0; // sysexits.h: 0 -> successful termination
const EXIT_PROCESSING_ERROR = 10;
// const EXIT_DATA_ERROR = 65; // sysexits.h: 65 -> input data was incorrect in some way
const EXIT_INTERNAL_ERROR = 70; // sysexits.h: 70 -> internal software error
const EXIT_CONFIG_ERROR = 78; // sysexits.h: 78 -> configuration error
const EXIT_SIGINT = 130; // bash scripting guide: 130 -> terminated by ctrl-c

/* *** TYPE DEFINITIONS *** */
type StdioConfigItem = Exclude<Config, boolean | undefined>;

export function busterMain(argv: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    /* Setting up a handler for SIGINT (Ctrl-C)
     * This handler may be useful for cleaning up before terminating the script.
     * At least it will resolve to the "correct" exit code.
     */
    process.on("SIGINT", () => {
      logger.info("Caught interrupt signal (Ctrl-C). Exiting!");
      return reject(EXIT_SIGINT);
    });

    /* Activate the quiet mode as early as possible
     * This is done without getopt() from stdio, because getopt() will be called
     * later during startup.
     * Please note: if quiet mode and debug mode are activated, debug mode wins.
     */
    const quietKey = (cmdLineOptions.quiet as StdioConfigItem)["key"];
    if (argv.indexOf(`-${quietKey as string}`) > -1) {
      suppressLogOutput();
    }

    /* Activate the debug mode as early as possible
     * This is done without getopt() from stdio, because getopt() will be called
     * later during startup.
     */
    const debugKey = (cmdLineOptions.debug as StdioConfigItem)["key"];
    if (argv.indexOf(`-${debugKey as string}`) > -1) {
      applyDebugConfiguration();
    }

    let config: BusterConfig;
    getConfig(argv)
      .then(checkConfig)
      .then((checkedConfig) => {
        config = checkedConfig;
        logger.debug(config);
        return Promise.resolve(config);
      })
      .then(hashWalker)
      .then((result) => {
        logger.debug(result);
        return createManifestFile(result, config);
      })
      .then(() => {
        return resolve(EXIT_SUCCESS);
      })
      .catch((err) => {
        if (err instanceof BusterConfigError) {
          logger.error(err.message);
          logger.fatal("Could not determine configuration for buster!");
          return reject(EXIT_CONFIG_ERROR);
        }

        if (
          err instanceof BusterHashError ||
          err instanceof BusterFileSystemError ||
          err instanceof FileObjectWalkerError ||
          err instanceof BusterManifestError
        ) {
          logger.error(err.message);
          logger.fatal("Error during processing!");
          return reject(EXIT_PROCESSING_ERROR);
        }

        logger.error(err);
        logger.fatal("This was unexpected! Aborting!");
        return reject(EXIT_INTERNAL_ERROR);
      });
  });
}
