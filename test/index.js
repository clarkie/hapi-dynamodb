'use strict';

// Load Modules
const Hapi = require('hapi');
const Joi = require('joi');

const Code = require('code');
const Lab = require('lab');
const DynamoHapi = require('..');

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const internals = {};
internals.defaultTable = 'test_table';

// Schemas
internals.responseSchemas = {};
internals.responseSchemas.listTablesSchema = Joi.object().keys({
    TableNames : Joi.array().required()
});
internals.responseSchemas.scanSchema = Joi.array();

internals.defaultOptions = {
    dynamoEndpoint: 'http://120.0.0.1:8000/',
    tables: [{
        TableName: internals.defaultTable,
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
        ]
    }]
};

describe('dynamo-hapi plugin', function () {

    it('tries to register a plugin with hapijs, with default configuration', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();
            done();
        });
    });

    it('tries to register a plugin with hapijs, with NO default configuration', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi }, function (err) {

            expect(err).to.not.exist();
            done();
        });
    });

    it('should get dynamodb client object', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();
            Server.methods.dynamo.client(function (err, client) {

                expect(err).to.not.exist();
                expect(client).to.exist();
                done();
            });
        });
    });

    it('should fail as it tries to delete a table, but no table name provided. Joi validation fails', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();
            Server.methods.dynamo.deleteTable(null, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('tries to delete a non-existing table', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();
            Server.methods.dynamo.deleteTable('non-existing-table-name', function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('tries to describe a non-existant table in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();
            Server.methods.dynamo.doesTableExist('non-existing-table-name', function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('should fail to create a new table due to invalid reques schema', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();
            let create = JSON.parse(JSON.stringify(internals.defaultOptions.tables[0]));
            delete create.TableName;
            Server.methods.dynamo.createTable(create, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('should delete an existing table in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();
            Server.methods.dynamo.deleteTable(internals.defaultTable, function (err, res) {

                expect(err).to.not.exist();
                done();
            });
        });
    });

    it('should list all tables in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();
            Server.methods.dynamo.listTables(function (err, res) {

                expect(err).to.not.exist();
                Joi.validate(res, internals.responseSchemas.listTablesSchema, function (err, value) {

                    expect(err).to.not.exist();
                    expect(value).to.exist();
                });
                done();
            });
        });
    });

    it('should write item into a table in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let item = {
                TableName: internals.defaultTable,
                Item: {
                    id: '/apple/',
                    template_string: '<div></div>',
                    platform: 'web'
                }
            };
            Server.methods.dynamo.write(item, function (err, res) {

                expect(err).to.not.exist();
                done();
            });
        });
    });

    it('should batch write in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let items = {
                RequestItems: { }
            };
            items.RequestItems[internals.defaultTable] = [];
            for (let i = 0; i < 10; i++) {
                let put = {
                    PutRequest: {
                        Item: { }
                    }
                };
                let x = '12345678901234567890123456789012345678901234567890123456789012345678901234567890';
                let iterations = 7;
                for (let j = 0; j < iterations; j++) {
                    x += x + x;
                }
                put.PutRequest.Item = {
                    'id': '/apple' + i + '/',
                    'template_string': x
                };
                items.RequestItems[internals.defaultTable].push(put);
            }
            Server.methods.dynamo.batchWrite(items, function (err, res) {

                expect(err).to.not.exist();
                expect(res).to.exist();
                done();
            });
        });
    });

    it('should fail to batch write in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let items = {
                RequestItems1: {
                    'en_SA': [ ]
                }
            };
            Server.methods.dynamo.batchWrite(items, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('should scan entire table in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            var req = {
                TableName: internals.defaultTable
            };
            Server.methods.dynamo.scan(req, function (err, res) {

                expect(err).to.not.exist();
                Joi.validate(res, internals.responseSchemas.scanSchema, function (err, value) {

                    expect(err).to.not.exist();
                    expect(value).to.exist();
                });
                done();
            });
        });
    });

    it('should fail to scan due to invalid read request schema', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            var scan = {
                TableName1: internals.defaultTable
            };
            Server.methods.dynamo.scan(scan, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('should fail to read table due to invalid read request schema', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let read = {
                TableName1: internals.defaultTable
            };
            Server.methods.dynamo.read(read, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('should throw error for invalid scan request, e.g. non-existant table', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            var scan = {
                TableName: 'en_AE'
            };
            Server.methods.dynamo.scan(scan, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('should fail to write table due to invalid write request schema', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let write = {
                TableName1: internals.defaultTable
            };
            Server.methods.dynamo.write(write, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('tries to update a key in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let updateItems = {
                TableName: internals.defaultTable,
                Key: {
                    'id': '/apple/'
                },
                UpdateExpression: 'SET template_string = :tr',
                ExpressionAttributeValues: {
                    ':tr': '<span>Updated</span>'
                }
            };
            Server.methods.dynamo.update(updateItems, function (err, res) {

                expect(err).to.not.exist();
                expect(res).to.exist();
                done();
            });
        });
    });

    it('should fail to update table due to invalid request schema', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let updateItems = {
                TableName1: internals.defaultTable
            };
            Server.methods.dynamo.update(updateItems, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });

    it('should read an item from table in dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let query = {
                TableName: internals.defaultTable,
                KeyConditionExpression: '#id = :link',
                ExpressionAttributeNames:{
                    '#id': 'id'
                },
                ExpressionAttributeValues: {
                    ':link': '/apple/'
                }
            };
            Server.methods.dynamo.read(query, function (err, res) {

                expect(err).to.not.exist();
                expect(res).to.exist();
                done();
            });
        });
    });

    it('should delete an item from dynamodb', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let deleteItems = {
                TableName: internals.defaultTable,
                Key: {
                    'id': '/apple/'
                }
            };
            Server.methods.dynamo.delete(deleteItems, function (err, res) {

                expect(err).to.not.exist();
                expect(res).to.exist();
                done();
            });
        });
    });

    it('should fail to delete items in table due to invalid request schema', function (done) {

        let Server = new Hapi.Server();
        Server.connection();

        Server.register({ register: DynamoHapi, options: internals.defaultOptions }, function (err) {

            expect(err).to.not.exist();

            let items = {
                TableName1: internals.defaultTable
            };
            Server.methods.dynamo.delete(items, function (err, res) {

                expect(err).to.exist();
                done();
            });
        });
    });
});
