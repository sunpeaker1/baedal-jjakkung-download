from pathlib import Path
import sys, zipfile, re, shutil

if len(sys.argv) < 2:
    raise SystemExit("usage: build_from_apk.py <apk>")

apk = Path(sys.argv[1])
out_dir = Path(__file__).resolve().parent

with zipfile.ZipFile(apk) as z:
    source = z.read("assets/index.html").decode("utf-8", "replace")
    assets = [
        "rider_master_icon.png",
        "sym_signature.png",
        "platform_logo_coupang.png",
        "platform_logo_baemin.png",
        "rider_goal_art.png",
    ]
    for name in assets:
        (out_dir / name).write_bytes(z.read("assets/" + name))

# Keep the real app HTML/CSS and all five main tab pages, but remove the
# executable app JavaScript. The website is an interactive explanation demo.
nav_end = source.find("</nav>")
if nav_end < 0:
    raise RuntimeError("bottom nav not found in APK HTML")
html = source[:nav_end + len("</nav>")]

# Development/search isolation.
html = html.replace(
    "<title>라이더짝꿍 운행도우미</title>",
    '<title>라이더짝꿍 웹 체험판</title><meta name="robots" content="noindex,nofollow">',
    1,
)

# Use the real extracted APK assets in this directory.
for name in assets:
    html = html.replace(f'src="{name}"', f'src="./{name}"')

# Match the visible reference home state while keeping this a non-functional demo.
html = html.replace(
    'class="auto off" id="autoBtn" type="button" onclick="showPage(\'autoRecord\')" aria-label="자동기록 설정 열기">자동기록 설정</button>',
    'class="auto" id="autoBtn" type="button" aria-label="자동기록 안내">자동기록 ON</button>',
)
html = html.replace('<strong id="hourly">-</strong>', '<strong id="hourly">계산 대기</strong>')
html = html.replace('id="homeMaintAlertTitle">정비 점검 알림', 'id="homeMaintAlertTitle">정비 3건 임박')
html = html.replace(
    'id="homeMaintAlertText">점검이 필요한 항목을 확인하세요.',
    'id="homeMaintAlertText">엔진오일 · 점검 임박 · 320km 남음',
)
html = html.replace('id="goalEarned">0원', 'id="goalEarned">134,082원')
html = html.replace('id="goalPct">0.0%', 'id="goalPct">1.3%')
html = html.replace('id="goalRemain">10,000,000원', 'id="goalRemain">9,865,918원')
html = html.replace('id="goalDays">99일', 'id="goalDays">95일')
html = html.replace(
    '<div class="progress"><i id="goalBar"></i></div>',
    '<div class="progress"><i id="goalBar" style="width:1.3%"></i></div>',
)

demo = r'''
</div>
<style>
.demoInfoSheet{position:fixed;inset:0;z-index:9999;display:none;align-items:flex-end;justify-content:center;background:rgba(16,37,68,.48);backdrop-filter:blur(3px)}
.demoInfoSheet.show{display:flex}
.demoInfoCard{width:100%;max-width:430px;height:78dvh;min-height:72vh;max-height:82dvh;overflow:auto;background:#fff;border-radius:28px 28px 0 0;padding:14px 20px 26px;box-shadow:0 -14px 38px rgba(16,37,68,.18)}
.demoGrab{width:56px;height:6px;border-radius:99px;background:#d9e4ed;margin:0 auto 18px}
.demoInfoCard h3{margin:0;color:#102544;font-size:28px;line-height:1.25;letter-spacing:-1px}
.demoInfoCard p{margin:16px 0 0;color:#536b83;font-size:16px;line-height:1.75;font-weight:650}
.demoInfoCard ol{margin:18px 0 0;padding-left:24px;color:#425e77;font-size:15px;line-height:1.8;font-weight:650}
.demoInfoCard li+li{margin-top:7px}
.demoNote{margin-top:18px;padding:15px 16px;border-radius:16px;background:#eef8ff;border:1px solid #d4eafb;color:#255f8b;font-size:14px;font-weight:850;line-height:1.65}
.demoClose{width:100%;margin-top:18px;border:0;border-radius:16px;padding:15px;background:#118cf3;color:#fff;font-size:17px;font-weight:950}
.demoOnlyTag{position:fixed;right:max(10px,calc((100vw - 430px)/2 + 10px));bottom:calc(var(--navh) + 10px);z-index:30;padding:6px 9px;border-radius:999px;background:rgba(16,37,68,.78);color:#fff;font-size:9px;font-weight:900;backdrop-filter:blur(8px);pointer-events:none}
</style>

<div class="demoOnlyTag">웹 체험 · 실제 기능 미실행</div>
<div class="demoInfoSheet" id="demoInfoSheet" role="dialog" aria-modal="true">
  <div class="demoInfoCard">
    <div class="demoGrab"></div>
    <h3 id="demoInfoTitle">기능 안내</h3>
    <p id="demoInfoDesc"></p>
    <ol id="demoInfoSteps"></ol>
    <div class="demoNote">홈페이지2에서는 실제 자동기록·내비·위치·전화·저장 기능을 실행하지 않습니다. 실제 기능은 Android 앱에서 사용합니다.</div>
    <button class="demoClose" type="button" id="demoCloseBtn">확인</button>
  </div>
</div>

<script>
(()=>{
  const allowedPages=new Set(['home','region','records','manage','all']);
  const featureInfo={
    '오늘 총수익':{
      desc:'오늘 운행에서 기록된 전체 수익을 한눈에 확인하는 카드입니다. 쿠팡·배민·기타 수입을 합산해 오늘 총수익을 보여주고, 아래 플랫폼 카드와 함께 현재 운행 성과를 빠르게 확인할 수 있습니다.',
      steps:['운행을 시작하고 자동기록 상태를 확인합니다.','배달 완료 후 쿠팡·배민 등 플랫폼별 수익이 기록됐는지 확인합니다.','오늘 총수익에서 전체 합계와 플랫폼별 금액을 함께 확인합니다.']
    },
    '쿠팡':{
      desc:'쿠팡이츠 배달 완료 기록에서 들어온 수익과 완료 건수를 보여주는 영역입니다.',
      steps:['쿠팡이츠에서 배달을 완료합니다.','라이더짝꿍 자동기록에 완료 건과 수익이 반영됐는지 확인합니다.','필요하면 운행기록에서 최근 기록을 다시 확인합니다.']
    },
    '배민':{
      desc:'배민 배달 완료 기록의 수익과 건수를 확인하는 영역입니다. 공개 버전에 따라 배민 자동기록은 테스트 상태일 수 있습니다.',
      steps:['배민 배달 완료 후 기록 반영 여부를 확인합니다.','홈에서 배민 수익과 건수를 확인합니다.','이상이 있으면 운행기록에서 해당 기록을 점검합니다.']
    },
    '기타':{
      desc:'쿠팡·배민 자동기록 외의 수입을 별도로 관리하는 영역입니다.',
      steps:['기타 또는 수입 직접입력 기능을 엽니다.','금액과 필요한 메모를 입력합니다.','저장 후 오늘 총수익과 운행기록에 반영된 내용을 확인합니다.']
    },
    '총콜수':{
      desc:'오늘 완료한 전체 배달 건수를 합산해서 보여줍니다.',
      steps:['배달 완료 기록이 정상 저장됐는지 확인합니다.','홈의 총콜수에서 누적 완료 건수를 확인합니다.','세부 내역은 운행기록에서 확인합니다.']
    },
    '운행시간':{
      desc:'운행 시작부터 현재까지의 누적 운행시간을 보여주는 영역입니다.',
      steps:['운행 시작을 켭니다.','운행 중 누적 시간을 홈에서 확인합니다.','운행 종료 후 최종 시간을 운행기록과 함께 확인합니다.']
    },
    '시간당수익':{
      desc:'기록된 총수익과 운행시간을 기준으로 시간당 수익을 계산해 보여줍니다.',
      steps:['운행시간과 수익 기록이 쌓여야 계산됩니다.','홈에서 현재 시간당수익을 확인합니다.','수익 분석에서 시간대·요일별 흐름과 함께 비교합니다.']
    },
    '정비 3건 임박':{
      desc:'등록한 바이크의 정비주기와 현재 주행거리를 비교해 곧 점검해야 할 항목을 알려주는 영역입니다.',
      steps:['바이크와 현재 주행거리를 등록합니다.','엔진오일·타이어·브레이크 등 정비주기와 최근 정비기록을 입력합니다.','홈의 정비 임박 알림에서 남은 거리와 필요한 점검 항목을 확인합니다.']
    },
    '100일 목표 챌린지':{
      desc:'100일 동안 정한 목표금액을 얼마나 달성했는지 관리하는 기능입니다. 자동기록과 수동입력으로 쌓인 누적 수익을 기준으로 현재 누적금액, 달성률, 남은 금액, 남은 기간을 한눈에 보여줍니다. 홈의 100일 목표 카드는 전체 진행상황을 요약해서 보여주는 화면입니다.',
      steps:['100일 목표관리에서 시작일과 목표금액을 설정합니다.','운행 수익이 기록되면 누적금액에 반영됩니다.','홈 카드에서 현재 누적금액과 달성률을 확인합니다.','남은 목표금액과 남은 기간을 함께 확인해 하루·주간 목표를 조절합니다.','목표 설정을 변경하면 새 기준에 맞춰 진행상황을 다시 확인합니다.']
    },
    '긴급정비':{
      desc:'운행 중 갑작스러운 고장이나 정비가 필요한 상황에서 관련 정보를 빠르게 확인하는 기능입니다.',
      steps:['안전한 곳에 정차합니다.','정비 관련 정보를 확인합니다.','필요한 경우 정비소나 긴급 도움을 이용합니다.']
    },
    '안전':{
      desc:'112·119 긴급연락, 사고메모, 사고사진 등 안전과 사고 대응에 필요한 기능을 모아둔 메뉴입니다.',
      steps:['운행 전 필요한 안전기능을 확인합니다.','사고나 긴급상황에서는 공식 긴급서비스를 우선 이용합니다.','필요하면 사고메모와 증빙사진을 남깁니다.']
    },
    '지역판단':{
      desc:'활동지역과 선호·주의·회피지역을 직접 설정해 배달 목적지를 자신의 운행 기준에 맞춰 판단하는 기능입니다.',
      steps:['주 활동지역을 등록합니다.','선호·주의·회피지역을 설정합니다.','운행 시작 상태에서 목적지를 확인할 때 등록한 기준을 참고합니다.']
    },
    '운행기록':{
      desc:'자동기록과 직접 입력한 수입을 날짜별로 모아 건수·수익·운행 흐름을 확인하는 핵심 기록 화면입니다.',
      steps:['오늘·주간·월간·달력 보기에서 기간을 선택합니다.','자동기록과 직접 입력한 수입을 확인합니다.','필요하면 최근 기록을 수정·삭제하거나 최근삭제 복원을 사용합니다.']
    },
    '관리':{
      desc:'바이크 정비, 주유, 지출, 렌트·리스, 증빙, 백업 등 운행에 필요한 관리 기능을 모아둔 화면입니다.',
      steps:['관리 화면에서 필요한 항목을 선택합니다.','해당 기능의 기록이나 설정을 확인합니다.','저장된 내용은 수익·정비·백업 등 관련 화면에서 다시 확인합니다.']
    },
    '전체':{
      desc:'라이더짝꿍의 전체 기능과 설정을 한곳에서 확인하는 메뉴입니다.',
      steps:['전체 메뉴를 엽니다.','필요한 기능을 선택합니다.','각 기능의 설명과 실제 앱 사용방법을 확인합니다.']
    },
    '짝꿍내비':{
      desc:'메인폰의 배달앱에서 확인한 목적지를 보조폰으로 전송해 TMAP 또는 카카오내비 길안내 사용을 돕는 기능입니다.',
      steps:['메인폰과 보조폰 역할을 정합니다.','처음 한 번 QR로 페어링합니다.','두 기기가 연결됨 상태인지 확인합니다.','배달 목적지를 보조폰으로 전송해 선택한 내비로 안내를 시작합니다.']
    },
    '정비관리':{
      desc:'바이크 주행거리와 정비주기, 정비 이력을 관리해 다음 점검시점을 놓치지 않게 하는 기능입니다.',
      steps:['바이크 정보와 현재 주행거리를 등록합니다.','정비 항목별 최근 정비일·주행거리와 주기를 입력합니다.','다음 점검시점과 임박 항목을 확인합니다.']
    },
    '주유관리':{
      desc:'주유금액·주유량·주행거리를 기록해 월 주유비와 참고 연비를 관리합니다.',
      steps:['주유할 때 금액과 주유량을 입력합니다.','필요하면 현재 주행거리도 기록합니다.','월간 주유비와 참고 연비 흐름을 확인합니다.']
    },
    '지출관리':{
      desc:'보험료·통행료·주차비·식비·소모품·통신비 등 업무 관련 지출을 기록하고 실제 순수익 계산에 참고하는 기능입니다.',
      steps:['지출 날짜와 항목을 선택합니다.','금액과 메모를 입력합니다.','수익분석에서 비용 반영 결과를 확인합니다.']
    },
    '렌트/리스':{
      desc:'바이크 렌트·리스 계약의 납입주기, 누적 납입액, 남은 기간 등을 관리하는 기능입니다.',
      steps:['계약조건과 납입주기를 등록합니다.','납입한 금액을 기록합니다.','누적 납입액과 남은 계약기간을 확인합니다.']
    },
    '증빙보관함':{
      desc:'정산·주유·정비·렌트·보험·사고 관련 사진과 자료를 항목별로 분류해 보관하는 기능입니다.',
      steps:['증빙 종류를 선택합니다.','사진이나 필요한 자료를 추가합니다.','필요할 때 항목별로 찾아 확인합니다.']
    },
    '백업/복원':{
      desc:'수익·정비·지출 등 앱 데이터를 백업파일로 저장하고 휴대폰 교체 시 복원할 수 있게 하는 기능입니다.',
      steps:['백업 화면에서 전체 백업을 실행합니다.','생성된 백업파일을 안전한 곳에 보관합니다.','새 휴대폰에서 해당 파일을 선택해 복원합니다.']
    },
    '편의지도':{
      desc:'주변의 화장실·주유소·오토바이 정비소·라이더 쉼터 등 라이더에게 필요한 장소를 찾는 기능입니다.',
      steps:['찾고 싶은 장소 종류를 선택합니다.','주변 결과를 확인합니다.','필요하면 지도에서 위치와 이동경로를 확인합니다.']
    },
    '위험도로':{
      desc:'포트홀·침수·공사·미끄럼 등 운행 중 주의해야 할 위험구간을 메모와 위치로 남기는 기능입니다.',
      steps:['안전하게 정차한 뒤 위험도로 메모를 엽니다.','위험 유형과 메모를 입력합니다.','필요하면 위치를 함께 저장합니다.']
    },
    '단속경고':{
      desc:'전방·후면 단속 위치에 접근할 때 설정한 거리에서 화면·소리·진동으로 알려주는 운행 보조 기능입니다.',
      steps:['전방·후면 단속경고 사용 여부를 설정합니다.','200m·100m·50m·30m 등 필요한 경고거리를 확인합니다.','실제 도로의 제한속도와 표지판을 우선해 운행합니다.']
    }
  };

  const sheet=document.getElementById('demoInfoSheet');
  const title=document.getElementById('demoInfoTitle');
  const desc=document.getElementById('demoInfoDesc');
  const steps=document.getElementById('demoInfoSteps');

  function showPage(id){
    if(!allowedPages.has(id)) return;
    document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===id));
    document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));
    window.scrollTo(0,0);
  }

  function labelFor(el){
    if(el.classList && el.classList.contains('goal')) return '100일 목표 챌린지';
    const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
    return Object.keys(featureInfo)
      .sort((a,b)=>b.length-a.length)
      .find(k=>text.includes(k)) || text.slice(0,38) || '기능 안내';
  }

  function openInfo(el){
    const label=labelFor(el);
    const info=featureInfo[label] || {
      desc:'실제 라이더짝꿍 앱의 화면과 같은 위치에서 이 기능의 역할과 사용방법을 확인할 수 있습니다.',
      steps:['실제 앱에서 해당 카드 또는 메뉴를 누릅니다.','화면 안내에 따라 필요한 정보나 설정을 확인합니다.','홈페이지2에서는 기능을 실행하지 않고 설명만 제공합니다.']
    };
    title.textContent=label;
    desc.textContent=info.desc;
    steps.innerHTML=info.steps.map(x=>'<li>'+x+'</li>').join('');
    sheet.classList.add('show');
    document.querySelector('.demoInfoCard').scrollTop=0;
  }

  document.querySelectorAll('.nav button').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault(); e.stopImmediatePropagation();
      showPage(btn.dataset.page);
    },true);
  });

  document.addEventListener('click',e=>{
    const target=e.target.closest('button,[role="button"],.hero,.goal');
    if(!target || target.closest('.nav') || target.id==='demoCloseBtn') return;
    e.preventDefault(); e.stopImmediatePropagation();
    openInfo(target);
  },true);

  document.getElementById('demoCloseBtn').addEventListener('click',()=>sheet.classList.remove('show'));
  sheet.addEventListener('click',e=>{if(e.target===sheet) sheet.classList.remove('show')});

  const d=new Date();
  const wk=['일','월','화','수','목','금','토'][d.getDay()];
  const date=document.getElementById('dateText');
  if(date) date.textContent=d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일 ('+wk+')';

  showPage('home');
})();
</script>
</body></html>
'''

(out_dir / "index.html").write_text(html + demo, encoding="utf-8")
print("homepage2 generated from", apk)
