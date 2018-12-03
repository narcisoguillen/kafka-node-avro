const Settings   = require('./lib/settings');
const Client     = require('./lib/client');
const Producer   = require('./lib/producer');
const SchemaPool = require('./lib/schemaPool');

module.exports = async function(settings){
  Settings.read(settings);

  await Producer.connect(await Client.connect());

  if(Settings.schema.topics){
    Settings.schema.topics.forEach(await SchemaPool.add);
  }

  return require('./mechanisms');
};
