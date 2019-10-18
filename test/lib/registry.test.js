const expect   = require('expect.js');
const Settings = require('../../lib/settings');
const Registry = require('../../lib/registry');
const nock     = require('nock');

describe('Registry', function() {

  beforeEach(function(){
    Settings.read({
      kafka :{
        kafkaHost : "test.broker:9092"
      },
      schema  : {
        registry : "http://test.registry.com",
      }
    });
  });

  describe('init', function() {
    it('should set host based on settings', function() {
      expect(Registry.init).to.be.a('function');
      Registry.init();
      expect(Registry.host).to.eql("http://test.registry.com");
    });
  });

  describe('mechanisms', function() {

    beforeEach(function(){
      Registry.init();
    });

    describe('alive', function() {
      it('should touch registry to see if its alive', function(done) {
        nock('http://test.registry.com').get('/subjects').reply(200, ['test.topic']);

        expect(Registry.alive).to.be.a('function');
        Registry.alive().then( alive => {
          expect(alive).to.eql('["test.topic"]');
          return done();
        }, done);
      });

      describe('with endpoint setting supplied', function() {
        it('should touch registry to see if its alive', function(done) {
          nock('http://test.registry.com').get('/foo').reply(200, ['test.topic']);

          const settings = {endpoint: 'foo'};
          Registry.alive(settings).then( alive => {
            expect(alive).to.eql('["test.topic"]');
            return done();
          }, done);
        });
      });

      describe('with empty endpoint setting supplied', function() {
        it('should touch registry to see if its alive', function(done) {
          nock('http://test.registry.com').get('/').reply(200, ['test.topic']);

          const settings = {endpoint: ''};
          Registry.alive(settings).then( alive => {
            expect(alive).to.eql('["test.topic"]');
            return done();
          }, done);
        });
      });
    });

    describe('fetchVersions', function() {
      it('should fetch schema versions of a topic from its registry', function(done) {
        nock('http://test.registry.com').get('/subjects/test.topic-value/versions').reply(200, JSON.stringify([1,2,3]));

        expect(Registry.fetchVersions).to.be.a('function');
        Registry.fetchVersions('test.topic').then( versions => {
          expect(versions).to.be.an('array');
          return done();
        }, done);
      });
    });

    describe('fetchById', function() {
      it('should fetch schema by its id', function(done) {
        nock('http://test.registry.com').get('/schemas/ids/1').reply(200, JSON.stringify({
          schema : '{"type":"record","name":"TestTopic","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
        }));

        expect(Registry.fetchById).to.be.a('function');
        Registry.fetchById(1).then( schema => {
          expect(schema).to.be.an('object');
          return done();
        }, done);
      });
    });

  });
});
