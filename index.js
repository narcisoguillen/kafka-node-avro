const Settings   = require('./lib/settings');
const Registry   = require('./lib/registry');
const Client     = require('./lib/client');
const Producer   = require('./lib/producer');
const SchemaPool = require('./lib/schemaPool');

module.exports.init = function(settings){
  return new Promise(function(resolve, reject){
    Settings.read(settings);
    Registry.init();

    Registry.alive().then( alive => {
      let length = Settings.schema.topics ? Settings.schema.topics.length : 1;
      let done   = after(length, function(){ return resolve(require('./mechanisms')); });
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

function after(times, func) {
  return function() { if (--times < 1) { return func.apply(this, arguments); } };
};
