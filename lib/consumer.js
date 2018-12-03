const {ConsumerGroup} = require('kafka-node');
const EventEmitter    = require('events');
const Settings        = require('./settings');
const SchemaPool      = require('./schemaPool');
const Simple          = require('./simple');
const _               = require('underscore');

module.exports = class Consumer extends EventEmitter {

  constructor(topics, options){
    super();
    this.isSimple = options.simple; delete options.simple;
    this.topics   = topics;
    this.consumer = new ConsumerGroup(_.extend({
      kafkaHost : Settings.brokers,
      encoding  : 'buffer'
    }, options), topics);

    this.consumer.on('error'   , this.emit.bind(this, 'error'));
    this.consumer.on('message' , this.parse.bind(this));
  }

  parse(message){
    let schemaId   = message.value.readUInt32BE(1);
    let schemaName = message.topic;

    message.key = message.key.toString();

    if(this.isSimple){
      message.value = Simple.decode(message.value);
      return this.emit('message', message);
    }

    SchemaPool.get(message.topic, schemaId).then( schema => {
      message.value = schema.decode(message.value);
      this.emit('message', message);
    }, this.emit.bind(this, 'error'));
  }
};
