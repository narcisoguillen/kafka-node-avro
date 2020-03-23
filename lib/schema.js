const avro     = require('avsc');
const Registry = require('./registry');

module.exports = class Shema {

  constructor (topic) {
    if(!topic.name && !topic.id){ throw new Error('Topic name or id is needed to build Schema'); }
    this.id         = topic.id;
    this.name       = topic.name;
    this.version    = topic.version;
    this.key_fields = topic.key_fields || [];
  }

  parse (data) {
    return new Promise( (resolve, reject) => {
      this.encode(data.messages).then( encoded => {

        let payload = Object.assign({
          topic : this.name,
          key   : this.genKey(data.messages)
        }, data, {
          messages : encoded
        });

        return resolve([payload]);
      }, reject);
    });
  }

  genKey (data) {
    let item = Array.isArray(data) ? data[0] : data;
    return this.key_fields.reduce( (memo, field) => {
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
            return reject(`Invalid Field '${path}' type ${type.toString()} : ${any}`);
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

  fetchByVersion(){
    return new Promise( (resolve, reject) => {
      Registry.fetchByVersion(this.id, this.name, this.version).then( registry => {
        this.id         = registry.id;
        this.version    = registry.version;
        this.definition = registry.schema;
        this.parser     = avro.Type.forSchema(JSON.parse(this.definition));

        return resolve(this);
      } , reject);
    });
  }

  fetchById(){
    return new Promise( (resolve, reject) => {
      Registry.fetchById(this.id, this.name, this.version).then( registry => {
      this.definition = registry.schema;
      this.parser     = avro.Type.forSchema(JSON.parse(this.definition));
        return resolve(this);
      } , reject);
    });
  }

  fetchByName(){
    return new Promise( (resolve, reject) => {
      Registry.fetchVersions(this.id, this.name, this.version).then( versions => {
        this.version = Math.max.apply(Math, versions); // Latest version
        this.fetchByVersion().then(resolve, reject);
      } , reject);
    });
  }

  fetch () {
    // Fetch by ID
    if(this.id){ return this.fetchById(); }

    // Fetch by Version
    if(this.version){ return this.fetchByVersion(); }

    // Fetch by Topic Name
    if(this.name){ return this.fetchByName(); }
  }
};
