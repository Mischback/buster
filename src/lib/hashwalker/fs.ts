// SPDX-License-Identifier: MIT

/* library imports */
import { copyFile as fscopyFile, rename } from "fs/promises";

/* internal imports */
import { BusterConfigMode, MODE_COPY, MODE_RENAME } from "../configure";
import { BusterError } from "../errors";
import { logger } from "../logging";

export class BusterFileSystemError extends BusterError {
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
        return reject(new BusterFileSystemError("Could not copy file"));
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
        return reject(new BusterFileSystemError("Could not rename file"));
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
export function createHashedFile(
  source: string,
  destination: string,
  mode: BusterConfigMode
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
        return reject(new BusterFileSystemError("Unknown mode"));
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
