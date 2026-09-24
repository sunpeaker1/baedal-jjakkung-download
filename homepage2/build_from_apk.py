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
.demoInfoCard{width:100%;max-width:430px;max-height:76vh;overflow:auto;background:#fff;border-radius:24px 24px 0 0;padding:12px 16px 24px;box-shadow:0 -14px 38px rgba(16,37,68,.18)}
.demoGrab{width:48px;height:5px;border-radius:99px;background:#d9e4ed;margin:0 auto 14px}
.demoInfoCard h3{margin:0;color:#102544;font-size:22px;letter-spacing:-.8px}
.demoInfoCard p{margin:10px 0 0;color:#62758d;font-size:13px;line-height:1.65}
.demoInfoCard ol{margin:12px 0 0;padding-left:21px;color:#526b83;font-size:12px;line-height:1.7}
.demoNote{margin-top:12px;padding:12px 13px;border-radius:14px;background:#eef8ff;border:1px solid #d4eafb;color:#2f6089;font-size:11px;font-weight:800;line-height:1.55}
.demoClose{width:100%;margin-top:14px;border:0;border-radius:14px;padding:12px;background:#118cf3;color:#fff;font-weight:950}
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
  const descriptions={
    '오늘 총수익':'오늘 운행에서 기록된 총수익과 플랫폼별 수익 흐름을 확인합니다.',
    '쿠팡':'쿠팡이츠 자동기록 수익과 완료 건수를 확인합니다.',
    '배민':'배민 자동기록 수익과 완료 건수를 확인합니다.',
    '기타':'자동기록 외 기타 수입을 관리합니다.',
    '총콜수':'오늘 완료한 전체 배달 건수를 확인합니다.',
    '운행시간':'운행 시작부터 종료까지 누적 운행시간을 확인합니다.',
    '시간당수익':'총수익과 운행시간을 기준으로 시간당 수익을 확인합니다.',
    '정비 3건 임박':'엔진오일·타이어·브레이크 등 정비 시점을 확인합니다.',
    '100일 목표 챌린지':'설정한 기간과 목표금액을 기준으로 누적 수익 진행률을 확인합니다.',
    '긴급정비':'사고·고장 상황에서 필요한 정비 관련 정보를 확인합니다.',
    '안전':'사고예방·긴급연락·사고기록 등 안전 기능을 안내합니다.',
    '지역판단':'활동지역과 선호·주의·회피지역을 관리하고 목적지 판단 기준을 확인합니다.',
    '운행기록':'자동기록과 수입 기록을 날짜별로 확인하고 관리합니다.',
    '관리':'정비·주유·지출·렌트/리스·증빙·백업 등 관리 기능을 확인합니다.',
    '전체':'라이더짝꿍의 전체 기능을 확인합니다.',
    '짝꿍내비':'메인폰 배달 목적지를 보조폰으로 전송해 TMAP·카카오내비 사용을 돕습니다.',
    '정비관리':'바이크 주행거리와 정비주기, 정비 이력을 관리합니다.',
    '주유관리':'주유금액·주유량·주행거리를 기록해 주유비와 참고 연비를 관리합니다.',
    '지출관리':'보험료·통행료·주차비·식비·소모품 등 업무지출을 기록합니다.',
    '렌트/리스':'렌트·리스 계약과 납입내역, 남은 기간을 관리합니다.',
    '증빙보관함':'정산·주유·정비·보험·사고 관련 사진과 자료를 분류해 보관합니다.',
    '백업/복원':'앱 데이터를 백업하고 휴대폰 교체 시 복원합니다.',
    '편의지도':'화장실·주유소·정비소·라이더 쉼터 등을 찾는 기능입니다.',
    '위험도로':'포트홀·침수·공사·미끄럼 등 위험구간을 메모합니다.',
    '단속경고':'전방·후면 단속 위치 접근 시 거리별 경고를 제공합니다.'
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
    const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
    return Object.keys(descriptions).find(k=>text.includes(k)) || text.slice(0,38) || '기능 안내';
  }

  function openInfo(el){
    const label=labelFor(el);
    title.textContent=label;
    desc.textContent=descriptions[label] || '실제 라이더짝꿍 앱의 화면과 같은 위치에서 이 기능의 역할과 사용법을 확인할 수 있습니다.';
    steps.innerHTML='<li>실제 앱에서 해당 카드 또는 메뉴를 누릅니다.</li><li>화면 안내에 따라 필요한 정보나 설정을 확인합니다.</li><li>홈페이지2에서는 기능을 실행하지 않고 설명만 제공합니다.</li>';
    sheet.classList.add('show');
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
