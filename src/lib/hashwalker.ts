// SPDX-License-Identifier: MIT

/* library imports */
import { createHash } from "crypto";
import { createReadStream } from "fs";
import { readdir, stat } from "fs/promises";
import { dirname, extname, resolve as pathresolve } from "path";

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

class BusterHashWalkerFilterError extends BusterHashWalkerError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Match a given filename against a list of extensions
 *
 * @param filename - Reference to a file, provided as string
 * @param extensions - A list of extensions, derived from {@link BusterConfig}
 * @returns - A Promise, resolving to a filename (as string) that matches the
 *            list of extensions
 */
function filterByExtension(
  filename: string,
  extensions: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    /* determine the file extension */
    const fileExtension = extname(filename).substring(1);

    if (extensions.includes(fileExtension)) return resolve(filename);

    return reject(
      new BusterHashWalkerFilterError(
        `${filename}: extension "${fileExtension}" not in extensions`
      )
    );
  });
}

/**
 * Calculate the hash of a file's content
 *
 * @param filename - Reference to a file, provided as string
 * @returns - A Promise, resolving to the hash of the file's content
 */
function hashFileContent(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("md5");
    const stream = createReadStream(filename);

    stream.on("error", () => {
      return reject(new BusterHashWalkerError("Error during hash calculation"));
    });

    stream.on("end", () => {
      return resolve(hash.digest("hex"));
    });

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });
  });
}

/**
 * The actual file system walker to process the files
 *
 * @param config - A {@link BusterConfig} instance
 * @param commonPathLength - A number, determining the common path length
 * @returns - A Promise, resolving to a dictionary of filenames as key with
 *            their corresponding, hashed, equivalents
 */
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
                filterByExtension(file, config.extensions)
                  .then(hashFileContent)
                  .then((hash) => {
                    logger.debug(`${file}: ${hash}`);
                  })
                  .catch((err) => {
                    if (!(err instanceof BusterHashWalkerFilterError))
                      return reject(err);
                  })
                  .finally(() => {
                    if (--pending === 0) return resolve(results);
                  });
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
