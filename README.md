# Shamir's Secret Sharing
[![tests](https://img.shields.io/github/actions/workflow/status/substrate-system/shamirs-secret-sharing/nodejs.yml?style=flat-square)](https://github.com/substrate-system/shamirs-secret-sharing/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/@substrate-system/icons?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/shamirs-secret-sharing)](https://packagephobia.com/result?p=@substrate-system/shamirs-secret-sharing)
[![gzip size](https://img.shields.io/bundlephobia/minzip/@substrate-system/shamirs-secret-sharing?style=flat-square)](https://bundlephobia.com/@substrate-system/shamirs-secret-sharing)
[![dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg?style=flat-square)](package.json)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)


Shamir's Secret Sharing for the browser.

[See a live demo](https://substrate-system.github.io/shamirs-secret-sharing/)

<details><summary><h2>Contents</h2></summary>
<!-- toc -->
</details>

## install

Installation instructions

```sh
npm i -S @substrate-system/shamirs-secret-sharing
```

## API

This exposes ESM and common JS via [package.json `exports` field](https://nodejs.org/api/packages.html#exports).

### ESM
```js
import '@substrate-system/shamirs-secret-sharing'
```

### Common JS
```js
require('@substrate-system/shamirs-secret-sharing')
```

## Use

### JS
```js
import '@substrate-system/shamirs-secret-sharing'
```

### pre-built JS
This package exposes minified JS files too. Copy them to a location that is
accessible to your web server, then link to them in HTML.

#### copy
```sh
cp ./node_modules/@substrate-system/shamirs-secret-sharing/dist/index.min.js ./public/sss.min.js
```

#### HTML
```html
<script type="module" src="./sss.min.js"></script>
```
