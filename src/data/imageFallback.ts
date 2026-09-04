import type React from 'react';

/**
 * Safe Image Fallback Utilities for AbirTune
 * Generates instant, elegant, high-contrast SVG data URIs or verified CDN fallbacks
 * ensuring zero broken image icons or empty grey boxes ever appear.
 */

export function getSafeImageFallback(
  type: 'artist' | 'album' | 'track' = 'track',
  label: string = 'AbirTune'
): string {
  const cleanLabel = (label || 'Music')
    .slice(0, 18)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  const initial = (label || 'M').charAt(0).toUpperCase();

  const isArtist = type === 'artist';
  const gradStart = isArtist ? '#ff2d55' : '#1f1f23';
  const gradEnd = isArtist ? '#e11d48' : '#09090b';

  const svg = isArtist
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${gradStart}"/>
            <stop offset="100%" stop-color="${gradEnd}"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#g)"/>
        <circle cx="100" cy="80" r="32" fill="rgba(255,255,255,0.85)"/>
        <path d="M45 165 C55 125, 145 125, 155 165 Z" fill="rgba(255,255,255,0.85)"/>
        <text x="100" y="88" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="28" font-weight="900" fill="${gradEnd}" text-anchor="middle">${initial}</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${gradStart}"/>
            <stop offset="100%" stop-color="${gradEnd}"/>
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="24" fill="url(#bg)"/>
        <circle cx="100" cy="100" r="54" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
        <circle cx="100" cy="100" r="38" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
        <circle cx="100" cy="100" r="22" fill="#ff2d55"/>
        <circle cx="100" cy="100" r="6" fill="#09090b"/>
        <text x="100" y="174" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.75)" text-anchor="middle">${cleanLabel}</text>
      </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Handle image error gracefully by swapping in a safe branded fallback
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  type: 'artist' | 'album' | 'track' = 'track',
  label?: string
) {
  const target = event.currentTarget;
  if (target.src && target.src.includes('/maxresdefault.jpg')) {
    target.src = target.src.replace('/maxresdefault.jpg', '/hqdefault.jpg');
    return;
  }
  if (target.src && target.src.includes('/hqdefault.jpg')) {
    target.src = target.src.replace('/hqdefault.jpg', '/mqdefault.jpg');
    return;
  }
  const fallback = getSafeImageFallback(type, label);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
