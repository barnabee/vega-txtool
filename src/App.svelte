<script lang="ts">
  import { vega } from '@vegaprotocol/protos'
  import * as vegaSchema from '../vega-schema.json'
   
  import { stringifyWithBigNumbers, parseOr } from './lib/jsonutils'
  import { checkProtoShape, outputFormatters, type ProtoCheckResult, type Delta } from './lib/vegahelpers'
  import { 
    setState, 
    onStateChanged, 
    resetCheckpointTimeout, 
    saveCheckpointIfDirty } from './lib/stateCheckpoint'

  import EditorToolbar from './EditorToolbar.svelte'
  import Editor from './Editor.svelte'
  import ErrorReport from './ErrorReport.svelte'
  import TabBar from './TabBar.svelte'
  import Output from './Output.svelte'
  import Settings from './Settings.svelte';
  import { type SettingsData } from './Settings.svelte';
  
  // UI state and settings
  let editorView: any
  let settingsDialog: HTMLDialogElement
  let settingsTab = 'user'
  let showUnchanged = false
  let outputFormat = localStorage.outputFormat || 'json'
  $: localStorage.setItem('outputFormat', outputFormat)  // remember selected output format

  // Input, output, intermediate state, and errors for reporting
  let inputJson = location.hash.slice(1) == '' ? '' : atob(location.hash.slice(1))  // init from URL hash
  let tx: vega.commands.v1.InputData.InputData
  let checkResult: ProtoCheckResult | null = null
  let left: any, right: any, delta: Delta | null, otherError: string | null

  let settings: SettingsData = (localStorage.settings && JSON.parse(localStorage.settings)) || {
    walletName: 'WALLET_NAME',
    publicKey: 'PUBLIC_KEY'
  }

  // Called when URL hash changes
  onStateChanged(s => inputJson = s || '')

   // Get the roundtrip result and diff with input (has to be async because of the diff library)
  async function processInput(parsedObj: any) {
    checkResult = await checkProtoShape(parsedObj)
    left = checkResult?.left
    right = checkResult?.right
    delta = checkResult?.delta
    otherError = checkResult?.error
  }

  // Wrapper to ensure state checkpoint updates when code changes the editor content
  function updateInput(newValue: any): void {
    saveCheckpointIfDirty()
    inputJson=stringifyWithBigNumbers(newValue)
    saveCheckpointIfDirty()
  }

  function saveSettings(newSettings: SettingsData) {
    localStorage.setItem('settings', JSON.stringify(newSettings))
    settings = newSettings
  }

  $: setState(inputJson)  // update state has (with debounce) when editor changes
  $: [command, jsonError] = parseOr(inputJson, null)  // parse JSON and check for basic syntax errors
  $: tx = { nonce: 0n, blockHeight: 0n, command }  // place the parsed JSON in a Vega InputData message
  $: processInput(tx)
  $: outputText = left !== null 
      ? outputFormatters[outputFormat].format(left, settings.walletName, settings.publicKey) : ''
</script>

<main>
  <header>
    <h1>Vega transaction tool</h1>
  </header>
  <section> 
    <EditorToolbar 
      update={updateInput}
      bind:settingsDialog={settingsDialog}
      bind:input={inputJson}
      bind:showUnchanged
      bind:left={left}
      bind:right={right}
      bind:delta={delta} />
    <Editor
      bind:value={inputJson}
      schema={vegaSchema}
      on:change={resetCheckpointTimeout}
      bind:editorView />
    <ErrorReport
      bind:inputJson
      bind:inputData={tx}
      bind:jsonError={jsonError}
      bind:otherError={otherError}
      bind:left
      bind:right
      bind:delta 
      bind:showUnchanged />
  </section>
  <section>
    {#if inputJson !== '' && command !== null}
    <TabBar tabs={outputFormatters} bind:selected={outputFormat}>
      <li id="copy-button">
        <button on:click={()=>navigator.clipboard.writeText(outputText)}>Copy ⧉</button>
      </li>
    </TabBar>
    {/if}
    <Output
      bind:inputJson
      bind:command={left}
      bind:output={outputText} />
  </section>
  <footer>
    <p>✨ <a href="https://github.com/barnabee/vega-txtool">Source on GitHub</a> ✨</p>
  </footer>
</main>

<Settings bind:settingsDialog bind:settings {saveSettings} />

<style>
  #copy-button {
    padding: 0.5rem 0.5rem;
    float: right;
    & > button {
      background: none;
      border: none;
      color: #bbbbbb;
      padding: 0.25rem;
      top: -0.1rem;
      font-size: 0.8rem;
      position: relative;
      margin: 0 0 0 0.1rem;
      &:active {
        border: none;
      }
    }
  }
</style>
