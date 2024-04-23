<script lang="ts">
  import { vega } from '@vegaprotocol/protos'
  import * as vegaSchema from '../vega-schema.json'
   
  import { stringifyWithBigNumbers, parseOr, jsonErrorHelp, type Delta } from './lib/jsonutils'
  import { checkProtoShape, outputFormatters, type ProtoCheckResult } from './lib/vegahelpers'
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
  
  // UI state and settings
  let editorView: any
  let showUnchanged = false
  let outputFormat = localStorage.outputFormat || 'json'
  $: localStorage.setItem('outputFormat', outputFormat)  // remember selected output format

  // Input, output, intermediate state, and errors for reporting
  let inputJson = location.hash.slice(1) == '' ? '' : atob(location.hash.slice(1))  // init from URL hash
  let tx: vega.commands.v1.InputData.InputData
  let checkResult: ProtoCheckResult | null = null
  let left: any, right: any, delta: Delta | null, otherError: string | null

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

  $: setState(inputJson)  // update state has (with debounce) when editor changes
  $: [command, jsonError] = parseOr(inputJson, null)  // parse JSON and check for basic syntax errors
  $: tx = { nonce: 0n, blockHeight: 0n, command }  // place the parsed JSON in a Vega InputData message
  $: processInput(tx)
  $: outputText = left !== null ? outputFormatters[outputFormat].format(left) : ''
</script>

<main>
  <header>
    <h1>Vega transaction tool</h1>
  </header>
  <section> 
    <EditorToolbar 
      update={updateInput}
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
    <TabBar tabs={outputFormatters} bind:selected={outputFormat}>
      <li id="copy-button">
        <button on:click={()=>navigator.clipboard.writeText(outputText)}>Copy ⧉</button>
      </li>
    </TabBar>
    <Output
      bind:inputJson
      bind:command={left}
      bind:output={outputText} />
  </section>
  <footer>
    <p>❤️ <a href="https://github.com/barnabee/vega-txtool">Source on GitHub</a> ✨</p>
  </footer>
 </main>

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
