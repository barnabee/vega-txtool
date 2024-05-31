/**
* Store state in URL hash, batch updates occurring close together in time
*/

let stateValue: string | null = null
let lastCheckpoint: any = null
let checkpointTimeout: number | null = null
let stateChangedHandler: (state: any) => void = () => {}


export function setState(newState: string): void {
  stateValue = newState
  resetCheckpointTimeout()
}

export function onStateChanged(cb: (state: any) => void) {
  stateChangedHandler = cb
}

export async function markCheckpointClean(): Promise<void> {
  if (stateValue === null) return
  lastCheckpoint = '#' + await compressCheckpoint(stateValue)
}

async function compressCheckpoint(checkpoint: string): Promise<string> {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const inputData = encoder.encode(checkpoint);

  // Create a CompressionStream and a writer
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(inputData);
  writer.close();

  // Read the compressed data from the stream
  const compressedData = await new Response(stream.readable).arrayBuffer();

  // Convert to base64
  const base64String = btoa(String.fromCharCode(...new Uint8Array(compressedData)));
  return base64String;
}

async function decompressCheckpoint(base64String: string): Promise<string> {
  // Convert base64 string back to Uint8Array
  const compressedData = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));

  // Create a DecompressionStream and a writer
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(compressedData);
  writer.close();

  // Read the decompressed data from the stream
  const decompressedData = await new Response(stream.readable).arrayBuffer();

  // Convert to string
  const decoder = new TextDecoder();
  const decompressedString = decoder.decode(decompressedData);
  return decompressedString;
}

export async function saveCheckpointIfDirty(): Promise<void> {
  if (lastCheckpoint === null) {
    markCheckpointClean()
  }
  else {
    if (stateValue === null) return
    const currentCheckpoint = '#' + await compressCheckpoint(stateValue);
    if (lastCheckpoint !== currentCheckpoint) {
      history.pushState(null, '', currentCheckpoint)
      markCheckpointClean()
    }
  }
  resetCheckpointTimeout()
}

export function resetCheckpointTimeout() {
  if (checkpointTimeout !== null) clearTimeout(checkpointTimeout)
  checkpointTimeout = setTimeout(saveCheckpointIfDirty, 1_000)
}

export async function readHashValue(): Promise<string> {
  return location.hash.slice(1) == '' ? '' : await decompressCheckpoint(location.hash.slice(1))
}

window.onload = () => {
  markCheckpointClean()
  resetCheckpointTimeout()
}

window.onhashchange = async () => {
  stateValue = await readHashValue()
  markCheckpointClean()
  resetCheckpointTimeout()
  try {
    stateChangedHandler(stateValue)
  }
  catch (e: any) {
    console.log('error in state change handler:', e)
  }
}
