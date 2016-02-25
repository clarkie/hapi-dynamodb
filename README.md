## DynamoDb - Hapi plugin

[![Build Status][travis-badge]][travis-url]

**dynamodb** is a Node.js plugin for [dynamodb](https://aws.amazon.com/dynamodb) interaction using [Hapi](https://github.com/hapijs/hapi) Framework.

#### Valid Options:
* `accessKeyId`: **mandatory** AWS AccessKey, default - `DummyKeyForLocalDynamoDB`
* `secretAccessKey`: **mandatory** AWS SecretAccessKey, default - `DummySecretAccessKeyForLocalDynamoDB`
* `region`: **mandatory** AWS region, default - `eu-west-1`
* `httpOptions`: default - `{ timeout: 5000 }`
* `dynamoEndpoint`: AWS DynamoDb endpoint, defaults to `http://127.0.0.1:8000`

#### Usage:
```javascript
var Hapi = require('hapi');
var DynamoDb = require('dynamodb');

var server = new Hapi.Server();
server.connection();
var options = {
    accessKeyId: 'DummyKeyForLocalDynamoDB',
    secretAccessKey: 'DummySecretAccessKeyForLocalDynamoDB',
    region: 'eu-west-1'
};
server.register({ register: dynamodb, options: options }, function (err) {
    console.log(err);
});
```

[travis-badge]: https://api.travis-ci.org/WadiInternet/hapi-dynamodb.svg
[travis-url]: https://travis-ci.org/WadiInternet/hapi-dynamodb