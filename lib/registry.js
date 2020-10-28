const request  = require('request');
const Settings = require('./settings');

const Registry = {
  // endpoints namespace
  endpoints : {
    byId        : null, // not yet implemented
    allVersions : null, // not yet implemented
    byVersion   : null  // not yet implemented
  }
};

Registry.init = function () {
  Registry.host    = Settings.schema.registry;
  Registry.options = Object.assign({
    headers: { 'Content-Type': 'application/vnd.schemaregistry.v1+json' }
  }, Settings.schema.options);

  Registry.request = request.defaults(Registry.options);
  Registry.buildEndpoints();
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

/* Endpoints */
Registry.buildEndpoints = function(){
  ['byId', 'allVersions', 'byVersion'].forEach( endpoint =>{
    // Polyfill
    Registry.endpoints[endpoint] = Registry.endpoints[endpoint] || function(id, name, version){
      return Settings.schema.endpoints[endpoint].replace(/{{id}}|{{name}}|{{version}}/g, function(variable){
        if(variable == '{{id}}'){ return id; }
        if(variable == '{{name}}'){ return name; }
        if(variable == '{{version}}'){ return version; }
      });
    };
  });
};

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
