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
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const headHtml = headMatch ? headMatch[0] : 'No <head> section found';
    console.log('HEAD SECTION:\n', headHtml);

    // Regex to find all <script>...</script> tags
    const scriptTagRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    const scriptContents = [...html.matchAll(scriptTagRegex)].map(m => m[1].toLowerCase());

    // Also extract script srcs for good measure
    const srcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    const scriptSrcs = [...html.matchAll(srcRegex)].map(m => m[1].toLowerCase());

    console.log('SCRIPT SOURCES FOUND:');
    scriptSrcs.forEach(src => console.log('→', src));

    console.log('INLINE SCRIPT SNIPPETS FOUND:');
    scriptContents.forEach((code, i) => console.log(`Script ${i + 1}:\n`, code.slice(0, 300))); // Trim long output

    const keywords = ['rb2b', 'warmly', 'vector', 'lfeeder', 'leadfeeder'];
    let webIdDetected = null;

    // Check inline scripts
    for (const code of scriptContents) {
      const match = keywords.find(word => code.includes(word));
      if (match) {
        webIdDetected = (match === 'lfeeder' || match === 'leadfeeder') ? 'leadfeeder' : match;
        break;
      }
    }

    // If not found in inline, check script srcs
    if (!webIdDetected) {
      for (const src of scriptSrcs) {
        const match = keywords.find(word => src.includes(word));
        if (match) {
          webIdDetected = (match === 'lfeeder' || match === 'leadfeeder') ? 'leadfeeder' : match;
          break;
        }
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
