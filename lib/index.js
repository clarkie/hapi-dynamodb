'use strict';

// Load Modules
const AWS = require('aws-sdk');
const Hoek = require('hoek');
const Joi = require('joi');

// Load Configs
const Schemas = require('./schemas');

// internals
let internals = {};
internals.defaults = {
    accessKeyId: 'DummyKeyForLocalDynamoDB',
    secretAccessKey: 'DummySecretAccessKeyForLocalDynamoDB',
    region: 'eu-west-1',
    httpOptions: { timeout: 5000 },
    dynamoEndpoint: 'http://127.0.0.1:8000'
};
internals.createTableFormat = {
    TableName : null,
    KeySchema: [],
    AttributeDefinitions: [],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 10
    }
};

// Methods

/**
 * Check if table exists in DynamoDb
 * @param tableName
 *          string
 * @param cb
 */
internals.doesTableExist = function (tableName, cb) {

    Hoek.assert(tableName, 'Check if Table Exists -> table name is required');
    internals.superClient.describeTable({ TableName: tableName }, function (err, data) {

        cb(err, data);
    });
};

/**
 * Delete table in DynamoDb
 * @param cb
 */
internals.deleteTable = function (tableName, cb) {

    var json = { TableName: tableName };
    Joi.validate(json, Schemas.deleteTable, function (err, value) {

        if (!err) {
            internals.superClient.deleteTable(value, function (err, data) {

                cb(err, data);
            });
        } else {
            cb(err, null);
        }
    });
};

/**
 * Get DocClient for DynamoDb
 * @param cb
 */
internals.getClient = function (cb) {

    cb(null, internals.client);
};

/**
 * Get a list of all tables from DynamoDb
 * @param cb
 */
internals.listTables = function (cb) {

    internals.superClient.listTables(function (err, data) {

        cb(err, data);
    });
};

/**
 * Read item(s) from DynamoDb
 * @param cb
 */
internals.read = function (query, cb) {

    Joi.validate(query, Schemas.readItems, function (err, value) {

        if (err) {
            return cb(err, value);
        }
        internals.client.query(value, function (err, data) {

            cb(err, data);
        });
    });
};

/**
 * Write item to DynamoDb
 * @param cb
 */
internals.write = function (item, cb) {

    Joi.validate(item, Schemas.writeItem, function (err, value) {

        if (err) {
            return cb(err, value);
        }
        internals.client.put(value, function (err, res) {

            cb(err, res);
        });
    });
};

/**
 * Write multiple items to DynamoDb
 * @param cb
 */
internals.batchWrite = function (items, cb) {

    Joi.validate(items, Schemas.batchWrite, function (err, value) {

        if (err) {
            return cb(err, value);
        }
        internals.client.batchWrite(value, function (err, res) {

            cb(err, res);
        });
    });
};

/**
 * Update item(s) in DynamoDb
 * @param cb
 */
internals.update = function (items, cb) {

    Joi.validate(items, Schemas.updateItems, function (err, value) {

        if (err) {
            return cb(err, value);
        }
        internals.client.update(value, function (err, res) {

            cb(err, res);
        });
    });
};

/**
 * Delete item(s) in DynamoDb
 * @param cb
 */
internals.delete = function (items, cb) {

    Joi.validate(items, Schemas.deleteItems, function (err, value) {

        if (err) {
            return cb(err, value);
        }
        internals.client.delete(value, function (err, data) {

            cb(err, data);
        });
    });
};

/**
 * Scan entire table in DynamoDb
 * @param cb
 */
internals.scan = function (scan, cb) {

    let records = [];
    let onScan = function (err, data) {

        if (err) {
            cb(err, null);
        } else {
            data.Items.forEach(function (item) {

                records.push(item);
            });

            // continue scanning if more records
            if (typeof data.LastEvaluatedKey !== 'undefined') {
                scan.ExclusiveStartKey = data.LastEvaluatedKey;
                internals.client.scan(scan, onScan);
            } else {
                cb(null, records);
            }
        }
    };

    Joi.validate(scan, Schemas.scanTable, function (err, value) {

        if (err) {
            return cb(err, value);
        }
        internals.client.scan(scan, onScan);
    });
};

/**
 * Create table in DynamoDb
 * @param cb
 */
internals.createTable = function (table, cb) {

    Joi.validate(table, Schemas.createTable, function (err, value) {

        if (!err) {
            var json = Hoek.applyToDefaults(internals.createTableFormat, value);
            internals.superClient.createTable(json, function (err, data) {

                cb(err, data);
            });
        } else {
            cb(err, value);
        }
    });
};

module.exports.register = function (server, options, next) {

    internals.config = Hoek.applyToDefaults(internals.defaults, options);
    Hoek.assert(internals.config.dynamoEndpoint, 'DynamoDb endpoint is required');

    AWS.config.update(internals.config);

    let databaseConfig = { endpoint: new AWS.Endpoint(internals.config.dynamoEndpoint) };
    internals.superClient = new AWS.DynamoDB(databaseConfig);
    internals.client = new AWS.DynamoDB.DocumentClient(databaseConfig);

    if (internals.config.tables) {
        internals.config.tables.map(function (value, index) {

            var cb = function (err, res) {

                if (err) {
                    internals.createTable(value, function (err, response) {

                        // Everythings right with the world
                    });
                } else {
                    // Table already exists
                }
            };

            internals.doesTableExist(value.TableName, cb);
        });
    }

    server.method('dynamo.client', internals.getClient);
    server.method('dynamo.read', internals.read);
    server.method('dynamo.write', internals.write);
    server.method('dynamo.update', internals.update);
    server.method('dynamo.delete', internals.delete);
    server.method('dynamo.scan', internals.scan);
    server.method('dynamo.batchWrite', internals.batchWrite);
    server.method('dynamo.createTable', internals.createTable);
    server.method('dynamo.deleteTable', internals.deleteTable);
    server.method('dynamo.doesTableExist', internals.doesTableExist);
    server.method('dynamo.listTables', internals.listTables);

    next();
};

module.exports.register.attributes = {
    multiple: false,
    pkg: require('./../package.json')
};
