const crypto=require('crypto');
const {get}=require('@vercel/blob');
const {Readable}=require('stream');
const NAME='RiderJjakkung-V1.58.156-income-nav-PRIVATE-TEST.apk';
const PATH='rider-v156/'+NAME;
const SIZE=54954541;
function allowed(key,secret){if(!key||!secret)return false;const a=Buffer.from(String(key));const b=Buffer.from(String(secret));return a.length===b.length&&crypto.timingSafeEqual(a,b);}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).end();
 const body=typeof req.body==='string'?Object.fromEntries(new URLSearchParams(req.body)):(req.body||{});
 if(!allowed(body.token,process.env.V156_DOWNLOAD_TOKEN))return res.status(403).end('다운로드 권한이 확인되지 않았습니다.');
 try{
  const blob=await get(PATH,{access:'private'});
  if(!blob||blob.statusCode!==200||!blob.stream)return res.status(503).end('V156 APK 원본을 가져올 수 없습니다.');
  if(blob.blob?.size!=null&&blob.blob.size!==SIZE)return res.status(503).end('V156 APK 파일 크기 검증 실패');
  res.setHeader('Content-Type','application/vnd.android.package-archive');
  res.setHeader('Content-Disposition','attachment; filename="'+NAME+'"');
  res.setHeader('Content-Length',String(SIZE));
  const stream=typeof blob.stream.getReader==='function'?Readable.fromWeb(blob.stream):blob.stream;
  stream.on('error',()=>{if(!res.headersSent)res.status(502).end('DOWNLOAD_STREAM_FAILED');else res.destroy();});
  stream.pipe(res);
 }catch(e){if(!res.headersSent)return res.status(503).end('비공개 APK 다운로드 경로 점검 필요');res.destroy();}
};