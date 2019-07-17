const Schema  = require('./schema');
const {after} = require('./utils');

const Pool = {
  items : {},
  busy  : {}
};

/*
 * Add List
 * */
Pool.addList = function(list){
  return new Promise(function(resolve, reject){
    if(!list || !list.length){ return resolve(false); }
    let done = after(list.length, function(){ return resolve(true); });

    list.forEach( topic => {
      Pool.add(topic).then(done, reject);
    });
  });
};

/*
 * Add
 * */
Pool.add = function(topic){
  return new Promise(function(resolve, reject){
    let key = JSON.stringify(topic);

    // Load busy pool
    if(Pool.busy[key]){ return Pool.busy[key].push({resolve, reject}); }
    Pool.busy[key] = [{resolve, reject}];

    let schema = new Schema(topic);

    // Flush busy pool
    schema.fetch().then( fetchedSchema => {
      Pool.busy[key].forEach( waiting => { waiting.resolve(fetchedSchema); });
      delete Pool.busy[key];   // Delete busy pool
      Pool.set(fetchedSchema); // Set schema on pool
    }, error => {
      Pool.busy[key].forEach( waiting => { waiting.reject(error); });
      delete Pool.busy[key]; // Delete busy pool
    });
  });
};

/*
 * Setter
 * */
Pool.set = function(schema){
  Pool.items[schema.id] = schema;
  if(schema.name){ Pool.items[schema.name] = schema; }
  return schema;
};

/*
 * Get by Id
 * */
Pool.getById = function(id) {
  return new Promise(function(resolve, reject){
    let schema = Pool.items[id];
    if(schema){ return resolve(schema); }
    Pool.add({id}).then(resolve, reject);
  });
};

/*
 * Get by Name
 * */
Pool.getByName = function(name) {
  return new Promise(function(resolve, reject){
    let schema = Pool.items[name];
    if(schema){ return resolve(schema); }
    Pool.add({ name }).then(resolve, reject);
  });
};

/*
 * Flush
 * */
Pool.flush = function(done){
  done || (done = function(){});
  Pool.items = {}; done();
};

module.exports = Pool;
