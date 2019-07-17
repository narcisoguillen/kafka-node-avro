const Producer     = require('../lib/producer');
const consumerPool = require('../lib/consumerPool');
const SchemaPool   = require('../lib/schemaPool');
const Client       = require('../lib/client');
const {after}      = require('../lib/utils');

module.exports = function(done){
  let next = after(4, done);

  consumerPool.flush(next);
  Producer.close(next);
  SchemaPool.flush(next);
  Client.close(next);
};
