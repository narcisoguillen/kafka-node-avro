const avro     = require('avsc');
const _        = require('underscore');
const request  = require('request');
const Settings = require('./settings');

module.exports = class Shema {

  constructor (topic) {
    if(!topic.name){ throw new Error('Topic name is needed to build Schema'); }

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
    return [{
      topic    : this.name,
      key      : data.key || this.genKey(data.messages),
      messages : this.encode(data.messages)
    }];
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
    function encode(payload){
      const encodedMessage = this.parser.toBuffer(payload);
      const message        = Buffer.alloc(encodedMessage.length + 5);
      message.writeUInt8(0);
      message.writeUInt32BE(this.id, 1);
      encodedMessage.copy(message, 5);
      return message;
    }
    return Array.isArray(messages) ? messages.map(encode, this) : encode.call(this, messages);
  }

  decode (message) {
    if(message.readUInt8(0) !== 0 ){ throw new Error("Message doesn't contain schema identifier byte."); }
    return this.parser.fromBuffer(message.slice(5));
  }

  fetch () {
    return new Promise( (resolve, reject) => {
      let url = `${Settings.schema.registry}/subjects/${this.name}-value/versions`;

      if(this.version){
        url += `/${this.version}`; return fetchSchema.call(this);
      }

      this.request.get(url, (error, response, body) => {
        // failed
        if(error || response.statusCode >= 400){ return reject(`Unabel to load Schema ${this.name} Version`); }

        let abailableVersions = JSON.parse(body);
        this.version = abailableVersions.pop(); // Use latest version
        url += `/${this.version}`;
        return fetchSchema.call(this);
      });

      function fetchSchema(){
        this.request.get(url, (error, response, body) => {
          // failed
          if(error || response.statusCode >= 400){ return reject(`Unabel to load Schema ${this.name}`); }

          let registry    = JSON.parse(body);
          this.id         = registry.id;
          this.version    = registry.version || this.version;
          this.definition = registry.schema;
          this.parser     = avro.parse(JSON.parse(this.definition));

          return resolve(registry);
        });
      }
    });
  }
};
