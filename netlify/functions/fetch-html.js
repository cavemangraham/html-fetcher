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

    // Log full <head> section
    const headMatch = html.match(/<head[^>]*>([\\s\\S]*?)<\\/head>/i);
    const headHtml = headMatch ? headMatch[0] : 'No <head> section found';
    console.log('HEAD SECTION:\\n', headHtml);

    // Extract script src URLs with regex
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    const matches = [...html.matchAll(scriptRegex)];
    const scriptSrcs = matches.map(m => m[1].toLowerCase());

    // Log each script src
    console.log('SCRIPT SOURCES FOUND:');
    scriptSrcs.forEach(src => console.log('→', src));

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
    console.error('ERROR:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Error fetching URL: ${error.message}` }),
    };
  }
};
