// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

/* library imports */
import { createHash } from "crypto";
import { createReadStream } from "fs";

/* internal imports */
import { BusterError } from "../errors";

export class BusterHashError extends BusterError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Calculate the hash of a file's content
 *
 * @param filename - Reference to a file, provided as string
 * @returns - A Promise, resolving to the hash of the file's content
 */
export function hashFileContent(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("md5");
    const stream = createReadStream(filename);

    stream.on("error", () => {
      return reject(new BusterHashError("Error during hash calculation"));
    });

    stream.on("end", () => {
      return resolve(hash.digest("hex"));
    });

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });
  });
}
