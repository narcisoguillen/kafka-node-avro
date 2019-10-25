const Producer = require('../lib/producer');

module.exports = function(options, customPartitioner){
  return new Producer(options, customPartitioner);
};
