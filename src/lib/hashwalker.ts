// SPDX-License-Identifier: MIT

/* library imports */
import { readdir, stat } from "fs/promises";
import { dirname, resolve as pathresolve } from "path";

/* internal imports */
import { BusterConfig } from "./configure";
import { BusterError } from "./errors";
import { logger } from "./logging";

export interface HashWalkerResult {
  [index: string]: string;
}

export class BusterHashWalkerError extends BusterError {
  constructor(message: string) {
    super(message);
  }
}

export function hashWalker(
  config: BusterConfig,
  commonPathLength = -1
): Promise<HashWalkerResult> {
  let results: HashWalkerResult = {};

  /* The first iteration of hashWalker will determine the common path length and
   * pass it on.
   * While hashWalker operates on absolute file paths, the resulting list of
   * tuples should provide relative paths again.
   */
  if (commonPathLength === -1) {
    // FIXME: Does this work?!
    pathresolve(config.rootDirectory).length -
      config.rootDirectory.length +
      dirname(config.rootDirectory).length;
  }

  return new Promise((resolve, reject) => {
    readdir(config.rootDirectory)
      .then((fileList) => {
        /* Check if there are still files to process. If nothing more to do,
         * resolve with the current result
         */
        let pending: number = fileList.length;
        // if (!pending) was original code!
        if (pending === 0) return resolve(results);

        /* process items in fileList */
        fileList.forEach((file) => {
          /* make the file path absolute */
          file = pathresolve(config.rootDirectory, file);

          stat(file)
            .then((statObject) => {
              if (statObject.isDirectory() === true) {
                /* The current item is a directory itsself. Use recursion to
                 * handle this!
                 */
                hashWalker(
                  Object.assign(config, { rootDirectory: file }),
                  commonPathLength
                ).then(
                  (recResult) => {
                    /* merge existing results with results from recursive call */
                    results = Object.assign(results, recResult);
                    // if (!--pending) was original code!
                    if (--pending === 0) return resolve(results);
                  },
                  (err) => {
                    return reject(err);
                  }
                );
              } else {
                /* TODO: REAL LOGIC GOES HERE! */
                logger.debug(file);
                if (--pending === 0) return resolve(results);
              }
            })
            .catch((err) => {
              logger.debug(err);
              return reject(
                new BusterHashWalkerError(
                  `Error while using "stat" on "${file}"`
                )
              );
            });
        });
      })
      .catch((err) => {
        logger.debug(err);
        return reject(
          new BusterHashWalkerError(
            `Error while reading directory "${config.rootDirectory}"`
          )
        );
      });
  });
}
