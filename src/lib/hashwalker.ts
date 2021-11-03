// SPDX-License-Identifier: MIT

/* library imports */
import { createHash } from "crypto";
import { createReadStream } from "fs";
import { copyFile as fscopyFile, readdir, rename, stat } from "fs/promises";
import { basename, dirname, extname, join, resolve as pathresolve } from "path";

/* internal imports */
import { BusterConfig, MODE_COPY, MODE_RENAME } from "./configure";
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
 * Copy a file
 *
 * @param source - The original file provided as string
 * @param destination - The new filename and copy target
 * @returns - A Promise, resolving to the new filename
 *
 * This function is not meant to be called directly, {@link createHashedFile}
 * wraps around it and determines which mode is to be used.
 *
 * @see {@link renameFile}
 */
function copyFile(source: string, destination: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fscopyFile(source, destination)
      .then(() => {
        return resolve(destination);
      })
      .catch((err) => {
        logger.debug(err);
        return reject(new BusterHashWalkerError("Could not copy file"));
      });
  });
}

/**
 * Rename a file
 *
 * @param source - The original file provided as string
 * @param destination - The new filename
 * @returns - A Promise, resolving to the new filename
 *
 * This function is not meant to be called directly, {@link createHashedFile}
 * wraps around it and determines which mode is to be used.
 *
 * @see {@link copyFile}
 */
function renameFile(source: string, destination: string): Promise<string> {
  return new Promise((resolve, reject) => {
    rename(source, destination)
      .then(() => {
        return resolve(destination);
      })
      .catch((err) => {
        logger.debug(err);
        return reject(new BusterHashWalkerError("Could not rename file"));
      });
  });
}

/**
 * Create the file with its content hash appended to the filename
 *
 * @param source - The original source file
 * @param destination - The new filename as returned by {@link determineNewFilename}
 * @param mode - Operation mode, either {@link MODE_COPY} or {@link MODE_RENAME}
 * @returns - A Promise, resolving to the new filename
 *
 * Buster provides two different modes of operation:
 * - in copy mode, the source file is copied with destination as its new filename
 * - in rename mode, the source file is renamed to destination
 *
 * The actual filesystem operations are performed by {@link copyFile} and
 * {@link renameFile}.
 */
function createHashedFile(
  source: string,
  destination: string,
  mode: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let fileFunc;
    switch (mode) {
      case MODE_COPY:
        fileFunc = copyFile;
        break;
      case MODE_RENAME:
        fileFunc = renameFile;
        break;
      default:
        return reject(new BusterHashWalkerError("Unknown mode"));
    }

    fileFunc(source, destination)
      .then(() => {
        return resolve(destination);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

/**
 * Append the hash (or part of it) to the filename
 *
 * @param filename - The original filenam
 * @param fileHash - The hash of the file's content as provided by {@link hashFileContent}
 * @param hashLength - The length of the hash to append to the filename as
 *                     determined by {@link BusterConfig}
 * @retval - A Promise, resolving to the new filename
 */
function determineNewFilename(
  filename: string,
  fileHash: string,
  hashLength: number
): Promise<string> {
  return new Promise((resolve) => {
    const filePath = dirname(filename);
    const fileExtension = extname(filename);
    const fileBasename = basename(filename, fileExtension);

    const newFilename = join(
      filePath,
      `${fileBasename}.${fileHash.substring(0, hashLength)}${fileExtension}`
    );

    return resolve(newFilename);
  });
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
                    return determineNewFilename(file, hash, config.hashLength);
                  })
                  .then((newFilename) => {
                    return createHashedFile(file, newFilename, config.mode);
                  })
                  .then((newFilename) => {
                    logger.debug(`"${file}" => "${newFilename}"`);
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
