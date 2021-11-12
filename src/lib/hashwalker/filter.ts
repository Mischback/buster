// SPDX-License-Identifier: MIT

/* library imports */
import { extname } from "path";

/* internal imports */
import { BusterError } from "../errors";

export class BusterExtensionFilterError extends BusterError {
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
export function filterByExtension(
  filename: string,
  extensions: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    /* determine the file extension */
    const fileExtension = extname(filename).substring(1);

    if (extensions.includes(fileExtension)) return resolve(filename);

    return reject(
      new BusterExtensionFilterError(
        `${filename}: extension "${fileExtension}" not in extensions`
      )
    );
  });
}
