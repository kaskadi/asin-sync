module.exports.handler = async (event) => {
  const searchAllProduct = require('./helpers/search-all-products.js')
  const getAsinsMap = require('./helpers/get-asins-map.js')
  const updateAsins = require('./helpers/update-asins.js')
  return await searchAllProduct()
  .then(esData => getAsinsMap(esData.body.hits.hits.map(product => product._id)))
  .then(asinsMap => updateAsins(asinsMap))
}