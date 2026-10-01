/**
 * Amazon & E-Commerce 1-Click Product Importer Utility
 * Automatically extracts Product Title, Prices (Selling & MRP), High-Res Image Gallery,
 * Fabric, Category, Color, and Features from Amazon/Flipkart URLs or pasted content.
 */

import { normalizeImageUrl } from './imageUrl.js';

/**
 * Normalizes Amazon Image URLs to high-resolution (1500px)
 */
export const enhanceAmazonImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let cleanUrl = url.trim();

  // If it's a relative URL or non-http, ignore
  if (!cleanUrl.startsWith('http')) return '';

  // Exclude non-product icons, badges, logos, sprites
  if (
    cleanUrl.includes('sprite') || 
    cleanUrl.includes('transparent-pixel') || 
    cleanUrl.includes('grey-pixel') ||
    cleanUrl.includes('loading') ||
    cleanUrl.includes('logo') ||
    cleanUrl.includes('icon') ||
    cleanUrl.includes('uedata') ||
    cleanUrl.includes('amazon-fashion-logo')
  ) {
    return '';
  }

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
          const enhanced = enhanceAmazonImageUrl(url);
          if (enhanced) images.add(enhanced);
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
          if (item.hiRes) images.add(enhanceAmazonImageUrl(item.hiRes));
          else if (item.large) images.add(enhanceAmazonImageUrl(item.large));
        });
      } catch {}
    }

    // 3. Check OpenGraph image
    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      const enhanced = enhanceAmazonImageUrl(ogMatch[1]);
      if (enhanced) images.add(enhanced);
    }

    // 4. Check landingImage tag
    const landingMatch = html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i);
    if (landingMatch && landingMatch[1]) {
      const enhanced = enhanceAmazonImageUrl(landingMatch[1]);
      if (enhanced) images.add(enhanced);
    }

    // 5. Generic Amazon media CDN matches
    const mediaMatches = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[a-zA-Z0-9%_-]+\.(jpg|jpeg|png|webp)/gi);
    if (mediaMatches) {
      mediaMatches.forEach(u => {
        const enhanced = enhanceAmazonImageUrl(u);
        if (enhanced) images.add(enhanced);
      });
    }
  } catch (e) {
    console.warn("Error parsing Amazon images from HTML:", e);
  }

  return Array.from(images).filter(Boolean);
};

/**
 * Auto-detect boutique category from text
 */
export const detectBoutiqueCategory = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('saree') || text.includes('sari')) {
    return 'Sarees & Drapes';
  } else if (text.includes('lehenga') || text.includes('choli') || text.includes('ghagra')) {
    return 'Lehengas & Cholis';
  } else if (text.includes('gown') || text.includes('anarkali') || text.includes('maxi dress')) {
    return 'Gowns & Anarkalis';
  } else if (text.includes('co-ord') || text.includes('coord') || text.includes('western') || text.includes('jumpsuit')) {
    return 'Co-ord Sets';
  } else if (text.includes('dupatta') || text.includes('stole') || text.includes('shawl')) {
    return 'Dupattas & Shawls';
  } else if (text.includes('kurti') || text.includes('kurta') || text.includes('suit') || text.includes('pant set')) {
    return 'Kurtis & Suits';
  }
  return 'Kurtis & Suits';
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

  const categoryHint = detectBoutiqueCategory(title, description);

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
 * Intelligent Multi-Engine Amazon & E-Commerce Link Fetcher
 * Engine 1: Microlink Scraper with custom Amazon metadata selectors (Zero CORS, handles shortlinks)
 * Engine 2: AllOrigins JSON Reader
 * Engine 3: Heuristic ASIN Extraction Fallback
 */
export const fetchAndParseAmazonProduct = async (url) => {
  if (!url || typeof url !== 'string') {
    throw new Error('Please provide a valid product URL.');
  }

  const cleanUrl = url.trim();

  // --------------------------------------------------------------------------
  // ENGINE 1: Microlink Open Metadata API with Custom Amazon Selectors
  // --------------------------------------------------------------------------
  try {
    const customSelectors = {
      price: { selector: '.a-price-whole, #priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen' },
      mrp: { selector: '.basisPrice .a-offscreen, .a-text-price .a-offscreen, #priceblock_sns_price' },
      images: { selectorAll: 'img', attr: 'src' },
      fabric: { selector: '#productOverview_feature_div tr:nth-child(1) td:nth-child(2), #productOverview_feature_div tr:nth-child(2) td:nth-child(2)' },
      bullets: { selectorAll: '#feature-bullets li span.a-list-item' }
    };

    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}` +
      `&data.price=${encodeURIComponent(JSON.stringify(customSelectors.price))}` +
      `&data.mrp=${encodeURIComponent(JSON.stringify(customSelectors.mrp))}` +
      `&data.images=${encodeURIComponent(JSON.stringify(customSelectors.images))}` +
      `&data.fabric=${encodeURIComponent(JSON.stringify(customSelectors.fabric))}` +
      `&data.bullets=${encodeURIComponent(JSON.stringify(customSelectors.bullets))}`;

    const res = await fetch(microlinkUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.status === 'success' && json.data) {
        const d = json.data;
        let title = (d.title || '').trim();
        title = title.replace(/^Buy\s+/i, '')
                     .replace(/\s*:\s*Amazon\.[a-z.]+/i, '')
                     .replace(/\s+at\s+Amazon\.[a-z.]+/i, '')
                     .replace(/\s+from\s+[a-zA-Z\s]+at\s+Amazon\.[a-z.]+/i, '')
                     .trim();

        // Extract Price
        let price = 0;
        if (d.price) {
          const rawP = String(d.price).replace(/[^0-9.]/g, '');
          price = parseFloat(rawP) || 0;
        }

        // Extract MRP
        let originalPrice = 0;
        if (d.mrp) {
          const rawMrp = String(d.mrp).replace(/[^0-9.]/g, '');
          originalPrice = parseFloat(rawMrp) || 0;
        }
        if (!originalPrice || originalPrice <= price) {
          originalPrice = price > 0 ? Math.round(price * 1.6) : 1999;
        }

        // Collect Multi-Photos
        const photoSet = new Set();
        if (d.image?.url) {
          const primaryEnhanced = enhanceAmazonImageUrl(d.image.url);
          if (primaryEnhanced) photoSet.add(primaryEnhanced);
        }

        if (Array.isArray(d.images)) {
          d.images.forEach(imgUrl => {
            if (typeof imgUrl === 'string' && imgUrl.includes('media-amazon.com/images/I/')) {
              const enhanced = enhanceAmazonImageUrl(imgUrl);
              if (enhanced) photoSet.add(enhanced);
            }
          });
        }

        const photoList = Array.from(photoSet);
        if (photoList.length === 0) {
          photoList.push('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80');
        }

        // Extract Description & Bullets
        let description = '';
        if (Array.isArray(d.bullets) && d.bullets.length > 0) {
          description = d.bullets.slice(0, 5).map(b => `• ${String(b).trim()}`).join('\n');
        } else if (d.description) {
          description = d.description;
        } else {
          description = 'Handcrafted premium ethnic fashion ensemble with exquisite embroidery and festive luxury finish.';
        }

        // Extract Fabric & Category
        const fabric = d.fabric ? String(d.fabric).trim() : 'Pure Silk / Cotton';
        const categoryHint = detectBoutiqueCategory(title, description);

        if (title || photoList.length > 0) {
          return {
            name: title || 'Imported Fashion Outfit',
            price: price || 999,
            originalPrice: originalPrice || 1999,
            image: photoList[0],
            images: photoList.slice(0, 6),
            fabric: fabric,
            color: 'Multicolor',
            category: categoryHint,
            description: description,
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            badge: 'Trending Import',
            offer: 'Online Exclusive Offer',
            inStock: true,
            rating: 4.8,
            reviewsCount: 24,
            sourceUrl: d.url || cleanUrl
          };
        }
      }
    }
  } catch (err) {
    console.warn("Microlink extraction warning:", err);
  }

  // --------------------------------------------------------------------------
  // ENGINE 2: AllOrigins JSON API Proxy Fallback
  // --------------------------------------------------------------------------
  try {
    const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(allOriginsUrl);
    if (res.ok) {
      const json = await res.json();
      if (json && json.contents) {
        const product = parseAmazonProductHtml(json.contents, cleanUrl);
        if (product.name && product.image) {
          return product;
        }
      }
    }
  } catch (err) {
    console.warn("AllOrigins fallback warning:", err);
  }

  // --------------------------------------------------------------------------
  // ENGINE 3: ASIN & URL Heuristic Fallback
  // --------------------------------------------------------------------------
  const asinMatch = cleanUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  if (asinMatch && asinMatch[1]) {
    const asin = asinMatch[1];
    return {
      name: `Amazon Designer Outfit (ASIN: ${asin})`,
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

  throw new Error('Could not auto-extract product from this link. Please copy and paste the product text in the "Smart Paste" tab to auto-fill instantly!');
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
  name = name.replace(/(?:₹|Rs\.?|INR)\s*[\d,]+/gi, '').trim();

  // Extract Images if image URLs are found in the text
  const imgUrlRegex = /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|webp))/gi;
  const foundImages = rawText.match(imgUrlRegex) || [];
  const cleanImages = foundImages.map(u => enhanceAmazonImageUrl(u)).filter(Boolean);

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

  const categoryHint = detectBoutiqueCategory(name, rawText);

  return {
    name: name.slice(0, 100),
    price: price || 999,
    originalPrice: originalPrice || 1999,
    image: cleanImages[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    images: cleanImages.length > 0 ? cleanImages.slice(0, 6) : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
    fabric: fabric,
    color: color,
    category: categoryHint,
    description: lines.slice(1, 6).join('\n') || 'Handcrafted ethnic design with supreme comfort and festive elegance.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    badge: 'Quick Import',
    offer: 'Best Price Guarantee',
    inStock: true,
    rating: 4.8,
    reviewsCount: 15
  };
};
