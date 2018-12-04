const Producer   = require('../lib/producer');
const Simple     = require('../lib/simple');
const SchemaPool = require('../lib/schemaPool');

module.exports = function(data){
  return new Promise(function(resolve, reject){
    if(data.simple){ return send(Simple.parse(data)); }

    SchemaPool.getByName(data.topic).then( schema => {
      try{
        return send(schema.parse(data));
      }catch(error){
        return reject(`${data.topic} : ${error}`);
      }
    }, reject);

    function send(payload){
      Producer.send(payload, (error, success) => {
        if(error){ return reject(error); }
        return resolve(success);
      });
    }
  });
};
