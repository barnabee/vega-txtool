/**
* Utilities for working with JSON
*/

// Regex to get line and column numbers from the error string returned by JSON.parse
// Seems to work ok on Firefox and Brave (Chrome) at least
const jsonParseErrMatcher = /.*[^A-Za-z\d]line (\d+) column (\d+)[^A-Za-z\d].*/


/** Serialise an object containing BigNumbers to JSON string (credit: Matt/ChatGPT) */
export function stringifyWithBigNumbers(obj: any, n = 2): string {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value  // return as is for other types
  }, n)
}

export type JsonParseError = {
  msg: string,
  line: number | null,
  col: number | null
}

/** JSON.parse wrapper that returns a default value plus error context on parse failure */
export function parseOr(
    maybeJson: string,
    defaultValue: any,
    contextBefore: number = 4,
    contextAfter: number = 4): [any, JsonErrorInfo | null] {
  try {
    return [maybeJson && maybeJson !== '' ? JSON.parse(maybeJson) : null, null]
  }
  catch (e: any) {
    const errorInfo: JsonParseError = { msg: e.toString(), line: null, col: null }
    const match = e.toString().match(jsonParseErrMatcher)
    if (match !== null) {
      const [_, errorLine, errorCol] = match
      errorInfo.line = parseInt(errorLine)
      errorInfo.col = parseInt(errorCol)
    }
    return [defaultValue, jsonErrorHelp(maybeJson, errorInfo, contextBefore, contextAfter)]
  }
}

export type JsonErrorInfo = {
  linesBefore: string | null,
  errorLine: string | null,
  linesAfter: string | null,
  errorMessage: string
}

/** Turn JSON parse error details + input into some useful context data to print alongside the error */
export function jsonErrorHelp(
    input: string,
    error: any,
    contextBefore = 4,
    contextAfter = 4): JsonErrorInfo | null {
  if (!error) return null
  if (!error.line) return {
    linesBefore: null,
    errorLine: null,
    linesAfter: null,
    errorMessage: error.msg
  }
  const lines = input.split('\n')
  const linesBefore: string[] = lines.slice(Math.max(error.line - 1 - contextBefore, 0), error.line - 1)
  const line: string[] = lines.slice(error.line - 1, error.line)
  const linesAfter: string[] = lines.slice(error.line, Math.min(error.line + contextAfter, lines.length))
  const message: string = ' '.repeat(error.col - 1) + '^ ' + error.msg
  return {
    linesBefore: linesBefore.join('\n'), 
    errorLine: line.join('\n'), 
    linesAfter: linesAfter.join('\n'),
    errorMessage: message
  }
}


/** Recursively remove values considered empty (defaults to undefined or null) from an object */
export function removeEmpty(
    obj: any, 
    empties: any[] = [undefined, null], 
    keepEmptyCollections: boolean = true): any {
  if (obj === undefined || empties.some(empty => obj === empty)) {
    return undefined
  }
  else if (Array.isArray(obj)) {
    const filtered = obj.map(item => removeEmpty(item)).filter(item => item !== undefined)
    return keepEmptyCollections || filtered.length > 0 ? filtered : undefined
  }
  else if ('object' === typeof obj) {
    for (let [k, v] of Object.entries(obj)) {
      if (removeEmpty(v) === undefined) {
        delete obj[k]
      }
    }
    return keepEmptyCollections || Object.keys(obj).length > 0 ? obj : undefined
  }
  return obj
}
