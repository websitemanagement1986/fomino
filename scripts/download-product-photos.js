/**
 * Downloads real grocery product photos into assets/products/
 * Run: node scripts/download-product-photos.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dir = path.join(__dirname, '..', 'assets', 'products');
fs.mkdirSync(dir, { recursive: true });

const UA = 'FominoBot/1.0 (https://fomino.in; support@fomino.in)';

const PHOTOS = {
  'banana-robusta': 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'mango-alphonso': 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'apple-gala': 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'pomegranate': 'https://images.pexels.com/photos/65256/pomegranate-open-cores-fruit-65256.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'orange-imported': 'https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'watermelon': 'https://images.pexels.com/photos/1313267/pexels-photo-1313267.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'grapes-green': 'https://images.pexels.com/photos/23042/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'tomato-local': 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'onion': 'https://images.pexels.com/photos/144248/onions-vegetables-food-healthy-144248.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'potato': 'https://images.pexels.com/photos/144251/potatoes-vegetables-erdfrucht-bio-144251.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'carrot-orange': 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'capsicum-green': 'https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'cauliflower': 'https://images.pexels.com/photos/1300975/pexels-photo-1300975.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'spinach-palak': 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'ginger': 'https://images.pexels.com/photos/4198142/pexels-photo-4198142.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'broccoli': 'https://images.pexels.com/photos/47347/broccoli-vegetable-food-healthy-47347.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'blueberry': 'https://images.pexels.com/photos/70862/blueberries-blueberry-fruit-70862.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'avocado': 'https://images.pexels.com/photos/5946091/pexels-photo-5946091.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'zucchini': 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'lettuce-iceberg': 'https://images.pexels.com/photos/1199590/pexels-photo-1199590.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'mushroom-button': 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'organic-tomato': 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'organic-onion': 'https://images.pexels.com/photos/144248/onions-vegetables-food-healthy-144248.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'organic-ginger': 'https://images.pexels.com/photos/4198142/pexels-photo-4198142.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'organic-carrot': 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'organic-spinach': 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'basmati-rice': 'https://images.pexels.com/photos/4110257/pexels-photo-4110257.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'toor-dal': 'https://images.pexels.com/photos/4110257/pexels-photo-4110257.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'atta-whole-wheat': 'https://images.pexels.com/photos/4110257/pexels-photo-4110257.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'sunflower-oil': 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'sugar': 'https://images.pexels.com/photos/65882/spoon-sugar-bean-coffee-65882.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'turmeric-powder': 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'milk-toned': 'https://images.pexels.com/photos/236010/pexels-photo-236010.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'curd': 'https://images.pexels.com/photos/236010/pexels-photo-236010.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'paneer': 'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'brown-bread': 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'butter': 'https://images.pexels.com/photos/4109111/pexels-photo-4109111.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'orange-juice': 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'tea-leaves': 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'coffee-instant': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'coconut-water': 'https://images.pexels.com/photos/333868/pexels-photo-333868.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'green-tea': 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'marie-biscuits': 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'namkeen-mix': 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'potato-chips': 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'cookies-assorted': 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
  'peanuts-roasted': 'https://images.pexels.com/photos/4110257/pexels-photo-4110257.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
};

const FALLBACK = {
  potato: 'onion',
  'toor-dal': 'basmati-rice',
  'atta-whole-wheat': 'basmati-rice',
  'turmeric-powder': 'carrot-orange',
  curd: 'milk-toned',
  butter: 'paneer',
  'orange-juice': 'orange-imported',
  'green-tea': 'tea-leaves',
  'marie-biscuits': 'cookies-assorted',
  'namkeen-mix': 'cookies-assorted',
  'potato-chips': 'cookies-assorted',
  'peanuts-roasted': 'namkeen-mix',
  'organic-tomato': 'tomato-local',
  'organic-onion': 'onion',
  'organic-ginger': 'ginger',
  'organic-carrot': 'carrot-orange',
  'organic-spinach': 'spinach-palak',
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
  const productIds = [
    'banana-robusta','mango-alphonso','apple-gala','pomegranate','orange-imported','watermelon','grapes-green',
    'tomato-local','onion','potato','carrot-orange','capsicum-green','cauliflower','spinach-palak','ginger',
    'broccoli','blueberry','avocado','zucchini','lettuce-iceberg','mushroom-button',
    'organic-tomato','organic-onion','organic-ginger','organic-carrot','organic-spinach',
    'basmati-rice','toor-dal','atta-whole-wheat','sunflower-oil','sugar','turmeric-powder',
    'milk-toned','curd','paneer','brown-bread','butter',
    'orange-juice','tea-leaves','coffee-instant','coconut-water','green-tea',
    'marie-biscuits','namkeen-mix','potato-chips','cookies-assorted','peanuts-roasted',
  ];
  let ok = 0;
  let fail = 0;

  for (const id of productIds) {
    const url = PHOTOS[id];
    const out = path.join(dir, `${id}.jpg`);
    if (!url) {
      console.log(`SKIP ${id} (no URL)`);
      fail++;
      continue;
    }
    try {
      process.stdout.write(`Downloading ${id}... `);
      const buf = await download(url);
      if (buf.length < 3000) throw new Error('too small');
      fs.writeFileSync(out, buf);
      console.log(`OK (${(buf.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      const fb = FALLBACK[id];
      const fbPath = path.join(dir, `${fb}.jpg`);
      if (fb && fs.existsSync(fbPath)) {
        fs.copyFileSync(fbPath, out);
        console.log(`  → copied from ${fb}`);
        ok++;
      } else {
        fail++;
      }
    }
  }
  console.log(`\nDone: ${ok} images, ${fail} missing`);
}

main().catch((e) => { console.error(e); process.exit(1); });
