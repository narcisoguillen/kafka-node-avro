let Settings = {};

Settings.read = function(settings){

  if(!settings.kafka){ throw new Error('Missing Kafka Settings'); }
  if(!settings.schema){ throw new Error('Missing Schema Settings'); }
  if(!settings.schema.registry){ throw new Error('Missing Schema Registry on Settings'); }

  if(settings.schema.topics && !Array.isArray(settings.schema.topics)){
    throw new Error('Schema topics need to be en array');
  }

  Settings = Object.assign(Settings, settings);
};

module.exports = Settings;
