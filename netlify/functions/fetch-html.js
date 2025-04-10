const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

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

    const dom = new JSDOM(html);
    const scripts = [...dom.window.document.querySelectorAll('script[src]')];
    const scriptSrcs = scripts.map(script => script.src);

    const keywords = ['rb2b', 'warmly', 'vector', 'lfeeder', 'leadfeeder'];
    let webIdDetected = null;

    for (const src of scriptSrcs) {
      const matchedKeyword = keywords.find(word =>
        src.toLowerCase().includes(word)
      );
      if (matchedKeyword) {
        webIdDetected =
          matchedKeyword === 'lfeeder' || matchedKeyword === 'leadfeeder'
            ? 'leadfeeder'
            : matchedKeyword;
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
