const expect = require('expect.js');
const Simple = require('../../lib/simple');

describe('Simple', function() {

  describe('decode', function() {
    it('should decode a message to an object', function() {
      expect(Simple.decode).to.be.a('function');
      let message = Buffer.from('{"hello" : "world"}');
      let decoded = Simple.decode(message);
      expect(decoded).to.be.an('object');
      expect(decoded.hello).to.eql('world');
    });
  });

  describe('parse', function() {
    it('should parse a message', function() {
      expect(Simple.parse).to.be.a('function');

      let message = { hello : 'world' };
      let payload = {
        topic    : 'test.topic',
        key      : 'some/key'  ,
        messages :  message
      };
      let parsed = Simple.parse(payload);
      expect(parsed).to.be.an('array');
      let parsedMessage = parsed[0];

      expect(parsedMessage.topic).to.eql('test.topic');
      expect(parsedMessage.key).to.eql('some/key');
      expect(parsedMessage.messages).to.be.a('string');
      expect(parsedMessage.messages).to.eql(JSON.stringify(message));
    });
  });

});
