const Consumer = require('./consumer');
const {after}  = require('./utils');

const Pool = {
  items : {}
};

/*
 * Add
 * */
Pool.add = function(topics, options){
  let id = JSON.stringify({ t : topics, op : options});
  Pool.items[id] || (Pool.items[id] = new Consumer(topics, options));
  return Pool.items[id];
};

/*
 * Flush
 * */
Pool.flush = function(done){
  done || (done = function(){});

  let consumersList = [];

  // Collect
  for(consumersItem in Pool.items){
    consumersList.push(consumersItem);
  }

  // nothing to close
  if(!consumersList.length){ return done(); }

  /* close all */
  let next = after(consumersList.length, done);

  consumersList.forEach( consumersItem => {
    let id       = Object.keys(consumersItem)[0];
    let consumer = consumersItem[id];

    consumer.close(next);
  });
};

module.exports = Pool;
