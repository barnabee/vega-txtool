/**
* Return descriptive strings for various Vega IDs
*/

export const entities: { [key: string]: string } = JSON.parse(localStorage.entityDescriptors || '{}')

setTimeout(async () =>{
  let resp: any

  // Proposals
  resp = await (await fetch('https://api.vega.community/api/v2/governances')).json()
  for (let edge of resp.connection.edges) {
    const key: string | null = edge?.node?.proposal?.id.toLowerCase() 
    const desc: string | null = edge?.node?.proposal?.rationale?.title
    if (key !== null && desc !== null) entities[key] = desc
  }
  
  // Asset symbols by ID
  resp = await (await fetch('https://api.vega.community/api/v2/assets')).json()
  for (let edge of resp.assets.edges) {
    const key: string | null = edge?.node?.id.toLowerCase() 
    const desc: string | null = edge?.node?.details?.symbol
    if (key !== null && desc !== null) entities[key] = desc
  }

  // Markets
  resp = await (await fetch('https://api.vega.community/api/v2/markets')).json()
  for (let edge of resp.markets.edges) {
    const key: string | null = edge?.node?.id.toLowerCase() 
    const desc: string | null = edge?.node?.tradableInstrument?.instrument?.code
    if (key !== null && desc !== null) entities[key] = desc
  }
  
  localStorage.setItem('entityDescriptors', JSON.stringify(entities))
}, 0) 
