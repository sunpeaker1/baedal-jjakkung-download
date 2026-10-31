const crypto=require('crypto');
const {put}=require('@vercel/blob');
const NAME='RiderJjakkung-V1.58.156-income-nav-PRIVATE-TEST.apk';
const SHA='d38ef5809029e28a7a168466ba75746077a99e6fb6c746651cd711c492a9cee3';
const SIZE=54954541;
const PATH='rider-v156/'+NAME;
function allowed(key,secret){if(!key||!secret)return false;const a=Buffer.from(String(key));const b=Buffer.from(String(secret));return a.length===b.length&&crypto.timingSafeEqual(a,b);}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).end();
 const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
 if(!allowed(body.token,process.env.V156_DOWNLOAD_TOKEN))return res.status(403).json({ok:false,reason:'UNAUTHORIZED'});
 let url;
 try{url=new URL(String(body.sourceUrl||''));}catch{return res.status(400).json({ok:false,reason:'URL_INVALID'});}
 if(url.protocol!=='https:'||!(/(^|\\.)oaiusercontent\\.com$/).test(url.hostname)||!url.pathname.endsWith('/raw'))return res.status(400).json({ok:false,reason:'SOURCE_NOT_ALLOWED'});
 try{
  const upstream=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(105000)});
  if(!upstream.ok||!upstream.body)return res.status(502).json({ok:false,reason:'SOURCE_FETCH_FAILED',status:upstream.status});
  const length=Number(upstream.headers.get('content-length')||'0');
  if(length&&length!==SIZE)return res.status(422).json({ok:false,reason:'SIZE_HEADER_MISMATCH'});
  const chunks=[];const hash=crypto.createHash('sha256');let bytes=0;
  for await(const raw of upstream.body){const chunk=Buffer.from(raw);bytes+=chunk.length;if(bytes>SIZE)throw new Error('SIZE_OVERFLOW');chunks.push(chunk);hash.update(chunk);}
  if(bytes!==SIZE||hash.digest('hex')!==SHA)return res.status(422).json({ok:false,reason:'SOURCE_SHA_OR_SIZE_MISMATCH',size:bytes});
  const data=Buffer.concat(chunks,SIZE);
  const blob=await put(PATH,data,{access:'private',contentType:'application/vnd.android.package-archive',addRandomSuffix:false});
  if(!blob.url||!blob.url.includes('.private.blob.vercel-storage.com'))throw new Error('NOT_PRIVATE');
  return res.status(200).json({ok:true,stored:'private',path:blob.pathname||PATH,bytes,SHA});
 }catch(e){return res.status(503).json({ok:false,reason:'IMPORT_FAILED',code:e.code||e.name||'Error'});}
};