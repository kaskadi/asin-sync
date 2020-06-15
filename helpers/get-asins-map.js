module.exports = async (eans) => {
  let asinsMap = {}
  for (let i=0; i < eans.length + 4; i+=5) {
    // getMatchingProductForId from the products section of MWS API accepts up to 5 products ID per request
    asinsMap = {
      ...asinsMap,
      ...await getPartialAsinsMap(eans.slice(i, i + 5))
    }
  }
  return asinsMap
}

async function getPartialAsinsMap(eans) {
  const marketplaces = require('../marketplaces.js')
  const MWS = require('mws-client')({
    AWSAccessKeyId: process.env.ACCESS_KEY,
    SellerId: process.env.SELLER_ID,
    MWSAuthToken: process.env.MWS_AUTH_TOKEN
  })
  let partialAsinsMap = Object.fromEntries(eans.map(ean => [ean, {}]))
  for (const marketplace in marketplaces) {
    const reqOpts = {
      _marketplace: marketplace,
      IdType: 'EAN',
      ...Object.fromEntries(eans.map((ean, i) => [`IdList.Id.${i + 1}`, ean])) // mws-client doesn't support array as parameter as of 1.0.0
    }
    await new Promise((resolve, reject) => setTimeout(resolve, 1000)) // throttling
    const mwsData = await MWS.products.getMatchingProductForId(reqOpts)
    const results = [mwsData.body.GetMatchingProductForIdResponse.GetMatchingProductForIdResult].flat(1) // when 1 result is returned by MWS, they return a single object instead of an Array...
    results.forEach(productResult => {
      partialAsinsMap[productResult.Id][`amz_${marketplace.toLowerCase()}`] = productResult.status === 'Success' ? [productResult.Products.Product].flat(1).map(product => product.Identifiers.MarketplaceASIN.ASIN) : []
    })
  }
  return partialAsinsMap
}