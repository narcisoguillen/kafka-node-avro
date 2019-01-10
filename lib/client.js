const kafkaNode = require('kafka-node');
const Settings  = require('./settings');

module.exports.connect = function(){
  return new Promise(function(resolve, reject){

    this.client = new kafkaNode.KafkaClient(Object.assign({
      kafkaHost : Settings.brokers
    }, Settings.brokerSettings || {}));

    this.client.on('ready', ready => { return resolve(this.client); });
    this.client.on('error', reject);
  });
};
