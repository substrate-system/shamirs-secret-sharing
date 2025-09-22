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

- [Install](#install)
- [Quick start](#quick-start)
  * [Ed25519 with Web Crypto](#ed25519-with-web-crypto)
- [Use](#use)
  * [Node/Browser ESM](#nodebrowser-esm)
  * [CommonJS](#commonjs)
  * [Pre-built JS for browsers](#pre-built-js-for-browsers)
- [API](#api)
  * [split](#split)
  * [reconstruct](#reconstruct)
  * [Share](#share)
- [Limits and notes](#limits-and-notes)
- [FAQ](#faq)

<!-- tocstop -->

</details>

## Install

Install from npm:

```sh
npm i -S @substrate-system/shamirs-secret-sharing
```

## Quick start

Split a secret into shares and reconstruct it later.

```ts
import { split, reconstruct } from '@substrate-system/shamirs-secret-sharing'

// Any bytes work. Here we use UTF-8 text for simplicity.
const secretBytes = new TextEncoder().encode('correct horse battery staple')

// Create 5 shares, any 3 can reconstruct
const shares = split(secretBytes, { min: 3, total: 5 })

// Pick any 3 shares to reconstruct
const recovered = reconstruct([shares[0], shares[2], shares[4]])

console.log(new TextDecoder().decode(recovered)) // "correct horse battery staple"
```

### Ed25519 with Web Crypto

Generate an Ed25519 key pair with the Web Crypto API, export the private key,
and split it into shares. Works in modern browsers and Node 20+.

```ts
import { split, reconstruct } from '@substrate-system/shamirs-secret-sharing'

// In modern browsers and Node 20+, globalThis.crypto is available.
// For wider compatibility, you can use:
// import { webcrypto as crypto } from '@substrate-system/one-webcrypto'

const crypto = globalThis.crypto

// 1) Generate Ed25519 key pair
const keypair = await crypto.subtle.generateKey(
{ name: 'Ed25519' },
true,                 // extractable: we will export the private key
['sign', 'verify']
)

// 2) Export the private key as PKCS#8 bytes
const pkcs8 = await crypto.subtle.exportKey('pkcs8', keypair.privateKey)
const privateKeyBytes = new Uint8Array(pkcs8)

// 3) Split into 5 shares where any 3 can reconstruct
const shares = split(privateKeyBytes, { min: 3, total: 5 })

// 4) Later, reconstruct from any 3 shares
const recovered = reconstruct([shares[0], shares[2], shares[4]])

// 5) (Optional) Import the reconstructed key back to a CryptoKey
const importedPrivateKey = await crypto.subtle.importKey(
'pkcs8',
recovered,
{ name: 'Ed25519' },
true,
['sign']
)

console.log('Reconstruction successful:', importedPrivateKey instanceof CryptoKey)
```


## Use

### Node/Browser ESM
```ts
import { split, reconstruct, type Share } from '@substrate-system/shamirs-secret-sharing'

const msg = 'hello shamir'
const secret = new TextEncoder().encode(msg)
const shares: Share[] = split(secret, { min: 2, total: 3 })

const restored = reconstruct([shares[0], shares[2]])
console.log(new TextDecoder().decode(restored)) // 'hello shamir'
```

### CommonJS
```js
const { split, reconstruct } = require('@substrate-system/shamirs-secret-sharing')

const secret = Buffer.from('my secret', 'utf8')
const shares = split(secret, { min: 2, total: 3 })
const restored = reconstruct([shares[0], shares[1]])
console.log(Buffer.from(restored).toString('utf8'))
```

### Pre-built JS for browsers
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

You can also see a complete interactive example in `example/` and the
[live demo](https://substrate-system.github.io/shamirs-secret-sharing/).

## API

### split

```ts
function split(
  secret:Uint8Array,
  options:{ min:number; total:number }
):Share[]
```

- `secret`: The bytes to protect (any `Uint8Array`: text, keys, binary data).
- `options.min`: Threshold k. Must be >= 2 and <= `total`.
- `options.total`: Number of shares n to generate. Max 254.

Returns `n` `Share` objects. Any `k` or more distinct shares reconstruct the secret.

### reconstruct

```ts
function reconstruct(shares:Share[]):Uint8Array
```

- `shares`: An array of shares with the same `threshold` and length.

Returns the original `Uint8Array` secret. Throws if insufficient shares provided.

### Share

```ts
interface Share {
  x:number            // share index in [1..254]
  y:Uint8Array        // share bytes (same length as secret)
  threshold?:number   // k; included for convenience
}
```

Notes:
- `y` is raw bytes. To display or persist, encode to hex/base64.

Example serialization:

```ts
import { toString as u8ToString } from 'uint8arrays/to-string'
import { fromString as u8FromString } from 'uint8arrays/from-string'

const encoded = u8ToString(share.y, 'base64')
const decoded = u8FromString(encoded, 'base64')
```

## Limits and notes

- Maximum shares: 254 (GF(256) constraint).
- Threshold must be between 2 and `total`.
- All shares must be from the same `split` call (same secret length and params).
- Randomness: coefficients are generated using WebCrypto via
  `@substrate-system/one-webcrypto` for wide platform compatibility.
- Performance: linear in secret length and number of shares.

## FAQ

- How big are shares? &ndash; Exactly the same length as the secret bytes plus small
  constant metadata (`x`, optional `threshold`).
- Can I split strings? &ndash; Yes. Encode to bytes with `TextEncoder`,
  and decode with `TextDecoder` after reconstruction.
- Is Node supported? &ndash; Yes. Use ESM or CJS as shown above.
- Is there a demo UI? &ndash; Yes, see `example/` and the hosted demo
  linked above.
