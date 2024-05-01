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

export function markCheckpointClean(): void {
  lastCheckpoint = '#' + btoa(stateValue || '')
}

export function saveCheckpointIfDirty(): void {
  if (lastCheckpoint === null) {
    markCheckpointClean()
  }
  else {
    const currentCheckpoint = '#' + btoa(stateValue || '')
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

window.onload = () => {
  markCheckpointClean()
  resetCheckpointTimeout()
}

window.onhashchange = () => {
  stateValue = location.hash.slice(1) == '' ? '' : atob(location.hash.slice(1))
  markCheckpointClean()
  resetCheckpointTimeout()
  try {
    stateChangedHandler(stateValue)
  }
  catch(e: any) {
    console.log('error in state change handler:', e)
  }
}
