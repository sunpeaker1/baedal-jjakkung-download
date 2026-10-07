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

  async function report({targetType,targetId,reason}){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {data,error}=await state.client.from("reports").insert({reporter_id:state.user.id,target_type:targetType,target_id:targetId,reason}).select().single();
    if(error)throw error;return data;
  }

  window.RNXRemote={state,init,signUp,signIn,signOut,getRegionPosts,getComments,getMyPosts,refreshProfile,addPost,addComment,addMarket,getMarket,addBusiness,getBusinesses,addJob,getJobs,report};
})();