/**
 * Amazon & E-Commerce 1-Click Product Importer Utility
 * Automatically extracts Product Title, Prices (Selling & MRP), High-Res Image Gallery,
 * Fabric, Category, Color, and Features from Amazon/Flipkart URLs or pasted content.
 */

import { normalizeImageUrl } from './imageUrl';

/**
 * Normalizes Amazon Image URLs to high-resolution (1500px)
 */
export const enhanceAmazonImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let cleanUrl = url.trim();

  // Amazon image resolution enhancer: replace thumbnail suffixes with SL1500
  // e.g. https://m.media-amazon.com/images/I/71XXXXX._AC_UL320_.jpg -> ._SL1500_.jpg
  cleanUrl = cleanUrl.replace(/\._[A-Z0-9_,]+_\.(jpg|jpeg|png|webp)/i, '._SL1500_.$1');
  
  return cleanUrl;
};

/**
 * Extracts multiple high-res images from Amazon HTML
 */
export const extractAmazonImagesFromHtml = (html) => {
  const images = new Set();

  try {
    // 1. Check data-a-dynamic-image attribute (Amazon's high-res image map JSON)
    const dynamicImgRegex = /data-a-dynamic-image=["']({[^"']+})["']/g;
    let match;
    while ((match = dynamicImgRegex.exec(html)) !== null) {
      try {
        const decoded = match[1].replace(/&quot;/g, '"');
        const imgMap = JSON.parse(decoded);
        Object.keys(imgMap).forEach((url) => {
          if (url && url.startsWith('http')) {
            images.add(enhanceAmazonImageUrl(url));
          }
        });
      } catch (err) {
        // Continue
      }
    }

    // 2. Check 'colorImages': { 'initial': [ ... ] } script block
    const colorImagesRegex = /'colorImages':\s*\{\s*'initial':\s*(\[[^\]]+\])/;
    const colorMatch = html.match(colorImagesRegex);
    if (colorMatch && colorMatch[1]) {
      try {
        const parsed = JSON.parse(colorMatch[1]);
        parsed.forEach((item) => {
          if (item.hiRes) images.add(item.hiRes);
          else if (item.large) images.add(enhanceAmazonImageUrl(item.large));
        });
      } catch {}
    }

    // 3. Check OpenGraph image
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      images.add(enhanceAmazonImageUrl(ogMatch[1]));
    }

    // 4. Check landingImage tag
    const landingMatch = html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i);
    if (landingMatch && landingMatch[1]) {
      images.add(enhanceAmazonImageUrl(landingMatch[1]));
    }

    // 5. Generic Amazon media CDN matches
    const mediaMatches = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[a-zA-Z0-9%_-]+\.(jpg|jpeg|png|webp)/gi);
    if (mediaMatches) {
      mediaMatches.slice(0, 10).forEach(u => images.add(enhanceAmazonImageUrl(u)));
    }
  } catch (e) {
    console.warn("Error parsing Amazon images from HTML:", e);
  }

  return Array.from(images).filter(url => !url.includes('sprite') && !url.includes('transparent-pixel') && !url.includes('icon'));
};

/**
 * Parses raw HTML string from Amazon product page
 */
export const parseAmazonProductHtml = (html, sourceUrl = '') => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Product Title
  let title = '';
  const titleEl = doc.querySelector('#productTitle') || 
                  doc.querySelector('#title') ||
                  doc.querySelector('h1.a-size-large') ||
                  doc.querySelector('meta[property="og:title"]');
  if (titleEl) {
    title = (titleEl.tagName === 'META' ? titleEl.getAttribute('content') : titleEl.textContent || '').trim();
    // Clean trailing site name
    title = title.replace(/\s*:\s*Amazon\.[a-z.]+/i, '').replace(/\|\s*Amazon\.[a-z.]+/i, '').trim();
  }

  // 2. Pricing (Current Selling Price)
  let price = 0;
  const priceWholeEl = doc.querySelector('.a-price .a-price-whole') ||
                       doc.querySelector('#priceblock_ourprice') ||
                       doc.querySelector('#priceblock_dealprice') ||
                       doc.querySelector('.a-price .a-offscreen');
  if (priceWholeEl) {
    const rawPrice = priceWholeEl.textContent.replace(/[^0-9.]/g, '');
    price = parseFloat(rawPrice) || 0;
  }

  // 3. Original Price (MRP / Regular Price)
  let originalPrice = 0;
  const mrpEl = doc.querySelector('.basisPrice .a-offscreen') ||
                doc.querySelector('.a-text-price .a-offscreen') ||
                doc.querySelector('#priceblock_sns_price');
  if (mrpEl) {
    const rawMrp = mrpEl.textContent.replace(/[^0-9.]/g, '');
    originalPrice = parseFloat(rawMrp) || 0;
  }
  if (!originalPrice || originalPrice <= price) {
    originalPrice = price > 0 ? Math.round(price * 1.5) : 1999;
  }

  // 4. Extract Images
  let images = extractAmazonImagesFromHtml(html);
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'];
  }

  // 5. Fabric & Product Overview Table
  let fabric = 'Pure Cotton / Silk';
  let color = 'Multicolor';
  let categoryHint = '';

  const poRows = doc.querySelectorAll('#productOverview_feature_div tr, #poExpander tr, .po-row');
  poRows.forEach(row => {
    const text = row.textContent || '';
    if (/material|fabric/i.test(text)) {
      const val = row.querySelector('.po-break-word, td:last-child')?.textContent?.trim();
      if (val) fabric = val;
    }
    if (/colour|color/i.test(text)) {
      const val = row.querySelector('.po-break-word, td:last-child')?.textContent?.trim();
      if (val) color = val;
    }
  });

  // 6. Bullet Points & Description
  const bulletEls = doc.querySelectorAll('#feature-bullets ul li:not(.aok-hidden), #feature-bullets li span.a-list-item');
  const bulletTexts = [];
  bulletEls.forEach(b => {
    const txt = b.textContent.trim();
    if (txt && !txt.includes('Replacement') && !txt.includes('Warranty') && txt.length > 5) {
      bulletTexts.push(`• ${txt}`);
    }
  });

  let description = bulletTexts.slice(0, 5).join('\n');
  if (!description) {
    const descEl = doc.querySelector('#productDescription p, #productDescription');
    if (descEl) description = descEl.textContent.trim();
  }
  if (!description) {
    description = 'Handcrafted premium ethnic fashion ensemble with exquisite embroidery and festive luxury finish.';
  }

  // 7. Auto-detect boutique category from Title/Description
  const combinedText = `${title} ${description}`.toLowerCase();
  if (combinedText.includes('kurti') || combinedText.includes('kurta') || combinedText.includes('suit')) {
    categoryHint = 'Kurtis & Suits';
  } else if (combinedText.includes('saree') || combinedText.includes('sari')) {
    categoryHint = 'Sarees & Drapes';
  } else if (combinedText.includes('lehenga') || combinedText.includes('choli')) {
    categoryHint = 'Lehengas & Cholis';
  } else if (combinedText.includes('dress') || combinedText.includes('gown') || combinedText.includes('anarkali')) {
    categoryHint = 'Gowns & Anarkalis';
  } else if (combinedText.includes('co-ord') || combinedText.includes('coord') || combinedText.includes('western')) {
    categoryHint = 'Co-ord Sets';
  } else if (combinedText.includes('dupatta') || combinedText.includes('stole')) {
    categoryHint = 'Dupattas & Shawls';
  } else {
    categoryHint = 'Kurtis & Suits';
  }

  return {
    name: title || 'Imported Fashion Ensemble',
    price: price || 999,
    originalPrice: originalPrice || 1999,
    image: images[0],
    images: images.slice(0, 6),
    fabric: fabric,
    color: color,
    category: categoryHint,
    description: description,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    badge: 'Trending Import',
    offer: 'Special Online Discount',
    inStock: true,
    rating: 4.8,
    reviewsCount: 24,
    sourceUrl: sourceUrl
  };
};

/**
 * Intelligent Multi-Proxy Amazon URL Fetcher
 */
export const fetchAndParseAmazonProduct = async (url) => {
  if (!url || typeof url !== 'string') {
    throw new Error('Please provide a valid product URL.');
  }

  const cleanUrl = url.trim();

  // Array of public CORS proxy services for fallback resilience
  const proxyEndpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(cleanUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`
  ];

  let lastError = null;

  for (const proxyUrl of proxyEndpoints) {
    try {
      const res = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!res.ok) continue;

      const html = await res.text();
      if (html && (html.includes('productTitle') || html.includes('landingImage') || html.includes('a-price') || html.includes('og:title') || html.includes('media-amazon.com'))) {
        const product = parseAmazonProductHtml(html, cleanUrl);
        if (product.name && product.image) {
          return product;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  // If live proxy failed (e.g., due to Amazon anti-bot), extract ASIN & basic metadata from URL itself
  const asinMatch = cleanUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  if (asinMatch && asinMatch[1]) {
    const asin = asinMatch[1];
    return {
      name: `Amazon Item (ASIN: ${asin})`,
      price: 999,
      originalPrice: 1999,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
      fabric: 'Pure Cotton / Silk',
      color: 'Multicolor',
      category: 'Kurtis & Suits',
      description: `Product imported via Amazon ASIN ${asin}. You can edit the title and photos above.`,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      badge: 'Amazon Import',
      offer: 'Festive Special',
      inStock: true,
      rating: 4.8,
      reviewsCount: 18,
      sourceUrl: cleanUrl,
      partialImport: true
    };
  }

  throw new Error(lastError ? lastError.message : 'Could not fetch product details from this link. Please use "Paste Amazon Text / HTML" tab to import instantly!');
};

/**
 * Smart Text Parser for copied Amazon/Flipkart share messages or product descriptions
 */
export const parsePastedProductText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Please paste text to parse.');
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract Price
  let price = 0;
  let originalPrice = 0;
  
  const priceMatches = rawText.match(/(?:₹|Rs\.?|INR)\s*([\d,]+)/gi);
  if (priceMatches && priceMatches.length > 0) {
    const parsedPrices = priceMatches.map(p => parseFloat(p.replace(/[^0-9]/g, ''))).filter(n => n > 0);
    if (parsedPrices.length === 1) {
      price = parsedPrices[0];
      originalPrice = Math.round(price * 1.5);
    } else if (parsedPrices.length >= 2) {
      price = Math.min(...parsedPrices);
      originalPrice = Math.max(...parsedPrices);
    }
  }

  // Extract Title (First substantial line)
  let name = lines[0] || 'Imported Fashion Kurti';
  // Filter out price from title line if present
  name = name.replace(/(?:₹|Rs\.?|INR)\s*[\d,]+/gi, '').trim();

  // Extract Images if image URLs are found in the text
  const imgUrlRegex = /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|webp))/gi;
  const foundImages = rawText.match(imgUrlRegex) || [];
  const cleanImages = foundImages.map(u => enhanceAmazonImageUrl(u));

  // Fabric extraction
  let fabric = 'Pure Cotton / Silk';
  const fabricMatch = rawText.match(/(?:Fabric|Material|Cloth)\s*:\s*([A-Za-z\s]+)/i);
  if (fabricMatch && fabricMatch[1]) {
    fabric = fabricMatch[1].trim();
  }

  // Color extraction
  let color = 'Multicolor';
  const colorMatch = rawText.match(/(?:Color|Colour)\s*:\s*([A-Za-z\s]+)/i);
  if (colorMatch && colorMatch[1]) {
    color = colorMatch[1].trim();
  }

  return {
    name: name.slice(0, 100),
    price: price || 999,
    originalPrice: originalPrice || 1999,
    image: cleanImages[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    images: cleanImages.length > 0 ? cleanImages.slice(0, 6) : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
    fabric: fabric,
    color: color,
    category: name.toLowerCase().includes('saree') ? 'Sarees & Drapes' : (name.toLowerCase().includes('lehenga') ? 'Lehengas & Cholis' : 'Kurtis & Suits'),
    description: lines.slice(1, 6).join('\n') || 'Handcrafted ethnic design with supreme comfort and festive elegance.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    badge: 'Quick Import',
    offer: 'Best Price Guarantee',
    inStock: true,
    rating: 4.8,
    reviewsCount: 15
  };
};
