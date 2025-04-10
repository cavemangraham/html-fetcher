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
    const faviconMatch = html.match(/<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i);
    const faviconLink = faviconMatch ? new URL(faviconMatch[1], url).href : null;

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

    let webIdDetected = null;

    // Check inline scripts
    for (const code of scriptContents) {
      const match = Object.keys(keywordMap).find(word => code.includes(word));
      if (match) {
        webIdDetected = keywordMap[match];
        break;
      }
    }

    // If not found in inline, check src URLs
    if (!webIdDetected) {
      for (const src of scriptSrcs) {
        const match = Object.keys(keywordMap).find(word => src.includes(word));
        if (match) {
          webIdDetected = keywordMap[match];
          break;
        }
      }
    }

    // Try to find main background color
    let mainColor = null;

    // Inline style in body
    const bodyTagMatch = html.match(/<body[^>]*style=["'][^"']*background[^"']*["']/i);
    if (bodyTagMatch) {
      const bgColorMatch = bodyTagMatch[0].match(/background(-color)?:\s*([^;"']+)/i);
      if (bgColorMatch) {
        mainColor = bgColorMatch[2].trim();
      }
    }

    // If still not found, try basic CSS detection from <style> tags
    if (!mainColor) {
      const styleTags = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
      for (const css of styleTags) {
        const bodyBgMatch = css.match(/body\s*{[^}]*background(-color)?:\s*([^;}]+)[;}]/i);
        if (bodyBgMatch) {
          mainColor = bodyBgMatch[2].trim();
          break;
        }
      }
    }

    // Normalize if color is in rgb(...) or named
    if (mainColor && mainColor.startsWith('rgb')) {
      const rgb = mainColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgb) {
        const [r, g, b] = rgb.slice(1).map(Number);
        mainColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        web_id_found: !!webIdDetected,
        web_id_detected: webIdDetected,
        favicon_link: faviconLink,
        main_color: mainColor,
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
