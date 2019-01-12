const expect     = require('expect.js');
const SchemaPool = require('../../lib/schemaPool');
const Schema     = require('../../lib/schema');
const Settings   = require('../../lib/settings');
const Registry   = require('../../lib/registry');
const nock       = require('nock');

describe('Schema Pool', function() {

  beforeEach(function(){
    Settings.read({
      kafka :{
        kafkaHost : "test.broker:9092"
      },
      schema  : {
        registry : "http://test.registry.com",
      }
    });
    Registry.init();
  });

  describe('add', function() {
    it('should fetch and add a new schema', function(done) {
      nock('http://test.registry.com').get('/schemas/ids/1').reply(200, JSON.stringify({
        schema : '{"type":"record","name":"TestTopic","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
      }));

      expect(SchemaPool.add).to.be.a('function');
      let topic = { id : 1 };

      SchemaPool.add(topic).then( schema => {
        expect(SchemaPool[1]).to.eql(schema);
        return done();
      }, done);
    });

    it('should fetch once, queue on a pool pending topics with same settings', function(done) {
      nock('http://test.registry.com').get('/schemas/ids/2').delay(1000).reply(200, JSON.stringify({
        schema : '{"type":"record","name":"TestTopic","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
      }));

      expect(SchemaPool.add).to.be.a('function');
      let topic = { id : 2 };

      SchemaPool.setCalled = 0;
      let set = SchemaPool.set.bind(SchemaPool);

      SchemaPool.set = function(){
        SchemaPool.setCalled++;
        return set.apply(SchemaPool, arguments);
      };

      let ready = after(10, function(schema){
        expect(SchemaPool.setCalled).to.eql(1);
        expect(SchemaPool[2]).to.be.an('object');
        expect(schema.id).to.eql(2);
        return done();
      });

      for(let i=1;i<=10;i++){
        SchemaPool.add(topic).then(ready, done);
      }

      function after(times, func) {
        return function() { if (--times < 1) { return func.apply(this, arguments); } };
      };
    });
  });

  describe('set', function() {
    it('should set schema on the pool', function() {
      expect(SchemaPool.set).to.be.a('function');
      let schema = new Schema({ id : 3 });
      SchemaPool.set(schema);
      expect(SchemaPool[3]).to.eql(schema);
    });
  });

  describe('getById', function() {
    it('should get an exisitng schema from pool by id', function(done) {
      expect(SchemaPool.getById).to.be.a('function');
      SchemaPool.set(new Schema({ id : 4 }));

      SchemaPool.getById(4).then( schema => {
        expect(schema.id).to.eql(4);
        return done();
      }, done);
    });

    it('should get a NONE exisitng schema from pool by id', function(done) {
      nock('http://test.registry.com').get('/schemas/ids/5').reply(200, JSON.stringify({
        schema : '{"type":"record","name":"TestTopic","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
      }));
      expect(SchemaPool.getById).to.be.a('function');
      SchemaPool.getById(5).then( schema => {
        expect(schema.id).to.eql(5);
        return done();
      }, done);
    });
  });

  describe('getByName', function() {
    it('should get an exisitng schema from pool by name', function(done) {
      expect(SchemaPool.getByName).to.be.a('function');
      SchemaPool.set(new Schema({ name : 'test.topic.name' }));

      SchemaPool.getByName('test.topic.name').then( schema => {
        expect(schema.name).to.eql('test.topic.name');
        return done();
      }, done);
    });

    it('should get a NONE exisitng schema from pool by name', function(done) {
      nock('http://test.registry.com').get('/subjects/test.unexisting.topic-value/versions').reply(200, JSON.stringify([1]));
      nock('http://test.registry.com').get('/subjects/test.unexisting.topic-value/versions/1').reply(200, JSON.stringify({
        subject : 'TestUnexisting-value',
        version : 1,
        id : 6,
        schema : '{"type":"record","name":"TestUnexisting","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
      }));

      expect(SchemaPool.getByName).to.be.a('function');
      SchemaPool.getByName('test.unexisting.topic').then( schema => {
        expect(schema.name).to.eql('test.unexisting.topic');
        return done();
      }, done);
    });
  });

});
