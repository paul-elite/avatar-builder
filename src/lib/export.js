import { avatarToSvg } from './avatar.js';

/* =========================================================================
   Download helpers (browser only). Also exported from the package so a host
   can wire its own export button:
     import { downloadSvg, downloadPng } from 'avatar-builder';
   ========================================================================= */

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(config, { size = 512, filename = 'avatar.svg' } = {}) {
  const blob = new Blob([avatarToSvg(config, { size })], { type: 'image/svg+xml' });
  triggerDownload(blob, filename);
}

/* Rasterizes the SVG to a transparent PNG via canvas. Returns a Promise. */
export function downloadPng(config, { size = 512, filename = 'avatar.png' } = {}) {
  return new Promise((resolve, reject) => {
    const svg = avatarToSvg(config, { size });
    const src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('PNG export failed'));
        triggerDownload(blob, filename);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('PNG export failed'));
    img.src = src;
  });
}
