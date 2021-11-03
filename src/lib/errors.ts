// SPDX-License-Identifier: MIT

/**
 * Base class for all module-related errors.
 */
 export class BusterError extends Error {
  constructor(message: string) {
    super(message);
  }
}
