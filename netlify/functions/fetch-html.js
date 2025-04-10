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

    // Extract favicon
    let faviconLink = null;
    const faviconMatch =
      html.match(/<link[^>]+(?:rel=["'](?:shortcut\s+)?icon["'])[^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["']/i);
    if (faviconMatch) {
      faviconLink = new URL(faviconMatch[1], url).href;
    }

    // Extract inline script contents
    const scriptTagRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    const scriptContents = [...html.matchAll(scriptTagRegex)].map(m => m[1].toLowerCase());

    // Extract script src URLs
    const srcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    const scriptSrcs = [...html.matchAll(srcRegex)].map(m => m[1].toLowerCase());

    console.log('SCRIPT SOURCES FOUND:');
    scriptSrcs.forEach(src => console.log('→', src));

    console.log('INLINE SCRIPT SNIPPETS FOUND:');
    scriptContents.forEach((code, i) => console.log(`Script ${i + 1}:\n`, code.slice(0, 300)));

    // Keywords and normalization map
    const keywordMap = {
      rb2b: 'rb2b',
      reb2b: 'rb2b',
      warmly: 'warmly',
      vector: 'vector',
      lfeeder: 'leadfeeder',
      leadfeeder: 'leadfeeder',
    };

    const chatKeywords = [
      'livechatinc',
      'zdassets',
      'driftt',
      'salesiq',
      'tidio',
      'olark',
      'crisp',
      'intercom',
      'tawk',
      'hs-scripts',
      '@n8n/chat',
      'hubspotconversations'
    ];

    let webIdDetected = null;
    let chatWidgetDetected = null;

    const allCode = [...scriptContents, ...scriptSrcs];

    // Detect web ID tool
    for (const code of allCode) {
      const match = Object.keys(keywordMap).find(word => code.includes(word));
      if (match) {
        webIdDetected = keywordMap[match];
        break;
      }
    }

    // Detect chat widget
    for (const code of allCode) {
      const match = chatKeywords.find(word => code.includes(word));
      if (match) {
        chatWidgetDetected = match;
        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        web_id_found: !!webIdDetected,
        web_id_detected: webIdDetected,
        favicon_link: faviconLink,
        has_chat_widget: !!chatWidgetDetected,
        chat_widget_detected: chatWidgetDetected,
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
