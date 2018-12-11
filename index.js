const Settings   = require('./lib/settings');
const Registry   = require('./lib/registry');
const Client     = require('./lib/client');
const Producer   = require('./lib/producer');
const SchemaPool = require('./lib/schemaPool');
const _          = require('underscore');

module.exports.init = function(settings){
  return new Promise(function(resolve, reject){
    Settings.read(settings);
    Registry.init();

    Registry.alive().then( alive => {
      let length = Settings.schema.topics ? Settings.schema.topics.length : 1;
      let done   = _.after(length, function(){ return resolve(require('./mechanisms')); });
      Client.connect().then( client => {
        Producer.connect(client).then( producer => {
          if(!Settings.schema.topics){ return done(); }
          Settings.schema.topics.forEach( topic => {
            SchemaPool.add(topic).then(done, reject);
          });
        }, reject);
      }, reject);
    }, reject);
  });
};
