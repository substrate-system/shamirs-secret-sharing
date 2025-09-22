import { type FunctionComponent, render } from 'preact'
import { webcrypto } from '@substrate-system/one-webcrypto'
import { html } from 'htm/preact'
import { signal, useComputed } from '@preact/signals'
import { EccKeys } from '@substrate-system/keys/ecc'
import { toString } from 'uint8arrays'
import Debug from '@substrate-system/debug'
import { split, reconstruct, type Share } from '../src/index.js'
const debug = Debug(import.meta.env.DEV)

export const NBSP = '\u00A0'

interface KeyPair {
    privateKey:string
    publicKey:string
}

const keyPair = signal<KeyPair|null>(null)
const shares = signal<Share[]>([])
const selectedShares = signal<Set<number>>(new Set())
const reconstructedKey = signal<string|null>(null)
const threshold = signal(3)
const totalShares = signal(5)

const generateKeyPair = async () => {
    const keys = await EccKeys.create(true, true)
    const privateKey = await webcrypto.subtle.exportKey(
        'pkcs8',
        keys.privateWriteKey
    )
    debug('the private key', privateKey)
    const privateKeyString = toString(new Uint8Array(privateKey), 'base64pad')
    const publicKeyString = await keys.publicWriteKeyAsString('base64')

    keyPair.value = {
        privateKey: privateKeyString,
        publicKey: publicKeyString
    }
    shares.value = []
    selectedShares.value = new Set()
    reconstructedKey.value = null
}

const splitPrivateKey = () => {
    if (!keyPair.value) return

    const privateKeyBytes = new TextEncoder().encode(keyPair.value.privateKey)
    const newShares = split(privateKeyBytes, {
        min: threshold.value,
        total: totalShares.value
    })
    shares.value = newShares
    selectedShares.value = new Set()
    reconstructedKey.value = null
}

const toggleShare = (index:number) => {
    const newSelected = new Set(selectedShares.value)
    if (newSelected.has(index)) {
        newSelected.delete(index)
    } else {
        newSelected.add(index)
    }
    selectedShares.value = newSelected
}

const reconstructPrivateKey = () => {
    if (selectedShares.value.size < threshold.value) return

    const selectedSharesArray = Array.from(selectedShares.value).map(i => {
        return shares.value[i]
    })
    const reconstructedBytes = reconstruct(selectedSharesArray)
    const reconstructedString = new TextDecoder().decode(reconstructedBytes)
    reconstructedKey.value = reconstructedString
}

const Example:FunctionComponent = function () {
    const success = useComputed<boolean>(() => {
        return reconstructedKey.value === keyPair.value?.privateKey
    })

    return html`
        <div class="container">
            <h1>Shamir's Secret Sharing Demo</h1>

            <div class="section">
                <h2>1. Generate Key Pair</h2>
                <button class="btn btn-primary" onclick=${generateKeyPair}>
                    Generate New Key Pair
                </button>

                ${keyPair.value && html`
                    <div class="field-container">
                        <div class="field-label">
                            <strong>Private Key:</strong>
                            <div class="code-block">
                                ${keyPair.value.privateKey}
                            </div>
                        </div>
                        <div>
                            <strong>Public Key:</strong>
                            <div class="code-block">
                                ${keyPair.value.publicKey}
                            </div>
                        </div>
                    </div>
                `}
            </div>

            ${keyPair.value && html`
                <div class="section">
                    <h2>2. Split Private Key</h2>
                    <div class="input-group">
                        <label class="input-label">
                            Threshold:
                            <input
                                type="number"
                                class="input-field"
                                value=${threshold.value}
                                min="2"
                                max="10"
                                onchange=${(e:Event) => {
                                    const input = e.target as HTMLInputElement
                                    threshold.value = parseInt(input.value)
                                }}
                            />
                        </label>
                        <label class="input-label">
                            Total Shares:
                            <input
                                type="number"
                                class="input-field"
                                value=${totalShares.value}
                                min=${threshold.value}
                                max="10"
                                onchange=${(e:Event) => {
                                    const input = e.target as HTMLInputElement
                                    totalShares.value = parseInt(input.value)
                                }}
                            />
                        </label>
                    </div>
                    <button class="btn btn-success" onclick=${splitPrivateKey}>
                        Split Private Key
                    </button>

                    ${shares.value.length > 0 && html`
                        <div class="field-container">
                            <strong>
                                Generated ${shares.value.length} shares
                                (need ${threshold.value} to reconstruct):
                            </strong>
                            <div class="field-container">
                                ${shares.value.map((share, index) => html`
                                    <div key=${index} class="share-item">
                                        <div class="field-label">
                                            <strong>
                                                Share ${index + 1} (x=${share.x}):
                                            </strong>
                                        </div>
                                        <div class="share-hex">
                                            ${Array.from(share.y).map(b => {
                                                return b.toString(16).padStart(2, '0')
                                            }).join('')}
                                        </div>
                                    </div>
                                `)}
                            </div>
                        </div>
                    `}
                </div>
            `}

            ${shares.value.length > 0 && html`
                <div class="section">
                    <h2>3. Reconstruct Private Key</h2>
                    <div class="field-label">
                        <strong>
                            Select ${threshold.value} or more shares
                            to reconstruct:
                        </strong>
                    </div>
                    <div class="input-group">
                        ${shares.value.map((share, index) => html`
                            <label key=${index} class="checkbox-item">
                                <input
                                    type="checkbox"
                                    class="checkbox-input"
                                    checked=${selectedShares.value.has(index)}
                                    onchange=${() => toggleShare(index)}
                                />
                                Share ${index + 1} (x=${share.x})
                            </label>
                        `)}
                    </div>
                    <button
                        class="btn ${selectedShares.value.size >= threshold.value ?
                            'btn-danger' :
                            'btn-disabled'}"
                        onclick=${reconstructPrivateKey}
                        disabled=${selectedShares.value.size < threshold.value}
                    >
                        Reconstruct Private Key ${NBSP}
                        (${selectedShares.value.size}/${threshold.value} selected)
                    </button>

                    ${reconstructedKey.value && html`
                        <div class="field-container">
                            <strong>Reconstructed Private Key:</strong>
                            <div class="code-block">
                                ${reconstructedKey.value}
                            </div>
                            <div class="${success.value ? 'status-success' : 'status-error'}">
                                ${success.value ? 'Successfully reconstructed' : 'Reconstruction failed...'}
                            </div>
                        </div>
                    `}
                </div>
            `}
        </div>
    `
}

render(html`<${Example} />`, document.getElementById('root')!)
