// SPDX-License-Identifier: MIT

/* library imports */
import { readdir, stat } from "fs/promises";
import { basename, dirname, extname, join, resolve as pathresolve } from "path";

/* internal imports */
import { BusterConfig } from "../configure";
import { BusterError } from "../errors";
import { logger } from "../logging";
import { BusterExtensionFilterError, filterByExtension } from "./filter";
import { createFile } from "./fs";
import { hashFileContent } from "./hash";

export interface HashWalkerResult {
  [index: string]: string;
}

type HashWalkerPayload = (
  arg1: string,
  arg2: BusterConfig
) => Promise<HashWalkerResult>;

export class BusterHashWalkerError extends BusterError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Creates a file with the hash of the file content appended to its filename
 *
 * @param filename - The input file, provided as string
 * @param config - A {@link BusterConfig} instance
 * @returns - A Promise, rsolving to the new filename
 */
function createHashedFile(
  filename: string,
  config: BusterConfig
): Promise<HashWalkerResult> {
  return new Promise((resolve, reject) => {
    filterByExtension(filename, config.extensions)
      .then(hashFileContent)
      .then((hash) => {
        return Promise.resolve(
          join(
            dirname(filename),
            `${basename(filename, extname(filename))}.${hash.substring(
              0,
              config.hashLength
            )}${extname(filename)}`
          )
        );
      })
      .then((newFilename) => {
        return createFile(filename, newFilename, config.mode);
      })
      .then((newFilename) => {
        return resolve({
          [filename.substring(config.commonPathLength)]: newFilename.substring(
            config.commonPathLength
          ),
        } as HashWalkerResult);
      })
      .catch((err) => {
        if (!(err instanceof BusterExtensionFilterError)) return reject(err);
      });
  });
}

/**
 * The actual file system walker to process the files
 *
 * @param fileObject - A file or directory (provided as string) as starting
 *                     point of the walker
 * @param config - A {@link BusterConfig} instance
 * @param payload - A {@link HashWalkerPayload}, actually providing the logic
 *                  of what is to be done
 * @returns - A Promise, resolving to a dictionary of filenames as key with
 *            their corresponding, hashed, equivalents
 */
export function fileObjectWalker(
  fileObject: string,
  payload: HashWalkerPayload,
  payloadConfig: BusterConfig
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
                fileObjectWalker(
                  pathresolve(fileObject, file),
                  payload,
                  payloadConfig
                )
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
          payload(fileObject, payloadConfig)
            .then((retVal) => {
              resolve(retVal);
            })
            .catch((err) => {
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

/**
 * Walk the filesystem and apply {@link createHashedFile} to the files
 *
 * @param config - A {@link BusterConfig} instance
 * @returns - A Promise, resolving to a {@link HashWalkerResult}
 */
export function hashWalker(config: BusterConfig): Promise<HashWalkerResult> {
  return fileObjectWalker(config.input, createHashedFile, config);
}
