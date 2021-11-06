// SPDX-License-Identifier: MIT

/* library imports */
import { readdir, stat } from "fs/promises";
import {
  basename,
  dirname,
  extname,
  join,
  resolve as pathresolve,
  // sep as pathOsSeparator,
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

/**
 * The actual file system walker to process the files
 *
 * @param config - A {@link BusterConfig} instance
 * @returns - A Promise, resolving to a dictionary of filenames as key with
 *            their corresponding, hashed, equivalents
 */
export function fileObjectWalker(
  fileObject: string,
  config: BusterConfig
): Promise<HashWalkerResult> {
  return new Promise((resolve, reject) => {
    stat(fileObject)
      .then((statObject) => {
        if (statObject.isDirectory() === true) {
          /* The current item is a directory itsself. Use recursion to
           * handle this!
           */

          /* prepare an empty result to recive recursive results */
          let results: HashWalkerResult = {};

          readdir(fileObject)
            .then((fileList) => {
              /* Check if there are still files to process. If nothing more to do,
               * resolve with the current result
               */
              let pending: number = fileList.length;
              if (pending === 0) return resolve(results);

              fileList.forEach((file) => {
                /* make the file path absolute */
                fileObjectWalker(pathresolve(fileObject, file), config)
                  .then((recResult) => {
                    results = Object.assign(results, recResult);
                    if (--pending === 0) return resolve(results);
                  })
                  .catch((err) => {
                    return reject(err);
                  });
              });
            })
            .catch((err: NodeJS.ErrnoException) => {
              logger.debug(err);
              return reject(
                new BusterHashWalkerError(`Could not readdir() "${fileObject}"`)
              );
            });
        } else {
          /* This is the actual payload, creating the hashed files */
          filterByExtension(fileObject, config.extensions)
            .then(hashFileContent)
            .then((hash) => {
              return determineNewFilename(fileObject, hash, config.hashLength);
            })
            .then((newFilename) => {
              return createHashedFile(fileObject, newFilename, config.mode);
            })
            .then((newFilename) => {
              //FIXME: directly resolve without temp variables!
              const results: HashWalkerResult = {};
              results[fileObject.substring(config.commonPathLength)] =
                newFilename.substring(config.commonPathLength);
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
        return reject(
          new BusterHashWalkerError(`Could not stat() "${fileObject}"`)
        );
      });
  });
}
