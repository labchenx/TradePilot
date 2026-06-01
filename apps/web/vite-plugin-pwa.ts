import type { Plugin } from 'vite';

export function pwaPlugin(): Plugin {
  return {
    name: 'tradepilot-pwa-meta',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#10b981">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="TradePilot">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  <meta name="description" content="TradePilot personal portfolio tracker">
</head>`,
      );
    },
  };
}
