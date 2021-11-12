// SPDX-License-Identifier: MIT

/* library imports */
import { readFile, writeFile } from "fs/promises";

export class JsonInterfaceError extends Error {
  originalError: Error;

  constructor(message: string, err: Error) {
    super(message);
    this.originalError = err;
  }
}

/**
 * Read a given file and parse its content as JSON
 *
 * @param filename - The file to be read provided as string
 * @returns A Promise, resolving to the file content as JSON
 *
 * The returned JSON object will be of type "unknown" and must be casted to
 * the required target type.
 */
export function loadJsonFromFile(filename: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    readFile(filename, "utf-8")
      .then((fileContent) => {
        try {
          const parsedContent = JSON.parse(fileContent) as unknown;
          return resolve(parsedContent);
        } catch (err) {
          return reject(
            new JsonInterfaceError(
              `Error while parsing content of "${filename}"`,
              err as Error
            )
          );
        }
      })
      .catch((err: Error) => {
        return reject(
          new JsonInterfaceError(`Could not read "${filename}"`, err)
        );
      });
  });
}

/**
 * Write a given object to a file in JSON
 *
 * @param filename - The file to be written to
 * @param jsonData - The object to be written to the file
 * @returns A Promise, resolving to 0 of type JsonInterfaceRetValSuccess
 */
export function writeJsonToFile(
  filename: string,
  jsonData: unknown
): Promise<void> {
  return new Promise((resolve, reject) => {
    writeFile(filename, JSON.stringify(jsonData))
      .then(() => {
        return resolve();
      })
      .catch((err: Error) => {
        return reject(
          new JsonInterfaceError(`Could not write to file "${filename}"`, err)
        );
      });
  });
}
