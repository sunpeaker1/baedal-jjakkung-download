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
      options:{
        data:{nickname,primary_region:primaryRegion,terms_accepted:true,privacy_accepted:true,terms_version:"2026-10-07",privacy_version:"2026-10-07"},
        emailRedirectTo:"https://baedal-jjakkung-download.vercel.app/ridernex-beta/auth.html?confirmed=1"
      }
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
  async function resendConfirmation(email){
    if(!state.client)throw new Error("서버 DB가 아직 연결되지 않았습니다.");
    email=String(email||"").trim().toLowerCase();
    if(!email)throw new Error("이메일을 입력하세요.");
    const {error}=await state.client.auth.resend({
      type:"signup",
      email,
      options:{emailRedirectTo:"https://baedal-jjakkung-download.vercel.app/ridernex-beta/auth.html?confirmed=1"}
    });
    if(error)throw error;
  }


  async function updateProfile({nickname,primaryRegion,secondaryRegion,bio,bike}){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const payload={
      nickname:String(nickname||"").trim(),
      primary_region:String(primaryRegion||"").trim()||null,
      secondary_region:String(secondaryRegion||"").trim()||null,
      bio:String(bio||"").trim()||null,
      bike:String(bike||"").trim()||null,
      updated_at:new Date().toISOString()
    };
    if(!payload.nickname)throw new Error("닉네임을 입력하세요.");
    const {data,error}=await state.client.from("profiles").update(payload).eq("id",state.user.id).select().single();
    if(error)throw error;
    state.profile=data;
    return data;
  }

  async function sendPasswordReset(email){
    if(!state.client)throw new Error("서버 연결이 필요합니다.");
    email=String(email||"").trim().toLowerCase();
    if(!email)throw new Error("이메일을 입력하세요.");
    const {error}=await state.client.auth.resetPasswordForEmail(email,{
      redirectTo:"https://baedal-jjakkung-download.vercel.app/ridernex-beta/account.html?recovery=1"
    });
    if(error)throw error;
  }

  async function updatePassword(password){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    password=String(password||"");
    if(password.length<8)throw new Error("새 비밀번호는 8자 이상 입력하세요.");
    const {error}=await state.client.auth.updateUser({password});
    if(error)throw error;
  }

  async function deleteAccount(){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {data,error}=await state.client.functions.invoke("delete-account",{body:{confirm:true}});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    state.user=null;state.profile=null;
    try{await state.client.auth.signOut()}catch{}
    return true;
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
    const {error}=await state.client.from("interest_memberships").insert({user_id:state.user.id,room});
    if(error&&error.code!=="23505")throw error;
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


  async function getMyNexHome(){
    if(!state.client||!state.user)return null;
    const {data,error}=await state.client.from("nexhomes").select("*").eq("owner_id",state.user.id).maybeSingle();
    if(error)throw error;
    return data||null;
  }

  async function checkNexHomeAvailability({lifeRegion,roomName,roadNo=null,houseNo=null}){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const {data,error}=await state.client.rpc("check_nexhome_availability",{
      p_life_region:String(lifeRegion||"").trim(),
      p_room_name:String(roomName||"").trim(),
      p_road_no:roadNo===null?null:Number(roadNo),
      p_house_no:houseNo===null?null:Number(houseNo)
    });
    if(error)throw error;
    return Array.isArray(data)?(data[0]||null):data;
  }

  async function createNexHome({lifeRegion,roomName,roadNo,houseNo}){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const payload={
      owner_id:state.user.id,
      life_region:String(lifeRegion||"").trim(),
      room_name:String(roomName||"").trim(),
      road_no:Number(roadNo),
      house_no:Number(houseNo)
    };
    if(payload.life_region.length<2)throw new Error("생활권을 선택하세요.");
    if(payload.room_name.length<2)throw new Error("방이름은 2자 이상 입력하세요.");
    if(!Number.isInteger(payload.road_no)||payload.road_no<1||payload.road_no>9999)throw new Error("길 번호를 확인하세요.");
    if(!Number.isInteger(payload.house_no)||payload.house_no<1||payload.house_no>9999)throw new Error("집 번호를 확인하세요.");
    const {data,error}=await state.client.from("nexhomes").insert(payload).select().single();
    if(error){
      if(error.code==="23505")throw new Error("이미 사용 중인 방이름 또는 NexHome 주소입니다.");
      throw error;
    }
    return data;
  }

  async function getNexHomeById(id){
    if(!state.client)return null;
    const {data,error}=await state.client
      .from("nexhomes")
      .select("*,profiles!nexhomes_owner_id_fkey(nickname,primary_region,bio,bike)")
      .eq("id",id)
      .maybeSingle();
    if(error)throw error;
    return data||null;
  }


  async function updateNexHome(id,changes={}){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const payload={updated_at:new Date().toISOString()};
    if(Object.prototype.hasOwnProperty.call(changes,"intro"))payload.intro=String(changes.intro||"").trim().slice(0,80);
    if(["light","blue","dark"].includes(changes.theme))payload.theme=changes.theme;
    if(["public","friends","private"].includes(changes.entryScope))payload.entry_scope=changes.entryScope;
    if(["all","friends","off"].includes(changes.guestbookScope))payload.guestbook_scope=changes.guestbookScope;
    if(Object.prototype.hasOwnProperty.call(changes,"profileUrl"))payload.profile_url=String(changes.profileUrl||"").trim()||null;
    if(Object.prototype.hasOwnProperty.call(changes,"coverUrl"))payload.cover_url=String(changes.coverUrl||"").trim()||null;
    const {error}=await state.client.from("nexhomes").update(payload).eq("id",id).eq("owner_id",state.user.id);
    if(error)throw error;
    return await getNexHomeById(id);
  }

  function nexHomeMediaPathFromUrl(url){
    const marker="/storage/v1/object/public/nexhome-media/";
    const i=String(url||"").indexOf(marker);
    return i<0?null:decodeURIComponent(String(url).slice(i+marker.length));
  }

  async function uploadNexHomeImage(nexhomeId,kind,file){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    if(!["profile","cover"].includes(kind))throw new Error("이미지 종류를 확인하세요.");
    if(!file)throw new Error("사진을 선택하세요.");
    const allowed={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
    const ext=allowed[file.type];
    if(!ext)throw new Error("JPG, PNG, WEBP 이미지만 사용할 수 있습니다.");
    if(file.size>6291456)throw new Error("사진은 6MB 이하만 사용할 수 있습니다.");
    const owned=await getMyNexHome();
    if(!owned||owned.id!==nexhomeId)throw new Error("내 NexHome에서만 사진을 바꿀 수 있습니다.");
    const oldUrl=kind==="profile"?owned.profile_url:owned.cover_url;
    const token=(globalThis.crypto&&crypto.randomUUID)?crypto.randomUUID():Math.random().toString(36).slice(2);
    const path=state.user.id+"/"+kind+"-"+Date.now()+"-"+token+"."+ext;
    const {data,error}=await state.client.storage.from("nexhome-media").upload(path,file,{
      cacheControl:"3600",
      contentType:file.type,
      upsert:false
    });
    if(error)throw error;
    const {data:publicData}=state.client.storage.from("nexhome-media").getPublicUrl(data.path);
    const url=publicData&&publicData.publicUrl;
    if(!url)throw new Error("업로드한 사진 주소를 만들지 못했습니다.");
    const changes=kind==="profile"?{profileUrl:url}:{coverUrl:url};
    const updated=await updateNexHome(nexhomeId,changes);
    const oldPath=nexHomeMediaPathFromUrl(oldUrl);
    if(oldPath){try{await state.client.storage.from("nexhome-media").remove([oldPath])}catch{}}
    return updated;
  }

  async function removeNexHomeImage(nexhomeId,kind){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    if(!["profile","cover"].includes(kind))throw new Error("이미지 종류를 확인하세요.");
    const owned=await getMyNexHome();
    if(!owned||owned.id!==nexhomeId)throw new Error("내 NexHome에서만 사진을 바꿀 수 있습니다.");
    const oldUrl=kind==="profile"?owned.profile_url:owned.cover_url;
    const changes=kind==="profile"?{profileUrl:""}:{coverUrl:""};
    const updated=await updateNexHome(nexhomeId,changes);
    const oldPath=nexHomeMediaPathFromUrl(oldUrl);
    if(oldPath){try{await state.client.storage.from("nexhome-media").remove([oldPath])}catch{}}
    return updated;
  }

  async function getNexHomeAlbums(nexhomeId){
    if(!state.client||!nexhomeId)return [];
    const {data,error}=await state.client
      .from("nexhome_albums")
      .select("*")
      .eq("nexhome_id",nexhomeId)
      .order("created_at",{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function getNexHomePhotos(nexhomeId,albumId=null){
    if(!state.client||!nexhomeId)return [];
    let q=state.client
      .from("nexhome_photos")
      .select("*")
      .eq("nexhome_id",nexhomeId)
      .order("created_at",{ascending:false});
    if(albumId)q=q.eq("album_id",albumId);
    const {data,error}=await q;
    if(error)throw error;
    return data||[];
  }

  async function createNexHomeAlbum(nexhomeId,{title,description="",visibility="public"}={}){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const owned=await getMyNexHome();
    if(!owned||owned.id!==nexhomeId)throw new Error("내 NexHome에서만 앨범을 만들 수 있습니다.");
    const payload={
      nexhome_id:nexhomeId,
      owner_id:state.user.id,
      title:String(title||"").trim().slice(0,60),
      description:String(description||"").trim().slice(0,500),
      visibility:["public","friends","private"].includes(visibility)?visibility:"public"
    };
    if(!payload.title)throw new Error("앨범 이름을 입력하세요.");
    const {data,error}=await state.client.from("nexhome_albums").insert(payload).select().single();
    if(error)throw error;
    return data;
  }

  async function uploadNexHomeAlbumPhotos(albumId,files=[]){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const list=Array.from(files||[]).filter(Boolean).slice(0,20);
    if(!list.length)throw new Error("사진을 선택하세요.");
    const {data:album,error:albumError}=await state.client
      .from("nexhome_albums")
      .select("id,nexhome_id,owner_id")
      .eq("id",albumId)
      .single();
    if(albumError)throw albumError;
    if(!album||album.owner_id!==state.user.id)throw new Error("내 앨범에만 사진을 올릴 수 있습니다.");
    const allowed={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
    const inserted=[];
    for(let i=0;i<list.length;i++){
      const file=list[i],ext=allowed[file.type];
      if(!ext)throw new Error("JPG, PNG, WEBP 이미지만 올릴 수 있습니다.");
      if(file.size>6291456)throw new Error("사진은 한 장당 6MB 이하만 올릴 수 있습니다.");
      const token=(globalThis.crypto&&crypto.randomUUID)?crypto.randomUUID():Math.random().toString(36).slice(2);
      const storagePath=state.user.id+"/albums/"+album.id+"/"+Date.now()+"-"+i+"-"+token+"."+ext;
      const {data:uploaded,error:uploadError}=await state.client.storage.from("nexhome-media").upload(storagePath,file,{
        cacheControl:"3600",contentType:file.type,upsert:false
      });
      if(uploadError)throw uploadError;
      const {data:publicData}=state.client.storage.from("nexhome-media").getPublicUrl(uploaded.path);
      const url=publicData&&publicData.publicUrl;
      if(!url){try{await state.client.storage.from("nexhome-media").remove([uploaded.path])}catch{};throw new Error("사진 주소를 만들지 못했습니다.");}
      const row={
        album_id:album.id,
        nexhome_id:album.nexhome_id,
        owner_id:state.user.id,
        image_url:url,
        storage_path:uploaded.path,
        sort_order:i
      };
      const {data,error}=await state.client.from("nexhome_photos").insert(row).select().single();
      if(error){try{await state.client.storage.from("nexhome-media").remove([uploaded.path])}catch{};throw error;}
      inserted.push(data);
    }
    return inserted;
  }

  async function updateNexHomeAlbum(albumId,{title,description,visibility}={}){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const changes={updated_at:new Date().toISOString()};
    if(title!==undefined){
      const v=String(title||"").trim().slice(0,60);
      if(!v)throw new Error("앨범 이름을 입력하세요.");
      changes.title=v;
    }
    if(description!==undefined)changes.description=String(description||"").trim().slice(0,500);
    if(visibility!==undefined){
      if(!["public","friends","private"].includes(visibility))throw new Error("공개범위를 확인하세요.");
      changes.visibility=visibility;
    }
    const {data,error}=await state.client
      .from("nexhome_albums")
      .update(changes)
      .eq("id",albumId)
      .eq("owner_id",state.user.id)
      .select()
      .single();
    if(error)throw error;
    return data;
  }

  async function updateNexHomePhotoPost(photoId,{title,body}={}){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const changes={};
    if(title!==undefined)changes.title=String(title||"").trim().slice(0,80);
    if(body!==undefined)changes.caption=String(body||"").trim().slice(0,1200);
    const {data,error}=await state.client
      .from("nexhome_photos")
      .update(changes)
      .eq("id",photoId)
      .eq("owner_id",state.user.id)
      .select()
      .single();
    if(error)throw error;
    return data;
  }

  async function updateNexHomePhotoCaption(photoId,caption=""){
    return updateNexHomePhotoPost(photoId,{body:caption});
  }

  async function getNexHomePhotoComments(photoId){
    if(!state.client||!photoId)return [];
    const {data,error}=await state.client
      .from("nexhome_photo_comments")
      .select("*,profiles!nexhome_photo_comments_author_id_fkey(nickname)")
      .eq("photo_id",photoId)
      .order("created_at",{ascending:true});
    if(error)throw error;
    return data||[];
  }

  async function addNexHomePhotoComment(photoId,body){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const text=String(body||"").trim().slice(0,500);
    if(!text)throw new Error("댓글 내용을 입력하세요.");
    const {data,error}=await state.client
      .from("nexhome_photo_comments")
      .insert({photo_id:photoId,author_id:state.user.id,body:text})
      .select("*,profiles!nexhome_photo_comments_author_id_fkey(nickname)")
      .single();
    if(error)throw error;
    return data;
  }

  async function deleteNexHomePhotoComment(commentId){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const {error}=await state.client
      .from("nexhome_photo_comments")
      .delete()
      .eq("id",commentId);
    if(error)throw error;
    return true;
  }

  async function deleteNexHomeAlbumPhoto(photoId){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const {data:photo,error:readError}=await state.client
      .from("nexhome_photos")
      .select("id,owner_id,storage_path")
      .eq("id",photoId)
      .single();
    if(readError)throw readError;
    if(!photo||photo.owner_id!==state.user.id)throw new Error("내 사진만 삭제할 수 있습니다.");

    const {error:deleteError}=await state.client
      .from("nexhome_photos")
      .delete()
      .eq("id",photo.id)
      .eq("owner_id",state.user.id);
    if(deleteError)throw deleteError;

    if(photo.storage_path){
      const {error:storageError}=await state.client.storage
        .from("nexhome-media")
        .remove([photo.storage_path]);
      if(storageError)throw new Error("사진 기록은 삭제됐지만 파일 정리에 실패했습니다.");
    }
    return true;
  }

  async function getNexHomeFriendState(otherUserId){
    if(!state.client||!state.user||!otherUserId)return {status:"signed_out",row:null};
    if(state.user.id===otherUserId)return {status:"self",row:null};
    const uid=state.user.id;
    const {data,error}=await state.client
      .from("nexhome_friendships")
      .select("*")
      .or("and(requester_id.eq."+uid+",addressee_id.eq."+otherUserId+"),and(requester_id.eq."+otherUserId+",addressee_id.eq."+uid+")")
      .maybeSingle();
    if(error)throw error;
    if(!data)return {status:"none",row:null};
    if(data.status==="accepted")return {status:"accepted",row:data};
    if(data.status==="pending"&&data.requester_id===uid)return {status:"outgoing_pending",row:data};
    if(data.status==="pending"&&data.addressee_id===uid)return {status:"incoming_pending",row:data};
    return {status:data.status||"none",row:data};
  }

  async function sendNexHomeFriendRequest(otherUserId){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    if(!otherUserId||otherUserId===state.user.id)throw new Error("내 자신에게는 친구 신청을 할 수 없습니다.");
    const current=await getNexHomeFriendState(otherUserId);
    if(current.status==="accepted")return current.row;
    if(current.status==="outgoing_pending")return current.row;
    if(current.status==="incoming_pending")throw new Error("상대가 먼저 친구 신청을 보냈습니다. 수락해주세요.");
    if(current.row){
      const {error:removeError}=await state.client.from("nexhome_friendships").delete().eq("id",current.row.id);
      if(removeError)throw removeError;
    }
    const {data,error}=await state.client
      .from("nexhome_friendships")
      .insert({requester_id:state.user.id,addressee_id:otherUserId,status:"pending"})
      .select()
      .single();
    if(error)throw error;
    return data;
  }

  async function answerNexHomeFriendRequest(friendshipId,accept=true){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const status=accept?"accepted":"rejected";
    const {data,error}=await state.client
      .from("nexhome_friendships")
      .update({status,updated_at:new Date().toISOString()})
      .eq("id",friendshipId)
      .eq("addressee_id",state.user.id)
      .eq("status","pending")
      .select()
      .single();
    if(error)throw error;
    return data;
  }

  async function removeNexHomeFriendship(friendshipId){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const {error}=await state.client.from("nexhome_friendships").delete().eq("id",friendshipId);
    if(error)throw error;
    return true;
  }

  async function getMyNexHomeFriends(){
    if(!state.client||!state.user)return {incoming:[],outgoing:[],friends:[]};
    const uid=state.user.id;
    const {data:rows,error}=await state.client
      .from("nexhome_friendships")
      .select("*")
      .or("requester_id.eq."+uid+",addressee_id.eq."+uid)
      .order("created_at",{ascending:false});
    if(error)throw error;
    const list=rows||[];
    const ids=[...new Set(list.flatMap(r=>[r.requester_id,r.addressee_id]).filter(id=>id!==uid))];
    let profiles=[],homes=[];
    if(ids.length){
      const pr=await state.client.from("profiles").select("id,nickname,primary_region,bike").in("id",ids);
      if(pr.error)throw pr.error;profiles=pr.data||[];
      const hr=await state.client.from("nexhomes").select("id,owner_id,room_name,life_region,profile_url,intro").in("owner_id",ids);
      if(hr.error)throw hr.error;homes=hr.data||[];
    }
    const byProfile=Object.fromEntries(profiles.map(p=>[p.id,p]));
    const byHome=Object.fromEntries(homes.map(h=>[h.owner_id,h]));
    const enrich=r=>{
      const otherId=r.requester_id===uid?r.addressee_id:r.requester_id;
      return {...r,other_id:otherId,profile:byProfile[otherId]||null,nexhome:byHome[otherId]||null};
    };
    return {
      incoming:list.filter(r=>r.status==="pending"&&r.addressee_id===uid).map(enrich),
      outgoing:list.filter(r=>r.status==="pending"&&r.requester_id===uid).map(enrich),
      friends:list.filter(r=>r.status==="accepted").map(enrich)
    };
  }

  async function isNexHomeFriend(ownerId){
    if(!state.client||!state.user||!ownerId)return false;
    if(state.user.id===ownerId)return true;
    const uid=state.user.id;
    const {data,error}=await state.client
      .from("nexhome_friendships")
      .select("id,requester_id,addressee_id,status")
      .eq("status","accepted")
      .or("and(requester_id.eq."+uid+",addressee_id.eq."+ownerId+"),and(requester_id.eq."+ownerId+",addressee_id.eq."+uid+")")
      .limit(1);
    if(error)throw error;
    return !!(data&&data.length);
  }

  async function getNexHomeGuestbook(nexhomeId){
    if(!state.client||!nexhomeId)return [];
    const {data,error}=await state.client
      .from("nexhome_guestbook_entries")
      .select("*,profiles!nexhome_guestbook_entries_author_id_fkey(nickname)")
      .eq("nexhome_id",nexhomeId)
      .order("created_at",{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function addNexHomeGuestbookEntry(nexhomeId,body){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const text=String(body||"").trim().slice(0,1000);
    if(!text)throw new Error("방명록 내용을 입력하세요.");
    const {data,error}=await state.client
      .from("nexhome_guestbook_entries")
      .insert({nexhome_id:nexhomeId,author_id:state.user.id,body:text})
      .select("*,profiles!nexhome_guestbook_entries_author_id_fkey(nickname)")
      .single();
    if(error)throw error;
    return data;
  }

  async function replyNexHomeGuestbookEntry(entryId,body){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const text=String(body||"").trim().slice(0,1000);
    if(!text)throw new Error("답글 내용을 입력하세요.");
    const {data,error}=await state.client
      .from("nexhome_guestbook_entries")
      .update({reply_body:text,reply_at:new Date().toISOString()})
      .eq("id",entryId)
      .select("*,profiles!nexhome_guestbook_entries_author_id_fkey(nickname)")
      .single();
    if(error)throw error;
    return data;
  }

  async function deleteNexHomeGuestbookEntry(entryId){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const {error}=await state.client
      .from("nexhome_guestbook_entries")
      .delete()
      .eq("id",entryId);
    if(error)throw error;
    return true;
  }

  async function getNexHomeRecords(nexhomeId){
    if(!state.client||!nexhomeId)return [];
    const {data,error}=await state.client
      .from("nexhome_records")
      .select("*")
      .eq("nexhome_id",nexhomeId)
      .order("created_at",{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function addNexHomeRecord(nexhomeId,{title,body,visibility="public"}={}){
    if(!state.client||!state.user)throw new Error("로그인이 필요합니다.");
    const payload={
      nexhome_id:nexhomeId,
      author_id:state.user.id,
      title:String(title||"").trim().slice(0,120),
      body:String(body||"").trim().slice(0,12000),
      visibility:["public","friends","private"].includes(visibility)?visibility:"public"
    };
    if(!payload.title)throw new Error("제목을 입력하세요.");
    if(!payload.body)throw new Error("내용을 입력하세요.");
    const {data,error}=await state.client.from("nexhome_records").insert(payload).select().single();
    if(error)throw error;
    return data;
  }

  async function finishNexHomeFirstVisit(id){
    if(!state.client||!state.user)return;
    const {error}=await state.client.from("nexhomes").update({first_visit:false,updated_at:new Date().toISOString()}).eq("id",id).eq("owner_id",state.user.id);
    if(error)throw error;
  }

  function isAdmin(){
    return !!(state.profile&&["admin","moderator"].includes(state.profile.role));
  }

  async function getPendingBusinesses(){
    if(!isAdmin())throw new Error("관리자 권한이 필요합니다.");
    const {data,error}=await state.client
      .from("businesses")
      .select("*")
      .eq("approval_status","pending")
      .order("created_at",{ascending:false});
    if(error)throw error;
    return data||[];
  }

  async function setBusinessApproval(id,status){
    if(!isAdmin())throw new Error("관리자 권한이 필요합니다.");
    if(!["approved","rejected","hidden"].includes(status))throw new Error("잘못된 상태입니다.");
    const {data,error}=await state.client
      .from("businesses")
      .update({approval_status:status,updated_at:new Date().toISOString()})
      .eq("id",id)
      .select()
      .single();
    if(error)throw error;
    return data;
  }

  async function getAdminReports(){
    if(!isAdmin())throw new Error("관리자 권한이 필요합니다.");
    const {data,error}=await state.client.from("reports").select("*").order("created_at",{ascending:false});
    if(error)throw error;
    const reports=data||[];
    const specs={
      post:{table:"posts",field:"title"},
      comment:{table:"comments",field:"body"},
      market:{table:"marketplace_items",field:"title"},
      business:{table:"businesses",field:"name"},
      job:{table:"jobs",field:"title"},
      interest_post:{table:"interest_posts",field:"title"},
      care_post:{table:"care_posts",field:"title"}
    };
    const maps={};
    for(const [type,spec] of Object.entries(specs)){
      const ids=[...new Set(reports.filter(r=>r.target_type===type).map(r=>r.target_id))];
      if(!ids.length)continue;
      const {data:rows,error:e}=await state.client.from(spec.table).select("id,"+spec.field).in("id",ids);
      if(e)throw e;
      maps[type]=Object.fromEntries((rows||[]).map(x=>[x.id,x[spec.field]]));
    }
    return reports.map(r=>({
      ...r,
      target_title:(maps[r.target_type]&&maps[r.target_type][r.target_id])||r.target_id
    }));
  }

  async function setReportStatus(id,status){
    if(!isAdmin())throw new Error("관리자 권한이 필요합니다.");
    if(!["open","reviewed","resolved","dismissed"].includes(status))throw new Error("잘못된 상태입니다.");
    const payload={status};
    if(status!=="open"){payload.reviewed_at=new Date().toISOString();payload.reviewed_by=state.user.id}
    const {data,error}=await state.client.from("reports").update(payload).eq("id",id).select().single();
    if(error)throw error;
    return data;
  }

  async function hideModeratedTarget(targetType,targetId){
    if(!isAdmin())throw new Error("관리자 권한이 필요합니다.");
    if(targetType==="market"){
      const {error}=await state.client.from("marketplace_items").update({status:"hidden",updated_at:new Date().toISOString()}).eq("id",targetId);
      if(error)throw error;return;
    }
    if(targetType==="business"){
      const {error}=await state.client.from("businesses").update({approval_status:"hidden",updated_at:new Date().toISOString()}).eq("id",targetId);
      if(error)throw error;return;
    }
    if(targetType==="job"){
      const {error}=await state.client.from("jobs").update({status:"hidden",updated_at:new Date().toISOString()}).eq("id",targetId);
      if(error)throw error;return;
    }
    throw new Error("이 항목은 자동 숨김 대상이 아닙니다.");
  }

  async function report({targetType,targetId,reason}){
    if(!state.user)throw new Error("로그인이 필요합니다.");
    const {data,error}=await state.client.from("reports").insert({reporter_id:state.user.id,target_type:targetType,target_id:targetId,reason}).select().single();
    if(error)throw error;return data;
  }

  window.RNXRemote={state,init,signUp,signIn,signOut,resendConfirmation,updateProfile,sendPasswordReset,updatePassword,deleteAccount,getRegionPosts,getComments,getMyPosts,refreshProfile,addPost,addComment,addMarket,getMarket,addBusiness,getBusinesses,addJob,getJobs,joinInterest,leaveInterest,isInterestMember,interestMemberCount,getInterestPosts,addInterestPost,getCarePosts,addCarePost,getNotifications,unreadCount,markNotice,markAllNotices,clearNotices,searchAll,getMyNexHome,checkNexHomeAvailability,createNexHome,getNexHomeById,updateNexHome,uploadNexHomeImage,removeNexHomeImage,getNexHomeAlbums,getNexHomePhotos,createNexHomeAlbum,updateNexHomeAlbum,uploadNexHomeAlbumPhotos,updateNexHomePhotoPost,updateNexHomePhotoCaption,getNexHomePhotoComments,addNexHomePhotoComment,deleteNexHomePhotoComment,deleteNexHomeAlbumPhoto,getNexHomeFriendState,sendNexHomeFriendRequest,answerNexHomeFriendRequest,removeNexHomeFriendship,getMyNexHomeFriends,isNexHomeFriend,getNexHomeGuestbook,addNexHomeGuestbookEntry,replyNexHomeGuestbookEntry,deleteNexHomeGuestbookEntry,getNexHomeRecords,addNexHomeRecord,finishNexHomeFirstVisit,isAdmin,getPendingBusinesses,setBusinessApproval,getAdminReports,setReportStatus,hideModeratedTarget,report};
})();