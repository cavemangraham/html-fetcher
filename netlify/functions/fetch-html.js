const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const url = event.queryStringParameters.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing `url` parameter' }),
    };
  }

  try {
    const res = await fetch(url);
    const html = await res.text();

    // Regex to find all <script src="..."> tags and extract the URLs
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    const matches = [...html.matchAll(scriptRegex)];
    const scriptSrcs = matches.map(m => m[1].toLowerCase());

    const keywords = ['rb2b', 'warmly', 'vector', 'lfeeder', 'leadfeeder'];
    let webIdDetected = null;

    for (const src of scriptSrcs) {
      const match = keywords.find(word => src.includes(word));
      if (match) {
        webIdDetected = match === 'lfeeder' || match === 'leadfeeder' ? 'leadfeeder' : match;
        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        web_id_found: !!webIdDetected,
        web_id_detected: webIdDetected,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error fetching URL: ${error.message}` }),
    };
  }
};
