<script lang="ts">
  import 'jsondiffpatch/formatters/styles/html.css'
  import 'jsondiffpatch/formatters/styles/annotated.css'
  
  import * as htmlFormatter from 'jsondiffpatch/formatters/html'
  import { diff } from 'jsondiffpatch'
  
  export let transaction: any = null

  let latestProposals: { [key: string]: any } = {}
  async function getProposals() {
    const allUpdateMarketProposals = await (await fetch('https://api.vega.community/api/v2/governances?proposalType=TYPE_UPDATE_MARKET&proposalState=STATE_ENACTED')).json()
    const allNewMarketProposals = await (await fetch('https://api.vega.community/api/v2/governances?proposalType=TYPE_NEW_MARKET&proposalState=STATE_ENACTED')).json()

    for (let newMarket of allNewMarketProposals?.connection?.edges) {
      const marketId = newMarket?.node?.proposal?.id
      const timestamp = newMarket?.node?.proposal?.terms?.enactmentTimestamp
      if (marketId) latestProposals[marketId] = { 
        timestamp, 
        changes: newMarket?.node?.proposal?.terms?.newMarket?.changes
      }
    }
    
    for (let updateMarket of allUpdateMarketProposals?.connection?.edges) {
      const marketId = updateMarket?.node?.proposal?.terms?.updateMarket?.marketId
      const existingTimestamp = latestProposals[marketId]?.timestamp || 0
      const timestamp = updateMarket?.node?.proposal?.terms?.enactmentTimestamp
      if (marketId && timestamp > existingTimestamp) latestProposals[marketId] = { 
        timestamp, 
        changes: updateMarket?.node?.proposal?.terms?.updateMarket?.changes
      }
    }
  }
  getProposals()
  
  function collectChanges(tx: any) {
    const marketChanges: any[] = []
    if (tx?.batchProposalSubmission?.terms?.changes?.length > 0) {
      for (let change of transaction?.batchProposalSubmission?.terms?.changes) {
        if (change?.updateMarket) marketChanges.push(change?.updateMarket)
      }
    } 
    else if (tx?.proposalSubmission?.terms?.updateMarket?.changes) {
      marketChanges.push(tx?.proposalSubmission?.terms?.updateMarket)
    }
    return marketChanges
  }

  $: marketChanges = collectChanges(transaction).filter(c => !!latestProposals[c?.marketId])
  $: diffs = marketChanges?.map(changes => ({ 
    id: changes?.marketId,
    code: changes.changes?.instrument?.code,
    html: htmlFormatter.format(diff(latestProposals[changes?.marketId]?.changes, changes.changes))
  })) || []
</script>

{#if diffs.length === 0}
  <div><p>Building diffs...</p></div>
{/if}
{#each diffs as diff}
  {#if latestProposals[diff.id]}
  <div>
    <h2>{diff.code} <span style="font-size: 60%;font-weight: normal; font-family: monospace;">{diff.id}</span></h2>
    <div class="content">
      {@html diff.html}
    </div>
  </div>
  {/if}
{/each}

<style>
  h2 {
    margin-bottom: 1rem;
  }
</style>
