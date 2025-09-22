import { webcrypto } from '@substrate-system/one-webcrypto'

export interface Share {
  x:number
  y:Uint8Array
  threshold?:number
}

const GF256_LOG = new Uint8Array(256)
const GF256_EXP = new Uint8Array(256)

function initGF256Tables () {
    let x = 1
    for (let i = 0; i < 255; i++) {
        GF256_EXP[i] = x
        GF256_LOG[x] = i
        x = x << 1
        if (x & 0x100) {  // if bit 8 is set (x >= 256)
            x ^= 0x11d    // XOR with irreducible polynomial x^8 + x^4 + x^3 + x + 1
        }
    }
    GF256_EXP[255] = GF256_EXP[0]
    GF256_LOG[0] = 255  // Special case for log(0) = undefined, use 255 as sentinel
}

initGF256Tables()

function gfMul (a:number, b:number):number {
    if (a === 0 || b === 0) return 0
    return GF256_EXP[(GF256_LOG[a] + GF256_LOG[b]) % 255]
}

function gfAdd (a:number, b:number):number {
    return a ^ b
}

function gfDiv (a:number, b:number):number {
    if (b === 0) throw new Error('Division by zero in GF(256)')
    if (a === 0) return 0
    return GF256_EXP[(GF256_LOG[a] - GF256_LOG[b] + 255) % 255]
}

function evaluatePolynomial (coeffs:number[], x:number):number {
    let result = 0
    let xPower = 1

    for (let i = 0; i < coeffs.length; i++) {
        const term = gfMul(coeffs[i], xPower)
        result = gfAdd(result, term)
        xPower = gfMul(xPower, x)
    }

    return result
}

export function split (
    secret:Uint8Array,
    options:{
        min:number
        total:number
    }
):Share[] {
    const { min, total } = options

    if (min < 2 || min > total) {
        throw new Error('Invalid threshold: must be >= 2 and <= total')
    }

    if (total > 254) {
        throw new Error('Maximum 254 shares supported')
    }

    const shares:Share[] = []

    // Generate random coefficients for each byte's polynomial
    const polynomials:number[][] = []
    for (let byteIndex = 0; byteIndex < secret.length; byteIndex++) {
        const coeffs = [secret[byteIndex]]  // constant term is the secret byte

        // Generate random coefficients for higher-order terms
        const randomBytes = webcrypto.getRandomValues(new Uint8Array(min - 1))
        for (let j = 1; j < min; j++) {
            coeffs.push(randomBytes[j - 1])
        }

        polynomials.push(coeffs)
    }

    // Generate shares by evaluating polynomials at different x values
    for (let shareIndex = 1; shareIndex <= total; shareIndex++) {
        const y = new Uint8Array(secret.length)

        for (let byteIndex = 0; byteIndex < secret.length; byteIndex++) {
            y[byteIndex] = evaluatePolynomial(polynomials[byteIndex], shareIndex)
        }

        shares.push({ x: shareIndex, y, threshold: min })
    }

    return shares
}

export function reconstruct (shares:Share[]):Uint8Array {
    if (shares.length === 0) {
        throw new Error('No shares provided')
    }

    const threshold = shares[0].threshold
    if (threshold && shares.length < threshold) {
        throw new Error(`Insufficient shares: need ${threshold}, got ${shares.length}`)
    }

    const result = new Uint8Array(shares[0].y.length)

    for (let byteIndex = 0; byteIndex < shares[0].y.length; byteIndex++) {
        let secretByte = 0

        for (let i = 0; i < shares.length; i++) {
            let numerator = 1
            let denominator = 1

            // Calculate Lagrange basis polynomial for x=0
            for (let j = 0; j < shares.length; j++) {
                if (i !== j) {
                    numerator = gfMul(numerator, shares[j].x)
                    denominator = gfMul(denominator, gfAdd(shares[i].x, shares[j].x))
                }
            }

            const lagrangeBasis = gfDiv(numerator, denominator)
            secretByte = gfAdd(secretByte, gfMul(shares[i].y[byteIndex], lagrangeBasis))
        }

        result[byteIndex] = secretByte
    }

    return result
}
