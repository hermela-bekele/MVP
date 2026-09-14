// PRIME EduAI - Service Worker for Offline Support
// This is a static service worker that doesn't rely on build-time generation

const CACHE_NAME = 'prime-eduai-v5';
const OFFLINE_URL = '/offline.html';

// Critical pages to precache on install (available offline immediately)
// ALL dashboard pages for each role - users can access their full portal offline
const PRECACHE_URLS = [
  // Authentication & Core
  '/',
  '/manifest.json',
  '/login',
  '/register',
  '/create-account',
  '/apply',
  '/forgot-password',
  '/select-engine',
  
  // Teacher Dashboard - All Pages (Tab-based navigation)
  '/dashboard/teacher',  // Main dashboard + all tabs via client-side routing
  '/dashboard/teacher/assessments',
  '/dashboard/teacher/lesson-notes',
  '/dashboard/teacher/lesson-plans',
  '/dashboard/teacher/training',
  
  // Student Dashboard
  '/dashboard/student',
  
  // School Head Dashboard - All Pages
  '/dashboard/school-head',
  '/dashboard/school-head/manage-employees',
  '/dashboard/school-head/manage-students',
  
  // Department Head Dashboard - All Pages
  '/dashboard/department-head',
  '/dashboard/department-head/assessments',
  
  // Head of Academics Dashboard - All Pages
  '/dashboard/head-of-academics',
  
  // Registrar Dashboard - All Pages
  '/dashboard/registrar',
  '/dashboard/registrar/applications',
  '/dashboard/registrar/student-registry',
  
  // HR Dashboard - All Pages
  '/dashboard/hr',
  '/dashboard/hr/employees',
  
  // Finance Dashboard
  '/dashboard/finance',
  
  // Parent Dashboard
  '/dashboard/parent',
  
  // MOE/Director Dashboard
  '/dashboard/moe',
];

// Install event - precache critical pages
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v5 with comprehensive precaching');
  console.log('[SW] Precaching', PRECACHE_URLS.length, 'pages for offline access');
  console.log('[SW] NOTE: Dashboard tabs use client-side routing, so main dashboard page caches all tab content');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Precaching critical pages...');
      
      // Cache pages one by one to avoid failing entire install
      const cachePromises = PRECACHE_URLS.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            console.log('[SW] ✓ Cached:', url);
          } else {
            console.warn('[SW] ✗ Failed to cache (status ' + response.status + '):', url);
          }
        } catch (err) {
          console.warn('[SW] ✗ Failed to cache:', url, err.message);
        }
      });
      
      await Promise.allSettled(cachePromises);
      console.log('[SW] Precaching complete!');
      console.log('[SW] All dashboard pages cached - users can access offline immediately');
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v5');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper: Check if request is for a page navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

// Helper: Check if request is for Next.js RSC (React Server Components)
function isRSCRequest(request) {
  return request.url.includes('?_rsc=') || 
         request.headers.get('RSC') === '1';
}

// Helper: Get base path without query params for fallback matching
function getBasePath(url) {
  const urlObj = new URL(url);
  return urlObj.origin + urlObj.pathname;
}

// Fetch event - network first, cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful, clone and cache the response
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        console.log('[SW] Network failed for:', event.request.url);
        
        // Try exact match first
        let cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          console.log('[SW] Serving from cache (exact):', event.request.url);
          return cachedResponse;
        }

        // For RSC requests, try to find the base page without query params
        if (isRSCRequest(event.request)) {
          const basePath = getBasePath(event.request.url);
          console.log('[SW] RSC request, trying base path:', basePath);
          cachedResponse = await caches.match(basePath);
          if (cachedResponse) {
            console.log('[SW] Serving base page for RSC:', basePath);
            return cachedResponse;
          }
        }

        // For navigation requests, return cached homepage or offline page
        if (isNavigationRequest(event.request)) {
          console.log('[SW] Navigation request, trying fallbacks');
          
          // Try cached homepage first
          cachedResponse = await caches.match('/');
          if (cachedResponse) {
            console.log('[SW] Serving cached homepage');
            return cachedResponse;
          }

          // Try offline page
          cachedResponse = await caches.match(OFFLINE_URL);
          if (cachedResponse) {
            console.log('[SW] Serving offline page');
            return cachedResponse;
          }

          // Last resort: inline offline HTML
          console.log('[SW] Serving inline offline page');
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Offline - PRIME EduAI</title>
              <style>
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-align: center;
                  padding: 20px;
                }
                .container {
                  max-width: 500px;
                }
                h1 {
                  font-size: 3em;
                  margin: 0 0 20px 0;
                }
                p {
                  font-size: 1.2em;
                  line-height: 1.6;
                }
                button {
                  margin-top: 20px;
                  padding: 12px 24px;
                  font-size: 1em;
                  background: white;
                  color: #667eea;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 600;
                }
                button:hover {
                  background: #f0f0f0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>📡 You're Offline</h1>
                <p>This page isn't available offline yet. You need to visit it while online first, then it will be cached for offline use.</p>
                <button onclick="window.location.href='/'">Go to Dashboard</button>
                <button onclick="window.location.reload()">Retry</button>
              </div>
            </body>
            </html>`,
            { 
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        }

        // For other resources (images, scripts, etc), return empty/transparent response
        console.log('[SW] Resource not cached:', event.request.url);
        
        // Return appropriate empty response based on request type
        if (event.request.destination === 'image') {
          // Return transparent 1x1 PNG
          return new Response(
            new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]),
            { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } }
          );
        }
        
        if (event.request.destination === 'script') {
          return new Response('', { 
            status: 200, 
            headers: { 'Content-Type': 'application/javascript' }
          });
        }

        // For everything else, return empty response (better than 503)
        return new Response('', { status: 200 });
      })
  );
});
