const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})

module.exports = async (asinsMap) => {
  await es.bulk({
    refresh: true,
    body: Object.entries(asinsMap).flatMap(entry => [{ update: { _index: 'products', _id: entry[0] } }, { doc: { asin: entry[1] } }])
  })
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ message: 'ASINs synchronized with Amazon!' })
  }
}