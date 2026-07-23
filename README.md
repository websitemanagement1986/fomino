# Fomino — Online Grocery Store

Fresh fruits, vegetables and groceries delivered to your doorstep. Built by **Fomino Product Hub Pvt Ltd**.

## Features

- 8 categories, 47+ products with real photos
- Guest checkout (no login)
- Online payment via PayMate (UPI, cards, net banking)
- Cash on Delivery (COD)
- Order confirmation emails via Resend

## Local Development

```bash
cd C:\Repositiries\Fomino
npm install
cp .env.example .env   # add PayMate & Resend keys
npm run download-images
npm start
```

Open http://localhost:3000

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PAYMATE_MERCHANT_ID` | PayMate merchant ID |
| `PAYMATE_TERMINAL_ID` | PayMate terminal ID |
| `PAYMATE_BUSINESS_XPRESS_ID` | PayMate business Xpress ID |
| `PAYMATE_IV` | PayMate encryption IV |
| `SITE_URL` | Public site URL (for return/callback links) |
| `RESEND_API_KEY` | Email sending (optional) |
| `FROM_EMAIL` | Sender email (default: orders@fominomart.in) |
| `ADMIN_EMAIL` | Order & contact notifications |
| `PORT` | Server port (default: 3000) |

## Hostinger Deployment

1. Connect GitHub repo `websitemanagement1986/fomino`
2. Node.js app, Express preset, `npm start`
3. Set environment variables in Hostinger panel
4. Point domain to the app

## Contact

- **Company:** Fomino Product Hub Pvt Ltd
- **Contact:** Pavan Kumar
- **Phone:** +91 7840819741
- **Address:** Office no O-1231, Gaur City Centre, Sec-4, Greater Noida West, UP 201318
