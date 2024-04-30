<script lang="ts">
  import * as monaco from 'monaco-editor'
  import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
  
  // Import the workers in a production-safe way.
  // This is different than in Monaco's documentation for Vite,
  // but avoids a weird error ("Unexpected usage") at runtime
  import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
  import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
  import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
  import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
  import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

  import * as vegaTransactionSchema from '../vega-schema.json'

  self.MonacoEnvironment = {
    getWorker: function (_: string, label: string) {
      switch (label) {
        case 'json':
          return new jsonWorker()
        case 'css':
        case 'scss':
        case 'less':
          return new cssWorker()
        case 'html':
        case 'handlebars':
        case 'razor':
          return new htmlWorker()
        case 'typescript':
        case 'javascript':
          return new tsWorker()
        default:
          return new editorWorker()
      }
    }
  }

  let editorInstance: Monaco.editor.IStandaloneCodeEditor
  export let value = ''
  $: editorInstance?.getModel()?.setValue(value)
  
  const modelUri = monaco.Uri.parse('vega://transaction')
  const model = monaco.editor.createModel(value, 'json', modelUri)
  
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  	validate: true,
  	schemas: [
  		{
  			uri: modelUri.toString(),
  			fileMatch: [modelUri.toString()],
  			schema: Object.assign({}, vegaTransactionSchema),
  		},
  	],
  });
  
  function editor(editorContainer: HTMLElement) {
    editorInstance = monaco.editor.create(editorContainer, {
      theme: 'vs-dark',
      minimap: { enabled: false },
      automaticLayout: true,
      formatOnPaste: true,
      fontFamily: 'JetBrains Mono, monospace',
      model,
    })
    editorInstance.onDidChangeModelContent(() => {
      value = editorInstance.getValue()
    })
    return { 
      destroy() {
        monaco?.editor.getModels().forEach(model => model.dispose())
        editorInstance?.dispose()
      }
    }
  }

</script>

<div class="transaction-editor">
  <div use:editor />
</div>

<style>
  div.transaction-editor {
    padding: 0;
    width: 100%;
    height: 30rem;
    resize: vertical;
    overflow: hidden;
    & > div {
      height: 100%;
    }
  }
</style>
