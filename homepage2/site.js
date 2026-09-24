document.addEventListener('DOMContentLoaded',()=>{
  const viewport=document.getElementById('appViewport');
  const navItems=[...document.querySelectorAll('.navItem')];
  const today=document.getElementById('todayText');
  const sheet=document.getElementById('helpSheet');
  const sheetTitle=document.getElementById('sheetTitle');
  const sheetKicker=document.getElementById('sheetKicker');
  const sheetDesc=document.getElementById('sheetDesc');
  const sheetSteps=document.getElementById('sheetSteps');
  const sheetNote=document.getElementById('sheetNote');
  const sheetImageWrap=document.getElementById('sheetImageWrap');
  const sheetImage=document.getElementById('sheetImage');

  try{
    today.textContent=new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date());
  }catch(e){today.textContent='오늘';}

  const help={
    demo:{
      kicker:'WEB DEMO',title:'라이더짝꿍 웹 체험판',
      desc:'실제 라이더짝꿍 앱의 화면 구조와 기능 배치를 웹에서 살펴보는 체험용 페이지입니다. 버튼은 실제 기능을 실행하지 않고 설명과 사용법을 보여줍니다.',
      steps:['아래 메뉴를 눌러 앱 화면을 이동합니다.','각 화면의 버튼·항목을 눌러 기능 설명을 확인합니다.','실제 운행 기능은 Android 앱에서 사용합니다.'],
      note:'홈페이지2는 앱 소개용 웹 체험판이며 운행기록·내비·위치·긴급전화 등의 실제 기능은 실행하지 않습니다.'
    },
    income:{
      kicker:'홈',title:'오늘 총수익',
      desc:'오늘 운행에서 기록된 수익과 플랫폼별 금액을 한눈에 확인하는 영역입니다.',
      image:'../assets/screenshots/full/home.webp',
      steps:['운행을 시작합니다.','배달 완료 기록이 쌓이면 플랫폼별 수익이 반영됩니다.','총콜수·운행시간·시간당수익과 함께 확인합니다.'],
      note:'웹 체험판의 숫자는 실제 수익 데이터와 연결되지 않습니다.'
    },
    driving:{
      kicker:'홈',title:'운행시간 · 시간당수익',
      desc:'현재 운행 세션의 시간과 수익 흐름을 빠르게 확인합니다.',
      image:'../assets/screenshots/full/home.webp',
      steps:['운행 시작 상태를 확인합니다.','누적 운행시간을 확인합니다.','총수익과 운행시간을 기준으로 시간당수익을 확인합니다.'],
      note:'실제 앱에서는 운행기록과 연결되어 표시됩니다.'
    },
    challenge:{
      kicker:'목표관리',title:'100일 목표 챌린지',
      desc:'100일 동안 목표 수익을 얼마나 달성했는지 누적 진행률로 확인하는 기능입니다.',
      image:'../assets/screenshots/full/home.webp',
      steps:['목표 금액과 기간을 설정합니다.','매일 기록된 수익이 누적됩니다.','홈에서 진행률과 남은 기간을 확인합니다.'],
      note:'목표는 관리용 지표이며 실제 정산액과 차이가 있을 수 있습니다.'
    },
    region:{
      kicker:'지역판단',title:'활동지역 · 선호 · 주의 · 회피',
      desc:'라이더가 직접 정한 지역 기준으로 목적지를 빠르게 판단하는 기능입니다.',
      image:'../assets/screenshots/full/region.webp',
      steps:['주 활동지역을 등록합니다.','선호·주의·회피지역을 설정합니다.','운행 중 목적지를 확인할 때 등록한 기준을 참고합니다.'],
      note:'지역판단은 운행 보조 기능이며 최종 오더 선택은 라이더가 직접 판단합니다.'
    },
    destination:{
      kicker:'지역판단',title:'목적지 자동판단',
      desc:'배달 목적지 정보를 읽어 등록한 활동·선호·주의·회피 기준과 비교해 보여주는 기능입니다.',
      image:'../assets/screenshots/full/region.webp',
      steps:['운행 시작을 켭니다.','목적지 정보가 확인되면 지역 기준과 비교합니다.','표시된 판단을 참고해 오더 수행 여부를 결정합니다.'],
      note:'홈페이지2에서는 목적지 인식이나 위치 판정을 실제로 수행하지 않습니다.'
    },
    record:{
      kicker:'운행기록',title:'자동기록 · 운행기록',
      desc:'배달 완료 건수와 수익, 운행 흐름을 날짜별로 관리하는 핵심 기록 화면입니다.',
      image:'../assets/screenshots/full/record.webp',
      steps:['자동기록 상태를 확인합니다.','배달 완료 후 기록이 정상 반영됐는지 확인합니다.','필요하면 수동입력·수정·삭제·복원을 사용합니다.'],
      note:'쿠팡 자동기록 보호영역은 안정화된 구조를 유지하며 배민 자동기록은 공개 버전에 따라 테스트 상태일 수 있습니다.'
    },
    manual:{
      kicker:'운행기록',title:'수입 직접 입력',
      desc:'자동기록으로 들어오지 않은 수입이나 기타 수익을 직접 추가하는 기능입니다.',
      image:'../assets/screenshots/full/record.webp',
      steps:['수입 직접 입력을 엽니다.','플랫폼·금액·메모 등을 입력합니다.','저장 후 오늘/주간/월간 기록에서 확인합니다.'],
      note:'자동기록과 중복되지 않도록 확인 후 입력합니다.'
    },
    settlement:{
      kicker:'수익관리',title:'수익 분석 · 정산 관리',
      desc:'총수익과 비용을 함께 보고 받을 돈·받은 돈을 플랫폼별로 검산하는 기능입니다.',
      image:'../assets/screenshots/full/settlement.webp',
      steps:['수익 분석에서 총수익과 비용을 확인합니다.','정산 예정일과 받을 금액을 확인합니다.','실제 입금 후 입금확인·검산을 진행합니다.'],
      note:'정산일과 금액은 플랫폼 정책 및 실제 지급 내역을 우선 확인해야 합니다.'
    },
    nav:{
      kicker:'짝꿍내비',title:'메인폰 → 보조폰 목적지 전송',
      desc:'메인폰의 배달앱에서 확인한 목적지를 보조폰으로 전송해 TMAP·카카오내비 길안내를 돕는 기능입니다.',
      image:'../assets/screenshots/full/nav.webp',
      steps:['메인폰과 보조폰 역할을 선택합니다.','처음 한 번 QR로 페어링합니다.','연결됨 상태에서 배달 목적지를 보조폰으로 전송합니다.','보조폰에서 선택한 내비로 길안내를 실행합니다.'],
      note:'현재 공개 테스트 버전에서는 실제 운행환경에 따라 일부 연동이 제한될 수 있습니다.'
    },
    pairing:{
      kicker:'짝꿍내비',title:'QR 1회 페어링',
      desc:'메인폰과 보조폰을 처음 한 번 연결해 이후 인터넷을 통해 목적지를 주고받을 수 있게 하는 과정입니다.',
      image:'../assets/screenshots/full/nav.webp',
      steps:['한 기기를 메인폰으로 선택합니다.','다른 기기를 보조폰으로 선택합니다.','QR을 한 번 스캔해 연결합니다.','두 기기에 연결됨 표시가 있는지 확인합니다.'],
      note:'페어링 코드나 QR 정보는 다른 사람에게 공개하지 않는 것이 좋습니다.'
    },
    maintenance:{
      kicker:'관리',title:'정비관리',
      desc:'주행거리와 주요 소모품의 최근 정비·다음 점검 시점을 관리합니다.',
      image:'../assets/screenshots/full/maintenance.webp',
      steps:['바이크 정보와 현재 주행거리를 등록합니다.','엔진오일·타이어·브레이크 등 정비 이력을 입력합니다.','다음 점검 시점과 임박 알림을 확인합니다.'],
      note:'실제 정비는 제조사 매뉴얼과 정비 전문가의 점검을 우선합니다.'
    },
    fuel:{
      kicker:'관리',title:'주유관리',
      desc:'주유 금액·주유량·주행거리를 기록해 월 주유비와 참고 연비를 관리합니다.',
      image:'../assets/screenshots/full/fuel.webp',
      steps:['주유할 때 금액과 리터를 입력합니다.','필요하면 계기판 주행거리도 기록합니다.','월간 주유비와 참고 연비 흐름을 확인합니다.'],
      note:'계기판·주유량 오차에 따라 계산 연비는 실제와 다를 수 있습니다.'
    },
    expense:{
      kicker:'관리',title:'지출관리',
      desc:'보험료·통행료·주차비·식비·소모품·통신비 등 업무 관련 지출을 기록합니다.',
      image:'../assets/screenshots/full/management.webp',
      steps:['지출 항목과 날짜를 선택합니다.','금액과 메모를 입력합니다.','수익 분석에서 실제 비용 반영 결과를 확인합니다.'],
      note:'세무상 인정 여부는 실제 증빙과 관련 세법 기준을 확인해야 합니다.'
    },
    rent:{
      kicker:'관리',title:'렌트 · 리스 관리',
      desc:'납입주기와 누적 납입액, 남은 계약기간을 기록해 바이크 고정비를 관리합니다.',
      image:'../assets/screenshots/full/rent.webp',
      steps:['계약 조건과 납입주기를 등록합니다.','납입한 금액을 기록합니다.','누적 납입액과 남은 기간을 확인합니다.'],
      note:'계약서의 실제 납입 조건을 기준으로 관리합니다.'
    },
    safety:{
      kicker:'안전',title:'안전도우미',
      desc:'112·119 긴급연락, 사고메모, 현장사진과 주행 중 필요한 안전기능을 모아둔 화면입니다.',
      image:'../assets/screenshots/full/safety.webp',
      steps:['필요한 안전 기능을 미리 확인합니다.','사고 시 긴급연락과 메모·사진 기능을 사용합니다.','운행 전후 필요한 기록을 증빙보관함에 정리합니다.'],
      note:'긴급상황에서는 앱보다 112·119 등 공식 긴급서비스 이용을 우선합니다.'
    },
    enforcement:{
      kicker:'안전',title:'단속경고',
      desc:'전방·후면 단속 위치 접근 시 설정한 거리에서 시각·소리·진동 경고를 제공하는 보조 기능입니다.',
      image:'../assets/screenshots/full/enforcement.webp',
      steps:['전방/후면 경고를 설정합니다.','200m·100m·50m·30m 등의 경고 거리를 선택합니다.','현재속도·후면점멸·경고음·진동 설정을 확인합니다.'],
      note:'단속경고는 참고용입니다. 실제 도로표지·제한속도·교통법규를 항상 우선합니다.'
    },
    evidence:{
      kicker:'관리',title:'증빙보관함',
      desc:'정산·주유·정비·렌트·보험·사고 관련 사진과 자료를 분류해 보관합니다.',
      image:'../assets/screenshots/full/evidence.webp',
      steps:['증빙 종류를 선택합니다.','사진 촬영 또는 갤러리에서 자료를 추가합니다.','필요할 때 항목별로 찾아 확인합니다.'],
      note:'중요 증빙은 별도의 안전한 백업도 함께 보관하는 것을 권장합니다.'
    },
    backup:{
      kicker:'관리',title:'데이터 백업 · 복원',
      desc:'수익·정비·지출·증빙 등 앱 데이터를 백업파일로 저장하고 새 기기에서 복원할 수 있게 합니다.',
      image:'../assets/screenshots/full/backup.webp',
      steps:['백업 화면을 엽니다.','전체 백업 파일을 생성해 안전한 곳에 보관합니다.','휴대폰 교체 시 백업 파일을 선택해 복원합니다.'],
      note:'백업 파일을 잃어버리면 복원이 어려울 수 있으니 별도 저장을 권장합니다.'
    },
    convenience:{
      kicker:'관리',title:'라이더 편의지도',
      desc:'현재 위치 주변의 화장실·주유소·오토바이 정비소·라이더 쉼터 등을 빠르게 찾습니다.',
      image:'../assets/screenshots/full/convenience-map.webp',
      steps:['필요한 장소 종류를 선택합니다.','주변 결과를 확인합니다.','선택한 지도 앱으로 위치를 확인합니다.'],
      note:'장소 정보와 영업시간은 지도 서비스의 최신 정보를 함께 확인합니다.'
    },
    hazard:{
      kicker:'관리',title:'위험도로 메모',
      desc:'포트홀·침수·공사·미끄럼 같은 위험구간을 메모와 위치로 남기는 기능입니다.',
      image:'../assets/screenshots/full/hazard.webp',
      steps:['위험도로 메모를 엽니다.','위험 유형과 메모를 입력합니다.','필요하면 현재 위치를 함께 저장합니다.'],
      note:'메모 입력은 반드시 안전하게 정차한 상태에서 진행해야 합니다.'
    },
    diagnostics:{
      kicker:'관리',title:'자동기록 상태감시 · 자체진단',
      desc:'접근성 권한, 서비스 실행 여부, 최근 감지와 마지막 정상기록 등을 확인해 자동기록 상태를 점검합니다.',
      image:'../assets/screenshots/full/management.webp',
      steps:['자동기록 상태감시 화면을 엽니다.','접근성 권한과 서비스 실행 상태를 확인합니다.','최근 감지·미확정 기록 등을 확인해 이상 여부를 점검합니다.'],
      note:'쿠팡 자동기록 보호영역은 임의로 변경하지 않는 것이 원칙입니다.'
    }
  };

  const screens={
    home:()=>`
      <div class="screen">
        <button class="appCard infoBanner explainBtn" data-help="demo" type="button">
          <div class="infoTop"><span class="infoDot">i</span><div><b>라이더짝꿍</b><p>오늘 운행을 한눈에 확인하세요</p></div></div>
        </button>

        <button class="appCard revenueCard explainBtn" data-help="income" type="button">
          <span class="cardLabel">오늘 총수익</span>
          <div class="bigMoney">0원</div>
          <div class="platformGrid">
            <div class="platformCell"><small>쿠팡</small><b>0원</b></div>
            <div class="platformCell"><small>배민</small><b>0원</b></div>
            <div class="platformCell"><small>기타</small><b>0원</b></div>
          </div>
        </button>

        <div class="metricGrid">
          <button class="appCard metricCard explainBtn" data-help="record" type="button"><small>총콜수</small><b>0건</b></button>
          <button class="appCard metricCard explainBtn" data-help="driving" type="button"><small>운행시간</small><b>00:00</b></button>
          <button class="appCard metricCard explainBtn" data-help="driving" type="button"><small>시간당수익</small><b>0원</b></button>
        </div>

        <button class="appCard explainBtn" data-help="maintenance" type="button">
          <div class="statusRow"><span class="statusIcon orange">🔧</span><div class="statusCopy"><b>정비 임박</b><small>바이크 정비 시점을 확인하세요</small></div><span class="chev">›</span></div>
        </button>

        <button class="appCard explainBtn" data-help="challenge" type="button">
          <div class="challengeHead"><b>100일 목표 챌린지</b><span>진행률 8%</span></div>
          <div class="progress"><i></i></div>
          <div class="challengeMeta"><span>누적 목표 관리</span><span>남은 기간 확인</span></div>
        </button>

        <div class="sectionLabel">빠른 관리</div>
        <div class="quickGrid">
          <button class="appCard quickBtn explainBtn" data-help="settlement" type="button"><b>수익·정산</b><small>번 돈 · 받을 돈 · 검산</small></button>
          <button class="appCard quickBtn explainBtn" data-help="safety" type="button"><b>안전도우미</b><small>112·119 · 사고 기록</small></button>
        </div>
      </div>`,
    region:()=>`
      <div class="screen">
        <div class="screenTitleRow"><div><h1>지역판단</h1><p>내 운행 기준으로 목적지를 확인합니다</p></div></div>

        <button class="appCard regionMain explainBtn" data-help="region" type="button">
          <span class="cardLabel">현재 활동지역</span>
          <div class="regionName">서울 관악구</div>
          <p style="margin:6px 0 0;color:#7690a4;font-size:11px">선호·주의·회피 기준을 직접 설정합니다</p>
        </button>

        <div class="regionTags">
          <button class="regionTag explainBtn" data-help="region" type="button"><b><span class="dotBlue"></span>활동지역</b><small>주 운행지역</small></button>
          <button class="regionTag explainBtn" data-help="region" type="button"><b><span class="dotGreen"></span>선호지역</b><small>우선 고려</small></button>
          <button class="regionTag explainBtn" data-help="region" type="button"><b><span class="dotYellow"></span>주의지역</b><small>조건 확인</small></button>
          <button class="regionTag explainBtn" data-help="region" type="button"><b><span class="dotRed"></span>회피지역</b><small>가급적 제외</small></button>
        </div>

        <button class="appCard explainBtn" data-help="destination" type="button">
          <div class="statusRow"><span class="statusIcon blue">⌖</span><div class="statusCopy"><b>목적지 자동판단</b><small>운행 시작 중 목적지 기준 확인</small></div><span class="chev">›</span></div>
        </button>

        <div class="sectionLabel">시간대별 콜 참고</div>
        <div class="appCard listCard">
          <button class="listButton explainBtn" data-help="region" type="button"><span class="listEmoji">🌤</span><div class="listCopy"><b>점심시간</b><small>활동지역 중심으로 판단 기준 확인</small></div><span class="chev">›</span></button>
          <button class="listButton explainBtn" data-help="region" type="button"><span class="listEmoji">🌙</span><div class="listCopy"><b>저녁시간</b><small>선호·주의·회피지역을 빠르게 확인</small></div><span class="chev">›</span></button>
        </div>
      </div>`,
    record:()=>`
      <div class="screen">
        <div class="screenTitleRow"><div><h1>운행기록</h1><p>자동기록과 수입 흐름을 관리합니다</p></div></div>
        <div class="recordTabs"><span class="active">오늘</span><span>주간</span><span>월간</span><span>달력</span></div>

        <button class="appCard explainBtn" data-help="record" type="button">
          <div class="recordSummary">
            <div class="platformCell"><small>오늘 수익</small><b>0원</b></div>
            <div class="platformCell"><small>총 건수</small><b>0건</b></div>
            <div class="platformCell"><small>운행시간</small><b>00:00</b></div>
          </div>
        </button>

        <div class="actionPair">
          <button class="actionButton explainBtn" data-help="manual" type="button">＋ 수입 직접 입력</button>
          <button class="actionButton explainBtn" data-help="settlement" type="button">₩ 돈 흐름</button>
        </div>

        <button class="appCard explainBtn" data-help="record" type="button">
          <div class="statusRow"><span class="statusIcon green">✓</span><div class="statusCopy"><b>쿠팡 자동기록</b><small>상태 정상 · 보호영역 유지</small></div><span class="connectedBadge">정상</span></div>
        </button>

        <div class="sectionLabel">최근 수입기록</div>
        <div class="appCard listCard">
          <button class="listButton explainBtn" data-help="record" type="button"><span class="listEmoji">🧾</span><div class="listCopy"><b>최근 기록 확인</b><small>수정 · 삭제 · 최근삭제 복원</small></div><span class="chev">›</span></button>
          <button class="listButton explainBtn" data-help="diagnostics" type="button"><span class="listEmoji">🩺</span><div class="listCopy"><b>자동기록 자체진단</b><small>서비스·감지·미확정 기록 점검</small></div><span class="chev">›</span></button>
        </div>
      </div>`,
    nav:()=>`
      <div class="screen">
        <div class="screenTitleRow"><div><h1>짝꿍내비</h1><p>메인폰 목적지를 보조폰 내비로</p></div></div>

        <button class="appCard connectedCard explainBtn" data-help="nav" type="button">
          <div class="connectedTop"><b>연결 상태</b><span class="connectedBadge">● 연결됨</span></div>
          <div class="roleSwitch"><span class="active">메인폰</span><span>보조폰</span></div>
        </button>

        <button class="appCard explainBtn" data-help="pairing" type="button">
          <div class="statusRow"><span class="statusIcon blue">▦</span><div class="statusCopy"><b>QR 1회 페어링</b><small>처음 한 번 연결 후 인터넷으로 전송</small></div><span class="chev">›</span></div>
        </button>

        <button class="appCard explainBtn" data-help="nav" type="button">
          <div class="navDest"><small>목적지 전송</small><b>배달앱 목적지 → 보조폰</b></div>
          <div style="margin-top:11px;color:#748da1;font-size:11px">TMAP · 카카오내비 실행을 돕습니다</div>
        </button>

        <div class="actionPair">
          <button class="actionButton explainBtn" data-help="nav" type="button">TMAP 안내</button>
          <button class="actionButton explainBtn" data-help="nav" type="button">카카오내비 안내</button>
        </div>

        <button class="appCard infoBanner explainBtn" data-help="nav" type="button">
          <div class="infoTop"><span class="infoDot">i</span><div><b>웹 체험판 안내</b><p>이 화면에서는 실제 목적지 전송이나 내비 실행을 하지 않습니다.</p></div></div>
        </button>
      </div>`,
    manage:()=>`
      <div class="screen">
        <div class="screenTitleRow"><div><h1>관리</h1><p>운행에 필요한 기록과 도구를 한곳에</p></div></div>

        <div class="manageGrid">
          <button class="menuTile explainBtn" data-help="maintenance" type="button"><span>🔧</span><b>정비관리</b><small>점검주기</small></button>
          <button class="menuTile explainBtn" data-help="fuel" type="button"><span>⛽</span><b>주유관리</b><small>주유비·연비</small></button>
          <button class="menuTile explainBtn" data-help="expense" type="button"><span>₩</span><b>지출관리</b><small>업무지출</small></button>
          <button class="menuTile explainBtn" data-help="rent" type="button"><span>🛵</span><b>렌트·리스</b><small>계약·납입</small></button>
          <button class="menuTile explainBtn" data-help="safety" type="button"><span>🛡</span><b>안전도우미</b><small>사고·긴급</small></button>
          <button class="menuTile explainBtn" data-help="enforcement" type="button"><span>⚠</span><b>단속경고</b><small>전방·후면</small></button>
          <button class="menuTile explainBtn" data-help="evidence" type="button"><span>📁</span><b>증빙보관함</b><small>사진·자료</small></button>
          <button class="menuTile explainBtn" data-help="backup" type="button"><span>↻</span><b>백업·복원</b><small>기기교체</small></button>
          <button class="menuTile explainBtn" data-help="convenience" type="button"><span>🗺</span><b>편의지도</b><small>쉼터·정비</small></button>
          <button class="menuTile explainBtn" data-help="hazard" type="button"><span>📍</span><b>위험도로</b><small>메모·위치</small></button>
          <button class="menuTile explainBtn" data-help="diagnostics" type="button"><span>🩺</span><b>상태감시</b><small>자동기록 진단</small></button>
          <button class="menuTile explainBtn" data-help="settlement" type="button"><span>📊</span><b>수익·정산</b><small>분석·검산</small></button>
        </div>
      </div>`
  };

  function render(screen){
    viewport.innerHTML=screens[screen]?screens[screen]():screens.home();
    viewport.scrollTop=0;
    navItems.forEach(n=>n.classList.toggle('active',n.dataset.screen===screen));
    bindHelpButtons();
  }

  function openHelp(key){
    const d=help[key]||help.demo;
    sheetKicker.textContent=d.kicker||'기능 안내';
    sheetTitle.textContent=d.title||'라이더짝꿍';
    sheetDesc.textContent=d.desc||'';
    sheetSteps.innerHTML=(d.steps||[]).map(x=>'<li>'+x+'</li>').join('');
    sheetNote.textContent=d.note||'';
    if(d.image){
      sheetImage.src=d.image;
      sheetImage.alt=d.title+' 실제 앱 화면';
      sheetImageWrap.hidden=false;
    }else{
      sheetImageWrap.hidden=true;
      sheetImage.removeAttribute('src');
    }
    sheet.hidden=false;
    document.body.classList.add('sheetOpen');
  }

  function closeSheet(){
    sheet.hidden=true;
    document.body.classList.remove('sheetOpen');
  }

  function bindHelpButtons(){
    viewport.querySelectorAll('.explainBtn').forEach(btn=>{
      btn.addEventListener('click',()=>openHelp(btn.dataset.help));
    });
  }

  navItems.forEach(btn=>btn.addEventListener('click',()=>render(btn.dataset.screen)));
  document.querySelectorAll('[data-close-sheet]').forEach(btn=>btn.addEventListener('click',closeSheet));
  document.querySelector('.demoBadge')?.addEventListener('click',()=>openHelp('demo'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)closeSheet();});

  render('home');
});
