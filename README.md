# buster

![npm (scoped)](https://img.shields.io/npm/v/@mischback/buster?style=flat)
[![install size](https://packagephobia.com/badge?p=@mischback/buster)](https://packagephobia.com/result?p=@mischback/buster)

![GitHub package.json version (development)](https://img.shields.io/github/package-json/v/mischback/buster/development?style=flat)
![GitHub branch checks state](https://img.shields.io/github/actions/workflow/status/mischback/buster/ci-default.yml?branch=development&style=flat&logo=github)
[![Coverage Status](https://coveralls.io/repos/github/Mischback/buster/badge.svg)](https://coveralls.io/github/Mischback/buster)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat&logo=prettier)](https://github.com/prettier/prettier)
![GitHub License](https://img.shields.io/github/license/mischback/buster?style=flat)

**buster** is a tool to support _cache busting_ for static assets of a website.

_buster_ will hash the file's content and append the hash to the filename,
providing a manifest file to match the orginal filename to the new one.

## Out of Maintanence

_buster_ is **out of maintenance** until further notice.

There will be no additional features, and **no bugfixes**. If you're interested
in taking over this project, you may use GitHub to get in touch (e.g. by
posting an issue in this repository).

## Installation

Just install _buster_ from **npm**:

```bash
npm install --save-dev @mischback/buster
```

Most likely you will want to install it as a development dependency for internal
usage.

## Usage

After installation, _buster_ is available using the following command:

```bash
npx buster
```

## Configuration

## Contributing

Issues, pull requests and feature requests are welcome. Just use the project's
[issue tracker](https://github.com/mischback/buster/issues).

_buster_ is implemented in TypeScript and compiled/transpiled to actual JavaScript
on release.

## License

[MIT](https://choosealicense.com/licenses/MIT)
