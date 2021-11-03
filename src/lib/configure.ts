// SPDX-License-Identifier: MIT

/* library imports */
import { accessSync, constants } from "fs";
import {
  basename,
  dirname,
  join,
  normalize,
  resolve as pathresolve,
} from "path";
import { getopt } from "stdio";
import { Config } from "stdio/dist/getopt";
const { R_OK, W_OK } = constants;

/* internal imports */
import { BusterError } from "./errors";
import { logger } from "./logging";

export interface BusterConfig {
  extensions: string[];
  hashLength: number;
  outFile: string;
  rootDirectory: string;
}

/* Provide some default settings
 *
 * We're kind of "misusing" stdio.getopt(), by providing a default value of
 * "false" for every accepted parameter and then parse the provided parameters
 * in {@see getConfig}.
 */
const defaultExtensions = ["css", "js"];
const defaultHashLength = 10;
const defaultOutFile = "asset-manifest.json";

/**
 * Define the accepted command line options as required by {@link getopt}.
 */
export const cmdLineOptions: Config = {
  extension: {
    args: "*",
    default: false,
    description:
      "A file extension to include in processing. May be specified multiple times. (default: [css, js])",
    key: "e",
    multiple: true,
    required: false,
  },
  debug: {
    args: 0,
    default: false,
    description: "Flag to activate debug mode",
    key: "d",
    required: false,
  },
  hashLength: {
    args: 1,
    default: false,
    description: "The length of the hash string to append",
    required: false,
  },
  outFile: {
    args: 1,
    default: false,
    description: `Path and filename of the output file (default: ${defaultOutFile})`,
    key: "o",
    required: false,
  },
  quiet: {
    args: 0,
    default: false,
    description: "Flag to activate quiet mode",
    key: "q",
    required: false,
  },
  rootDirectory: {
    args: 1,
    default: false,
    description: "The directory containing the files to work on",
    required: false,
  },
};

export class BusterConfigError extends BusterError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Checks provided configuration values and verifies that the given paths are accessible.
 */
export function checkConfig(config: BusterConfig): Promise<BusterConfig> {
  return new Promise((resolve, reject) => {
    const normalizedRootDir = normalize(pathresolve(config.rootDirectory));

    /* Verify that the root directory can be read and written to */
    try {
      accessSync(normalizedRootDir, R_OK | W_OK);
    } catch (err) {
      return reject(
        new BusterConfigError(
          "The specified root directory can not be read/written to"
        )
      );
    }

    /* Verify that the output file can be written to */
    // FIXME: Check what the if-block actually does!
    let normalizedOutFile = config.outFile;
    if (normalizedOutFile === basename(normalizedOutFile))
      normalizedOutFile = normalize(
        pathresolve(join(normalizedRootDir, normalizedOutFile))
      );
    else normalizedOutFile = normalize(pathresolve(normalizedOutFile));

    try {
      accessSync(dirname(normalizedOutFile), R_OK | W_OK);
    } catch (err) {
      return reject(
        new BusterConfigError(
          "The specified output file can not be read/written to"
        )
      );
    }

    return resolve(
      Object.assign(
        config,
        { rootDirectory: normalizedRootDir },
        { outFile: normalizedOutFile }
      ) as BusterConfig
    );
  });
}

/**
 * Determine the configuration for processing.
 *
 * @param argv - The argument vector which was was used to call the module
 * @returns - A Promise, resolving to a {@link BusterConfig} instance
 *
 * The function provides sane defaults for most of the configuration options and
 * enforces the specification of "rootDirectory" parameter.
 *
 * {@link getopt} is kind of misused, as the defaults are checked and provided
 * here. Probably this could be improved.
 */
export function getConfig(argv: string[]): Promise<BusterConfig> {
  return new Promise((resolve, reject) => {
    const cmdLineParams = getopt(cmdLineOptions, argv);

    if (cmdLineParams === null)
      return reject(
        new BusterConfigError("Could not parse command line parameters")
      );

    /* rootDirectory is a MANDATORY parameter, so an error is raised to reject
     * the Promise.
     */
    let tmpRootDir: string;
    if (cmdLineParams.rootDirectory === false) {
      return reject(new BusterConfigError("Missing parameter rootDirectory"));
    } else {
      tmpRootDir = cmdLineParams.rootDirectory as string;
    }

    let tmpExtensions: string[];
    if (cmdLineParams.extension === false) {
      tmpExtensions = defaultExtensions;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.info(`No extensions specified, using ${tmpExtensions}`);
    } else {
      if (typeof cmdLineParams.extension === "string") {
        tmpExtensions = [cmdLineParams.extension];
      } else {
        tmpExtensions = cmdLineParams.extension as string[];
      }
    }

    let tmpHashLength: number;
    if (cmdLineParams.hashLength === false) {
      tmpHashLength = defaultHashLength;
      logger.info(`No hash length specified, using "${tmpHashLength}"`);
    } else {
      tmpHashLength = parseInt(cmdLineParams.hashLength as string);
    }

    let tmpOutFile: string;
    if (cmdLineParams.outFile === false) {
      tmpOutFile = defaultOutFile;
      logger.info(`No output file specified, using "${tmpOutFile}"`);
    } else {
      tmpOutFile = cmdLineParams.outFile as string;
    }

    return resolve({
      extensions: tmpExtensions,
      hashLength: tmpHashLength,
      outFile: tmpOutFile,
      rootDirectory: tmpRootDir,
    } as BusterConfig);
  });
}
