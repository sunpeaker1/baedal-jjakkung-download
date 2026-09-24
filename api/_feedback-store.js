const { getCache } = require('@vercel/functions');

const CACHE_NAMESPACE='rider-jjakkung-feedback';
const BLOB_PREFIX='feedback/items/';

function hasBlob(){
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function blobApi(){
  return await import('@vercel/blob');
}

async function streamToText(stream){
  return await new Response(stream).text();
}

async function saveToCache(item){
  const cache=getCache(undefined,CACHE_NAMESPACE);
  await cache.set(item.id,item,{ttl:60*60*24*90,tags:['feedback']});
  const current=(await cache.get('recent'))||[];
  const next=[item.id,...current.filter(x=>x!==item.id)].slice(0,300);
  await cache.set('recent',next,{ttl:60*60*24*90,tags:['feedback-index']});
}

async function listFromCache(){
  const cache=getCache(undefined,CACHE_NAMESPACE);
  const ids=(await cache.get('recent'))||[];
  const items=[];
  for(const id of ids.slice(0,300)){
    const item=await cache.get(id);
    if(item) items.push({...item,status:item.status||'unread'});
  }
  return items;
}

async function saveToBlob(item){
  const { put }=await blobApi();
  const pathname=BLOB_PREFIX+item.id+'.json';
  await put(pathname,JSON.stringify(item),{
    access:'private',
    contentType:'application/json; charset=utf-8',
    addRandomSuffix:false,
    allowOverwrite:true,
    cacheControlMaxAge:0
  });
}

async function listFromBlob(){
  const { list, get }=await blobApi();
  const items=[];
  let cursor;
  do{
    const page=await list({prefix:BLOB_PREFIX,limit:100,cursor});
    for(const blob of page.blobs||[]){
      const result=await get(blob.pathname,{access:'private',useCache:false});
      if(!result || result.statusCode!==200) continue;
      try{
        const text=await streamToText(result.stream);
        const item=JSON.parse(text);
        if(item && item.id) items.push({...item,status:item.status||'unread'});
      }catch(e){}
    }
    cursor=page.cursor;
  }while(cursor);
  return items.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,300);
}

async function getBlobItem(id){
  const { get }=await blobApi();
  const result=await get(BLOB_PREFIX+id+'.json',{access:'private',useCache:false});
  if(!result || result.statusCode!==200) return null;
  try{
    return JSON.parse(await streamToText(result.stream));
  }catch{
    return null;
  }
}

async function saveFeedback(item){
  if(hasBlob()){
    await saveToBlob(item);
    return {storage:'blob',persistent:true};
  }
  await saveToCache(item);
  return {storage:'cache',persistent:false};
}

async function listFeedback(){
  if(hasBlob()){
    let items=await listFromBlob();
    if(!items.length){
      const cached=await listFromCache();
      if(cached.length){
        for(const item of cached){
          try{ await saveToBlob(item); }catch(e){}
        }
        items=await listFromBlob();
      }
    }
    return {items,storage:'blob',persistent:true};
  }
  return {items:await listFromCache(),storage:'cache',persistent:false};
}

async function updateFeedbackStatus(id,status){
  if(hasBlob()){
    const item=await getBlobItem(id);
    if(!item) return null;
    const updated={...item,status,updatedAt:new Date().toISOString()};
    await saveToBlob(updated);
    return updated;
  }
  const cache=getCache(undefined,CACHE_NAMESPACE);
  const item=await cache.get(id);
  if(!item) return null;
  const updated={...item,status,updatedAt:new Date().toISOString()};
  await cache.set(id,updated,{ttl:60*60*24*90,tags:['feedback']});
  return updated;
}

module.exports={hasBlob,saveFeedback,listFeedback,updateFeedbackStatus};
