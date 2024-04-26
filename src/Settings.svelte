<script lang="ts" context="module">
  export type SettingsData = {
    walletName: string
    publicKey: string
  }
</script>

<script lang="ts">
  import TabBar from "./TabBar.svelte";

  export let settingsDialog: HTMLDialogElement
  let settingsTab = 'user'

  export let settings: SettingsData = { 
    walletName: 'WALLET_NAME', 
    publicKey: 'PUBLIC_KEY' 
  }
  let walletName: string
  let publicKey: string
  
  function resetSettings() { 
    ({ walletName, publicKey } = settings)
  }
  resetSettings()

  export let saveSettings: (settings: SettingsData) => void

  function saveAndClose() {
    saveSettings({
      walletName,
      publicKey
    })
    settingsDialog.close()
  }

  function cancelAndClose() {
    resetSettings()
    settingsDialog.close()
  }
</script>

<dialog bind:this={settingsDialog}>
  <header>
    <h2>Settings</h2>
  </header>
  <section>
    <TabBar tabs={{ user: {name: 'User Settings'}, ui: {name: 'UI Config'} }} bind:selected={settingsTab} />
    <div class="content">
      {#if settingsTab === 'user'}
        <h3>Variables for wallet command generation</h3>
        <p><label>Wallet name<input type="text" bind:value={walletName} /></label></p>
        <p><label>Public key<input type="text" bind:value={publicKey}  /></label></p>
      {:else if settingsTab === 'ui'}
        <p>WIP</p>
      {/if}
    </div>
  </section>
  <footer>
    <button on:click={cancelAndClose}>Cancel</button>
    <button style="float: right;" on:click={saveAndClose}><strong>Save Settings</strong></button>
  </footer>
</dialog>

<style>
  dialog {
    min-width: 100%;
    @media (min-width: 641px) {
      min-width: 35rem;
    }
    min-height: 20rem;
    resize: horizontal;
  }
</style>
