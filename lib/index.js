try{
  const kafkaNode = require('kafka-node');
}catch(error){
  throw new Error('Peer dependency missing, Make sure to install kafka-node < npm install kafka-node >');
}

module.exports = {
  Settings   : require('./settings'),
  Registry   : require('./registry'),
  Client     : require('./client'),
  Consumer   : require('./consumer'),
  Producer   : require('./producer'),
  Schema     : require('./schema'),
  SchemaPool : require('./schemaPool'),
  Mechanisms : require('../mechanisms'),
  Simple     : require('./simple')
};
