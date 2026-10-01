/**
 * Compress an image file on the client before saving.
 * Reduces 5MB-15MB camera photos down to 30KB-60KB while preserving high visual sharpness.
 */
export const compressImageFile = (file, maxWidth = 650, maxHeight = 850, quality = 0.74) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      compressDataUrl(dataUrl, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(() => resolve(dataUrl));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compresses an existing Base64 / Data URL to ultra-efficient WebP format (~30KB)
 */
export const compressDataUrl = (dataUrl, maxWidth = 650, maxHeight = 850, quality = 0.74) => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      resolve('');
      return;
    }

    // If it's already an external HTTP/HTTPS URL, don't compress
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://') || dataUrl.startsWith('/')) {
      resolve(dataUrl);
      return;
    }

    if (!dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      let width = img.width || 600;
      let height = img.height || 800;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP for max compression
      try {
        const webpData = canvas.toDataURL('image/webp', quality);
        if (webpData.startsWith('data:image/webp') && webpData.length < dataUrl.length) {
          resolve(webpData);
          return;
        }
      } catch {
        // fallback
      }

      try {
        const jpegData = canvas.toDataURL('image/jpeg', quality);
        if (jpegData.length < dataUrl.length) {
          resolve(jpegData);
          return;
        }
      } catch {
        // fallback
      }

      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
};

