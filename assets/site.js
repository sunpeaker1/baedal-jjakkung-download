document.addEventListener('DOMContentLoaded',()=>{
  // Homepage should always open at the feature guide, not a restored old scroll position.
  if(document.body.classList.contains('homeLight') && !location.hash){
    if('scrollRestoration' in history) history.scrollRestoration='manual';
    requestAnimationFrame(()=>window.scrollTo(0,0));
    setTimeout(()=>window.scrollTo(0,0),80);
  }
  const btn=document.querySelector('.menu');
  const links=document.querySelector('.mobileLinks');
  if(btn&&links) btn.addEventListener('click',()=>links.classList.toggle('open'));

  document.querySelectorAll('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());

  document.querySelectorAll('[data-today-ko]').forEach(x=>{
    try{
      const parts=new Intl.DateTimeFormat('ko-KR',{
        year:'numeric',month:'long',day:'numeric',weekday:'short'
      }).format(new Date());
      x.textContent=parts;
    }catch(e){}
  });

  const section=document.getElementById('feature-detail');
  if(!section) return;

  const featureData={
    record:{
      kicker:'자동기록',
      title:'배달 기록은 자동으로, 확인은 한눈에',
      desc:'배달 완료 기록을 자동으로 모아 건수·수익·운행 흐름을 확인하고, 최근 기록의 오류 수정·삭제·복원까지 관리합니다.',
      screens:[
        ['assets/screenshots/full/record.webp','운행기록'],
        ['assets/screenshots/full/home.webp','홈 요약']
      ],
      steps:[
        '운행을 시작하고 자동기록 상태가 정상인지 확인합니다.',
        '배달 완료 후 운행기록에서 건수와 수익이 기록됐는지 확인합니다.',
        '필요하면 최근 기록에서 오류를 수정하거나 삭제·복원합니다.'
      ],
      point:'쿠팡 자동기록은 보호영역을 유지하고 있으며, 배민 자동기록은 현재 테스트 중이라 공개 버전에서 일부 동작이 제한될 수 있습니다.'
    },
    money:{
      kicker:'수익 · 정산',
      title:'번 돈부터 받을 돈까지 한 흐름으로',
      desc:'오늘·주간·월간 수익부터 공제·지출·렌트 부담, 정산 예정, 입금확인과 검산까지 실제 돈의 흐름을 한곳에서 관리합니다.',
      screens:[
        ['assets/screenshots/full/earnings.webp','수익 분석'],
        ['assets/screenshots/full/settlement.webp','정산 관리']
      ],
      steps:[
        '오늘·주간·월간 수익과 건수, 시간당수익을 확인합니다.',
        '공제·업무지출·렌트 부담을 반영해 예상 실제 순수익을 확인합니다.',
        '플랫폼별 정산 예정일과 받을 돈을 확인하고 실제 입금 후 검산합니다.'
      ],
      point:'100일 목표 관리도 함께 사용해 누적금액과 남은 기간을 확인할 수 있습니다.'
    },
    area:{
      kicker:'지역판단',
      title:'내 기준으로 목적지를 빠르게 판단',
      desc:'주 활동지역과 선호·주의·회피지역을 직접 설정하고, 배달 목적지가 내 운행 기준에 맞는지 빠르게 판단하는 데 활용합니다.',
      screens:[
        ['assets/screenshots/full/region.webp','지역판단']
      ],
      steps:[
        '주 활동지역을 설정합니다.',
        '선호·주의·회피지역을 필요에 맞게 등록합니다.',
        '운행 중 배달 목적지를 확인할 때 설정한 기준을 함께 확인합니다.'
      ],
      point:'지역판단은 라이더가 직접 설정한 기준을 빠르게 보여주는 운행 보조 기능입니다.'
    },
    nav:{
      kicker:'짝꿍내비',
      title:'목적지는 메인폰에서, 길안내는 보조폰에서',
      desc:'메인폰의 배달앱에서 확인한 목적지를 보조폰으로 보내 TMAP·카카오내비 사용을 돕는 보조 기능입니다.',
      screens:[
        ['assets/screenshots/full/nav.webp','짝꿍내비 연결 화면']
      ],
      steps:[
        '메인폰과 보조폰 역할을 선택합니다.',
        '처음 한 번 QR로 페어링하고 두 기기가 연결됨 상태인지 확인합니다.',
        '배달앱에서 목적지를 확인하면 보조폰으로 전송해 내비 실행을 준비합니다.'
      ],
      point:'짝꿍내비는 현재 실제 운행 환경에서 연동 테스트 중이며 공개 버전에서는 일부 동작이 제한될 수 있습니다.'
    },
    maintenance:{
      kicker:'정비관리',
      title:'바이크 상태와 유지비를 놓치지 않게',
      desc:'바이크 주행거리와 정비주기, 주유, 렌트·리스 비용을 기록해 점검 시점과 유지비를 함께 관리합니다.',
      screens:[
        ['assets/screenshots/full/maintenance.webp','정비관리'],
        ['assets/screenshots/full/fuel.webp','주유관리'],
        ['assets/screenshots/full/rent.webp','렌트·리스']
      ],
      steps:[
        '내 바이크와 현재 주행거리를 등록합니다.',
        '엔진오일·타이어·브레이크 등 주요 항목의 최근 정비와 다음 점검 시점을 관리합니다.',
        '주유비와 렌트·리스 납입 정보를 기록해 실제 운행비용에 반영합니다.'
      ],
      point:'정비 임박 항목을 홈에서 바로 확인할 수 있도록 구성했습니다.'
    },
    safety:{
      kicker:'안전도우미',
      title:'출발 전에는 확인하고, 사고 때는 바로 기록',
      desc:'112·119 긴급 연결, 사고메모·현장사진, 주변 안전정보와 전·후면 단속경고 설정을 한곳에서 확인합니다.',
      screens:[
        ['assets/screenshots/full/safety.webp','안전도우미'],
        ['assets/screenshots/full/enforcement.webp','단속경고 설정']
      ],
      steps:[
        '출발 전 필요한 안전정보와 경고 설정을 확인합니다.',
        '단속경고 거리·현재속도·후면점멸·경고음·진동을 원하는 방식으로 설정합니다.',
        '사고 시 112·119, 긴급메모와 사고사진 촬영 기능을 사용합니다.'
      ],
      point:'단속경고는 운행 참고용 보조 기능이며 실제 도로 표지·신호와 안전운행을 우선해야 합니다.'
    },
    expense:{
      kicker:'지출관리',
      title:'업무지출을 날짜별로 기록해 실제 순수익에 반영',
      desc:'보험료, 통행료, 주차비, 식비, 소모품, 통신비 등 날짜별 업무지출을 기록하고 수익 분석의 실제 순수익에 반영합니다.',
      screens:[
        ['assets/screenshots/full/management.webp','관리 메뉴'],
        ['assets/screenshots/full/earnings.webp','순수익 반영']
      ],
      steps:[
        '지출관리에서 날짜와 지출 항목을 선택합니다.',
        '금액을 입력하고 저장합니다.',
        '주유비·정비비처럼 다른 관리 화면에서 반영되는 비용은 중복 입력하지 않고 수익 분석에서 확인합니다.'
      ],
      point:'업무지출을 수익 분석과 연결해 총수익이 아니라 실제 남는 금액을 보는 데 활용합니다.'
    },
    all:{
      kicker:'전체 기능',
      title:'라이더짝꿍의 나머지 기능도 한곳에서',
      desc:'100일 목표관리, 수익분석, 정산관리, 지출·렌트/리스, 증빙보관함, 백업·복원, 편의지도, 위험도로 메모, 자동기록 설정, 기능점검과 사용도우미까지 전체 기능을 확인합니다.',
      screens:[
        ['assets/screenshots/full/management.webp','관리 메뉴'],
        ['assets/screenshots/full/evidence.webp','증빙보관함'],
        ['assets/screenshots/full/backup.webp','백업·복원'],
        ['assets/screenshots/full/convenience-map.webp','라이더 편의지도'],
        ['assets/screenshots/full/hazard.webp','위험도로 메모']
      ],
      steps:[
        '전체 메뉴에서 필요한 기능을 선택합니다.',
        '증빙·백업·편의지도·위험도로 메모 등 운행 보조 기능을 상황에 맞게 사용합니다.',
        '자동기록 설정, V1 기능 점검, 사용도우미, 개인정보·권한 안내도 전체 메뉴에서 확인합니다.'
      ],
      point:'전체 메뉴에는 100일 목표관리, 수익분석, 정산관리, 지출, 렌트/리스, 증빙보관함, 자동기록 설정, 백업/복원, 짝꿍내비, 편의지도, 위험도로 메모, 기능점검, 사용도우미, 권한 안내 등이 포함됩니다.'
    },
    home:{
      kicker:'실제 홈화면',
      title:'오늘 운행에 필요한 정보를 한눈에',
      desc:'총수익, 플랫폼별 기록, 운행시간, 시간당수익, 정비 임박과 목표 진행률을 홈에서 빠르게 확인합니다.',
      screens:[
        ['assets/screenshots/full/home.webp','라이더짝꿍 실제 홈화면']
      ],
      steps:[
        '앱을 열면 오늘의 운행 현황을 먼저 확인합니다.',
        '플랫폼별 수익과 총콜수, 운행시간, 시간당수익을 확인합니다.',
        '정비 임박과 100일 목표 진행률을 확인하고 필요한 관리 화면으로 이동합니다.'
      ],
      point:'홈화면은 실제 운행 데이터를 요약해서 보여주는 중심 화면입니다.'
    }
  };

  const title=document.getElementById('feature-detail-title');
  const kicker=document.getElementById('feature-detail-kicker');
  const desc=document.getElementById('feature-detail-desc');
  const screens=document.getElementById('feature-detail-screens');
  const steps=document.getElementById('feature-detail-steps');
  const point=document.getElementById('feature-detail-point');
  const picks=[...document.querySelectorAll('.featurePick')];
  const closeBtn=section.querySelector('.featureDetailClose');

  function showFeature(key){
    const d=featureData[key];
    if(!d) return;
    kicker.textContent=d.kicker;
    title.textContent=d.title;
    desc.textContent=d.desc;
    screens.innerHTML=d.screens.map(([src,label]) =>
      '<article class="featureScreenCard"><img src="'+src+'" alt="라이더짝꿍 '+label+' 실제 화면" loading="lazy"><h4>'+label+'</h4></article>'
    ).join('');
    steps.innerHTML=d.steps.map(x=>'<li>'+x+'</li>').join('');
    point.textContent=d.point;
    picks.forEach(x=>x.classList.toggle('active',x.dataset.feature===key));
    section.hidden=false;
    setTimeout(()=>section.scrollIntoView({behavior:'smooth',block:'start'}),40);
  }

  picks.forEach(el=>el.addEventListener('click',()=>showFeature(el.dataset.feature)));

  if(closeBtn) closeBtn.addEventListener('click',()=>{
    section.hidden=true;
    picks.forEach(x=>x.classList.remove('active'));
  });
});
