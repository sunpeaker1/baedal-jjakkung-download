const { get } = require('@vercel/blob');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET') return res.status(405).end();
  const configured=!!process.env.BLOB_STORE_ID;
  if(!configured) return res.status(503).json({ok:false,reason:'BLOB_STORE_ID_MISSING'});
  try {
    const r=await get('rider-v156/__auth_probe_not_existing__',{access:'private'});
    return res.status(200).json({ok:!r,reason:r?'UNEXPECTED_BLOB':'AUTHENTICATED_PRIVATE_STORE'});
  }catch(e){return res.status(503).json({ok:false,reason:'BLOB_PROBE_FAILED',errorCode:e.code||e.name||'Error'});}
};