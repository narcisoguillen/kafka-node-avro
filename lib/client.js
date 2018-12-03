const kafkaNode = require('kafka-node');
const Settings  = require('./settings');

module.exports.connect = function(){
  return new Promise(function(resolve, reject){
    let client = new kafkaNode.KafkaClient({
      kafkaHost        : Settings.brokers,
      connectTimeout   : Settings.connectTimeout   || 10000,
      requestTimeout   : Settings.requestTimeout   || 30000,
      autoConnect      : Settings.autoConnect      || true ,
      maxAsyncRequests : Settings.maxAsyncRequests || 10   ,
      sslOptions       : Settings.sslOptions       || null ,
      sasl             : Settings.sasl             || null
    });
    client.on('ready', ready => { return resolve(client); });
    client.on('error', reject);
  });
};
