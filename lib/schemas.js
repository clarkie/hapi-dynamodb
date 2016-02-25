'use strict';

const Joi = require('joi');

const Schemas = {

    createTable: Joi.object().keys({
        TableName : Joi.string().required(),
        KeySchema: Joi.array().required(),
        AttributeDefinitions: Joi.array().required(),
        ProvisionedThroughput: Joi.array()
    }),

    deleteTable: Joi.object().keys({
        TableName : Joi.string().required()
    }),

    writeItem: Joi.object().keys({
        TableName: Joi.string().required(),
        Item: Joi.object().required()
    }),

    // Modify this for more readItem request params
    readItems: Joi.object().keys({
        TableName: Joi.string().required(),
        KeyConditions: Joi.string(),
        KeyConditionExpression: Joi.string(),
        ExpressionAttributeNames: Joi.object(),
        ExpressionAttributeValues: Joi.object()
    }).with('KeyConditionExpression', ['ExpressionAttributeNames', 'ExpressionAttributeValues']),

    scanTable: Joi.object().keys({
        TableName : Joi.string().required()
    }),

    updateItems: Joi.object().keys({
        TableName : Joi.string().required(),
        Key: Joi.object().required(),
        UpdateExpression: Joi.string(),
        ExpressionAttributeNames: Joi.object(),
        ExpressionAttributeValues: Joi.object(),
        ReturnValues: Joi.string().valid(['NONE', 'ALL_OLD', 'UPDATED_OLD', 'ALL_NEW', 'UPDATED_NEW']).default('UPDATED_NEW')
    }),

    deleteItems: Joi.object().keys({
        Key: Joi.object().required(),
        TableName : Joi.string().required(),
        ConditionalOperator: Joi.string(),
        ConditionExpression: Joi.string(),
        Expected: Joi.object(),
        ExpressionAttributeNames: Joi.object(),
        ExpressionAttributeValues: Joi.object(),
        ReturnConsumedCapacity: Joi.string().valid(['INDEXES', 'TOTAL', 'NONE']).default('NONE')
    }),

    // Modify this for more batchWrite request params
    batchWrite: Joi.object().keys({
        RequestItems : Joi.object().required(),
        ReturnConsumedCapacity: Joi.string().valid(['INDEXES', 'TOTAL', 'NONE']).default('NONE'),
        ReturnItemCollectionMetrics: Joi.string().valid(['SIZE', 'NONE']).default('NONE')
    })
};

module.exports = Schemas;
