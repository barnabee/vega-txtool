<script lang="ts">
  import 'jsondiffpatch/formatters/styles/html.css'
  import 'jsondiffpatch/formatters/styles/annotated.css'
  
  import * as htmlFormatter from 'jsondiffpatch/formatters/html'
  import type { Delta } from 'jsondiffpatch';
  
  import { vega } from '@vegaprotocol/protos'
  
  import type { JsonErrorInfo } from "./lib/jsonutils"

  export let inputJson: string
  export let inputData: vega.commands.v1.InputData.InputData
  export let jsonError: JsonErrorInfo | null
  export let otherError: string | null
  export let left: any
  export let right: any
  export let delta: Delta | null
  export let showUnchanged: boolean

  $: htmlFormatter.showUnchanged(showUnchanged)
  $: diffHtml = delta !== null && right !== null ? (htmlFormatter.format(delta, left) || null) : null

  $: isErrorState = !inputJson 
      || jsonError !== null
      || ('string' === typeof inputJson && inputJson === '')
      || (inputJson !== '' && inputData?.command === null)
      || (otherError !== null && otherError !== '')
</script>

<div class="error-report" class:error={isErrorState}>
  {#if !inputJson || ('string' === typeof inputJson && inputJson.trim() === '') }
    <p><strong>No input.</strong> Paste transaction command JSON above.</p>
  {:else if jsonError !== null || (inputJson !== '' && inputData?.command === null)}
    <p><strong>Input is not valid JSON</strong></p>
    {#if jsonError !== null}
      {#if jsonError.linesBefore && jsonError.linesBefore !== ''}
        <pre class="linesBefore">{jsonError.linesBefore}</pre>
      {/if}
      {#if jsonError.errorLine && jsonError.errorLine !== ''}
        <pre class="errorLine">{jsonError.errorLine}</pre>
      {/if}
      {#if jsonError.errorMessage && jsonError.errorMessage !== ''}
        <pre class="errorMessage">{jsonError.errorMessage}</pre>
      {/if}
      {#if jsonError.linesAfter && jsonError.linesAfter !== ''}
        <pre class="linesAfter">{jsonError.linesAfter}</pre>
      {/if}
    {/if}
  {:else if right === null && otherError === null}  
    <p>Input contains no data matching a Vega command.</p>
  {:else if otherError !== null && otherError !== ''}
    <p class="error"><strong>{otherError}</strong></p>
  {:else if diffHtml !== null && left !== null && right !== null}
    <p><strong class="errorMessage">Diffs indicate possible missing data or malformed JSON.</strong>
    <span>Check values of all command line arguments, parameters and timestamps are as expected before submitting.</span></p>
    <div class="diff">
      {@html diffHtml}
    </div>
  {:else}
    <p><span class="good"><strong>No diffs!</strong> Transaction seems well formed 😎</span>&nbsp;
    Check values of all command line arguments, parameters and timestamps are as expected before submitting.</p>
  {/if}
</div>

<style>
  .linesBefore, .linesAfter {
    color: #aaaaaa;
  }
  .good {
    color: #22ff22;
  }
  .error {
    color: #eeeeee;
    background-color: #3A0909;
  }
  .errorMessage:not(:only-child) {
    margin-bottom: 0.5rem;
    color: #ff0000;
  }
  .errorLine {
    margin-bottom: 0.2rem;
    margin-top: 0.5rem;
    color: #FFC560;
  }
  pre {
    padding-left: 1rem;
  }
</style>
