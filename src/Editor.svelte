<script lang="ts">
  import { createEventDispatcher } from "svelte"
  
  import CodeMirror from "svelte-codemirror-editor"
  import { json } from "@codemirror/lang-json"
  import { oneDark } from "@codemirror/theme-one-dark"
  import { jsonSchema } from "codemirror-json-schema"

  export let schema: any
  export let value: string
  export let editorView

  const schemaValidator = jsonSchema(schema)
  const dispatch = createEventDispatcher()
</script>

<div class="transaction-editor">
  <CodeMirror 
    bind:value
    on:change={e=>dispatch('change', e)}
    lang={json()}
    theme={oneDark}
    on:ready={(e) => editorView = e.detail}
    extensions={[schemaValidator]} 
    styles={{
      "&":{
        height: "30rem",
        minHeight: "8rem",
        fontSize: "0.9rem",
        resize: "vertical",
        overflow: "hidden",
      },
      ".cm-tooltip-autocomplete > ul": {
        "& > li[aria-selected]": {
          color: "#ffffff",
          backgroundColor: "#3E4451",
        },
        "& > li": {
          color: "#abb2bf",
          backgroundColor: "#21252b",
        }
      }
    }} />
</div>

<style> 
  div {
    padding: 0;
  }
</style>
