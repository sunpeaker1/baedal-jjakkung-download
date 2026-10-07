(()=> {
  const state={enabled:false,client:null,user:null,profile:null,error:null};

  async function init(){
    try{
      const cfg=await fetch("/api/ridernex-config.js",{cache:"no-store"}).then(r=>r.json());
      if(!cfg.enabled){state.enabled=false;return state}
      const {createClient}=await import("https://esm.sh/@supabase/supabase-js@2");
      state.client=createClient(cfg.url,cfg.anonKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
      state.enabled=true;
      const {data:{user}}=await state.client.auth.getUser();
      state.user=user||null;
      if(user){
        const {data}=await state.client.from("profiles").select("*").eq("id",user.id).maybeSingle();
        state.profile=data||null;
      }
    }catch(e){state.error=e;state.enabled=false}
    return state;
  }

  async function signUp({email,password,nickname,primaryRegion}){
    if(!state.client)throw new Error("서버 DB가 아직 연결되지 않았습니다.");
    const {data,error}=await state.client.auth.signUp({
      email,password,
      options:{data:{nickname,primary_region:primaryRegion}}
    });
    if(error)throw error;
    return data;
  }

  async function signIn(email,password){
    if(!state.client)throw new Error("서버 DB가 아직 연결되지 않았습니다.");
    const {data,error}=await state.client.auth.signInWithPassword({email,password});
    if(error)throw error;
    state.user=data.user||null;
    return data;
  }

  async function signOut(){
    if(!state.client)return;
    const {error}=await state.client.auth.signOut();
    if(error)throw error;
    state.user=null;state.profile=null;
  }

  async function getRegionPosts(region,category=""){
    if(!state.client)return[];
    let q=state.client.from("posts").select("*,profiles!posts_author_id_fkey(nickname)").eq("region",region).order("created_at",{ascending:false});
    if(category)q=q.eq("category",category);
    const {data,error}=await q;
    if(error)throw error;
    return data||[];
  }

  async function getComments(postId){
    if(!state.client)return[];
    const {data,error}=await state.client
      .from("comments")
      .select("*,profiles!comments_author_id_fkey(nickname)")
      .eq("post_id",postId)
      .order("created_at",{ascending:true});
    if(error)throw error;
    return data||[];
  }

  async function getMyPosts(){
    if(!state.client||!state.user)return[];
    const {data,error}=await state.client
      .from("posts")
      .select("*")
      .eq("author_id",state.user.id)
      .order("created_at",{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function refreshProfile(){
    if(!state.client||!state.user)return null;
    const {data,error}=await state.client.from("profiles").select("*").eq("id",state.user.id).maybeSingle();
    if(error)throw error;
    state.profile=data||null;
    return state.profile;
  }

  async function addPost({region,category,title,body}){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {data,error}=await state.client.from("posts").insert({author_id:state.user.id,region,category,title,body}).select().single();
    if(error)throw error;
    return data;
  }

  async function addComment(postId,body){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {data,error}=await state.client.from("comments").insert({post_id:postId,author_id:state.user.id,body}).select().single();
    if(error)throw error;
    return data;
  }

  async function addMarket(item){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const payload={
      author_id:state.user.id,category:item.category,title:item.title,
      price:Number(item.price),region:item.region,item_condition:item.condition||"중고",body:item.body
    };
    const {data,error}=await state.client.from("marketplace_items").insert(payload).select().single();
    if(error)throw error;return data;
  }

  async function getMarket(){
    if(!state.client)return[];
    const {data,error}=await state.client.from("marketplace_items").select("*").order("created_at",{ascending:false});
    if(error)throw error;return data||[];
  }

  async function addBusiness(item){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const payload={author_id:state.user.id,business_type:item.type,name:item.name,region:item.region,phone:item.phone||null,address:item.address||null,body:item.body};
    const {data,error}=await state.client.from("businesses").insert(payload).select().single();
    if(error)throw error;return data;
  }

  async function getBusinesses(){
    if(!state.client)return[];
    const {data,error}=await state.client.from("businesses").select("*").order("created_at",{ascending:false});
    if(error)throw error;return data||[];
  }

  async function addJob(item){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const payload={author_id:state.user.id,kind:item.kind,title:item.title,region:item.region,pay:item.pay||null,schedule:item.schedule||null,body:item.body};
    const {data,error}=await state.client.from("jobs").insert(payload).select().single();
    if(error)throw error;return data;
  }

  async function getJobs(){
    if(!state.client)return[];
    const {data,error}=await state.client.from("jobs").select("*").order("created_at",{ascending:false});
    if(error)throw error;return data||[];
  }

  async function joinInterest(room){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {error}=await state.client.from("interest_memberships").upsert({user_id:state.user.id,room},{onConflict:"user_id,room"});
    if(error)throw error;
  }

  async function leaveInterest(room){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {error}=await state.client.from("interest_memberships").delete().eq("user_id",state.user.id).eq("room",room);
    if(error)throw error;
  }

  async function isInterestMember(room){
    if(!state.user)return false;
    const {data,error}=await state.client.from("interest_memberships").select("user_id").eq("user_id",state.user.id).eq("room",room).maybeSingle();
    if(error)throw error;
    return !!data;
  }

  async function interestMemberCount(room){
    if(!state.client)return 0;
    const {count,error}=await state.client.from("interest_memberships").select("*",{count:"exact",head:true}).eq("room",room);
    if(error)throw error;
    return count||0;
  }

  async function getInterestPosts(room){
    if(!state.client)return[];
    const {data,error}=await state.client
      .from("interest_posts")
      .select("*,profiles!interest_posts_author_id_fkey(nickname)")
      .eq("room",room)
      .order("created_at",{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function addInterestPost({room,title,body}){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const member=await isInterestMember(room);
    if(!member)throw new Error("먼저 관심방에 참여하세요.");
    const {data,error}=await state.client.from("interest_posts").insert({author_id:state.user.id,room,title,body}).select().single();
    if(error)throw error;
    return data;
  }

  async function getCarePosts(category=""){
    if(!state.client)return[];
    let q=state.client.from("care_posts").select("*,profiles!care_posts_author_id_fkey(nickname)").order("created_at",{ascending:false});
    if(category)q=q.eq("category",category);
    const {data,error}=await q;
    if(error)throw error;
    return data||[];
  }

  async function addCarePost({category,title,body}){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {data,error}=await state.client.from("care_posts").insert({author_id:state.user.id,category,title,body}).select().single();
    if(error)throw error;
    return data;
  }

  async function getNotifications(){
    if(!state.user)return[];
    const {data,error}=await state.client.from("notifications").select("*").eq("user_id",state.user.id).order("created_at",{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function unreadCount(){
    if(!state.user)return 0;
    const {count,error}=await state.client.from("notifications").select("*",{count:"exact",head:true}).eq("user_id",state.user.id).eq("is_read",false);
    if(error)throw error;
    return count||0;
  }

  async function markNotice(id){
    if(!state.user)return;
    const {error}=await state.client.from("notifications").update({is_read:true}).eq("id",id).eq("user_id",state.user.id);
    if(error)throw error;
  }

  async function markAllNotices(){
    if(!state.user)return;
    const {error}=await state.client.from("notifications").update({is_read:true}).eq("user_id",state.user.id).eq("is_read",false);
    if(error)throw error;
  }

  async function clearNotices(){
    if(!state.user)return;
    const {error}=await state.client.from("notifications").delete().eq("user_id",state.user.id);
    if(error)throw error;
  }

  async function searchAll(term){
    term=String(term||"").trim();
    if(!term||!state.client)return[];
    const pattern="%"+term.replace(/[%_]/g,"")+"%";
    const [posts,market,businesses,jobs,care,interests]=await Promise.all([
      state.client.from("posts").select("id,title,body,category,region,created_at").or(`title.ilike.${pattern},body.ilike.${pattern},category.ilike.${pattern},region.ilike.${pattern}`).order("created_at",{ascending:false}).limit(30),
      state.client.from("marketplace_items").select("id,title,body,category,region,price,item_condition,created_at").or(`title.ilike.${pattern},body.ilike.${pattern},category.ilike.${pattern},region.ilike.${pattern}`).order("created_at",{ascending:false}).limit(30),
      state.client.from("businesses").select("id,name,body,business_type,region,address,created_at").or(`name.ilike.${pattern},body.ilike.${pattern},business_type.ilike.${pattern},region.ilike.${pattern},address.ilike.${pattern}`).order("created_at",{ascending:false}).limit(30),
      state.client.from("jobs").select("id,title,body,kind,region,pay,schedule,created_at").or(`title.ilike.${pattern},body.ilike.${pattern},kind.ilike.${pattern},region.ilike.${pattern},pay.ilike.${pattern},schedule.ilike.${pattern}`).order("created_at",{ascending:false}).limit(30),
      state.client.from("care_posts").select("id,title,body,category,created_at").or(`title.ilike.${pattern},body.ilike.${pattern},category.ilike.${pattern}`).order("created_at",{ascending:false}).limit(30),
      state.client.from("interest_posts").select("id,title,body,room,created_at").or(`title.ilike.${pattern},body.ilike.${pattern},room.ilike.${pattern}`).order("created_at",{ascending:false}).limit(30)
    ]);
    for(const r of [posts,market,businesses,jobs,care,interests])if(r.error)throw r.error;
    const out=[];
    (posts.data||[]).forEach(x=>out.push({type:"지역글",title:x.title,meta:x.region+" · "+x.category,body:x.body,href:"region.html",createdAt:x.created_at}));
    (market.data||[]).forEach(x=>out.push({type:"장터",title:x.title,meta:x.region+" · "+Number(x.price).toLocaleString("ko-KR")+"원",body:x.body,href:"market.html",createdAt:x.created_at}));
    (businesses.data||[]).forEach(x=>out.push({type:"업체",title:x.name,meta:x.region+" · "+x.business_type,body:x.body,href:"business.html",createdAt:x.created_at}));
    (jobs.data||[]).forEach(x=>out.push({type:"구인·구직",title:x.title,meta:x.region+" · "+x.kind,body:x.body,href:"jobs.html",createdAt:x.created_at}));
    (care.data||[]).forEach(x=>out.push({type:"정비·장비",title:x.title,meta:x.category,body:x.body,href:"care.html?category="+encodeURIComponent(x.category),createdAt:x.created_at}));
    (interests.data||[]).forEach(x=>out.push({type:"관심방",title:x.title,meta:x.room,body:x.body,href:"interests.html?room="+encodeURIComponent(x.room),createdAt:x.created_at}));
    return out.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  }

  async function report({targetType,targetId,reason}){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {data,error}=await state.client.from("reports").insert({reporter_id:state.user.id,target_type:targetType,target_id:targetId,reason}).select().single();
    if(error)throw error;return data;
  }

  window.RNXRemote={state,init,signUp,signIn,signOut,getRegionPosts,getComments,getMyPosts,refreshProfile,addPost,addComment,addMarket,getMarket,addBusiness,getBusinesses,addJob,getJobs,joinInterest,leaveInterest,isInterestMember,interestMemberCount,getInterestPosts,addInterestPost,getCarePosts,addCarePost,getNotifications,unreadCount,markNotice,markAllNotices,clearNotices,searchAll,report};
})();