// SPDX-License-Identifier: MIT

/* library imports */
import { readdir, stat } from "fs/promises";
import { resolve as pathresolve } from "path";

/**
 * Custom Error class for the FileObjectWalker
 *
 * To make {@link fileObjectWalker} as generic as possible, it will not emit any
 * error / debugging messages. If an error is encountered, an instance of this
 * class will be raised/rejected, containing the original error as context,
 * accessible as {@link originalError}.
 */
export class FileObjectWalkerError extends Error {
  originalError: Error | undefined;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.originalError = originalError;
  }
}

/**
 * The actual file system walker to process the files
 *
 * @param fileObject - A file or directory (provided as string) as starting
 *                     point of the walker
 * @param payload - A function to be executed on actual files; the function is
 *                  called with the current filename and a configuration object
 *                  for the payload {@link payloadConfig}
 * @param payloadConfig - An instance of the payload's configuration object, as
 *                        specified in {@link payload}
 * @returns - A Promise, resolving to an object as determined by {@link payload}'s
 *            return type.
 */
export function fileObjectWalker<T>(
  fileObject: string,
  payload: (filename: string, ...payloadArgs: unknown[]) => Promise<T>,
  ...payloadArgs: unknown[]
): Promise<T> {
  return new Promise((resolve, reject) => {
    stat(fileObject)
      .then((statObject) => {
        if (statObject.isDirectory() === true) {
          /* The current item is a directory itsself. Use recursion to
           * handle this!
           */

          /* prepare an empty result to recive recursive results */
          let results: T = <T>{};

          readdir(fileObject)
            .then((fileList) => {
              /* Check if there are still files to process. If nothing more to
               * do, resolve with the current result
               */
              let pending: number = fileList.length;
              if (pending === 0) return resolve(results);

              fileList.forEach((file) => {
                /* make the file path absolute */
                fileObjectWalker(
                  pathresolve(fileObject, file),
                  payload,
                  ...payloadArgs
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
              return reject(
                new FileObjectWalkerError(
                  `Could not readdir() "${fileObject}"`,
                  err
                )
              );
            });
        } else {
          /* This is the actual payload, creating the hashed files */
          payload(fileObject, ...payloadArgs)
            .then((retVal) => {
              resolve(retVal);
            })
            .catch((err) => {
              return reject(err);
            });
        }
      })
      .catch((err: NodeJS.ErrnoException) => {
        return reject(
          new FileObjectWalkerError(`Could not stat() "${fileObject}"`, err)
        );
      });
  });
}
