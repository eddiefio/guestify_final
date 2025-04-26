// API per recuperare immagini da fonti esterne e bypassare problemi CORS
export default async function handler(req, res) {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    const imageResponse = await fetch(url);
    
    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({ 
        error: `Failed to fetch image: ${imageResponse.statusText}` 
      });
    }
    
    // Ottieni il tipo di contenuto dell'immagine
    const contentType = imageResponse.headers.get('content-type');
    
    // Prendi il buffer dell'immagine
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Imposta le intestazioni appropriate
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache per 24 ore
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Invia i dati dell'immagine
    res.status(200).send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
} 