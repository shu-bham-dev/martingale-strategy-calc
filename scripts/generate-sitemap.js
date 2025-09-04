const sm = require('sitemap');
const { writeFileSync } = require('fs');
const { join } = require('path');

// Base URL for your website
const baseUrl = 'https://martingale-strategy-calc.vercel.app/';

// Define routes for your single-page application
// Since this is a SPA with tab navigation, we'll focus on the main page
// and use hash fragments for different sections
const routes = [
  {
    url: '/',
    changefreq: 'daily',
    priority: 1.0,
    lastmod: new Date().toISOString()
  },
  // Hash-based URLs for different sections of the SPA
  {
    url: '/#configure',
    changefreq: 'weekly',
    priority: 0.9,
    lastmod: new Date().toISOString()
  },
  {
    url: '/#results',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  },
  {
    url: '/#charts',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  },
  {
    url: '/#simulation',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  },
  {
    url: '/#risks',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  }
];

function generateSitemap() {
  try {
    // Create sitemap using the stream approach
    const stream = new sm.SitemapStream({ hostname: baseUrl });
    
    routes.forEach(route => {
      stream.write(route);
    });
    
    stream.end();
    
    // Convert stream to string
    let xml = '';
    stream.on('data', (chunk) => xml += chunk);
    
    stream.on('end', () => {
      // Write to file
      writeFileSync(join(__dirname, '..', 'public', 'sitemap.xml'), xml);
      
      console.log('✅ Sitemap generated successfully at public/sitemap.xml');
      console.log(`📊 Total URLs: ${routes.length}`);
      console.log('🌐 Base URL:', baseUrl);
      console.log('💡 Remember to update the baseUrl variable with your actual domain!');
    });
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

// Run the generator
generateSitemap();

module.exports = { generateSitemap, routes, baseUrl };