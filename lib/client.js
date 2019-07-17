const kafkaNode = require('kafka-node');
const Settings  = require('./settings');

const Client = {};

Client.connect = function(){
  return new Promise(function(resolve, reject){
    let KafkaClient = new kafkaNode.KafkaClient(Settings.kafka);

    Client.close = KafkaClient.close.bind(KafkaClient); // wire close

    KafkaClient.on('ready', ready => { return resolve(KafkaClient); });
    KafkaClient.on('error', reject);
  });
};

module.exports = Client;
