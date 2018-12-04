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

[Params](https://github.com/SOHU-Co/kafka-node#sendpayloads-cb)

The only difference is on the `messages`
* `messages` : messages to send type **Object** or **Array** of **Objects**

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
}, error =>{
  // Something wrong happen
});
```

### Simple send(\<message\>)
If **NO** avro schema parsing is needed to send the message the package can encode the payload without avro by sending a `simple` flag.

```
kafka.send({
  simple   : true,
  topic    : 'my.cool.topic-2',
  messages : {
    foo : 'hello',
    bar : 'world'
  }
}).then( success => {
  // Message was sent without Avro Schema
}, error =>{
  // Something wrong happen
});
```

## addConsumer(\<TopicName\>, [Options])

[Options](https://github.com/SOHU-Co/kafka-node#consumergroupoptions-topics)

This package will auto decode the message before emitting on the `message` event, the message will be on a **JSON** format.

```
let consumer = kafka.addConsumer("my.cool.topic");

consumer.on('message', message => {
 // we got a decoded message
});
```

### Simple addConsumer(\<TopicName\>, [Options])
If **NO** avro schema parsing is needed to consume the message the package can decode the payload without avro by sending a `simple` flag.

```
let consumer = kafka.addConsumer("my.cool.topic-2", { simple : true });

consumer.on('message', message => {
 // we got an undecoded message
});
```
