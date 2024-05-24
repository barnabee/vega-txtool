<script lang="ts">
  import 'jsondiffpatch/formatters/styles/html.css'
  import 'jsondiffpatch/formatters/styles/annotated.css'
  
  import * as htmlFormatter from 'jsondiffpatch/formatters/html'
  import { diff } from 'jsondiffpatch'
  
  export let transaction: any = null

  let latestProposals: { [key: string]: any } = {}
  async function getProposals() {
    function processProposal(proposal: any) {
      const proposalParts: any[] = proposal?.node?.proposalType === 'TYPE_BATCH'
        ? proposal?.node?.proposals
        : [proposal?.node?.proposal]
      for (let p of proposalParts) {
        const marketId = p?.terms?.updateMarket?.marketId || (p?.terms?.newMarket && p?.id)
        const existingTimestamp = latestProposals[marketId]?.timestamp || 0
        const timestamp = p?.terms?.enactmentTimestamp
        const changes = (p?.terms?.newMarket || p?.terms?.updateMarket)?.changes
        if (marketId && timestamp > existingTimestamp) {
          latestProposals[marketId] = { timestamp, changes }
        }
        else {
          console.log(p)
        }
      }
    }
  
    const allNewMarketProposals = await (await fetch('https://api.vega.community/api/v2/governances?proposalType=TYPE_NEW_MARKET&proposalState=STATE_ENACTED')).json()

    for (let proposal of allNewMarketProposals?.connection?.edges) {
      processProposal(proposal)
    }
    
    const allUpdateMarketProposals = await (await fetch('https://api.vega.community/api/v2/governances?proposalType=TYPE_UPDATE_MARKET&proposalState=STATE_ENACTED')).json()

    for (let proposal of allUpdateMarketProposals?.connection?.edges) {
      processProposal(proposal)
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
    <details>
    <summary>
    <h2>{diff.code} <span style="font-size: 60%;font-weight: normal; font-family: monospace;">{diff.id}</span></h2>
    </summary>
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
    display: inline-block;
    margin-bottom: 1rem;
  }
  summary {
    cursor: pointer;
    &::marker {
      font-size: 2rem;
    }
  }
</style>
