const {
  hasBlob,
  deleteFeedback,
  deleteFeedbackByStatus,
  resetFeedback
} = require('./_feedback-store');

const PROD_ADMIN_API='https://baedal-jjakkung-download.vercel.app/api/admin';

function bearer(req){
  const h=String(req.headers.authorization||'');
  return h.startsWith('Bearer ')?h:'';
}

async function verifyAdmin(req){
  const auth=bearer(req);
  if(!auth) return false;
  try{
    const r=await fetch(PROD_ADMIN_API,{
      method:'GET',
      headers:{Authorization:auth,'Cache-Control':'no-store'}
    });
    return r.ok;
  }catch(error){
    console.error('admin_maintenance_auth_error',error);
    return false;
  }
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){
    return res.status(405).json({ok:false,message:'Method not allowed'});
  }

  if(!(await verifyAdmin(req))){
    return res.status(401).json({ok:false,message:'관리자 로그인이 필요합니다.'});
  }

  try{
    if(!hasBlob()){
      return res.status(409).json({ok:false,code:'PERSISTENT_STORAGE_REQUIRED',message:'영구저장 연결 상태에서만 삭제할 수 있습니다.'});
    }
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const action=String(body.action||'').trim();

    if(action==='delete-selected'){
      const ids=Array.isArray(body.ids)?body.ids:[];
      if(!ids.length) return res.status(400).json({ok:false,message:'삭제할 문의를 선택해 주세요.'});
      const result=await deleteFeedback(ids);
      return res.status(200).json({ok:true,...result});
    }

    if(action==='delete-done'){
      const result=await deleteFeedbackByStatus('done');
      return res.status(200).json({ok:true,...result});
    }

    if(action==='reset-all'){
      if(String(body.confirm||'')!=='전체 초기화'){
        return res.status(400).json({ok:false,message:'전체 초기화 확인값이 올바르지 않습니다.'});
      }
      const result=await resetFeedback();
      return res.status(200).json({ok:true,...result});
    }

    return res.status(400).json({ok:false,message:'지원하지 않는 작업입니다.'});
  }catch(error){
    console.error('admin_maintenance_error',error);
    return res.status(500).json({ok:false,message:'관리 작업 중 오류가 발생했습니다.'});
  }
};
