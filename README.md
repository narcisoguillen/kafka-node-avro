# kafka-node-avro

> Node.js bindings for `kafka-node` with `Avro` schema serialization.

This library combines [kafka-node](https://github.com/SOHU-Co/kafka-node) and [avsc](https://github.com/mtth/avsc) to produce and consume validated serialized messages

# API

## Options
* `brokers`	: A string of kafka broker/host combination delimited by comma.
* `schema`	: Object representing Schema Settings
* * `registry` : Registry host
* * `topics` : Array of Topic settings

### Schema.topics

* `name` : Name of the topic
* `version` : Version of the Schema
* `id` : id of the Schema
*  `key_fields` : Array of fields to use to build topic key.

#### Sample options


```
const Settings = {
    "brokers" : "localhost:9092",
    "schema": {
      "registry" : "http://schemaregistry.example.com:8081"
    }
  };
```

```
const Settings = {
    "brokers" : "localhost:9092",
    "schema": {
      "registry" : "http://schemaregistry.example.com:8081",
      "topics"   : [{ "name" : "my.cool.topic" }]
    }
  };
```

```
const Settings = {
    "brokers" : "localhost:9092",
    "schema": {
      "registry" : "http://schemaregistry.example.com:8081",
      "topics"   : [{ "id" : 1 }]
    }
  };
```

```
const Settings = {
    "brokers" : "localhost:9092",
    "schema": {
      "registry" : "http://schemaregistry.example.com:8081",
      "topics"   : [{
        "name"    : "my.cool.topic",
        "version" : 1,
      }]
    }
  };
```

```
const Settings = {
    "brokers" : "localhost:9092",
    "schema": {
      "registry" : "http://schemaregistry.example.com:8081",
      "topics"   : [{
        "name"        : "my.cool.topic",
        "version"     : 1,
        "key_fields"  : ["foo", "bar"]
      }]
    }
  };
```

## Install

```
 npm install kafka-node-avro
```

## Build

This package will not fullfill the promise if is not able to fetch the schemas from the schema registry, if shema settings was provided.


```
const KafkaAvro = require('kafka-node-avro');

KafkaAvro.init(Settings).then( kafka => {
  // ready to use
} , error => {
  // something wrong happen
});

```

## send(\<message\>)
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

```
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
```

If an invalid payload was provided for the AVRO Schema, the error will look like : `Invalid Field 'FIELD' type "TYPE" : VALUE`

## addConsumer(\<TopicName\>, [Options])

This package will auto decode the message before emitting on the `message` event, the message will be on a **JSON** format.

**Options**

* `simple` : If **NO** avro schema parsing is needed to consume the message
* `host` : zookeeper host omit if connecting directly to broker (see kafkaHost below)
* `kafkaHost` : connect directly to kafka broker (instantiates a KafkaClient)
* `zk` : put client zk settings if you need them (see Client)
* `batch` : put client batch settings if you need them (see Client)
* `ssl` : optional (defaults to false) or tls options hash
* `groupId` : Group Id
* `sessionTimeout` : Session Tiemout
* `protocol` : An array of partition assignment protocols ordered by preference. ['roundrobin']
* `fromOffset` : latest
* `commitOffsetsOnFirstJoin` : on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
* `outOfRangeOffset` : how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset

```
let consumer = kafka.addConsumer("my.cool.topic");

consumer.on('message', message => {
 // we got a decoded message
});
```
