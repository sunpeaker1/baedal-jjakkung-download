'use strict';
const crypto = require('crypto');
const { put, get } = require('@vercel/blob');
const { Readable } = require('stream');
const SIZE = 54954541, CHUNK = 2500000, COUNT = Math.ceil(SIZE / CHUNK);
const SHA = 'd38ef5809029e28a7a168466ba75746077a99e6fb6c746651cd711c492a9cee3';
const PREFIX = 'private-rider-v156-20261101/';
const VERIFIED = PREFIX + 'verified-manifest.json';
const partPath = n => PREFIX + 'part-' + String(n).padStart(2,'0') + '.bin';
function auth(req) {
 const secret=process.env.V156_DOWNLOAD_TOKEN, header=String(req.headers.authorization||'');
 const supplied=header.startsWith('Bearer ')?header.slice(7):'';
 if(!secret||!supplied)return false;
 const a=Buffer.from(supplied),b=Buffer.from(secret);
 return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
async function stored(path){
 const r=await get(path,{access:'private'});return r&&r.statusCode===200?r:null;
}
async function collect(req,size){
 const chunks=[];let bytes=0;
 for await(const c of req){bytes+=c.length;if(bytes>size)throw Error('OVERSIZE');chunks.push(c);}
 if(bytes!==size)throw Error('WRONG_PART_SIZE');
 return Buffer.concat(chunks,size);
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 if(!auth(req))return res.status(403).json({ok:false,error:'AUTH_REQUIRED'});
 const action=String(req.query?.action||'');
 if(action==='status'&&req.method==='GET'){
   try{const b=await stored(VERIFIED);return res.status(200).json({ok:true,ready:!!b});}
   catch{return res.status(503).json({ok:false,error:'STATUS_FAILED'});}
 }
 if(action==='part'&&req.method==='POST'){
   const index=Number(req.headers['x-v156-part-index']),claim=String(req.headers['x-v156-part-sha256']||'');
   if(!Number.isInteger(index)||index<0||index>=COUNT||!/^[0-9a-f]{64}$/.test(claim))return res.status(400).json({ok:false,error:'INVALID_PART'});
   const length=index===COUNT-1?SIZE-CHUNK*index:CHUNK;
   try{
     const b=await collect(req,length);
     if(crypto.createHash('sha256').update(b).digest('hex')!==claim)return res.status(422).json({ok:false,error:'PART_SHA_MISMATCH'});
     const o=await put(partPath(index),b,{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/octet-stream'});
     if(!o?.url?.includes('.private.blob.vercel-storage.com'))throw Error('NOT_PRIVATE');
     return res.status(200).json({ok:true,index,length});
   }catch(e){return res.status(503).json({ok:false,error:e.message==='OVERSIZE'||e.message==='WRONG_PART_SIZE'?e.message:'PART_STORAGE_FAILED'});}
 }
 if(action==='complete'&&req.method==='POST'){
   try{
     const whole=crypto.createHash('sha256');let length=0;
     for(let i=0;i<COUNT;i++){
       const o=await stored(partPath(i));
       if(!o?.stream)return res.status(409).json({ok:false,error:'MISSING_PART',index:i});
       let got=0;
       for await(const b of Readable.fromWeb(o.stream)){got+=b.length;whole.update(b);}
       const expected=i===COUNT-1?SIZE-CHUNK*i:CHUNK;
       if(got!==expected)return res.status(422).json({ok:false,error:'PART_SIZE_MISMATCH',index:i});
       length+=got;
     }
     if(length!==SIZE||whole.digest('hex')!==SHA)return res.status(422).json({ok:false,error:'WHOLE_SHA_MISMATCH'});
     const manifest=Buffer.from(JSON.stringify({version:'1.58.156',size:SIZE,sha256:SHA,count:COUNT,chunkSize:CHUNK,verifiedAt:new Date().toISOString()}));
     const x=await put(VERIFIED,manifest,{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});
     if(!x?.url?.includes('.private.blob.vercel-storage.com'))throw Error('NOT_PRIVATE');
     return res.status(200).json({ok:true,ready:true,size:SIZE,sha256:SHA});
   }catch(e){return res.status(503).json({ok:false,error:'COMPLETE_FAILED',code:e.code||e.name||'Error'});}
 }
 return res.status(405).json({ok:false,error:'METHOD_NOT_ALLOWED'});
};