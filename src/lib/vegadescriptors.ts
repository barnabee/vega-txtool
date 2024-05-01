/**
* Return descriptive strings for various Vega IDs
*/

export const entities: { [key: string]: string } = {}

setTimeout(async () =>{

  // Asset symbols by ID
  const resp = await (await fetch('https://api.vega.community/api/v2/assets')).json()
  for (let edge of resp.assets.edges) {
    entities[edge?.node?.id.toLowerCase()] = edge?.node?.details?.symbol
  }
}, 0) 
