const kafkaNodeAvro = require('../index');

module.exports = function(data){
  return kafkaNodeAvro.producer.send(data);
};
