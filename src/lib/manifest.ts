// SPDX-License-Identifier: MIT

/* library imports */

/* internal imports */
import { BusterConfig } from "./configure";
import { BusterError } from "./errors";
import { HashWalkerResult } from "./hashwalker/hashwalker";
import { writeJsonToFile } from "./json-interface";
import { logger } from "./logging";

export class BusterManifestError extends BusterError {
  constructor(message: string) {
    super(message);
  }
}

export function createManifestFile(
  result: HashWalkerResult,
  config: BusterConfig
): Promise<void> {
  return new Promise((resolve, reject) => {
    writeJsonToFile(config.outFile, result)
      .then(() => {
        return resolve();
      })
      .catch((err) => {
        logger.debug(err);
        return reject(
          new BusterManifestError("Could not create manifest file")
        );
      });
  });
}
