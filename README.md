kafka-node-avro
==============

[![NPM](https://nodei.co/npm/kafka-node-avro.png)](https://nodei.co/npm/kafka-node-avro/)

> Node.js bindings for `kafka-node` with `avsc` schema serialization.

This library combines [kafka-node](https://github.com/SOHU-Co/kafka-node) and [avsc](https://github.com/mtth/avsc) to produce and consume validated serialized messages

# Requirements

`kafka-node` is a peer dependency, make sure to install it. Tested on kafka-node 5.0.0

```
 npm install kafka-node
```

# Install

```
 npm install kafka-node-avro
```

# Test

```
 npm test
```

# Options
* `kafka` : *kafka-node* KafkaClient [options](https://github.com/SOHU-Co/kafka-node#options)
* * `kafkaHost` : A string of kafka broker/host combination delimited by comma for example: `kafka-1.us-east-1.myapp.com:9093,kafka-2.us-east-1.myapp.com:9093,kafka-3.us-east-1.myapp.com:9093` default: `localhost:9092`.
* * `connectTimeout` : in ms it takes to wait for a successful connection before moving to the next host default: `10000`
* * `requestTimeout` : in ms for a kafka request to timeout default: `30000`
* * `autoConnect` : automatically connect when KafkaClient is instantiated otherwise you need to manually call `connect` default: `true`
* * `connectRetryOptions` : object hash that applies to the initial connection. see [retry](https://www.npmjs.com/package/retry) module for these options.
* * `idleConnection` : allows the broker to disconnect an idle connection from a client (otherwise the clients continues to O after being disconnected). The value is elapsed time in ms without any data written to the TCP socket. default: 5 minutes
* * `reconnectOnIdle` : when the connection is closed due to client idling, client will attempt to auto-reconnect. default: true
* * `maxAsyncRequests` : maximum async operations at a time toward the kafka cluster. default: 10
* * `sslOptions`: **Object**, options to be passed to the tls broker sockets, ex. `{ rejectUnauthorized: false }` (Kafka 0.9+)
* * `sasl`: **Object**, SASL authentication configuration (only SASL/PLAIN is currently supported), ex. `{ mechanism: 'plain', username: 'foo', password: 'bar' }` (Kafka 0.10+)

* `schema`	: Object representing Schema Settings
* * `registry` : Registry host
* * `options` : Object registry options [TLS/SSL options](https://github.com/request/request#tlsssl-protocol)
* - * `headers` : Default is { 'Content-Type': 'application/vnd.schemaregistry.v1+json' }
* - * `cert` : fs.readFileSync(certFile)
* - * `key` : fs.readFileSync(keyFile)
* - * `passphrase` : 'password'
* - * `ca` : fs.readFileSync(caFile)
* - * `auth` : Authentication Object [HTTP Authentication](https://github.com/request/request#http-authentication)
* - * -  `user` : 'username'
* - * -  `pass` : 'password'
* - * -  `sendImmediately` : false
* - `topics` : Array of Topic settings
* - * `name` : Name of the topic ( required if no `id` is provided )
* - * `id` : id of the Schema ( required if no `name` is provided )
* - * `version` : Version of the Schema
* - * `key_fields` : Array of fields to use to build topic key.
* * `endpoints` : Object representing the Registry endpoints
* - * `byId` String to build **by id endpoint**. Default : *'schemas/ids/{{id}}'*
* - * `allVersions` String to build **by all versions endpoint**. Default : *'subjects/{{name}}-value/versions'*
* - * `byVersion` String to build **by version endpoint**. Default : *'subjects/{{name}}-value/versions/{{version}}'*

* `alive`	: Object representing Registry.alive settings
* * `endpoint` : Health check endpoint. default: 'subjects'

See [sample options](https://github.com/narcisoguillen/kafka-node-avro/wiki/Sample-Options).

# API

## **init**

This package will not fullfill the promise if is **not** able to :

- Fetch the schemas from the schema registry.
- Connect to kafka brokers
- Build the kafka producer

```javascript
const KafkaAvro = require('kafka-node-avro');
const Settings  = {
  "kafka" : {
    "kafkaHost" : "localhost:9092"
  },
  "schema": {
    "registry" : "http://schemaregistry.example.com:8081"
  }
};

KafkaAvro.init(Settings).then( kafka => {
  // ready to use
} , error => {
  // something wrong happen
});

```

## **use**

Ability to build custom plugins, this method will allow to modify existing [**core**](https://github.com/narcisoguillen/kafka-node-avro/wiki/core) implementations by direct overwrites *or* to build new mechanisms.

A Plugin must be a function, this function will get as argument the [**core**](https://github.com/narcisoguillen/kafka-node-avro/wiki/core) of `kafka-node-avro`

```javascript
const myCustomPlugin1 = function(core){
  // Overwrite : default registry uri builder for allVersions
  core.Registry.endpoints.allVersions = function(id, name, version){
    console.log('Look ma !, fetching all versions');
    return `subjects/${name}-value/versions`;
  };
};

const myCustomPlugin2 = function(core){
  // Overwrite : default consumer parser
  core.Consumer.prototype.parse = function(message){
    console.log('Workign on this -> ', message);
    return this.emit('message', message); // emit to consumers
  };
};

const myCustomPlugin3 = function(core){
  // Create new mechanism
  core.Mechanisms.myFunction = function(){
    // logic
  };
};
```

Plugging in

```javascript
KafkaAvro
  .use(myCustomPlugin1) // change how to build uri to fetch a schema by all versions
  .use(myCustomPlugin2) // change how to parse an incommig message
  .use(myCustomPlugin3) // add a new `myFunction`
  .init(Settings).then( kafka => {
    kafka.myFunction(); // new method by plugin
} , error => {
  // ..
});

```

## **schemas**
Fetch schemas from the schema registry, this package will fetch the schema from the shcema regitry based on the [initial settings](https://github.com/narcisoguillen/kafka-node-avro#options).

Once schema was fetched from the registry it will keep it on **memory** to be re used.

Schema format
```javascript
{
    id : Number,
    name : String,
    version : Number,
    key_fields : Arrary,
    definition : String, // raw responmse from the schema registry.
    parser : avro.Type.forSchema
}
```

### schemas.getById
Get an avro schema by `id`
```javascript
KafkaAvro.init(Settings).then( kafka => {
  kafka.schemas.getById(1).then( schema => {
    // we got the schema from the registry by the id
  } , error => {
    // something wrong happen
  });
} , error => {
  // something wrong happen
});

```

### schemas.getByName
Get an avro schema by `name`
```javascript
KafkaAvro.init(Settings).then( kafka => {
  kafka.schemas.getByName('my.cool.topic').then( schema => {
    // we got the schema from the registry by the name
  } , error => {
    // something wrong happen
  });
} , error => {
  // something wrong happen
});
```

## **send**(\<message\>)
This package will auto encode the message using the `avro` schema, if the schema was not provided on the initial settings, it will fetch it against the schema registry and use it from there on.

**Message Format**

* `simple` : If **NO** avro schema parsing is needed to send the message
* `topic` : Topic Name
* `messages` : messages to send type **Object** or **Array** of **Objects**
* `key` : string or buffer, only needed when using keyed partitioner
* `partition` :  default 0
* `attributes` : default: 0
* `timestamp` : Date.now() // <-- defaults to Date.now() (only available with kafka v0.10 and KafkaClient only)


If `key_fields` where provided when building the package, they will be used to send the messages on that `key`, on this example the key will be `hello/world`

```javascript
KafkaAvro.init(Settings).then( kafka => {
  kafka.send({
    topic    : 'my.cool.topic',
    messages : {
      foo : 'hello',
      bar : 'world'
    }
  }).then( success => {
    // Message was sent encoded with Avro Schema
  }, error => {
    // Something wrong happen
  });
} , error => {
  // something wrong happen
});
```

If an invalid payload was provided for the AVRO Schema, the error will look like : `Invalid Field 'FIELD' type "TYPE" : VALUE`

## **addProducer**([options], [customPartitioner])

kafka-node-avro has a global producer with default kafka-node settings for the **HighLevelProducer**, this mechanism will allow to create HighLevelProducers on demand with the ability to set options and customPartitioner. [here](https://github.com/SOHU-Co/kafka-node#highlevelproducer) for more info.

When creating a new producer, **send** mechanism is the same as the global producer, this send will auto encode the message using the `avro` schema, if the schema was not provided on the initial settings, it will fetch it against the schema registry and use it from there on.

**Message Format**

* `simple` : If **NO** avro schema parsing is needed to send the message
* `topic` : Topic Name
* `messages` : messages to send type **Object** or **Array** of **Objects**
* `key` : string or buffer, only needed when using keyed partitioner
* `partition` :  default 0
* `attributes` : default: 0
* `timestamp` : Date.now() // <-- defaults to Date.now() (only available with kafka v0.10 and KafkaClient only)

```javascript
KafkaAvro.init(Settings).then( kafka => {
  const producer = kafka.addProducer();

  producer.send({
    topic    : 'my.cool.topic',
    messages : {
      foo : 'hello',
      bar : 'world'
    }
  }).then( success => {
    // Message was sent encoded with Avro Schema
  }, error => {
    // Something wrong happen
  });
} , error => {
  // something wrong happen
});
```

### **Close**

Ability to close the producer

WARNING : closing the producer will close kafka client, this is part of `kafka-node` baseProducer definition.

```javascript
producer.close( closed => {
  // Connection is closed
});
```

## **addConsumer**(\<TopicName\>, [Options])

This package will auto decode the message before emitting on the `message` event, the message will be on a **JSON** format.

**Options**

* `simple` : If **NO** avro schema parsing is needed to consume the message
* `kafkaHost` : connect directly to kafka broker (instantiates a KafkaClient) : 'broker:9092'
* `batch` : put client batch settings if you need them : undefined
* `ssl` : optional (defaults to false) or tls options hash : true
* `groupId` : 'ExampleTestGroup'
* `sessionTimeout` : 15000,
* `protocol` : An array of partition assignment protocols ordered by preference, 'roundrobin' or 'range' string for built ins : ['roundrobin']
* `encoding` : 'utf8' or 'buffer', Please do nto replace this value , this library by default uses `buffer` to decode binary schema
* `fromOffset` : Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved) , equivalent to Java client's auto.offset.reset: 'latest'
* `commitOffsetsOnFirstJoin` : on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest) : true
* `outOfRangeOffset` : how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset : 'earliest'
* `onRebalance` : Callback to allow consumers with autoCommit false a chance to commit before a rebalance finishes , isAlreadyMember will be false on the first connection, and true on rebalances triggered after that : (isAlreadyMember, callback) => { callback(); } // or null

```javascript
KafkaAvro.init(Settings).then( kafka => {
  let consumer = kafka.addConsumer("my.cool.topic");

  consumer.on('message', message => {
   // we got a decoded message
  });
} , error => {
  // something wrong happen
});
```
