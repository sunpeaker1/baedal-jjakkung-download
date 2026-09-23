document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.querySelector('.menu'), links=document.querySelector('.mobileLinks');
  if(btn&&links)btn.addEventListener('click',()=>links.classList.toggle('open'));
  document.querySelectorAll('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());
});

/* Homepage interactive RiderJjakkung feature guide */
document.addEventListener('DOMContentLoaded',()=>{
  const section=document.getElementById('feature-detail');
  if(!section) return;

  const featureData={
    record:{
      kicker:'자동기록',
      title:'배달 기록은 자동으로, 확인은 한눈에',
      desc:'배달완료 건수와 수익 기록을 모아 운행 흐름을 확인하고 최근 기록을 관리합니다.',
      screens:[
        ['assets/screenshots/full/record.webp','운행기록'],
        ['assets/screenshots/full/home.webp','오늘 운행']
      ],
      steps:[
        '운행을 시작하고 자동기록 상태를 확인합니다.',
        '배달 완료 후 운행기록에서 건수와 수익이 들어왔는지 확인합니다.',
        '필요하면 최근 기록에서 오류를 수정하거나 삭제·복원합니다.'
      ],
      point:'쿠팡 자동기록은 안정화된 보호영역을 유지하며, 배민 자동기록은 테스트 상태에 따라 동작이 제한될 수 있습니다.'
    },
    money:{
      kicker:'수익 · 정산',
      title:'번 돈, 쓴 돈, 받을 돈까지 한 흐름으로',
      desc:'수익 분석부터 정산예정, 입금확인과 검산까지 실제 돈의 흐름을 관리합니다.',
      screens:[
        ['assets/screenshots/full/earnings.webp','수익 분석'],
        ['assets/screenshots/full/settlement.webp','정산 관리']
      ],
      steps:[
        '오늘·주간·월간 수익을 확인합니다.',
        '공제·업무지출·렌트 부담을 반영해 예상 순수익을 확인합니다.',
        '정산 예정일과 받을 돈을 확인하고 실제 입금 후 입금확인으로 검산합니다.'
      ],
      point:'수익만 보는 것이 아니라 지출과 정산까지 연결해 실제 남는 돈을 확인하는 데 초점을 둡니다.'
    },
    area:{
      kicker:'지역판단',
      title:'내 활동지역 기준으로 목적지를 빠르게 판단',
      desc:'선호·주의·회피·활동지역을 직접 설정하고 배달 목적지 판단에 활용합니다.',
      screens:[
        ['assets/screenshots/full/region.webp','지역판단']
      ],
      steps:[
        '주 활동지역을 설정합니다.',
        '선호·주의·회피지역을 필요에 맞게 등록합니다.',
        '운행 중 목적지를 확인할 때 현재 기준과 함께 판단합니다.'
      ],
      point:'지역판단은 라이더가 직접 정한 기준을 빠르게 보여주는 운행 보조 기능입니다.'
    },
    maintenance:{
      kicker:'정비 · 비용',
      title:'바이크 상태와 운행비용을 함께 관리',
      desc:'정비주기, 주유비, 업무지출, 렌트·리스 부담을 실제 기록으로 관리합니다.',
      screens:[
        ['assets/screenshots/full/maintenance.webp','정비관리'],
        ['assets/screenshots/full/fuel.webp','주유관리'],
        ['assets/screenshots/full/rent.webp','렌트·리스'],
        ['assets/screenshots/full/management.webp','통합 관리']
      ],
      steps:[
        '내 바이크와 현재 주행거리를 등록합니다.',
        '엔진오일·타이어·브레이크 등 정비항목의 최근 기록과 다음 점검 시점을 관리합니다.',
        '주유·업무지출·렌트/리스 비용을 입력해 실제 운행비용에 반영합니다.'
      ],
      point:'정비와 비용을 따로 적지 않고 같은 앱에서 관리하도록 구성했습니다.'
    },
    safety:{
      kicker:'안전도우미',
      title:'출발 전에는 확인하고, 사고 때는 바로 기록',
      desc:'112·119, 사고메모, 현장증빙, 단속경고와 주변 안전정보를 제공합니다.',
      screens:[
        ['assets/screenshots/full/safety.webp','안전도우미'],
        ['assets/screenshots/full/enforcement.webp','단속경고 설정']
      ],
      steps:[
        '출발 전 안전정보와 필요한 경고 설정을 확인합니다.',
        '단속경고 거리·음·진동·후면 점멸 등 원하는 방식을 설정합니다.',
        '사고 시 112·119, 긴급메모와 현장사진 기능을 사용합니다.'
      ],
      point:'단속경고는 운행 보조용 참고 기능이며 실제 도로 표지·신호와 안전운행을 우선해야 합니다.'
    },
    convenience:{
      kicker:'편의 · 위험도로',
      title:'필요한 장소는 빠르게 찾고, 위험한 길은 직접 기록',
      desc:'공공화장실·주유소·정비소·쉼터 찾기와 포트홀·침수·공사 구간 메모를 지원합니다.',
      screens:[
        ['assets/screenshots/full/convenience-map.webp','라이더 편의지도'],
        ['assets/screenshots/full/hazard.webp','위험도로 메모']
      ],
      steps:[
        '편의지도에서 찾고 싶은 장소 종류를 선택합니다.',
        '네이버지도 또는 Google 지도에서 주변 장소를 검색합니다.',
        '다시 피하고 싶은 위험구간은 위치와 메모를 남겨 다음 운행에 참고합니다.'
      ],
      point:'주행 중 조작하지 말고 안전하게 정차한 뒤 확인하는 것을 기준으로 합니다.'
    },
    data:{
      kicker:'증빙 · 백업',
      title:'영수증은 모으고, 내 기록은 지키고',
      desc:'정산·주유·정비·렌트·보험·사고 증빙을 보관하고 전체 데이터를 백업·복원합니다.',
      screens:[
        ['assets/screenshots/full/evidence.webp','증빙보관함'],
        ['assets/screenshots/full/backup.webp','데이터 백업/복원']
      ],
      steps:[
        '증빙보관함에서 사진을 촬영하거나 파일을 선택해 분류합니다.',
        '필요한 시점에 전체 백업파일을 저장합니다.',
        '휴대폰 교체나 재설치 시 백업파일을 확인한 뒤 복원합니다.'
      ],
      point:'수익 기록뿐 아니라 증빙파일까지 함께 보관할 수 있도록 설계했습니다.'
    },
    nav:{
      kicker:'짝꿍내비',
      title:'목적지는 메인폰에서, 길안내는 보조폰에서',
      desc:'메인폰에서 확인한 배달 목적지를 보조폰으로 보내 내비 사용을 돕습니다.',
      screens:[
        ['assets/screenshots/full/nav.webp','짝꿍내비 연결 화면']
      ],
      steps:[
        '메인폰과 보조폰 역할을 선택합니다.',
        '처음 한 번 QR로 페어링하고 두 기기 모두 연결됨을 확인합니다.',
        '배달앱에서 목적지를 확인하면 보조폰으로 전송해 내비 실행을 준비합니다.'
      ],
      point:'짝꿍내비는 현재 실제 운행 환경에서 연동 테스트 중이며 공개 버전에서는 일부 동작이 제한될 수 있습니다.'
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
    screens.innerHTML=d.screens.map(([src,label])=>'<article class="featureScreenCard"><img src="'+src+'" alt="라이더짝꿍 '+label+' 실제 화면" loading="lazy"><h4>'+label+'</h4></article>').join('');
    steps.innerHTML=d.steps.map(x=>'<li>'+x+'</li>').join('');
    point.textContent=d.point;
    picks.forEach(x=>x.classList.toggle('active',x.dataset.feature===key));
    section.hidden=false;
    setTimeout(()=>section.scrollIntoView({behavior:'smooth',block:'start'}),30);
  }

  picks.forEach(btn=>btn.addEventListener('click',()=>showFeature(btn.dataset.feature)));
  if(closeBtn) closeBtn.addEventListener('click',()=>{
    section.hidden=true;
    picks.forEach(x=>x.classList.remove('active'));
  });
});
