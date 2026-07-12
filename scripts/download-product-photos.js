/**
 * Downloads grocery product photos into assets/products/
 * Run: node scripts/download-product-photos.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dir = path.join(__dirname, '..', 'assets', 'products');
fs.mkdirSync(dir, { recursive: true });

const UA = 'FominoBot/1.0 (https://fomino.in; support@fomino.in)';

// Verified URLs (Pexels + Unsplash). Organic variants reuse the same source photo.
const PHOTOS = {
  'banana-robusta': 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'mango-alphonso': 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'apple-gala': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&q=80',
  'pomegranate': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
  'orange-imported': 'https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'watermelon': 'https://images.pexels.com/photos/1313267/pexels-photo-1313267.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'grapes-green': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&q=80',

  'tomato-local': 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&q=80',
  'onion': 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800&q=80',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
  'carrot-orange': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&q=80',
  'capsicum-green': 'https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'cauliflower': 'https://images.pexels.com/photos/5941391/pexels-photo-5941391.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'spinach-palak': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
  'ginger': 'https://images.pexels.com/photos/4198142/pexels-photo-4198142.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',

  'broccoli': 'https://images.pexels.com/photos/47347/broccoli-vegetable-food-healthy-47347.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'blueberry': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&q=80',
  'avocado': 'https://images.pexels.com/photos/5946091/pexels-photo-5946091.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'zucchini': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80',
  'lettuce-iceberg': 'https://images.pexels.com/photos/992731/pexels-photo-992731.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'mushroom-button': 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',

  'organic-tomato': 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&q=80',
  'organic-onion': 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=800&q=80',
  'organic-ginger': 'https://images.pexels.com/photos/4198142/pexels-photo-4198142.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'organic-carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&q=80',
  'organic-spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',

  'basmati-rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
  'toor-dal': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
  'atta-whole-wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
  'sunflower-oil': 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'sugar': 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=800&q=80',
  'turmeric-powder': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80',

  'milk-toned': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
  'curd': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&q=80',
  'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80',
  'brown-bread': 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'butter': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80',

  'orange-juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80',
  'tea-leaves': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
  'coffee-instant': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'coconut-water': 'https://images.pexels.com/photos/333868/pexels-photo-333868.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'green-tea': 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&q=80',

  'marie-biscuits': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80',
  'namkeen-mix': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
  'potato-chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80',
  'cookies-assorted': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80',
  'peanuts-roasted': 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800&q=80',
};

function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error('too many redirects'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        res.resume();
        return download(next, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
  });
}

async function main() {
  const productIds = Object.keys(PHOTOS);
  let ok = 0;
  let fail = 0;

  for (const id of productIds) {
    const url = PHOTOS[id];
    const out = path.join(dir, `${id}.jpg`);
    try {
      process.stdout.write(`Downloading ${id}... `);
      const buf = await download(url);
      if (buf.length < 3000) throw new Error('too small');
      fs.writeFileSync(out, buf);
      console.log(`OK (${(buf.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} images, ${fail} missing`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
