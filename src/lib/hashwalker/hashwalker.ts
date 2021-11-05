// SPDX-License-Identifier: MIT

/* library imports */
import { readdir, stat } from "fs/promises";
import {
  basename,
  dirname,
  extname,
  join,
  resolve as pathresolve,
  sep as pathOsSeparator,
} from "path";

/* internal imports */
import { BusterConfig } from "../configure";
import { BusterError } from "../errors";
import { logger } from "../logging";
import { BusterExtensionFilterError, filterByExtension } from "./filter";
import { createHashedFile } from "./fs";
import { hashFileContent } from "./hash";

export interface HashWalkerResult {
  [index: string]: string;
}

export class BusterHashWalkerError extends BusterError {
  constructor(message: string) {
    super(message);
  }
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

function fileObjectHandler(
  file: string,
  config: BusterConfig,
  commonPathLength: number
): Promise<HashWalkerResult> {
  return new Promise((resolve, reject) => {
    stat(file)
      .then((statObject) => {
        if (statObject.isDirectory() === true) {
          /* The current item is a directory itsself. Use recursion to
           * handle this!
           */
          hashWalker(
            Object.assign(config, { rootDirectory: file }),
            fileObjectHandler,
            commonPathLength
          ).then(
            (recResult) => {
              return resolve(recResult);
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
              //FIXME: directly resolve without temp variables!
              const results: HashWalkerResult = {};
              results[file.substring(commonPathLength)] =
                newFilename.substring(commonPathLength);
              return resolve(results);
            })
            .catch((err) => {
              if (!(err instanceof BusterExtensionFilterError))
                return reject(err);
            });
        }
      })
      .catch((err) => {
        logger.debug(err);
        return reject(new BusterHashWalkerError(`Could not stat() "${file}"`));
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
  payload = fileObjectHandler,
  commonPathLength = -1
): Promise<HashWalkerResult> {
  let results: HashWalkerResult = {};

  /* The first iteration of hashWalker will determine the common path length and
   * pass it on.
   * While hashWalker operates on absolute file paths, the resulting list of
   * tuples should provide relative paths again.
   */
  if (commonPathLength === -1) {
    /* - config.rootDirectory is already an absolute path (without trailing
     *   slash) -> see "conifgure/checkConfig()"
     * - the path separator is OS specific (though ususally its length should
     *   equal 1) and must be compensated for
     */
    commonPathLength = config.rootDirectory.length + pathOsSeparator.length;
  }

  return new Promise((resolve, reject) => {
    readdir(config.rootDirectory)
      .then((fileList) => {
        /* Check if there are still files to process. If nothing more to do,
         * resolve with the current result
         */
        let pending: number = fileList.length;
        if (pending === 0) return resolve(results);

        /* process items in fileList */
        fileList.forEach((file) => {
          /* make the file path absolute */
          file = pathresolve(config.rootDirectory, file);

          payload(file, config, commonPathLength)
            .then((partResults) => {
              results = Object.assign(results, partResults);
              if (--pending === 0) return resolve(results);
            })
            .catch((err) => {
              return reject(err);
            });
        });
      })
      .catch((err: NodeJS.ErrnoException) => {
        if (err.code === "ENOTDIR") {
          const file: string = err.path as string;
          // FIXME: commonPathLength has to be adjusted!
          payload(file, config, commonPathLength)
            .then((results) => {
              return resolve(results);
            })
            .catch((err) => {
              return reject(err);
            });
        } else {
          logger.debug(err);
          return reject(
            new BusterHashWalkerError(
              `Error while reading directory "${config.rootDirectory}"`
            )
          );
        }
      });
  });
}
