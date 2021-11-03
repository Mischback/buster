// SPDX-License-Identifier: MIT

import { Config } from "stdio/dist/getopt";

export const cmdLineOptions: Config = {
  debug: {
    args: 0,
    default: false,
    description: "Flag to activate debug mode",
    key: "d",
    required: false,
  },
};
