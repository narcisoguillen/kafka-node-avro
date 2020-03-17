const kafkaNodeAvro = { };

kafkaNodeAvro.use = function(plugin){
  (kafkaNodeAvro.core) || (kafkaNodeAvro.core = require('./lib'));
  plugin(kafkaNodeAvro.core);
  return kafkaNodeAvro;
};

kafkaNodeAvro.init = async function(settings){
  (kafkaNodeAvro.core) || (kafkaNodeAvro.core = require('./lib'));
  kafkaNodeAvro.core.Settings.read(settings);
  kafkaNodeAvro.core.Registry.init();

  let alive              = await kafkaNodeAvro.core.Registry.alive();
  kafkaNodeAvro.client   = await kafkaNodeAvro.core.Client.connect();
  kafkaNodeAvro.producer = new kafkaNodeAvro.core.Producer();

  await kafkaNodeAvro.core.SchemaPool.addList(kafkaNodeAvro.core.Settings.schema.topics);

  return kafkaNodeAvro.core.Mechanisms;
};

module.exports = kafkaNodeAvro;
