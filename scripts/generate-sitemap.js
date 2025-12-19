/*
  Sitemap generator for CRA projects.

  ✔ Parses src/App.js for static <Route path="..." />
  ✔ Fetches categories & packages from API
  ✔ Excludes CategoryID = 14
  ✔ Packages included ONLY if their CategoryID is allowed
  ✔ Skips wildcard & param routes
  ✔ Writes public/sitemap.xml
*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load .env (optional)
try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env') });
} catch (_) {}

const PROJECT_ROOT = process.cwd();
const APP_FILE = path.join(PROJECT_ROOT, 'src', 'App.js');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'public', 'sitemap.xml');

const SITE_ORIGIN =
  process.env.SITEMAP_SITE_ORIGIN || 'https://mycarbuddy.in';

const DEBUG =
  process.env.SITEMAP_DEBUG === '1' ||
  process.env.SITEMAP_DEBUG === 'true';

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readAppFile() {
  return fs.readFileSync(APP_FILE, 'utf8');
}

/* -------------------------------------------------------
   Extract Static Routes from App.js
------------------------------------------------------- */

function extractRoutes(appJsSource) {
  const routeRegex = /<Route\s+[^>]*path\s*=\s*(["'])(.*?)\1[^>]*>/g;
  const routes = new Set();

  let match;
  while ((match = routeRegex.exec(appJsSource)) !== null) {
    const routePath = match[2]?.trim();
    if (!routePath) continue;

    // Skip wildcard & dynamic routes
    if (routePath === '*' || routePath.includes(':')) continue;

    const normalized = routePath.startsWith('/')
      ? routePath
      : `/${routePath}`;

    routes.add(normalized);
  }

  return Array.from(routes).sort((a, b) =>
    a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)
  );
}

/* -------------------------------------------------------
   Fetch Dynamic Routes
------------------------------------------------------- */

async function fetchDynamicPaths() {
  const dynamicPaths = [];
  let allowedCategoryIds = [];

  /* ---------- Categories ---------- */
  try {
    const categoryResp = await axios.get(
      'https://api.mycarsbuddy.com/api/Category'
    );

    if (Array.isArray(categoryResp.data)) {
      categoryResp.data
        .filter(c => c.IsActive && Number(c.CategoryID) !== 14)
        .forEach(c => {
          const slug = slugify(c.CategoryName);
          dynamicPaths.push(`/service/${slug}/${c.CategoryID}`);
          allowedCategoryIds.push(Number(c.CategoryID));

          if (DEBUG) {
            console.log(
              `[sitemap] Category added: /service/${slug}/${c.CategoryID}`
            );
          }
        });
    }
  } catch (e) {
    console.warn('⚠️ Category API failed:', e.message);
  }

  /* ---------- Packages (filtered by allowed CategoryIDs) ---------- */
  try {
    const pkgResp = await axios.get(
      'https://api.mycarsbuddy.com/api/PlanPackage/GetPlanPackagesByCategoryAndSubCategory'
    );

    if (Array.isArray(pkgResp.data)) {
      pkgResp.data
        .filter(
          p =>
            p.IsActive === true &&
            p.PackageID &&
            p.PackageName &&
            allowedCategoryIds.includes(Number(p.CategoryID))
        )
        .forEach(p => {
          const slug = slugify(p.PackageName);
          dynamicPaths.push(`/servicedetails/${slug}/${p.PackageID}`);

          if (DEBUG) {
            console.log(
              `[sitemap] Package added: /servicedetails/${slug}/${p.PackageID} (CategoryID: ${p.CategoryID})`
            );
          }
        });
    }
  } catch (e) {
    console.warn('⚠️ Package API failed:', e.message);
  }

  return dynamicPaths;
}

/* -------------------------------------------------------
   Sitemap XML Builder
------------------------------------------------------- */

function buildSitemapXml(paths) {
  const lastMod = new Date().toISOString();

  const urls = paths
    .map(p => {
      return `
  <url>
    <loc>${SITE_ORIGIN}${p}</loc>
    <lastmod>${lastMod}</lastmod>
    <priority>1.0</priority>
  </url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function writeSitemap(xml) {
  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
  console.log(`✅ Sitemap generated: ${OUTPUT_FILE}`);
}

/* -------------------------------------------------------
   Main
------------------------------------------------------- */

async function main() {
  try {
    // 1️⃣ Static routes
    const appSource = readAppFile();
    const staticPaths = extractRoutes(appSource);

    // 2️⃣ Dynamic routes
    const dynamicPaths = await fetchDynamicPaths();

    // 3️⃣ Merge & de-duplicate
    const allPaths = Array.from(
      new Set([...staticPaths, ...dynamicPaths])
    );

    if (DEBUG) {
      console.log(
        `[sitemap] Static: ${staticPaths.length}, Dynamic: ${dynamicPaths.length}, Total: ${allPaths.length}`
      );
    }

    if (!allPaths.length) {
      throw new Error('No routes found to generate sitemap');
    }

    // 4️⃣ Build & write sitemap
    const xml = buildSitemapXml(allPaths);
    writeSitemap(xml);

  } catch (err) {
    console.error('❌ Sitemap generation failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
