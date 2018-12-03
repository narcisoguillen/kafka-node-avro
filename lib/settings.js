let Settings = {};

Settings.read = function(settings){
  if(!settings.brokers){ throw new Error('Missing Brokers on Settings'); }                 // Broker MUST exist
  if(!settings.schema){ throw new Error('Missing Schema Settings'); }                      // Broker MUST exist
  if(!settings.schema.registry){ throw new Error('Missing Schema Registry on Settings'); } // Broker Registry Schema MUST exist

  if(settings.schema.topics && !Array.isArray(settings.schema.topics)){
    throw new Error('Schema topics need to be en array');
  }

  Settings = Object.assign(Settings, settings);
};

module.exports = Settings;
