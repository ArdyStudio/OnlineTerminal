export type SessionStatus = 'idle' | 'ready' | 'counting' | 'reviewing' | 'processing' | 'review' | 'downloading';

export interface PhotoSession {
  id: string;
  timestamp: number;
  photos: string[]; // base64 images
  stripUrl?: string; // generated strip
}

export type PhotoFilter = 'none' | 'romantic' | 'mono' | 'vintage';

export const FILTERS: Record<PhotoFilter, string> = {
  none: '',
  romantic: 'sepia(0.2) saturate(1.2) hue-rotate(-10deg) brightness(1.1) contrast(1.1)',
  mono: 'grayscale(1) contrast(1.2)',
  vintage: 'sepia(0.5) contrast(0.9) brightness(1.05)',
};

export type GridLayout = 'vertical' | 'horizontal' | 'grid2x2';

export const GRID_LAYOUTS: Record<GridLayout, { name: string; description: string }> = {
  vertical: { name: 'Classic Strip', description: 'The traditional vertical photobooth strip.' },
  horizontal: { name: 'Wide Canvas', description: 'A panoramic arrangement of your moments.' },
  grid2x2: { name: 'Compact Grid', description: '2x2 grid with a dedicated branding space.' },
};

export type FrameTheme = 'minimal' | 'wedding' | 'birthday';

export const THEMES: Record<FrameTheme, { name: string; bg: string; text: string; accent: string }> = {
  minimal: { name: 'Minimal', bg: '#0a0a0a', text: '#C5A059', accent: '#C5A059' },
  wedding: { name: 'Wedding', bg: '#FFF9F9', text: '#D4AF37', accent: '#FADADD' },
  birthday: { name: 'Birthday', bg: '#1a1a2e', text: '#E94560', accent: '#0F3460' },
};
