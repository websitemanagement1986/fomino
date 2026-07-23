module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();

    return res.status(200).json({
      outbound_ip: ipData.ip,
      note: 'Give this IP to PayMate for API whitelist (outbound IP from your server).',
      request_ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      business_xpress_id: process.env.PAYMATE_BUSINESS_XPRESS_ID || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
