// SPDX-License-Identifier: MIT

/* library imports */
import { basename, dirname, extname, join } from "path";
import { fileObjectWalker } from "@mischback/fileobject-walker";

/* internal imports */
import { BusterConfig } from "../configure";
import { BusterExtensionFilterError, filterByExtension } from "./filter";
import { createFile } from "./filesystem";
import { hashFileContent } from "./hash";

export interface HashWalkerResult {
  [index: string]: string;
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
  payloadConfig: unknown
): Promise<HashWalkerResult> {
  const config = payloadConfig as BusterConfig;
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
        if (err instanceof BusterExtensionFilterError)
          return resolve({} as HashWalkerResult);
        else return reject(err);
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
