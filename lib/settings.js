let Settings = {
  alive : {},

  schema : {
    registry  : null,
    options   : {},
    endpoints : {
      byId        : 'schemas/ids/{{id}}',
      allVersions : 'subjects/{{name}}-value/versions',
      byVersion   : 'subjects/{{name}}-value/versions/{{version}}'
    }
  }

};

Settings.read = function(settings){
  if(!settings.kafka){ throw new Error('Missing Kafka Settings'); }
  if(!settings.schema){ throw new Error('Missing Schema Settings'); }
  if(!settings.schema.registry){ throw new Error('Missing Schema Registry on Settings'); }
  if(settings.schema.options && !settings.schema.options instanceof Object){ throw new Error('Schema Registry Options must be an Object'); }
  if(settings.schema.topics && !Array.isArray(settings.schema.topics)){ throw new Error('Schema topics need to be en array'); }
  if(settings.alive && !settings.alive instanceof Object){ throw new Error('Alive settings must be an Object'); }

  Settings.kafka = settings.kafka;
  Settings.schema.registry = settings.schema.registry;
  Settings.schema.options  = settings.schema.options;

  if(settings.schema.topics){
    Settings.schema.topics = settings.schema.topics;
  }

  if(settings.schema.endpoints){
    Settings.schema.endpoints = Object.assign(Settings.schema.endpoints, settings.schema.endpoints);
  }

  if(settings.alive){
    Settings.alive = settings.alive;
  }
};

module.exports = Settings;
