<script lang="ts">
  import { vega } from '@vegaprotocol/protos'
  import { type Settings } from './lib/settings'
  import * as settingsStore from './lib/settings'
  import { stringifyWithBigNumbers, parseOr } from './lib/jsonutils'
  import { checkProtoShape, outputFormatters, type ProtoCheckResult, type Delta } from './lib/vegahelpers'
  import { 
    setState, 
    readHashValue,
    onStateChanged, 
    saveCheckpointIfDirty } from './lib/stateCheckpoint'

  import EditorToolbar from './EditorToolbar.svelte'
  import MonacoEditor from './MonacoEditor.svelte'
  import ErrorReport from './ErrorReport.svelte'
  import TabBar from './TabBar.svelte'
  import Output from './Output.svelte'
  import SettingsView from './Settings.svelte'
  import ChangePreview from './ChangePreview.svelte'
  
  // UI state and settings
  let settingsDialog: HTMLDialogElement
  let showUnchanged = false
  let previewChanges = false
  let outputFormat = localStorage.outputFormat || 'json'
  $: localStorage.setItem('outputFormat', outputFormat)  // remember selected output format

  // Input, output, intermediate state, and errors for reporting
  let inputJson = ''
  readHashValue().then(s => inputJson = s)
  let tx: vega.commands.v1.InputData.InputData
  let checkResult: ProtoCheckResult | null = null
  let left: any, right: any, delta: Delta | null, otherError: string | null

  let settings: Settings = settingsStore.load()

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

  function saveSettings(newSettings: Settings) {
    settings = settingsStore.save(newSettings)
  }

  $: setState(inputJson)  // update state has (with debounce) when editor changes
  $: [command, jsonError] = parseOr(inputJson, null)  // parse JSON and check for basic syntax errors
  $: tx = { nonce: 0n, blockHeight: 0n, command }  // place the parsed JSON in a Vega InputData message
  $: processInput(tx)
  $: outputText = left !== null 
      ? outputFormatters[outputFormat].format(left, settings) : ''
</script>

<header>
  <h1>Vega transaction tool</h1>
</header>
<main class="vsplit">
  <nav>
    <menu>
      <li><a href="/tx/">Transaction builder</a></li>
      <!--<li><a href="/mk">Market history</a></li>-->
    </menu>
  </nav>
  <div class="dynamic-col">
    <section id="editor-panel">
      <EditorToolbar 
        update={updateInput}
        bind:settingsDialog={settingsDialog}
        bind:input={inputJson}
        bind:showUnchanged
        bind:previewChanges
        bind:left={left}
        bind:right={right}
        bind:delta={delta} />
      <MonacoEditor
        hidden={previewChanges}
        bind:value={inputJson} />
      {#if previewChanges}
      <ChangePreview
        transaction={left} />
      {:else}
      <ErrorReport
        bind:inputJson
        bind:inputData={tx}
        bind:jsonError={jsonError}
        bind:otherError={otherError}
        bind:left
        bind:right
        bind:delta 
        bind:showUnchanged />
      {/if}
    </section>
    {#if !previewChanges}
    <section id="output-panel">
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
    {/if}
  </div>
</main>

<footer>
  <p>✨ <a href="https://github.com/barnabee/vega-txtool">Source on GitHub</a> ✨</p>
</footer>

<SettingsView bind:settingsDialog bind:settings {saveSettings} />

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
  #editor-panel {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  #output-panel {
    flex-shrink: 1;
  }
  main {
    min-width: 25em;
  }
</style>
