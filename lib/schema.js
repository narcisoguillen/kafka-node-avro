const avro     = require('avsc');
const _        = require('underscore');
const request  = require('request');
const Settings = require('./settings');

module.exports = class Shema {

  constructor (topic) {
    if(!topic.name && !topic.id){ throw new Error('Topic name or id is needed to build Schema'); }

    this.id         = topic.id;
    this.name       = topic.name;
    this.version    = topic.version;
    this.key_fields = topic.key_fields || [];
    this.request    = request.defaults({
      headers: {
        'Content-Type' : 'application/vnd.schemaregistry.v1+json'
      }
    });
  }

  parse (data) {
    return new Promise( (resolve, reject) => {
      this.encode(data.messages).then( encoded => {
        return resolve([{
          topic    : this.name,
          key      : data.key || this.genKey(data.messages),
          messages : encoded
        }]);
      }, reject);
    });
  }

  genKey (data) {
    let item = Array.isArray(data) ? data[0] : data;
    return _.reduce(this.key_fields, (memo, field) => {
      let value = item[field];
      if(!value){ throw new Error(`Unable to generate key missing field : ${field}`); }
      let prefix = memo ? '/' : '';
      return memo += prefix + value;
    }, '');
  }

  encode (messages) {
    let done = false;
    return new Promise( (resolve, reject) => {
      function encode(payload){
        if(done){ return false; } // promise is done;
        let valid = this.parser.isValid(payload, {
          errorHook : function(path, any, type){
            done = true;
            return reject(`Invalid Field '${path}' type ${type.toString()} : ${payload[path]}`);
          }
        });

        if(valid){
          try{
            const encodedMessage = this.parser.toBuffer(payload);
            const message        = Buffer.alloc(encodedMessage.length + 5);
            message.writeUInt8(0);
            message.writeUInt32BE(this.id, 1);
            encodedMessage.copy(message, 5);
            return message;
          }catch(error){
            done = true;
            return reject(error);
          }
        }
      }
      return resolve(Array.isArray(messages) ? messages.map(encode, this) : encode.call(this, messages));
    });
  }

  decode (message) {
    if(message.readUInt8(0) !== 0 ){ throw new Error("Message doesn't contain schema identifier byte."); }
    return this.parser.fromBuffer(message.slice(5));
  }

  fetchVersions () {
    return new Promise( (resolve, reject) => {
      let url = `${Settings.schema.registry}/subjects/${this.name}-value/versions`;
      this.request.get(url, (error, response, body) => {
        if(error || response.statusCode >= 400){ return reject(`Unabel to load Schema ${this.name} Versions`); } // Failed
        return resolve(JSON.parse(body));
      });
    });
  }

  fetchByVersion(){
    return new Promise( (resolve, reject) => {
      let url = `${Settings.schema.registry}/subjects/${this.name}-value/versions/${this.version}`;
      this.request.get(url, (error, response, body) => {
        // failed
        if(error || response.statusCode >= 400){ return reject(`Unabel to load Schema ${this.name}`); }

        let registry    = JSON.parse(body);
        this.id         = registry.id;
        this.version    = registry.version;
        this.definition = registry.schema;
        this.parser     = avro.Type.forSchema(JSON.parse(this.definition));

        return resolve(this);
      });
    });
  }

  fetchById(){
    return new Promise( (resolve, reject) => {
      let url = `${Settings.schema.registry}/schemas/ids/${this.id}`;
      this.request.get(url, (error, response, body) => {
        // failed
        if(error || response.statusCode >= 400){ return reject(`Unabel to load Schema ${this.id}`); }
        let registry = JSON.parse(body);

        this.definition = registry.schema;
        this.parser     = avro.Type.forSchema(JSON.parse(this.definition));

        return resolve(this);
      });
    });
  }

  fetchByName(){
    return new Promise( (resolve, reject) => {
      this.fetchVersions().then( versions => {
        this.version = Math.max.apply(Math, versions); // Latest version
        this.fetchByVersion().then(resolve, reject);
      } , reject);
    });
  }

  fetch () {
    return new Promise( (resolve, reject) => {
      // Fetch by ID
      if(this.id){
        return this.fetchById().then(resolve, reject)
      }
      // Fetch by Version
      if(this.version){
        return this.fetchByVersion().then(resolve, reject);
      }
      // Fetch by Topic Name
      if(this.name){
        return this.fetchByName().then(resolve, reject);
      }
    });
  }
};
