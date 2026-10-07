(()=> {
  const KEY="ridernex_beta_v1";
  const enc=new TextEncoder();
  const now=()=>new Date().toISOString();
  const id=(p)=>p+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8);
  const blank=()=>({users:[],session:null,posts:[],market:[],businesses:[],jobs:[],notifications:[],interestPosts:[],interestMembers:{},carePosts:[]});
  const normalize=(d)=>Object.assign(blank(),d||{});
  const load=()=>{try{return normalize(JSON.parse(localStorage.getItem(KEY)))}catch{return blank()}};
  const save=(d)=>localStorage.setItem(KEY,JSON.stringify(normalize(d)));
  const hash=async(s)=>{const b=await crypto.subtle.digest("SHA-256",enc.encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")};
  const currentUser=()=>{const d=load();return d.session?d.users.find(u=>u.id===d.session.userId)||null:null};
  const pushNotice=(d,userId,type,title,body="",href="")=>{
    if(!userId)return;
    d.notifications.unshift({id:id("n"),userId,type,title,body,href,read:false,createdAt:now()});
  };
  async function register({email,password,nickname,region="서울 관악구"}){
    const d=load(); email=(email||"").trim().toLowerCase(); nickname=(nickname||"").trim();
    if(!email||!password||!nickname) throw new Error("모든 항목을 입력하세요.");
    if(password.length<4) throw new Error("비밀번호는 4자 이상 입력하세요.");
    if(d.users.some(u=>u.email===email)) throw new Error("이미 가입된 이메일입니다.");
    const u={id:id("u"),email,nickname,passwordHash:await hash(password),region,createdAt:now()};
    d.users.push(u); d.session={userId:u.id};
    pushNotice(d,u.id,"system","라이더넥스 베타에 가입했습니다.","지역방, 장터, 업체정보와 구인·구직 기능을 테스트할 수 있습니다.","my.html");
    save(d); return u;
  }
  async function login(email,password){
    const d=load(); email=(email||"").trim().toLowerCase();
    const u=d.users.find(x=>x.email===email); if(!u||u.passwordHash!==await hash(password)) throw new Error("이메일 또는 비밀번호가 맞지 않습니다.");
    d.session={userId:u.id}; save(d); return u;
  }
  function logout(){const d=load();d.session=null;save(d)}
  function addPost({region="서울 관악구",category,title,body}){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    title=(title||"").trim();body=(body||"").trim(); if(!title||!body) throw new Error("제목과 내용을 입력하세요.");
    const p={id:id("p"),region,category:category||"자유수다",title,body,authorId:u.id,createdAt:now(),comments:[],reports:[]};
    d.posts.unshift(p); pushNotice(d,u.id,"post","지역방 글을 등록했습니다.",title,"region.html?city=seoul&district=gwanak"); save(d); return p;
  }
  function posts(region){const d=load();return d.posts.filter(p=>!region||p.region===region)}
  function userById(uid){return load().users.find(u=>u.id===uid)||null}
  function addComment(postId,body){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    body=(body||"").trim(); if(!body) throw new Error("댓글을 입력하세요.");
    const p=d.posts.find(x=>x.id===postId); if(!p) throw new Error("게시글을 찾을 수 없습니다.");
    p.comments.push({id:id("c"),body,authorId:u.id,createdAt:now()});
    if(p.authorId!==u.id) pushNotice(d,p.authorId,"comment",u.nickname+"님이 내 글에 댓글을 남겼습니다.",body,"region.html?city=seoul&district=gwanak");
    save(d)
  }
  function report(postId,reason){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    const p=d.posts.find(x=>x.id===postId); if(!p) throw new Error("게시글을 찾을 수 없습니다.");
    if(p.reports.some(r=>r.userId===u.id)) throw new Error("이미 신고한 게시글입니다.");
    p.reports.push({userId:u.id,reason:reason||"기타",createdAt:now()});pushNotice(d,u.id,"report","신고가 접수되었습니다.",p.title,"notifications.html");save(d)
  }
  function myPosts(){const u=currentUser();return u?posts().filter(p=>p.authorId===u.id):[]}

  function addMarket({category,title,price,region,condition,body}){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    title=(title||"").trim();body=(body||"").trim();region=(region||u.region||"").trim();
    const n=Number(String(price||"").replace(/[^0-9]/g,""));
    if(!title||!body||!region||!n) throw new Error("제목, 가격, 지역, 설명을 입력하세요.");
    const x={id:id("m"),category:category||"기타",title,price:n,region,condition:condition||"중고",body,authorId:u.id,createdAt:now(),reports:[]};
    d.market.unshift(x);pushNotice(d,u.id,"market","장터 매물을 등록했습니다.",title,"market.html");save(d);return x;
  }
  function marketItems(){return load().market}
  function addBusiness({type,name,region,phone,address,body}){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    name=(name||"").trim();region=(region||"").trim();body=(body||"").trim();
    if(!type||!name||!region||!body) throw new Error("업종, 업체명, 지역, 소개를 입력하세요.");
    const x={id:id("b"),type,name,region,phone:(phone||"").trim(),address:(address||"").trim(),body,authorId:u.id,createdAt:now(),reports:[]};
    d.businesses.unshift(x);pushNotice(d,u.id,"business","업체정보를 등록했습니다.",name,"business.html");save(d);return x;
  }
  function businesses(){return load().businesses}
  function addJob({kind,title,region,pay,schedule,body}){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    title=(title||"").trim();region=(region||"").trim();body=(body||"").trim();
    if(!kind||!title||!region||!body) throw new Error("구분, 제목, 지역, 내용을 입력하세요.");
    const x={id:id("j"),kind,title,region,pay:(pay||"").trim(),schedule:(schedule||"").trim(),body,authorId:u.id,createdAt:now(),reports:[]};
    d.jobs.unshift(x);pushNotice(d,u.id,"job","구인·구직 글을 등록했습니다.",title,"jobs.html");save(d);return x;
  }
  function jobs(){return load().jobs}
  function reportEntry(kind,entryId,reason){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    const key=kind==="market"?"market":kind==="business"?"businesses":"jobs";
    const x=d[key].find(v=>v.id===entryId); if(!x) throw new Error("항목을 찾을 수 없습니다.");
    x.reports=x.reports||[];
    if(x.reports.some(r=>r.userId===u.id)) throw new Error("이미 신고했습니다.");
    x.reports.push({userId:u.id,reason:reason||"기타",createdAt:now()});pushNotice(d,u.id,"report","신고가 접수되었습니다.",x.title||x.name||"신고 항목","notifications.html");save(d)
  }
  function notifications(){
    const d=load(),u=currentUser();return u?d.notifications.filter(n=>n.userId===u.id):[];
  }
  function unreadCount(){return notifications().filter(n=>!n.read).length}
  function markNotice(idValue){
    const d=load(),u=currentUser();if(!u)return;
    const n=d.notifications.find(x=>x.id===idValue&&x.userId===u.id);if(n)n.read=true;save(d)
  }
  function markAllNotices(){
    const d=load(),u=currentUser();if(!u)return;
    d.notifications.forEach(n=>{if(n.userId===u.id)n.read=true});save(d)
  }
  function clearNotices(){
    const d=load(),u=currentUser();if(!u)return;
    d.notifications=d.notifications.filter(n=>n.userId!==u.id);save(d)
  }
  function searchAll(q){
    q=String(q||"").trim().toLowerCase();if(!q)return[];
    const d=load(),out=[];
    const hit=(...xs)=>xs.filter(Boolean).join(" ").toLowerCase().includes(q);
    d.posts.forEach(x=>{if(hit(x.title,x.body,x.category,x.region))out.push({type:"지역글",title:x.title,meta:x.region+" · "+x.category,body:x.body,href:"region.html?city=seoul&district=gwanak",createdAt:x.createdAt})});
    d.market.forEach(x=>{if(hit(x.title,x.body,x.category,x.region))out.push({type:"장터",title:x.title,meta:x.region+" · "+Number(x.price).toLocaleString("ko-KR")+"원",body:x.body,href:"market.html",createdAt:x.createdAt})});
    d.businesses.forEach(x=>{if(hit(x.name,x.body,x.type,x.region,x.address))out.push({type:"업체",title:x.name,meta:x.region+" · "+x.type,body:x.body,href:"business.html",createdAt:x.createdAt})});
    d.jobs.forEach(x=>{if(hit(x.title,x.body,x.kind,x.region,x.pay,x.schedule))out.push({type:"구인·구직",title:x.title,meta:x.region+" · "+x.kind,body:x.body,href:"jobs.html",createdAt:x.createdAt})});
    const staticItems=[
      {type:"라이더도구",title:"라이더짝꿍",meta:"수입·운행·내비 대표 앱",body:"라이더짝꿍 기존 홈",href:"../rider-jjakkung-home.html"},
      {type:"라이더도구",title:"배달내비",meta:"라이더 전용 주행안내",body:"배달내비",href:"../delivery-navi.html"},
      {type:"라이더도구",title:"퀵짝꿍",meta:"퀵 업무 지원",body:"퀵짝꿍",href:"../quick.html"},
      {type:"라이더도구",title:"바이크체크",meta:"정비·주행관리",body:"바이크체크",href:"../bikecheck.html"},
      {type:"라이더도구",title:"오늘얼마",meta:"수입 관리",body:"오늘얼마",href:"../oneul-eolma.html"},
      {type:"서비스",title:"지역정보",meta:"전국 지역방",body:"지역 현장정보와 지역 라이더방",href:"region.html"},
      {type:"서비스",title:"라이더 지도",meta:"지역·업체·현장 지도",body:"관악구 중심 베타 지도",href:"map.html"}
    ];
    staticItems.forEach(x=>{if(hit(x.title,x.meta,x.body))out.push(x)});
    return out.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  }
  function joinInterest(room){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    d.interestMembers[room]=Array.isArray(d.interestMembers[room])?d.interestMembers[room]:[];
    if(!d.interestMembers[room].includes(u.id))d.interestMembers[room].push(u.id);
    pushNotice(d,u.id,"interest",room+" 관심방에 참여했습니다.","관심방 새 글을 확인할 수 있습니다.","interests.html?room="+encodeURIComponent(room));save(d)
  }
  function leaveInterest(room){
    const d=load(),u=currentUser(); if(!u)return;
    d.interestMembers[room]=(d.interestMembers[room]||[]).filter(x=>x!==u.id);save(d)
  }
  function isInterestMember(room){const u=currentUser();return !!(u&&(load().interestMembers[room]||[]).includes(u.id))}
  function interestMemberCount(room){return (load().interestMembers[room]||[]).length}
  function addInterestPost({room,title,body}){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    if(!(d.interestMembers[room]||[]).includes(u.id)) throw new Error("먼저 관심방에 참여하세요.");
    title=(title||"").trim();body=(body||"").trim();if(!title||!body)throw new Error("제목과 내용을 입력하세요.");
    d.interestPosts.unshift({id:id("ip"),room,title,body,authorId:u.id,createdAt:now()});save(d)
  }
  function interestPosts(room){return load().interestPosts.filter(x=>!room||x.room===room)}
  function addCarePost({category,title,body}){
    const d=load(),u=currentUser();if(!u)throw new Error("로그인이 필요합니다.");
    title=(title||"").trim();body=(body||"").trim();if(!title||!body)throw new Error("제목과 내용을 입력하세요.");
    d.carePosts.unshift({id:id("cp"),category,title,body,authorId:u.id,createdAt:now()});save(d)
  }
  function carePosts(category){return load().carePosts.filter(x=>!category||x.category===category)}
  function adminReports(){
    const d=load(),out=[];
    d.posts.forEach(x=>(x.reports||[]).forEach((r,i)=>out.push({kind:"지역글",itemId:x.id,title:x.title,reason:r.reason,userId:r.userId,createdAt:r.createdAt,resolved:!!r.resolved,index:i})));
    d.market.forEach(x=>(x.reports||[]).forEach((r,i)=>out.push({kind:"장터",itemId:x.id,title:x.title,reason:r.reason,userId:r.userId,createdAt:r.createdAt,resolved:!!r.resolved,index:i})));
    d.businesses.forEach(x=>(x.reports||[]).forEach((r,i)=>out.push({kind:"업체",itemId:x.id,title:x.name,reason:r.reason,userId:r.userId,createdAt:r.createdAt,resolved:!!r.resolved,index:i})));
    d.jobs.forEach(x=>(x.reports||[]).forEach((r,i)=>out.push({kind:"구인·구직",itemId:x.id,title:x.title,reason:r.reason,userId:r.userId,createdAt:r.createdAt,resolved:!!r.resolved,index:i})));
    return out.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
  }
  function resolveAdminReport(kind,itemId,index){
    const d=load();const key=kind==="지역글"?"posts":kind==="장터"?"market":kind==="업체"?"businesses":"jobs";
    const x=d[key].find(v=>v.id===itemId);if(x&&x.reports&&x.reports[index])x.reports[index].resolved=true;save(d)
  }
  function fmt(iso){const ms=Date.now()-new Date(iso).getTime(),m=Math.floor(ms/60000);if(m<1)return"방금 전";if(m<60)return m+"분 전";const h=Math.floor(m/60);if(h<24)return h+"시간 전";return new Date(iso).toLocaleDateString("ko-KR")}
  window.RNX={load,currentUser,register,login,logout,addPost,posts,userById,addComment,report,myPosts,addMarket,marketItems,addBusiness,businesses,addJob,jobs,reportEntry,notifications,unreadCount,markNotice,markAllNotices,clearNotices,searchAll,joinInterest,leaveInterest,isInterestMember,interestMemberCount,addInterestPost,interestPosts,addCarePost,carePosts,adminReports,resolveAdminReport,fmt};
})();