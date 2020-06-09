module.exports.handler = async (event) => {
  const es = require('aws-es-client')({
    id: process.env.ES_ID,
    token: process.env.ES_SECRET,
    url: process.env.ES_ENDPOINT
  })
  const esData = await es.search({
    index: 'products',
    body: {
      from: 0,
      size: 10000,
      query: {
        match_all: {}
      }
    }
  })
  const eans = esData.body.hits.hits.map(product => product._id)
  // await es.bulk({
  //   refresh: true,
  //   body: Object.entries(await getAsinsMap(eans)).flatMap(entry => [{ update: { _index: 'products', _id: entry[0] } }, { doc: { asin: entry[1] } }])
  // })
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ message: 'ASINs synchronized with Amazon!' })
  }
}

async function getAsinsMap(eans) {
  let asinsMap = {}
  for (let i=0; i < eans.length + 4; i+=5) {
    asinsMap = {
      ...asinsMap,
      ...await getPartialAsinsMap(eans.slice(i, i + 5))
    }
  }
  return asinsMap
}

async function getPartialAsinsMap(eans) {
  const marketplaces = require('./marketplaces.js')
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
      ...Object.fromEntries(eans.map((ean, i) => [`IdList.Id.${i + 1}`, ean]))
    }
    await new Promise((resolve, reject) => setTimeout(resolve, 1000)) // throttling, 5 items per second
    const mwsData = await MWS.products.getMatchingProductForId(reqOpts)
    const results = [mwsData.body.GetMatchingProductForIdResponse.GetMatchingProductForIdResult].flat(1) // when 1 result is returned by MWS, they return a single object instead of an Array...
    results.forEach(productResult => {
      partialAsinsMap[productResult.Id][marketplace] = productResult.status === 'Success' ? [productResult.Products.Product].flat(1).map(product => product.Identifiers.MarketplaceASIN.ASIN) : []
    })
  }
  return partialAsinsMap
}