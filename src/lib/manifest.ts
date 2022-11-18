// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

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

/**
 * Create the manifest file containing the results from hashWalker()
 *
 * @param result - The result of hashWalker()
 * @param config - An instance of {@link BusterConfig}
 * @returns A Promise, resolving to void
 */
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
