const Schema = require('./schema');
const _      = require('underscore');

const Pool = {};

/*
 * Add
 * */
Pool.add = function(topic){
  return new Promise(function(resolve, reject){
    let schema = new Schema(topic);
    schema.fetch().then( registry => {
      return resolve(Pool.set(schema));
    } , reject);
  });
};

/*
 * Setter
 * */
Pool.set = function(schema){
  if(!schema.name){ throw new Error('Can not add Schema : Missing Schema name'); }
  if(!schema.id){ throw new Error('Can not add Schema : Missing Schema id'); }

  (Pool[schema.name]) || (Pool[schema.name] = {});

  Pool[schema.name][schema.id] = schema;
  Pool[schema.name].latest     = schema;
  return schema;
};

/*
 * Getter
 * */
Pool.get = function(topicName, id) {
  return new Promise(function(resolve, reject){
    let schemas = Pool[topicName];
    if(schemas){ return resolve(schemas.latest); }
    Pool.add({ name : topicName }).then(resolve, reject);
  });
};

module.exports = Pool;
