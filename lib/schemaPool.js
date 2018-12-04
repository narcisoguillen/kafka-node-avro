const Schema = require('./schema');
const _      = require('underscore');

const Pool = {
};

/*
 * Add
 * */
Pool.add = function(topic){
  return new Promise(function(resolve, reject){
    let schema = new Schema(topic);
    schema.fetch().then( fetchedSchema => {
      return resolve(Pool.set(fetchedSchema));
    } , reject);
  });
};

/*
 * Setter
 * */
Pool.set = function(schema){
  Pool[schema.id] = schema;
  if(schema.name){ Pool[schema.name] = schema; }
  return schema;
};

/*
 * Get by Id
 * */
Pool.getById = function(id) {
  return new Promise(function(resolve, reject){
    let schema = Pool[id];
    if(schema){ return resolve(schema); }
    Pool.add({id}).then(resolve, reject);
  });
};

/*
 * Get by Name
 * */
Pool.getByName = function(name) {
  return new Promise(function(resolve, reject){
    let schema = Pool[name];
    if(schema){ return resolve(schema); }
    Pool.add({ name }).then(resolve, reject);
  });
};

module.exports = Pool;
