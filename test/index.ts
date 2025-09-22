import { test } from '@substrate-system/tapzero'
import { webcrypto } from '@substrate-system/one-webcrypto'
import { split, reconstruct } from '../src/index.js'

test('debug basic polynomial', async t => {
    const keypair = await webcrypto.subtle.generateKey(
        { name: 'Ed25519' },
        true,  // extractable
        ['sign', 'verify']
    )

    const secret = new Uint8Array(
        await webcrypto.subtle.exportKey('pkcs8', keypair.privateKey)
    )
    console.log('Secret length:', secret.length)

    const shares = split(secret, { min: 2, total: 3 })

    try {
        const reconstructed = reconstruct(shares.slice(0, 2))
        console.log('Reconstructed length:', reconstructed.length)

        let matches = true
        for (let i = 0; i < secret.length; i++) {
            if (secret[i] !== reconstructed[i]) {
                matches = false
                break
            }
        }

        t.ok(matches, 'should reconstruct original private key')
    } catch (e) {
        console.error('Reconstruction failed:', e)
        t.fail('reconstruction failed')
    }
})

test('basic secret sharing', t => {
    const secret = new TextEncoder().encode('AB')

    const shares = split(secret, {
        min: 2,
        total: 3
    })

    t.equal(shares.length, 3, 'should generate 3 shares')

    console.log('Secret:', Array.from(secret))
    console.log('Share1:', { x: shares[0].x, y: Array.from(shares[0].y) })
    console.log('Share2:', { x: shares[1].x, y: Array.from(shares[1].y) })
    console.log('Share3:', { x: shares[2].x, y: Array.from(shares[2].y) })

    const reconstructed1 = reconstruct([shares[0], shares[1]])
    const reconstructed2 = reconstruct([shares[0], shares[2]])
    const reconstructed3 = reconstruct([shares[1], shares[2]])

    console.log('Recon1:', Array.from(reconstructed1))
    console.log('Recon2:', Array.from(reconstructed2))
    console.log('Recon3:', Array.from(reconstructed3))

    const text1 = new TextDecoder().decode(reconstructed1)
    const text2 = new TextDecoder().decode(reconstructed2)
    const text3 = new TextDecoder().decode(reconstructed3)

    t.equal(text1, 'AB', 'shares 0,1 should reconstruct original secret')
    t.equal(text2, 'AB', 'shares 0,2 should reconstruct original secret')
    t.equal(text3, 'AB', 'shares 1,2 should reconstruct original secret')
})

test('insufficient shares should fail', t => {
    const secret = new TextEncoder().encode('test secret')

    const shares = split(secret, {
        min: 3,
        total: 4
    })

    try {
        reconstruct(shares.slice(0, 2))
        t.fail('should have thrown error')
    } catch (error) {
        t.ok(error instanceof Error,
            'should throw error with insufficient shares')
    }
})

test('different share sets should reconstruct same secret', t => {
    const secret = new TextEncoder().encode('consistent secret')

    const shares = split(secret, {
        min: 3,
        total: 6
    })

    const reconstructed1 = reconstruct([shares[0], shares[2], shares[4]])
    const reconstructed2 = reconstruct([shares[1], shares[3], shares[5]])

    const text1 = new TextDecoder().decode(reconstructed1)
    const text2 = new TextDecoder().decode(reconstructed2)

    t.equal(text1, 'consistent secret', 'first reconstruction should work')
    t.equal(text2, 'consistent secret', 'second reconstruction should work')
    t.equal(text1, text2, 'both reconstructions should be identical')
})

test('simple single byte test', t => {
    const secret = new Uint8Array([65]) // 'A'

    console.log('=== DEBUGGING POLYNOMIAL CREATION ===')
    console.log('Secret byte:', secret[0])

    // Let's manually check what the polynomial evaluation should give
    // For a threshold of 2, we need 1 random coefficient
    // Let's say the polynomial is: f(x) = 65 + c*x where c is random

    const shares = split(secret, {
        min: 2,
        total: 3
    })

    console.log('Share 1:', { x: shares[0].x, y: shares[0].y[0] })
    console.log('Share 2:', { x: shares[1].x, y: shares[1].y[0] })
    console.log('Share 3:', { x: shares[2].x, y: shares[2].y[0] })

    const reconstructed = reconstruct([shares[0], shares[1]])
    console.log('Reconstructed:', reconstructed[0])

    t.equal(reconstructed[0], 65, 'should reconstruct single byte correctly')
})

test('exact threshold shares work', t => {
    const secret = new TextEncoder().encode('exact threshold')

    const shares = split(secret, {
        min: 4,
        total: 7
    })

    const reconstructed = reconstruct(shares.slice(0, 4))
    const reconstructedText = new TextDecoder().decode(reconstructed)

    t.equal(reconstructedText, 'exact threshold',
        'should work with exact threshold')
})
