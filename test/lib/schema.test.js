const expect   = require('expect.js');
const Schema   = require('../../lib/schema');
const Settings = require('../../lib/settings');
const avro     = require('avsc');
const nock     = require('nock');

describe('Shema', function() {

  beforeEach(function(){
    Settings.read({
      "brokers" : "test.broker:9092",
      "schema"  : {
        "registry" : "http://test.registry.com",
      }
    });

    this.schema = new Schema({
      name       : 'test.topic',
      key_fields : ['foo', 'bar']
    });

    this.schema.parser = avro.Type.forSchema({
      "type" : "record",
      "name" : "TestClass",
      "namespace" : "com.test.avro",
      "fields" : [ {
        "name" : "foo",
        "type" : "string"
      }, {
        "name" : "bar",
        "type" : "string"
      } ]
    });
  });

  describe('parse', function() {

    it('should parse producer message', function(done) {
      let payload = {
        messages : {
          foo : 'hello',
          bar : 'world'
        }
      };

      expect(this.schema.parse).to.be.a('function');
      this.schema.parse(payload).then( parsed => {
        expect(parsed).to.be.an('array');
        expect(parsed[0].topic).to.eql('test.topic');
        expect(parsed[0].key).to.eql('hello/world');
        expect(Buffer.isBuffer(parsed[0].messages)).to.be(true);
        return done();
      } , done);
    });

    it('should parse producer multiple messages', function(done) {
      let payload = {
        messages : [{
          foo : 'hello',
          bar : 'world'
        }, {
          foo : 'bat',
          bar : 'man'
        }]
      };

      expect(this.schema.parse).to.be.a('function');
      this.schema.parse(payload).then( parsed => {
        expect(parsed).to.be.an('array');
        let messages = parsed[0].messages;
        expect(Buffer.isBuffer(messages[0])).to.be(true);
        expect(Buffer.isBuffer(messages[1])).to.be(true);
        return done();
      } , done);
    });

  });

  describe('genKey', function() {
    it('should auto generate topic key', function() {
      let message = {
        foo : 'hello',
        bar : 'world'
      };

      let key = this.schema.genKey(message);

      expect(this.schema.genKey).to.be.a('function');
      expect(key).to.eql('hello/world');
    });
  });

  describe('encode', function() {

    it('should encode message to avro schema', function(done) {
      let message = {
        foo : 'hello',
        bar : 'world'
      };

      expect(this.schema.encode).to.be.a('function');
      this.schema.encode(message).then( encoded => {
        let decoded = this.schema.parser.fromBuffer(encoded.slice(5));
        expect(Buffer.isBuffer(encoded)).to.be(true);
        expect(decoded).to.eql(message);
        return done();
      }, done);
    });

    it('should auto hook avro error if incorrect schema', function(done) {
      let message = {
        foo : 1,
        bar : 'world'
      };

      expect(this.schema.encode).to.be.a('function');
      this.schema.encode(message).then( encoded => {
        return done('Should not encode');
      }, error =>{
        expect(error).to.eql(`Invalid Field 'foo' type "string" : 1`);
        return done();
      });
    });

  });

  describe('decode', function() {
    it('should decode a message from a avro schema', function(done) {
      let message = {
        foo : 'hello',
        bar : 'world'
      };

      expect(this.schema.decode).to.be.a('function');
      this.schema.encode(message).then( encoded => {
        let decoded = this.schema.decode(encoded);
        expect(decoded).to.eql(message);
        return done();
      }, done);
    });
  });

  describe('fetchVersions', function() {
    let versions = [1,2,3];
    nock('http://test.registry.com').get('/subjects/test.topic-value/versions').reply(200, JSON.stringify(versions));

    it('should fetch available versions for a schema registry', function(done) {
      this.schema.fetchVersions().then( result => {
        expect(result).to.be.an('array');
        expect(result).to.eql(versions);
        return done();
      }, done);
    });
  });


  describe('fetchByVersion', function() {

    before(function(){
      nock('http://test.registry.com').get('/subjects/test.byVersion-value/versions/1').reply(200, JSON.stringify({
        subject : 'TestByVersion-value',
        version : 1,
        id : 1,
        schema : '{"type":"record","name":"TestByVersion","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
      }));
    });


    it('should fetch a schema from schema registry by version', function(done) {
      let schema = new Schema({
        name    : 'test.byVersion',
        version : 1
      });

      expect(schema.fetchByVersion).to.be.a('function');
      schema.fetchByVersion().then( result => {
        expect(result.name).to.eql('test.byVersion');
        expect(result.version).to.eql(1);
        expect(result.id).to.eql(1);
        return done();
      }, done);
    });
  });

  describe('fetchById', function() {
    before(function(){
      nock('http://test.registry.com').get('/schemas/ids/1').reply(200, JSON.stringify({
        schema : '{"type":"record","name":"TestById","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
      }));
    });


    it('should fetch a schema from schema registry by version', function(done) {
      let schema = new Schema({ id : 1 });

      expect(schema.fetchById).to.be.a('function');
      schema.fetchById().then( result => {
        expect(result.id).to.eql(1);
        return done();
      }, done);
    });
  });

  // TODO
  //- fetchByName
  //- fetch
});
