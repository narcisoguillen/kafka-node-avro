const request  = require('request');
const Settings = require('./settings');

const Registry = {
  endpoints : { } // endpoints namespace
};

Registry.init = function(){
  Registry.host    = Settings.schema.registry;
  Registry.request = request.defaults({
    headers: {
      'Content-Type' : 'application/vnd.schemaregistry.v1+json'
    }
  });
};

// Global requester
Registry.GET = function(endpoint, callback){
  return Registry.request.get(`${Registry.host}/${endpoint}`, callback);
};

/* Default URIs */

// Default alive URI builder
Registry.endpoints.alive = function(){
  return 'endpoint' in Settings.alive ? Settings.alive.endpoint : 'subjects';
};

// Default byId URI builder
Registry.endpoints.byId = function(id, name, version){
  return `schemas/ids/${id}`;
};

// Default allVersions URI builder
Registry.endpoints.allVersions = function(id, name, version){
  return `subjects/${name}-value/versions`;
};

// Default byVersion URI builder
Registry.endpoints.byVersion = function(id, name, version){
  return `subjects/${name}-value/versions/${version}`;
};

/* Endpoints */

// Health check endpoint
Registry.alive = function(){
  return new Promise(function(resolve, reject){
    Registry.GET(Registry.endpoints.alive(), (error, response, body) => {
      // failed
      if(error || response.statusCode >= 400){ return reject(`Unable to access registry ${Registry.host}`); }
      return resolve(body);
    });
  });
};

// Fetch by id
Registry.fetchById = function(id, name, version){
  return new Promise( (resolve, reject) => {
    Registry.GET(Registry.endpoints.byId(id, name, version), (error, response, body) => {
      // failed
      if(error || response.statusCode >= 400){ return reject(`Unable to load schema ${id}`); }
      return resolve(JSON.parse(body));
    });
  });
};

// Fetch all version
Registry.fetchVersions = function(id, name, version){
  return new Promise( (resolve, reject) => {
    Registry.GET(Registry.endpoints.allVersions(id, name, version), (error, response, body) => {
      // failed
      if(error || response.statusCode >= 400){ return reject(`Unable to load schema ${name} versions`); } // Failed
      return resolve(JSON.parse(body));
    });
  });
};

// Fetch by version
Registry.fetchByVersion = function(id, name, version){
  return new Promise( (resolve, reject) => {
    Registry.GET(Registry.endpoints.byVersion(id, name, version), (error, response, body) => {
      // failed
      if(error || response.statusCode >= 400){ return reject(`Unable to load schema ${name} version : ${version}`); }
      return resolve(JSON.parse(body));
    });
  });
};

module.exports = Registry;
