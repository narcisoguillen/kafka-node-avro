const { HighLevelProducer } = require('kafka-node');

let Producer = {};

Producer.connect = function(client){
  return new Promise(function(resolve, reject){

    let producer   = new HighLevelProducer(client);
    Producer.send  = producer.send.bind(producer);  // wire send
    Producer.close = producer.close.bind(producer); // wire close

    process.nextTick(function(){
      if(producer.ready){ return resolve(producer); }
      producer.on('ready', ready => { return resolve(producer); });
    });

    producer.on('error', reject);
  });
};

module.exports = Producer;
