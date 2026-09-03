import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

function youtubeSearchProxyPlugin(): Plugin {
  const serverSearchCache = new Map<string, { time: number; data: string }>();
  const serverSuggestCache = new Map<string, { time: number; data: string }>();
  const SERVER_CACHE_TTL_MS = 15 * 60 * 1000;

  return {
    name: 'vite-plugin-youtube-search-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/search')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const q = urlObj.searchParams.get('q') || '';
            const region = urlObj.searchParams.get('region') || 'IN';
            const limitParam = parseInt(urlObj.searchParams.get('limit') || '8', 10);
            const limit = isNaN(limitParam) ? 8 : Math.max(1, Math.min(limitParam, 20));

            if (!q.trim()) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ items: [] }));
              return;
            }

            const cacheKey = `${q.toLowerCase()}__${region.toLowerCase()}__${limit}`;
            const cached = serverSearchCache.get(cacheKey);
            if (cached && Date.now() - cached.time < SERVER_CACHE_TTL_MS) {
              res.setHeader('Content-Type', 'application/json');
              res.end(cached.data);
              return;
            }

            // High-reliability YouTube Innertube search endpoint
            const ytRes = await fetch('https://www.youtube.com/youtubei/v1/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                context: {
                  client: {
                    clientName: 'WEB',
                    clientVersion: '2.20231201.00.00',
                    hl: 'en',
                    gl: region,
                  },
                },
                query: q,
              }),
            });

            if (ytRes.ok) {
              const data = await ytRes.json();
              const sectionList =
                data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
              const items: any[] = [];
              if (Array.isArray(sectionList)) {
                for (const section of sectionList) {
                  const itemSection = section.itemSectionRenderer?.contents;
                  if (Array.isArray(itemSection)) {
                    for (const item of itemSection) {
                      if (item.videoRenderer?.videoId) {
                        const v = item.videoRenderer;
                        const title = v.title?.runs?.[0]?.text || '';
                        const titleLower = title.toLowerCase();
                        if (
                          titleLower.includes('jukebox') ||
                          titleLower.includes('full album') ||
                          titleLower.includes('all songs') ||
                          titleLower.includes('non stop') ||
                          titleLower.includes('non-stop') ||
                          titleLower.includes('1 hour') ||
                          titleLower.includes('2 hour') ||
                          titleLower.includes('3 hour') ||
                          titleLower.includes('megamix')
                        ) {
                          continue;
                        }

                        const durationStr = v.lengthText?.simpleText || '';
                        if (durationStr) {
                          const parts = durationStr.split(':').map((p: string) => parseInt(p, 10));
                          if (parts.length >= 3) {
                            // >= 1 hour, skip
                            continue;
                          } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                            const totalSec = parts[0] * 60 + parts[1];
                            if (totalSec > 420 || totalSec < 60) {
                              continue;
                            }
                          }
                        }

                        items.push({
                          id: v.videoId,
                          videoId: v.videoId,
                          title,
                          channel: v.ownerText?.runs?.[0]?.text || 'YouTube Music',
                          durationText: v.lengthText?.simpleText || '3:30',
                          viewsText: v.viewCountText?.simpleText || '',
                          thumbnail:
                            v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                            `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                        });

                        if (items.length >= limit) {
                          break;
                        }
                      }
                    }
                  }
                  if (items.length >= limit) {
                    break;
                  }
                }
              }
              const responseData = JSON.stringify({ items });
              serverSearchCache.set(cacheKey, { time: Date.now(), data: responseData });
              res.setHeader('Content-Type', 'application/json');
              res.end(responseData);
              return;
            }
          } catch (e: any) {
            console.warn('API search middleware warning:', e?.message);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ items: [] }));
          return;
        }

        if (req.url && req.url.startsWith('/api/suggestions')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const q = urlObj.searchParams.get('q') || '';
            if (q.trim()) {
              const cacheKey = q.toLowerCase();
              const cached = serverSuggestCache.get(cacheKey);
              if (cached && Date.now() - cached.time < SERVER_CACHE_TTL_MS) {
                res.setHeader('Content-Type', 'application/json');
                res.end(cached.data);
                return;
              }

              const sugRes = await fetch(
                `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`
              );
              if (sugRes.ok) {
                const data = await sugRes.json();
                const suggestions = Array.isArray(data[1]) ? data[1] : [];
                const responseData = JSON.stringify({ suggestions });
                serverSuggestCache.set(cacheKey, { time: Date.now(), data: responseData });
                res.setHeader('Content-Type', 'application/json');
                res.end(responseData);
                return;
              }
            }
          } catch (e: any) {
            console.warn('API suggestions middleware warning:', e?.message);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ suggestions: [] }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), youtubeSearchProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
