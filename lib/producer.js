const { HighLevelProducer } = require('kafka-node');
const EventEmitter          = require('events');
const kafkaNodeAvro         = require('../index');
const Simple                = require('./simple');
const SchemaPool            = require('./schemaPool');

module.exports = class Producer extends EventEmitter{
  constructor(options, customPartitioner){
    super();
    this.producer = new HighLevelProducer(kafkaNodeAvro.client, options, customPartitioner);

    this.producer.on('ready', this.emit.bind(this, 'ready'));
    this.producer.on('error', this.emit.bind(this, 'error'));
    this.close = this.producer.close.bind(this.producer); // wire close
  }

  send(data){
    return new Promise( (resolve, reject) => {
      if(data.simple){
        this.producer.send(Simple.parse(data), (error, success) =>{
          if(error){ return reject(error); }
          return resolve(success);
        });
      }else {
        SchemaPool.getByName(data.topic).then( schema => {
          schema.parse(data).then( payload => {
            this.producer.send(payload, (error, success) =>{
              if(error){ return reject(error); }
              return resolve(success);
            });
          }, reject);
        }, reject);
      }
    });
  }
}
