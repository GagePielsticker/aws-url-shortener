/* Coldstart dependency loading */
const { formatResponse } = require('../../utils/response')

const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb')
const { marshall } = require('@aws-sdk/util-dynamodb')
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION })

/* Invoke handler */
exports.handler = async (event, context, callback) => {
  // /s/xxxx
  const params = event?.queryStringParameters
  console.log(`Lambda Invoked with params:\n${params ? JSON.stringify(params, null, 4) : 'NONE'}`)

  const shortID = event.pathParameters.proxy

    // validate not exist in db already
    const dbQuery = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      KeyConditionExpression: 'shortID = :shortID',
      ExpressionAttributeValues: marshall({
        ':shortID': shortID
      })
    }

    try {
      const queryCommand = new QueryCommand(dbQuery)
      const queryResponse = await dbClient.send(queryCommand)
  
      if (queryResponse.Items && queryResponse.Items.length > 0) {
        return callback(null, formatResponse({}, 302, {
          Location: queryResponse.Items[0].longID.S
        }))
      }
    } catch (error) {
      console.log(`Error checking user in database:: ${error}.`)
      return callback(null, formatResponse({ error: 'Internal Service Error.' }, 500))
    }

  return callback(null, formatResponse({
    status: 'This ID does not exist in database.'
  }, 404))
}
