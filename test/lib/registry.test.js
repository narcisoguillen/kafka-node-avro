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
        registry  : "http://test.registry.com",
        options   : {},
        endpoints : {
          byId        : 'schemas/ids/{{id}}',
          allVersions : 'subjects/{{name}}-value/versions',
          byVersion   : 'subjects/{{name}}-value/versions/{{version}}'
        }
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

          Settings.alive = { endpoint : 'foo' }
          Registry.alive().then( alive => {
            expect(alive).to.eql('["test.topic"]');
            return done();
          }, done);
        });
      });

      describe('with empty endpoint setting supplied', function() {
        it('should touch registry to see if its alive', function(done) {
          nock('http://test.registry.com').get('/').reply(200, ['test.topic']);

          Settings.alive = { endpoint : '' }
          Registry.alive().then( alive => {
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
        Registry.fetchVersions(undefined, 'test.topic', undefined).then( versions => {
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
        Registry.fetchById(1, undefined, undefined).then( schema => {
          expect(schema).to.be.an('object');
          return done();
        }, done);
      });
    });

  });

  describe('Custom endpoints from settings', function(){

    it('should fetch schema by id [CUSTOM]', function(done) {
      Settings.read({
        kafka :{
          kafkaHost : "test.broker:9092"
        },
        schema  : {
          registry : "http://test.registry.com",
          endpoints : {
            byId : 'custom/ids/{{id}}'
          }
        }
      });
      Registry.init();

      nock('http://test.registry.com').get('/custom/ids/1').reply(200, JSON.stringify({
        schema : '{"type":"record","name":"TestTopic","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
      }));

      expect(Registry.fetchById).to.be.a('function');
      Registry.fetchById(1, undefined, undefined).then( schema => {
        expect(schema).to.be.an('object');
        return done();
      }, done);
    });

    it('should fetch all versions [CUSTOM]', function(done) {
      Settings.read({
        kafka :{
          kafkaHost : "test.broker:9092"
        },
        schema  : {
          registry : "http://test.registry.com",
          endpoints : {
            allVersions : 'subjects/{{name}}-custom/versions'
          }
        }
      });
      Registry.init();

      nock('http://test.registry.com').get('/subjects/test.topic-custom/versions').reply(200, JSON.stringify([1,2,3]));

      expect(Registry.fetchVersions).to.be.a('function');
      Registry.fetchVersions(undefined, 'test.topic', undefined).then( versions => {
        expect(versions).to.be.an('array');
        return done();
      }, done);
    });

    it('should fetch by version [CUSTOM]', function(done) {
      Settings.read({
        kafka :{
          kafkaHost : "test.broker:9092"
        },
        schema  : {
          registry : "http://test.registry.com",
          endpoints : {
            byVersion   : 'subjects/{{name}}-custom/versions/{{version}}'
          }
        }
      });
      Registry.init();

      nock('http://test.registry.com').get('/subjects/test.topic-custom/versions/1').reply(200, JSON.stringify({
        schema : '{"type":"record","name":"TestTopic","namespace":"com.test.avro","fields":[{"name":"foo","type":"string"},{"name":"bar","type":"string"}]}'
      }));

      expect(Registry.fetchByVersion).to.be.a('function');
      Registry.fetchByVersion(undefined, 'test.topic', 1).then( versions => {
        expect(versions).to.be.an('object');
        return done();
      }, done);
    });

  });

  describe('Custom registry options', function(){
    it('should be able to set auth username and password', function() {
      Settings.read({
        kafka :{
          kafkaHost : "test.broker:9092"
        },
        schema  : {
          registry : "http://test.registry.com",
          options : {
            auth : {
              user : 'username',
              pass : 'password'
            }
          }
        }
      });
      Registry.init();

      expect(Registry.options.auth.user).to.eql('username');
      expect(Registry.options.auth.pass).to.eql('password');
    });
  });

});

