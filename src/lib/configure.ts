// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

/* library imports */
import { accessSync, constants, existsSync, lstatSync } from "fs";
import {
  basename,
  dirname,
  normalize,
  resolve as pathresolve,
  sep as pathOsSeparator,
} from "path";
import { getopt } from "stdio";
import { Config } from "stdio/dist/getopt";
const { R_OK, W_OK } = constants;

/* internal imports */
import { BusterError } from "./errors";
import { logger } from "./logging";

export type BusterConfigMode = "copy" | "rename";

export const MODE_COPY = "copy";
export const MODE_RENAME = "rename";

export interface BusterConfig {
  commonPathLength: number;
  extensions: string[];
  input: string;
  hashLength: number;
  mode: BusterConfigMode;
  outFile: string;
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
  commonPathLength: {
    args: 1,
    default: false,
    description: "Manually override the common path length",
    required: false,
  },
  debug: {
    args: 0,
    default: false,
    description: "Flag to activate debug mode",
    key: "d",
    required: false,
  },
  extension: {
    args: "*",
    default: false,
    description:
      "A file extension to include in processing. May be specified multiple times. (default: [css, js])",
    key: "e",
    multiple: true,
    required: false,
  },
  hashLength: {
    args: 1,
    default: false,
    description: "The length of the hash string to append",
    required: false,
  },
  input: {
    args: 1,
    default: false,
    description: "The input, either a directory or a file",
    key: "i",
    required: false,
  },
  mode: {
    args: 1,
    default: false,
    description: "Operation mode, either files are copied or simply renamed",
    key: "m",
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
    /* Verify that the input can be read and written to */
    const normalizedInput = normalize(pathresolve(config.input));
    try {
      accessSync(normalizedInput, R_OK | W_OK);
    } catch (err) {
      return reject(
        new BusterConfigError("The specified input can not be read/written to")
      );
    }

    const inputIsDirectory =
      existsSync(normalizedInput) && lstatSync(normalizedInput).isDirectory();
    let normalizedCommonPathLength = config.commonPathLength;
    if (normalizedCommonPathLength === -1 && inputIsDirectory === true) {
      normalizedCommonPathLength =
        normalizedInput.length + pathOsSeparator.length;
    }

    /* Determine the absolute path for the outfile
     * - if just a filename is given, buster tries to place this file relative
     *   to the input (inside input, if input is a directory or in the same
     *   same directory as input, if input is a file)
     * - if a path/filename is given, just make that absolute
     */
    let normalizedOutFile = config.outFile;
    if (normalizedOutFile === basename(normalizedOutFile)) {
      if (inputIsDirectory === true) {
        normalizedOutFile = normalize(
          pathresolve(normalizedInput, normalizedOutFile)
        );
      } else {
        normalizedOutFile = normalize(
          pathresolve(dirname(normalizedInput), normalizedOutFile)
        );
      }
    } else {
      normalizedOutFile = normalize(pathresolve(normalizedOutFile));
    }

    /* Verify that the output file can be written to */
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
        { commonPathLength: normalizedCommonPathLength },
        { input: normalizedInput },
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
 * enforces the specification of "input" parameter.
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

    /* input is a MANDATORY parameter, so an error is raised to reject
     * the Promise.
     */
    let tmpInput: string;
    if (cmdLineParams.input === false) {
      return reject(new BusterConfigError("Missing parameter input"));
    } else {
      tmpInput = cmdLineParams.input as string;
    }

    /* commonPathLength is initialized with -1 if not provided.
     * {@link checkConfig} will then determine the commonPathLength depending
     * on "input".
     */
    let tmpCommonPathLength: number;
    if (cmdLineParams.commonPathLength === false) {
      tmpCommonPathLength = -1;
    } else {
      tmpCommonPathLength = cmdLineParams.commonPathLength as number;
    }

    let tmpExtensions: string[];
    if (cmdLineParams.extension === false) {
      tmpExtensions = defaultExtensions;
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.debug(`No extensions specified, using ${tmpExtensions}`);
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
      logger.debug(`No hash length specified, using "${tmpHashLength}"`);
    } else {
      tmpHashLength = parseInt(cmdLineParams.hashLength as string);
    }

    let tmpMode: BusterConfigMode;
    if (cmdLineParams.mode === false) {
      tmpMode = MODE_COPY;
      logger.info(`No mode specified, using "${tmpMode}"`);
    } else {
      tmpMode = cmdLineParams.mode as BusterConfigMode;
    }

    let tmpOutFile: string;
    if (cmdLineParams.outFile === false) {
      tmpOutFile = defaultOutFile;
      logger.info(`No output file specified, using "${tmpOutFile}"`);
    } else {
      tmpOutFile = cmdLineParams.outFile as string;
    }

    return resolve({
      commonPathLength: tmpCommonPathLength,
      extensions: tmpExtensions,
      hashLength: tmpHashLength,
      input: tmpInput,
      mode: tmpMode,
      outFile: tmpOutFile,
    } as BusterConfig);
  });
}
