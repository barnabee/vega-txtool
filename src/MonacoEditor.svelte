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
  import { entities } from './lib/vegadescriptors'

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

  let editorInstance: Monaco.editor.IStandaloneCodeEditor | null = null
  export let value = ''
  $: editorInstance?.getModel()?.getValue() !== value && editorInstance?.getModel()?.setValue(value)
  
  const modelUri = monaco.Uri.parse('vega://transaction')
  const model = monaco.editor.createModel(value, 'json', modelUri)

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  	validate: true,
  	comments: 'ignore',
  	allowComments: true,
  	schemaValidation: 'error',
  	trailingCommas: 'error',
  	schemas: [
  		{
  			uri: modelUri.toString(),
  			fileMatch: [modelUri.toString()],
  			schema: Object.assign({}, vegaTransactionSchema),
  		},
  	],
  });

  function provideInlayHints(
      model: monaco.editor.ITextModel,
      range: monaco.IRange,
      _token: monaco.CancellationToken) {
    const matches = model.findMatches('"[a-zA-Z0-9]+"', range, true, false, null, true)
    const hints: monaco.languages.InlayHint[] = []
    for (let match of matches) {
      const matchText: string | null = (match.matches !== null && match.matches.length > 0)
          ? JSON.parse(match.matches[0]).toString().toLowerCase() 
          : null 
      if (matchText !== null && matchText in entities) {
        hints.push({
          kind: monaco.languages.InlayHintKind.Type,
          position: { column: match.range.startColumn, lineNumber: match.range.startLineNumber },
          label: entities[matchText],
          paddingRight: true,
        })
      }
    }
    return { hints, dispose() {} }
  }

  monaco.languages.registerInlayHintsProvider('json', { provideInlayHints })
  
  function editor(editorContainer: HTMLElement) {
    editorInstance = monaco.editor.create(editorContainer, {
      theme: 'vs-dark',
      minimap: { enabled: false },
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12,
      contextmenu: false,
      wordWrap: 'on',
      model,
    })
    editorInstance.onDidChangeModelContent(() => {
      if (editorInstance !== null) value = editorInstance.getValue()
    })
    return { 
      destroy() {
        monaco?.editor.getModels().forEach(model => model.dispose())
        editorInstance?.dispose()
        editorInstance = null
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
