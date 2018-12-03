const Consumer = require('../lib/consumer');

module.exports = function(topics, options){
  (options) || (options = {});
  return new Consumer(topics, options);
};
