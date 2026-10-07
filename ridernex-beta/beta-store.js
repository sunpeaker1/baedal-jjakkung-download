(()=> {
  const KEY="ridernex_beta_v1";
  const enc=new TextEncoder();
  const now=()=>new Date().toISOString();
  const id=(p)=>p+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8);
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{users:[],session:null,posts:[]}}catch{return {users:[],session:null,posts:[]}}};
  const save=(d)=>localStorage.setItem(KEY,JSON.stringify(d));
  const hash=async(s)=>{const b=await crypto.subtle.digest("SHA-256",enc.encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")};
  const currentUser=()=>{const d=load();return d.session?d.users.find(u=>u.id===d.session.userId)||null:null};
  async function register({email,password,nickname,region="서울 관악구"}){
    const d=load(); email=(email||"").trim().toLowerCase(); nickname=(nickname||"").trim();
    if(!email||!password||!nickname) throw new Error("모든 항목을 입력하세요.");
    if(password.length<4) throw new Error("비밀번호는 4자 이상 입력하세요.");
    if(d.users.some(u=>u.email===email)) throw new Error("이미 가입된 이메일입니다.");
    const u={id:id("u"),email,nickname,passwordHash:await hash(password),region,createdAt:now()};
    d.users.push(u); d.session={userId:u.id}; save(d); return u;
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
    d.posts.unshift(p); save(d); return p;
  }
  function posts(region){const d=load();return d.posts.filter(p=>!region||p.region===region)}
  function userById(uid){return load().users.find(u=>u.id===uid)||null}
  function addComment(postId,body){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    body=(body||"").trim(); if(!body) throw new Error("댓글을 입력하세요.");
    const p=d.posts.find(x=>x.id===postId); if(!p) throw new Error("게시글을 찾을 수 없습니다.");
    p.comments.push({id:id("c"),body,authorId:u.id,createdAt:now()});save(d)
  }
  function report(postId,reason){
    const d=load(),u=currentUser(); if(!u) throw new Error("로그인이 필요합니다.");
    const p=d.posts.find(x=>x.id===postId); if(!p) throw new Error("게시글을 찾을 수 없습니다.");
    if(p.reports.some(r=>r.userId===u.id)) throw new Error("이미 신고한 게시글입니다.");
    p.reports.push({userId:u.id,reason:reason||"기타",createdAt:now()});save(d)
  }
  function myPosts(){const u=currentUser();return u?posts().filter(p=>p.authorId===u.id):[]}
  function fmt(iso){const ms=Date.now()-new Date(iso).getTime(),m=Math.floor(ms/60000);if(m<1)return"방금 전";if(m<60)return m+"분 전";const h=Math.floor(m/60);if(h<24)return h+"시간 전";return new Date(iso).toLocaleDateString("ko-KR")}
  window.RNX={load,currentUser,register,login,logout,addPost,posts,userById,addComment,report,myPosts,fmt};
})();