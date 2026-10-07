export default function handler(req,res){
  res.setHeader("Cache-Control","no-store, max-age=0");
  const url=process.env.RIDERNEX_SUPABASE_URL||"";
  const anonKey=process.env.RIDERNEX_SUPABASE_ANON_KEY||"";
  res.status(200).json({
    enabled:Boolean(url&&anonKey),
    url,
    anonKey
  });
}
