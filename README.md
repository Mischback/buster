# buster

![npm (scoped)](https://img.shields.io/npm/v/@mischback/buster?style=flat)
[![install size](https://packagephobia.com/badge?p=@mischback/buster)](https://packagephobia.com/result?p=@mischback/buster)

![GitHub package.json version (development)](https://img.shields.io/github/package-json/v/mischback/buster/development?style=flat)
![GitHub branch checks state](https://img.shields.io/github/workflow/status/mischback/buster/CI%20default%20branch?style=flat&logo=github)
[![Coverage Status](https://coveralls.io/repos/github/Mischback/buster/badge.svg)](https://coveralls.io/github/Mischback/buster)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat&logo=prettier)](https://github.com/prettier/prettier)
![GitHub License](https://img.shields.io/github/license/mischback/buster?style=flat)

**buster** is a tool to support _cache busting_ for static assets of a website.

_buster_ will hash the file's content and append the hash to the filename,
providing a manifest file to match the orginal filename to the new one.

## Installation

Just install _buster_ from **npm**:

```bash
$ npm install --save-dev @mischback/buster
```

Most likely you will want to install it as a development dependency for internal
usage.

## Usage

After installation, _buster_ is available using the following command:

```bash
$ npx buster
```

### Example Usage

```bash
$ tree .manual-test
.manual-test
├── blank.css
├── index.ts
└── lib
    └── hashwalker.ts

$ npx buster -i "./.manual-test" -e "ts"
[date and time]  INFO [buster] No mode specified, using "copy"
[date and time]  INFO [buster] No output file specified, using "asset-manifest.json"

$ tree .manual-test
.manual-test
├── asset-manifest.json
├── blank.css
├── index.dd99a19417.ts
├── index.ts
└── lib
    ├── hashwalker.84f1a289e8.ts
    └── hashwalker.ts

$ cat .manual-test/asset-manifest.json
{"index.ts":"index.dd99a19417.ts","lib/hashwalker.ts":"lib/hashwalker.84f1a289e8.ts"}%
```

## Configuration

_buster_ is configured by command line parameters.

- `--commonPathLength`: manually override the length of filepath's that is to be
  preserved in the manifest file
- `--debug`, `-d`: activate debug mode, providing more log messages
  - default: `false`
- `--extension`, `-e`: a file extension to include during processing; may be specified multiple times
  - default: `["css", "js"]`
- `--hashLength`: the length of the hash to be appended to the filename
  - default: `10`
- `--input`, `-i`: the actual input file or directory
  - **mandator parameter**, no default value
- `--mode`, `-m`: operation mode, either `"copy"` or `"rename"`
  - default: `copy`
  - `MODE_COPY` as specified by `copy` will copy the source file to a new file
    with the content's hash appended to the filename
  - `MODE_RENAME` as specified by `rename` will rename the existing file
- `--outFile`, `-o`: filename and path of the manifest file to be created
  - default: `"asset-manifest.json"`
  - **Please note:** If just a filename is specified, the output file will be
    created relative to `input`: if `input` is a directory, it will be placed
    inside this directory; if `input` is a file, it will be placed into the same
    directory; if a path and filename is specified, that location will be useds
- `--quiet`, `-q`: suppress all log messages
  - default: `false`

## Contributing

Issues, pull requests and feature requests are welcome. Just use the project's
[issue tracker](https://github.com/mischback/buster/issues).

_buster_ is implemented in TypeScript and compiled/transpiled to actual JavaScript
on release.

## License

[MIT](https://choosealicense.com/licenses/MIT)
