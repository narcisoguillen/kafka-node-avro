module.exports.init = async function(settings){
  const core = require('./lib');

  core.Settings.read(settings);
  core.Registry.init();

  let alive    = await core.Registry.alive();
  let client   = await core.Client.connect();
  let producer = await core.Producer.connect(client);

  await core.SchemaPool.addList(core.Settings.schema.topics);

  return core.Mechanisms;
};
