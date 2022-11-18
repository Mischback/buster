// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

/**
 * Base class for all module-related errors.
 */
 export class BusterError extends Error {
  constructor(message: string) {
    super(message);
  }
}
