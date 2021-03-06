#!/usr/bin/env node

// SPDX-License-Identifier: MIT

/* internal imports */
import { busterMain } from "./main";

busterMain(process.argv)
  .then((retVal) => {
    process.exit(retVal);
  })
  .catch((errno: number) => {
    process.exit(errno);
  });
