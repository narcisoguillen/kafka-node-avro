const kafkaNodeAvro = {};

kafkaNodeAvro.init = async function(settings){
  kafkaNodeAvro.core = require('./lib');

  kafkaNodeAvro.core.Settings.read(settings);
  kafkaNodeAvro.core.Registry.init();

  let alive              = await kafkaNodeAvro.core.Registry.alive(settings.alive);
  kafkaNodeAvro.client   = await kafkaNodeAvro.core.Client.connect();
  kafkaNodeAvro.producer = new kafkaNodeAvro.core.Producer();

  await kafkaNodeAvro.core.SchemaPool.addList(kafkaNodeAvro.core.Settings.schema.topics);

  return kafkaNodeAvro.core.Mechanisms;
};

module.exports = kafkaNodeAvro;
