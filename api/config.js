// Vercel Serverless Function to inject environment variables
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send(`
    window.SUPABASE_URL = '${process.env.VITE_SUPABASE_URL || ''}';
    window.SUPABASE_ANON_KEY = '${process.env.VITE_SUPABASE_ANON_KEY || ''}';
  `);
}
