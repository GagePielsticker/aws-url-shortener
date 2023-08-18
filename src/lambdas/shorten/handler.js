/* Coldstart dependency loading */
const { formatResponse } = require('../../utils/response')

const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb')
const { marshall } = require('@aws-sdk/util-dynamodb')
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION })

const { string, object } = require('yup')

const short = require('short-uuid')

/* Invoke handler */
exports.handler = async (event, context, callback) => {
  // /shorten?url=https://123.com/1234/1234
  const params = event?.queryStringParameters
  console.log(`Lambda Invoked with params:\n${params ? JSON.stringify(params, null, 4) : 'NONE'}`)

  // validate input
  const url = event.queryStringParameters.url

  const inputSchema = object({
    longUrl: string().url()
  })

  try {
    await inputSchema.validate({
      longUrl: url
    })
  } catch (error) {
    console.log(`Error validating input :: ${error}.`)
    return callback(null, formatResponse({ error: `Invalid Input. ${error}` }, 409))
  }

  // validate not exist in db already
  const dbQuery = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    IndexName: process.env.LONG_INDEX,
    KeyConditionExpression: 'longID = :longID',
    ExpressionAttributeValues: marshall({
      ':longID': url
    })
  }

  try {
    const queryCommand = new QueryCommand(dbQuery)
    const queryResponse = await dbClient.send(queryCommand)

    if (queryResponse.Items && queryResponse.Items.length > 0) {
      return callback(null, formatResponse({
        status: 'Successfully shortened URL.',
        data: queryResponse.Items[0].shortID.S
      }))
    }
  } catch (error) {
    console.log(`Error checking user in database:: ${error}.`)
    return callback(null, formatResponse({ error: 'Internal Service Error.' }, 500))
  }

  // Create DynamoDB Object
  const dbInput = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Item: {
      shortID: { S: short.generate() }, // primary key (unchangeable)
      longID: { S: url }, // secondary index key
      createdOn: { N: `${+new Date()}` } // You must send numbers to Dynamo as strings, however dynamo will treat it as a number for maths
    }
  }

  // Insert into DynamoDB
  try {
    const putCommand = new PutItemCommand(dbInput)
    await dbClient.send(putCommand)
    console.log('Successfully added link to DB.')
  } catch (error) {
    console.log(`Error when adding user to database :: ${error}.`)
    return callback(null, formatResponse({ error: 'Internal Service Error.' }, 500))
  }

  const data = {
    status: 'Successfully shortened URL.',
    data: dbInput.Item.shortID.S
  }

  return callback(null, formatResponse(data))
}
