<script lang="ts">
  import 'jsondiffpatch/formatters/styles/html.css'
  import 'jsondiffpatch/formatters/styles/annotated.css'
  
  import * as htmlFormatter from 'jsondiffpatch/formatters/html'
  import { diff } from 'jsondiffpatch'
  
  export let transaction: any = null

  let latestProposals: { [key: string]: any } = {}
  async function getProposals() {
    function processProposal(p: any, ptype: string) {
      console.log('got:', ptype, p)
      const marketId = p?.terms?.updateMarket?.marketId
      const existingTimestamp = latestProposals[marketId]?.timestamp || 0
      const timestamp = p?.terms?.enactmentTimestamp
      const proposal = p?.terms?.newMarket || p?.terms?.updateMarket
      if (marketId && timestamp > existingTimestamp) latestProposals[marketId] = { 
        timestamp, 
        changes: proposal.changes
      }
    }
  
    const allUpdateMarketProposals = await (await fetch('https://api.vega.community/api/v2/governances?proposalType=TYPE_UPDATE_MARKET&proposalState=STATE_ENACTED')).json()
    const allNewMarketProposals = await (await fetch('https://api.vega.community/api/v2/governances?proposalType=TYPE_NEW_MARKET&proposalState=STATE_ENACTED')).json()

    for (let newMarket of allNewMarketProposals?.connection?.edges) {
      processProposal(newMarket?.node?.proposal, 'NEW')  
    }
    
    for (let proposal of allUpdateMarketProposals?.connection?.edges) {
      if (proposal?.node?.proposalType === 'TYPE_BATCH' && proposal?.node?.proposals.length > 0) {
        for (let batchProposal of proposal?.node?.proposals) {
          processProposal(batchProposal, 'BATCH_UPDATE')
        }
      }
      else if (proposal?.node?.proposalType === 'TYPE_SINGLE_OR_UNSPECIFIED') {
        processProposal(proposal?.node?.proposal, 'SINGLE_UPDATE')
      }
      else {
        console.log('error: processing market update proposals, unknown type or empty batch', proposal)
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

{#each diffs as diff}
  {#if latestProposals[diff.id]}
  <div>
    <h2>{diff.code} <span style="font-size: 60%;font-weight: normal; font-family: monospace;">{diff.id}</span></h2>
    <div class="content">
      {@html diff.html}
    </div>
  </div>
  {/if}
{:else}
  <div>
  {#if transaction?.batchProposalSubmission || transaction?.proposalSubmission}
    <p>Building diffs...</p>
  {:else}
    <p>No proposals found to diff, or maybe some sort of error.</p>
  {/if}
  </div>
{/each}

<style>
  h2 {
    margin-bottom: 1rem;
  }
</style>
