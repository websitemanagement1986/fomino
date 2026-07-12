/**
 * Downloads grocery product photos from Wikimedia Commons into assets/products/
 * Run: node scripts/download-product-photos.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dir = path.join(__dirname, '..', 'assets', 'products');
fs.mkdirSync(dir, { recursive: true });

const UA = 'FominoBot/1.0 (https://fomino.in; support@fomino.in)';

// Wikimedia Commons — stable, correctly labelled food photos
const PHOTOS = {
  'banana-robusta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Cavendish_banana_from_Maracaibo.jpg/960px-Cavendish_banana_from_Maracaibo.jpg',
  'mango-alphonso': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Mango_and_cross_sections.jpg/960px-Mango_and_cross_sections.jpg',
  'apple-gala': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Gala_Apples_-_Flickr_-_The_Marmot.jpg',
  'pomegranate': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Pomegranate02_edit.jpg/960px-Pomegranate02_edit.jpg',
  'orange-imported': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Ambersweet_oranges.jpg/960px-Ambersweet_oranges.jpg',
  'watermelon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Taiwan_2009_Tainan_City_Organic_Farm_Watermelon_FRD_7962.jpg/960px-Taiwan_2009_Tainan_City_Organic_Farm_Watermelon_FRD_7962.jpg',
  'grapes-green': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Green_Grape_3.jpg/960px-Green_Grape_3.jpg',

  'tomato-local': 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Tomatoes_plain_and_sliced.jpg',
  'onion': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Onions_3.jpg/960px-Onions_3.jpg',
  'potato': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Potatoes%2C_Wirral_flower_and_vegetable_show_-_DSC08219.JPG/960px-Potatoes%2C_Wirral_flower_and_vegetable_show_-_DSC08219.JPG',
  'carrot-orange': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Carrots_of_many_colors.jpg/960px-Carrots_of_many_colors.jpg',
  'capsicum-green': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Green_capsicum%2C_sweet_bell_pepper.jpg/960px-Green_capsicum%2C_sweet_bell_pepper.jpg',
  'cauliflower': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Chou-fleur_02.jpg/960px-Chou-fleur_02.jpg',
  'spinach-palak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Spinach_leaves.jpg/960px-Spinach_leaves.jpg',
  'ginger': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Ginger_Plant_vs.jpg',

  'broccoli': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Broccoli_and_cross_section_edit.jpg/960px-Broccoli_and_cross_section_edit.jpg',
  'blueberry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Blueberries-In-Pack.jpg/960px-Blueberries-In-Pack.jpg',
  'avocado': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Avocado11.jpg/960px-Avocado11.jpg',
  'zucchini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Zucchini_in_basket_2021_G1.jpg/960px-Zucchini_in_basket_2021_G1.jpg',
  'lettuce-iceberg': 'https://upload.wikimedia.org/wikipedia/commons/4/40/Lettuce_iceberg_variety.jpeg',
  'mushroom-button': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/2016-01_Agaricus_bisporus_01.jpg/960px-2016-01_Agaricus_bisporus_01.jpg',

  'organic-tomato': 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Tomatoes_plain_and_sliced.jpg',
  'organic-onion': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Onions_3.jpg/960px-Onions_3.jpg',
  'organic-ginger': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Ginger_Plant_vs.jpg',
  'organic-carrot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Carrots_of_many_colors.jpg/960px-Carrots_of_many_colors.jpg',
  'organic-spinach': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Spinach_leaves.jpg/960px-Spinach_leaves.jpg',

  'basmati-rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Basmati_Rice_India%2C_raw.jpg/960px-Basmati_Rice_India%2C_raw.jpg',
  'toor-dal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Pigeon_Pea_%28Toor_Dal%29_%2849683602388%29.jpg/960px-Pigeon_Pea_%28Toor_Dal%29_%2849683602388%29.jpg',
  'atta-whole-wheat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Whole_wheat_grain_flour_being_scooped.jpg/960px-Whole_wheat_grain_flour_being_scooped.jpg',
  'sunflower-oil': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/2022_sunflower_oil_-_manufacturing_dates_02.jpg/960px-2022_sunflower_oil_-_manufacturing_dates_02.jpg',
  'sugar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Sugar_2xmacro.jpg/960px-Sugar_2xmacro.jpg',
  'turmeric-powder': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Turmeric_Powder_Spelled_Out.jpg/960px-Turmeric_Powder_Spelled_Out.jpg',

  'milk-toned': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Glass_of_milk.jpg/960px-Glass_of_milk.jpg',
  'curd': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Joghurt.jpg/960px-Joghurt.jpg',
  'paneer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Panir_Paneer_Indian_cheese_fresh.jpg/960px-Panir_Paneer_Indian_cheese_fresh.jpg',
  'brown-bread': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Vegan_Nine_Grain_Whole_Wheat_Bread.jpg/960px-Vegan_Nine_Grain_Whole_Wheat_Bread.jpg',
  'butter': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Butter_block.JPG/960px-Butter_block.JPG',

  'orange-juice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/960px-Orange_juice_1_edit1.jpg',
  'tea-leaves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Csinensis.jpg/960px-Csinensis.jpg',
  'coffee-instant': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Instant_coffee.jpg/960px-Instant_coffee.jpg',
  'coconut-water': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Coconut_Drink%2C_Pangandaran.JPG/960px-Coconut_Drink%2C_Pangandaran.JPG',
  'green-tea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Cup_of_green_tea_and_tea_pot_on_table.jpg/960px-Cup_of_green_tea_and_tea_pot_on_table.jpg',

  'marie-biscuits': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Galleta_Mar%C3%ADa.jpg/960px-Galleta_Mar%C3%ADa.jpg',
  'namkeen-mix': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Indian_Snacks_%28Namkeen%29.jpg/960px-Indian_Snacks_%28Namkeen%29.jpg',
  'potato-chips': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Potato-Chips.jpg/960px-Potato-Chips.jpg',
  'cookies-assorted': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Koekjestrommel_open.jpg',
  'peanuts-roasted': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Roasted_peanuts_2.jpg/960px-Roasted_peanuts_2.jpg',
};

function isValidImage(buf) {
  if (!buf || buf.length < 3000) return false;
  const head = buf.slice(0, 32).toString('utf8');
  if (head.includes('<!DOCTYPE') || head.includes('<html')) return false;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  return isJpeg || isPng;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error('too many redirects'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode === 429) {
        res.resume();
        return reject(new Error('HTTP 429'));
      }
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
      let buf;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          buf = await download(url);
          break;
        } catch (err) {
          if (attempt === 5 || !String(err.message).includes('429')) throw err;
          const wait = attempt * 3000;
          process.stdout.write(`retry in ${wait / 1000}s... `);
          await sleep(wait);
        }
      }
      if (!isValidImage(buf)) throw new Error('not a valid image');
      fs.writeFileSync(out, buf);
      console.log(`OK (${(buf.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      fail++;
    }
    await sleep(2000);
  }

  const catDir = path.join(__dirname, '..', 'assets', 'categories');
  fs.mkdirSync(catDir, { recursive: true });
  const categorySources = {
    'fresh-fruits': 'mango-alphonso',
    'fresh-vegetables': 'tomato-local',
    exotic: 'broccoli',
    organic: 'organic-spinach',
    staples: 'basmati-rice',
    dairy: 'milk-toned',
    beverages: 'orange-juice',
    snacks: 'namkeen-mix',
  };
  for (const [slug, productId] of Object.entries(categorySources)) {
    const src = path.join(dir, `${productId}.jpg`);
    const dst = path.join(catDir, `${slug}.jpg`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      console.log(`Category ${slug} ← ${productId}`);
    }
  }

  console.log(`\nDone: ${ok} images, ${fail} missing`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
