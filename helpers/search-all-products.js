const es = require('aws-es-client')({
  id: process.env.ES_ID,
  token: process.env.ES_SECRET,
  url: process.env.ES_ENDPOINT
})

module.exports = async () => {
  let from = 0
  const size = 500
  const searchResult = await searchProducts(from, size)
  let dbData = searchResult.body.hits.hits
  while (from < searchResult.body.hits.total.value - size) {
    from += size
    dbData = dbData.concat((await searchProducts(from, size)).body.hits.hits)
  }
  return dbData
}
function searchProducts(from, size) {
  return es.search({
    index: 'products',
    from,
    size,
    body: {
      query: {
        match_all: {}
      }
    }
  })
}
