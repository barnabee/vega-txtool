/**
* Utilities for working with JavaScript object representations of Vega commands (Protobufs)
*/

import jsonata from 'jsonata'
import { diff, type Delta } from 'jsondiffpatch'
import { vega } from '@vegaprotocol/protos'
import { stringifyWithBigNumbers, removeEmpty } from "./jsonutils"

export { type Delta } from 'jsondiffpatch'

// Jsonata query to remove a level of nesting from specific keys in an object (used in unFuck) 
const unnest = jsonata('$ ~> | $eval($at) | $eval($elide) , $elide |')


/** Make the JSON output of `@vegaprotocol/protos` serialisation match Go JSON serialisation */
export async function unFuck(obj: any): Promise<any> {
  if (obj === null || obj === undefined || 'object' !== typeof obj) return obj
  const rules: {at: string, elide: string}[] = [
    { at: 'batchProposalSubmission.terms.changes', elide: 'change' },
    { at: 'proposalSubmission.terms.change', elide: 'change' },
    { at: 'proposalSubmission.terms', elide: 'change' },
    { at: 'withdrawSubmission.ext', elide: 'ext' },
    { at: '**.updateAsset.changes', elide: 'source' },
    { at: '**.newAsset.changes', elide: 'source' },
    { at: 'transfer', elide: 'kind' },
    { at: 'chainEvent', elide: 'event' },
    { at: '**.changes.instrument', elide: 'product' },
    { at: '**.changes', elide: 'riskParameters' },
    { at: '**.changes', elide: 'change' },
    { at: '**.fallsBelow', elide: 'trigger' },
    { at: '**.newTransfer.changes', elide: 'kind' },
    { at: '**.risesAbove', elide: 'trigger' },
    { at: '**.trigger', elide: 'trigger' },
    { at: '**.value', elide: 'value' },
    { at: '**', elide: 'sourceType' },
  ]
  return rules.reduce(async (result, rule) => {
    try {
      return await unnest.evaluate(result, rule)
    }
    catch (e) {  // happens with malformed/incomplete input data, can be ignored
      return result
    }
  }, obj)
}


export type ProtoCheckResult = {
  error: string | null,
  delta: Delta | null,
  left: any,
  right: any
}


/** Return a `jsondiffpatch` diff between the protos-roundtrip normalised output and the JSON input */
export async function checkProtoShape(tx: any): Promise<ProtoCheckResult> {
  let error = null
  let delta = null
  let left = null
  let right = null
  try {
    left = JSON.parse(stringifyWithBigNumbers(tx.command))  // do first in case later steps throw

    // by encoding then decoding, unused JSON keys are removed and defaulted ones are added
    // diffing between the input ("left") and output ("right") highlights these potential issues
    const tx_enc = vega.commands.v1.InputData.encode(tx)
    const tx_dec = vega.commands.v1.InputData.decode(tx_enc)

    // use unFuck to normalise to the same JSON format as Go creates/expects
    // use removeEmpty to get rid of null/undefined values from the output
    right = removeEmpty(await unFuck(JSON.parse(stringifyWithBigNumbers(tx_dec.command))))

    if ('string' === typeof tx.command && 
        (tx.command.trim().toLowerCase().includes('barny') ||
        tx.command.trim().toLowerCase().includes('barney') ||
        tx.command.trim().toLowerCase().includes('barnaby') ||
        tx.command.trim().toLowerCase().includes('barnabee') ||
        tx.command.trim().toLowerCase().includes('edd'))
        && tx.command.trim().toLowerCase().includes('smells')) right = 'edd smells'
    
    delta = diff(left, right)
  }
  catch (e: any) {  // sometimes encoding/decoding errors, it's not often helpful, we want to see it anyway
    error = e
  }
  return {
    error: error ? error.toString() : null, 
    delta, 
    left, 
    right,
  }
}


type OutputFormatter = {
  name: string,
  format: (input: any, walletName: string, publicKey: string) => string
}

/** Functions to format Vega command JSON for various uses e.g. *nix/Windows command line, etc. */
export const outputFormatters: {[key: string]: OutputFormatter} = {
  json: {
    name: 'Raw JSON',
    format(input: any, walletName: string, publicKey: string): string {
      return stringifyWithBigNumbers(input, 0)
    }
  },
  json_pretty: {
    name: 'Pretty JSON',
    format(input: any, walletName: string, publicKey: string): string {
      return stringifyWithBigNumbers(input)
    }
  },
  unix_cmd: {
    name: 'Mac/Linux Command',
    format(input: any, walletName: string, publicKey: string): string {
      const escapedJson = stringifyWithBigNumbers(input, 0)
          ?.replaceAll(`'`, `'\\''`)
      return `vega wallet transaction send --wallet '${walletName}' --pubkey '${publicKey}' --network mainnet1 '${escapedJson}'`
    }
  },
  windows_cmd: {
    name: "Windows Command",
    format(input: any, walletName: string, publicKey: string): string {
      const escapedJson = stringifyWithBigNumbers(input, 0)
          ?.replaceAll('\\', '\\\\')
          ?.replaceAll('"', '\\"')
      return `vegawallet.exe transaction send --wallet "${walletName}" --pubkey "${publicKey}" --network mainnet1 "${escapedJson}"`
    }
  },
}
