'use strict';
const crypto=require('crypto');
const {get}=require('@vercel/blob');
const {Readable}=require('stream');
const {once}=require('events');
const SIZE=54954541,CHUNK=2500000,COUNT=Math.ceil(SIZE/CHUNK);
const PREFIX='private-rider-v156-20261101/';
const MANIFEST=PREFIX+'verified-manifest.json';
const SHA='d38ef5809029e28a7a168466ba75746077a99e6fb6c746651cd711c492a9cee3';
const NAME='RiderJjakkung-V1.58.156-income-nav-PRIVATE-TEST.apk';
function auth(s,secret){
 if(!s||!secret)return false;const a=Buffer.from(s),b=Buffer.from(secret);
 return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private,no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 if(req.method!=='POST')return res.status(405).end();
 const b=typeof req.body==='string'?Object.fromEntries(new URLSearchParams(req.body)):(req.body||{});
 if(!auth(b.token,process.env.V156_DOWNLOAD_TOKEN))return res.status(403).end('비공개 다운로드 권한이 없습니다.');
 try{
   const m=await get(MANIFEST,{access:'private'});
   if(!m||m.statusCode!==200||!m.stream)return res.status(503).end('V156 APK가 아직 등록되지 않았습니다.');
   const info=JSON.parse(await new Response(m.stream).text());
   if(info.size!==SIZE||info.sha256!==SHA||info.count!==COUNT)return res.status(503).end('파일 검증 정보가 일치하지 않습니다.');
   res.setHeader('Content-Type','application/vnd.android.package-archive');
   res.setHeader('Content-Disposition','attachment; filename="'+NAME+'"');
   res.setHeader('Content-Length',String(SIZE));
   let total=0;
   for(let i=0;i<COUNT;i++){
     const item=await get(PREFIX+'part-'+String(i).padStart(2,'0')+'.bin',{access:'private'});
     if(!item||item.statusCode!==200||!item.stream)throw Error('PART_NOT_FOUND');
     let count=0;
     for await(const bytes of Readable.fromWeb(item.stream)){
       total+=bytes.length;count+=bytes.length;
       if(!res.write(bytes))await once(res,'drain');
     }
     const expected=i===COUNT-1?SIZE-CHUNK*i:CHUNK;
     if(count!==expected)throw Error('PART_SIZE_MISMATCH');
   }
   if(total!==SIZE)throw Error('TOTAL_SIZE_MISMATCH');
   res.end();
 }catch(e){
   if(res.headersSent)res.destroy(e);
   else res.status(503).end('비공개 APK 다운로드 검증이 필요합니다.');
 }
};