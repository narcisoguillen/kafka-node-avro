const request  = require('request');
const Settings = require('./settings');

const Registry = {};

Registry.init = function(){
  Registry.host    = Settings.schema.registry;
  Registry.request = request.defaults({
    headers: {
      'Content-Type' : 'application/vnd.schemaregistry.v1+json'
    }
  });
};

Registry.GET = function(endpoint, callback){
  return Registry.request.get(`${Registry.host}/${endpoint}`, callback);
};

// Health check endpoint
Registry.alive = function(settings){
  const endpoint = settings && 'endpoint' in settings
    ? settings.endpoint
    : 'subjects';
    
  return new Promise(function(resolve, reject){
    Registry.GET(endpoint, (error, response, body) => {
      // failed
      if(error || response.statusCode >= 400){ return reject(`Unable to access registry ${Registry.host}`); }
      return resolve(body);
    });
  });
};

Registry.fetchVersions = function(topicName){
  return new Promise( (resolve, reject) => {
    Registry.GET(`subjects/${topicName}-value/versions`, (error, response, body) => {
      // failed
      if(error || response.statusCode >= 400){ return reject(`Unable to load schema ${topicName} versions`); } // Failed
      return resolve(JSON.parse(body));
    });
  });
};

Registry.fetchByVersion = function(topicName, version){
  return new Promise( (resolve, reject) => {
    Registry.GET(`subjects/${topicName}-value/versions/${version}`, (error, response, body) => {
      // failed
      if(error || response.statusCode >= 400){ return reject(`Unable to load schema ${topicName} version : ${version}`); }
      return resolve(JSON.parse(body));
    });
  });
};

Registry.fetchById = function(id){
  return new Promise( (resolve, reject) => {
    Registry.GET(`schemas/ids/${id}`, (error, response, body) => {
      // failed
      if(error || response.statusCode >= 400){ return reject(`Unable to load schema ${id}`); }
      return resolve(JSON.parse(body));
    });
  });
};

module.exports = Registry;
