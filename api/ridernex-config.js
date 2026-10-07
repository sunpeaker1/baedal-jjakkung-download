export default function handler(req,res){
  res.setHeader("Cache-Control","no-store, max-age=0");
  const url=process.env.RIDERNEX_SUPABASE_URL||"https://rgizjekedjaarjjwbzvb.supabase.co";
  const anonKey=process.env.RIDERNEX_SUPABASE_ANON_KEY||"sb_publishable_ScO6su_ARoD1PMAN1tYzcA_u3nC2K3V";
  res.status(200).json({
    enabled:Boolean(url&&anonKey),
    url,
    anonKey
  });
}
