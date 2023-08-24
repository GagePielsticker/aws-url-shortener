function formatResponse (data, stat, headers) {
  let statusCode

  if (!data || typeof data !== 'object') {
    data = 'Invalid Server Response.'
    statusCode = 400
  } else if (!stat) statusCode = 200
  else statusCode = stat

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin':'*',
      ...headers
    },
    body: JSON.stringify(
      {
        meta: {
          region: process.env.AWS_REGION
        },
        ...data
      }
    )
  }
}

module.exports = {
  formatResponse
}
