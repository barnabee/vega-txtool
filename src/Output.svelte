<script lang="ts">
  export let inputJson: string
  export let command: any
  export let output: string
</script>

<div class="content">
  {#if inputJson !== '' && command !== null}
    <pre>{output}</pre>
  {:else if 'string' === typeof inputJson && inputJson.trim() === ''}
    <p><strong>Command JSON is empty.</strong> Paste or type valid Vega transaction JSON to view and copy wallet command.</p>
  {:else}
    <p><strong>Command JSON is malformed.</strong> Correct errors to view and copy wallet command.</p>
  {/if}
</div>

<style>
  div {
    padding: 1rem;
  }
  pre {
    font-size: 0.8rem;
    color: #bbbbbb;
  }
</style>
