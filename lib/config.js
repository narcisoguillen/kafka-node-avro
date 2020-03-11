const Registry = require('../lib/registry');

module.exports = function(config){
  if(!config instanceof Object){ throw new Error('Config must be an Object'); }

  // Overwrite default schema enspoints on registry class
  if(config.schema_endpoints instanceof Object){
    Object.assign(Registry.endpoints, config.schema_endpoints); // Overwrite
  }
};
