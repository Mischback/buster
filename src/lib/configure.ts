// SPDX-License-Identifier: MIT

/* library imports */
import { getopt } from "stdio";
import { Config } from "stdio/dist/getopt";

/* internal imports */
import { BusterError } from "./errors";

export interface BusterConfig {
  rootDirectory: string;
}

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

    return resolve({
      rootDirectory: tmpRootDir,
    } as BusterConfig);
  });
}
