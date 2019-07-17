const consumerPool = require('../lib/consumerPool');

module.exports = function(topics, options){
  (options) || (options = {});
  return consumerPool.add(topics, options);
};
