export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/'
      }
    });
    
    // Copy all headers
    const contentType = response.headers.get('content-type');
    const cacheControl = response.headers.get('cache-control');
    
    if (contentType) res.setHeader('Content-Type', contentType);
    if (cacheControl) res.setHeader('Cache-Control', cacheControl);
    
    // Send back the data
    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send(error.message);
  }
}
