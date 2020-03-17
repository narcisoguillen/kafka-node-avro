const expect        = require('expect.js');
const nock          = require('nock');
const kafkaNodeAvro = require('../');

describe('Plugin mechanism', function() {

  beforeEach(function(){
    this.Settings = {
      kafka :{
        kafkaHost : "test.broker:9092"
      },
      schema  : {
        registry : "http://test.registry.com"
      }
    };

    nock('http://test.registry.com').get('/').reply(200, ['test.topic']);
  });

  describe('use', function() {
    it('.use should be available', function() {
      expect(kafkaNodeAvro.use).to.be.a('function');
    });

    it('should be able to plug a direct overwrite', function(done){
      // no need for kafka server plugin
      const myCustomPlugin = function(core){
        // fake global producer
        core.Producer = class FakeProducer {
          constructor(){ }
        }

        core.Client.connect = function(){
          return new Promise(function(resolve, reject){
            return resolve(); // no need for kafka now
          });
        };
      };

      kafkaNodeAvro
        .use(myCustomPlugin)
        .init(this.Settings)
        .then( kafka => {
          expect(1).to.be.ok();
          return done();
        }, done);
    });

    it('should have the avility for multiple plugins', function(done){

      // no need for kafka server plugin
      const myCustomPlugin1 = function(core){
        // fake global producer
        core.Producer = class FakeProducer {
          constructor(){ }
        }

        core.Client.connect = function(){
          return new Promise(function(resolve, reject){
            return resolve(); // no need for kafka now
          });
        };
      };

      // A new custom mechanism
      const myCustomPlugin2 = function(core){
        core.Mechanisms.myFunction = function(){};
      };

      kafkaNodeAvro
        .use(myCustomPlugin1)
        .use(myCustomPlugin2)
        .init(this.Settings)
        .then( kafka => {
          expect(kafka.myFunction).to.be.a('function');
          return done();
        }, done);
    });

  });

});
