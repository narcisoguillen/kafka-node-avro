function encode (data) {
  function toString(payload){
    return typeof payload === 'object' ? JSON.stringify(payload) : payload;
  }
  return Array.isArray(data) ? data.map(toString, this) : toString.call(this, data);
};

module.exports.decode = function(message){
  return JSON.parse(message.toString());
};

module.exports.parse = function(data){
  return [{
    topic    : data.topic,
    key      : data.key || '',
    messages : encode(data.messages)
  }];
};
