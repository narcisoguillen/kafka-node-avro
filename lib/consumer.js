const {ConsumerGroup} = require('kafka-node');
const EventEmitter    = require('events');
const Settings        = require('./settings');
const SchemaPool      = require('./schemaPool');
const Simple          = require('./simple');

module.exports = class Consumer extends EventEmitter {

  constructor(topics, options){
    super();
    this.isSimple = options.simple; delete options.simple;
    this.topics   = topics;

    this.consumer = new ConsumerGroup(Object.assign({
      kafkaHost : Settings.kafka.kafkaHost,
      encoding  : 'buffer'
    }, options) , topics);

    this.consumer.on('error'   , this.emit.bind(this, 'error'));
    this.consumer.on('message' , this.parse.bind(this));
  }

  parse(message){
    let schemaId   = message.value.readUInt32BE(1);
    let schemaName = message.topic;

    if(message.key){ message.key = message.key.toString(); }

    if(this.isSimple){
      message.value = Simple.decode(message.value);
      return this.emit('message', message);
    }

    SchemaPool.getById(schemaId).then( schema => {
      message.value = schema.decode(message.value);
      this.emit('message', message);
    }, error => { this.emit('error', error); });
  }
};
