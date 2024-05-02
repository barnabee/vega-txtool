<script lang="ts">
  import { stringifyWithBigNumbers } from "./lib/jsonutils"
  
  export let update: (newValue: any) => void
  export let input: string
  export let left: any
  export let right: any
  export let delta: any
  export let showUnchanged: boolean
  export let previewChanges: boolean
  export let settingsDialog: HTMLDialogElement
</script>

<menu class="toolbar" id="editor-toolbar">
  <li id="format-json">
    <button
      disabled={!left || input === stringifyWithBigNumbers(left)}
      on:click={()=>update(left)}>Format JSON</button>
  </li>
  <li id="apply-diff">
    <button 
      disabled={!left || !right || !delta}
      on:click={()=>update(right)}>Apply diff</button>
  </li>
  <li id="show-unchanged">
    <label><input
      type="checkbox"
      bind:checked={showUnchanged} />Show unchanged</label>
  </li>
  <li id="preview-changes">
    <label><input
      type="checkbox"
      disabled={!left?.batchProposalSubmission}
      bind:checked={previewChanges} />Preview changes</label>
  </li>
  <li>
    <button
      style="float: right;"
      on:click={()=>settingsDialog.showModal()}>Settings</button>
  </li>
</menu>
