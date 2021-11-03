// SPDX-License-Identifier: MIT

/* library imports */
import { getopt } from "stdio";
import { Config } from "stdio/dist/getopt";

/* internal imports */
import { BusterError } from "./errors";
import { logger } from "./logging";

export interface BusterConfig {
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
const defaultOutFile = "asset-manifest.json";
const defaultHashLength = 10;

/**
 * Define the accepted command line options as required by {@link getopt}.
 */
export const cmdLineOptions: Config = {
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
      hashLength: tmpHashLength,
      outFile: tmpOutFile,
      rootDirectory: tmpRootDir,
    } as BusterConfig);
  });
}
