const Settings   = require('./lib/settings');
const Registry   = require('./lib/registry');
const Client     = require('./lib/client');
const Producer   = require('./lib/producer');
const SchemaPool = require('./lib/schemaPool');
const Mechanisms = require('./mechanisms');

module.exports.init = async function(settings){
  Settings.read(settings);
  Registry.init();

  let alive    = await Registry.alive();
  let client   = await Client.connect();
  let producer = await Producer.connect(client);

  await SchemaPool.addList(Settings.schema.topics);

  return Mechanisms;
};
