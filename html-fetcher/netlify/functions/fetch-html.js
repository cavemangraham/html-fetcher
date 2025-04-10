const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const url = event.queryStringParameters.url;
  
  if (!url) {
    return {
      statusCode: 400,
      body: 'Missing `url` parameter',
    };
  }

  try {
    const res = await fetch(url);
    const html = await res.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: html,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error fetching URL: ${error.message}`,
    };
  }
};