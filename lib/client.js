const kafkaNode = require('kafka-node');
const Settings  = require('./settings');

module.exports.connect = function(){
  return new Promise(function(resolve, reject){

    let client = new kafkaNode.KafkaClient(Settings.kafka);

    client.on('ready', ready => { return resolve(client); });
    client.on('error', reject);
  });
};
