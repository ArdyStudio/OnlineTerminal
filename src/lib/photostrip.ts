import { PhotoSession, FrameTheme, THEMES, GridLayout } from '@/src/types';

export async function generatePhotostrip(
  photos: string[], 
  themeKey: FrameTheme = 'minimal', 
  layout: GridLayout = 'vertical'
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  const theme = THEMES[themeKey];
  const PADDING = 40;
  const GAP = 25;
  const IMAGE_ASPECT = 3 / 4;
  
  let canvasWidth = 0;
  let canvasHeight = 0;
  let footerHeight = 150;

  if (layout === 'vertical') {
    canvasWidth = 600;
    const imageWidth = canvasWidth - (PADDING * 2);
    const imageHeight = imageWidth / IMAGE_ASPECT;
    canvasHeight = (PADDING * 2) + (imageHeight * 3) + (GAP * 2) + footerHeight;
  } else if (layout === 'horizontal') {
    const imageHeight = 500;
    const imageWidth = imageHeight * IMAGE_ASPECT;
    canvasWidth = (PADDING * 2) + (imageWidth * 3) + (GAP * 2);
    canvasHeight = imageHeight + (PADDING * 2) + footerHeight;
  } else if (layout === 'grid2x2') {
    canvasWidth = 1000;
    const imageWidth = (canvasWidth - (PADDING * 2) - GAP) / 2;
    const imageHeight = imageWidth / IMAGE_ASPECT;
    canvasHeight = (PADDING * 2) + (imageHeight * 2) + GAP + footerHeight;
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Background using theme color
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < photos.length; i++) {
    const img = await loadImage(photos[i]);
    let x = PADDING;
    let y = PADDING;
    let targetWidth = 0;
    let targetHeight = 0;

    if (layout === 'vertical') {
      targetWidth = canvas.width - (PADDING * 2);
      targetHeight = targetWidth / IMAGE_ASPECT;
      y = PADDING + (i * (targetHeight + GAP));
    } else if (layout === 'horizontal') {
      targetHeight = canvas.height - (PADDING * 2) - footerHeight;
      targetWidth = targetHeight * IMAGE_ASPECT;
      x = PADDING + (i * (targetWidth + GAP));
    } else if (layout === 'grid2x2') {
      targetWidth = (canvas.width - (PADDING * 2) - GAP) / 2;
      targetHeight = targetWidth / IMAGE_ASPECT;
      x = PADDING + (i % 2) * (targetWidth + GAP);
      y = PADDING + Math.floor(i / 2) * (targetHeight + GAP);
    }

    // Draw white polaroid-like background for specific themes
    if (themeKey === 'wedding') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 5, y - 5, targetWidth + 10, targetHeight + 10);
    }

    // Draw image with object-fit: cover
    const imgAspect = img.width / img.height;
    const containerAspect = targetWidth / targetHeight;
    let sw, sh, sx, sy;

    if (imgAspect > containerAspect) {
      sh = img.height;
      sw = img.height * containerAspect;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = img.width / containerAspect;
      sx = 0;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, targetWidth, targetHeight);
    
    // Aesthetic border
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, targetWidth, targetHeight);
  }

  // Draw branding/empty slot for 2x2 if we only have 3 photos
  if (layout === 'grid2x2' && photos.length === 3) {
    const targetWidth = (canvas.width - (PADDING * 2) - GAP) / 2;
    const targetHeight = targetWidth / IMAGE_ASPECT;
    const x = PADDING + (3 % 2) * (targetWidth + GAP);
    const y = PADDING + Math.floor(3 / 2) * (targetHeight + GAP);

    ctx.fillStyle = theme.accent + '20'; // Translucent accent
    ctx.fillRect(x, y, targetWidth, targetHeight);
    
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 40px "Playfair Display"';
    ctx.textAlign = 'center';
    ctx.fillText('Aichi', x + targetWidth / 2, y + targetHeight / 2);
    ctx.font = '20px "Inter"';
    ctx.fillText('Memories', x + targetWidth / 2, y + targetHeight / 2 + 40);
  }

  // Branding Text Footer
  ctx.fillStyle = theme.text;
  ctx.textAlign = 'center';
  const textY = canvas.height - 80;
  
  ctx.font = 'italic 32px "Playfair Display"';
  ctx.fillText('Made by Love of', canvas.width / 2, textY);
  
  ctx.font = '300 16px "Inter"';
  ctx.globalAlpha = 0.6;
  ctx.fillText('Ardy & Chinta', canvas.width / 2, textY + 40);
  ctx.globalAlpha = 1.0;

  return canvas.toDataURL('image/jpeg', 0.95);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for canvas
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
