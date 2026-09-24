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

promo = r'''
<style>
body.promoLock{overflow:hidden}
.promoIntro{
  position:fixed;inset:0;z-index:20000;overflow:auto;
  background:
    radial-gradient(circle at 15% 15%,rgba(63,205,255,.30),transparent 28%),
    radial-gradient(circle at 85% 25%,rgba(66,240,179,.24),transparent 30%),
    radial-gradient(circle at 50% 90%,rgba(64,126,255,.24),transparent 36%),
    linear-gradient(160deg,#071a35 0%,#0b315b 46%,#0d67a5 100%);
  color:#fff;
}
.promoGlow{position:absolute;border-radius:50%;filter:blur(10px);opacity:.55;animation:promoFloat 6s ease-in-out infinite}
.promoGlow.g1{width:180px;height:180px;left:-60px;top:110px;background:#16c8ff}
.promoGlow.g2{width:220px;height:220px;right:-85px;top:240px;background:#32e0a0;animation-delay:-2s}
.promoGlow.g3{width:180px;height:180px;left:30%;bottom:-70px;background:#407dff;animation-delay:-4s}
@keyframes promoFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.08)}}
.promoTopActions{
  position:fixed;right:18px;top:calc(18px + env(safe-area-inset-top));z-index:3;
  display:flex;align-items:center;gap:8px
}
.promoBrowse{
  border:1px solid rgba(122,226,255,.48);
  background:rgba(36,198,255,.18);
  color:#fff;border-radius:999px;padding:10px 16px;font-size:12px;font-weight:950;
  backdrop-filter:blur(10px);white-space:nowrap;
  box-shadow:0 8px 20px rgba(0,0,0,.10)
}
.promoInner{
  position:relative;z-index:1;width:min(100%,430px);min-height:100dvh;margin:auto;
  padding:calc(22px + env(safe-area-inset-top)) 22px calc(16px + env(safe-area-inset-bottom));
  display:flex;flex-direction:column
}
.promoBody{
  flex:1;display:flex;flex-direction:column;justify-content:center;
  padding:18px 0 10px
}
.promoBrand{display:flex;align-items:center;gap:12px;min-height:54px;padding-right:126px}
.promoBrand img{width:54px;height:54px;border-radius:16px;box-shadow:0 12px 25px rgba(0,0,0,.22)}
.promoBrandCopy strong{display:block;font-size:24px;letter-spacing:-1.2px;line-height:1.05;white-space:nowrap}
.promoBrandCopy span{display:block;margin-top:4px;color:#bfeaff;font-size:10px;font-weight:800;white-space:nowrap}
.promoBadge{
  display:inline-flex;align-self:flex-start;margin-top:0;padding:7px 11px;
  border-radius:999px;background:rgba(76,233,177,.16);border:1px solid rgba(76,233,177,.35);
  color:#bfffe3;font-size:11px;font-weight:950;letter-spacing:.04em
}
.promoTitle{margin:13px 0 0;font-size:40px;line-height:1.08;letter-spacing:-2px;font-weight:1000}
.promoTitle em{font-style:normal;color:#62ddff}
.promoLead{margin:12px 0 0;color:#d8ecff;font-size:15px;line-height:1.58;font-weight:700}
.promoFeatureGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}
.promoFeature{
  min-height:126px;padding:15px 14px;border-radius:18px;background:rgba(255,255,255,.10);
  border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(10px);
  box-shadow:0 12px 28px rgba(0,0,0,.10)
}
.promoFeature b{display:block;font-size:14px}
.promoFeature small{display:block;margin-top:4px;color:#c6def4;font-size:11px;line-height:1.45}
.promoFeatureIcon{font-size:23px;display:block;margin-bottom:7px}
.promoVisual{
  position:relative;min-height:176px;margin-top:14px;overflow:hidden;
  border-radius:24px;border:1px solid rgba(255,255,255,.20);
  background:
    linear-gradient(115deg,rgba(6,32,66,.92) 0%,rgba(14,103,166,.76) 54%,rgba(40,219,175,.30) 100%);
  box-shadow:0 18px 40px rgba(0,0,0,.18)
}
.promoVisual:before{
  content:"";position:absolute;inset:0;
  background:radial-gradient(circle at 82% 25%,rgba(91,228,255,.32),transparent 34%);
  pointer-events:none
}
.promoVisualText{position:relative;z-index:2;width:61%;padding:19px 0 17px 20px}
.promoVisualText span{display:block;color:#7eeaff;font-size:10px;font-weight:1000;letter-spacing:.12em}
.promoVisualText strong{display:block;margin-top:7px;font-size:24px;line-height:1.22;letter-spacing:-1.1px}
.promoVisualText p{margin:10px 0 0;color:#d9ecfb;font-size:11px;line-height:1.55;font-weight:750}
.promoVisual img{
  position:absolute;right:-8px;bottom:-2px;width:46%;max-height:166px;object-fit:contain;
  filter:drop-shadow(0 12px 20px rgba(0,0,0,.24))
}
.promoTrust{
  margin-top:12px;padding:11px 14px;border-radius:17px;
  background:linear-gradient(90deg,rgba(0,157,255,.18),rgba(42,235,177,.15));
  border:1px solid rgba(171,233,255,.2);color:#dff7ff;font-size:12px;line-height:1.6;font-weight:750
}
.promoActions{margin-top:25px;display:grid;gap:10px}
.promoStart{
  width:100%;border:0;border-radius:18px;padding:17px;
  background:linear-gradient(90deg,#24c6ff,#1b83ff);color:#fff;
  font-size:18px;font-weight:1000;box-shadow:0 14px 30px rgba(0,111,255,.34)
}
.promoSub{margin-top:8px;text-align:center;color:#b8d6ef;font-size:9px;font-weight:800}
@media(max-width:380px){
  .promoTopActions{right:10px;gap:5px}
  .promoBrowse{padding:8px 11px;font-size:10px}
  .promoBrand{padding-right:105px}
  .promoTitle{font-size:35px}
  .promoLead{font-size:14px}
  .promoBrand img{width:48px;height:48px}
  .promoBrandCopy strong{font-size:21px}
  .promoBrandCopy span{font-size:9px}
  .promoBody{padding-top:14px;padding-bottom:6px}
  .promoVisual{min-height:168px}
  .promoVisualText{padding-left:16px}
  .promoVisualText strong{font-size:22px}
}
</style>

<section class="promoIntro" id="promoIntro" aria-label="라이더짝꿍 소개">
  <div class="promoGlow g1"></div>
  <div class="promoGlow g2"></div>
  <div class="promoGlow g3"></div>
  <div class="promoTopActions">
    <button class="promoBrowse" type="button" id="promoBrowse">앱 둘러보기</button>
  </div>
  <div class="promoInner">
    <div class="promoBrand">
      <img src="./rider_master_icon.png" alt="라이더짝꿍">
      <div class="promoBrandCopy">
        <strong>라이더짝꿍</strong>
        <span>배달 라이더를 위한 운행 파트너</span>
      </div>
    </div>

    <div class="promoBody">
    <span class="promoBadge">RIDER MATE · V1.57.78 TEST</span>

    <h1 class="promoTitle">
      수익은 올리고,<br>
      <em>관리는 줄이고.</em>
    </h1>

    <p class="promoLead">
      배달 라이더에게 꼭 필요한 기능만 담았습니다.<br>
      자동기록부터 정산, 지역판단, 정비관리, 짝꿍내비까지 한 번에.
    </p>

    <div class="promoVisual">
      <div class="promoVisualText">
        <span>RIDER MATE</span>
        <strong>라이더의 하루를<br>더 효율적으로.</strong>
        <p>수익 · 운행 · 정비 · 안전 · 내비까지<br>한 번에 관리하는 라이더 전용 파트너</p>
      </div>
      <img src="./rider_goal_art.png" alt="라이더짝꿍 홍보 이미지">
    </div>

    <div class="promoTrust">
      정비 · 주유 · 지출 · 렌트/리스 · 증빙 · 백업 · 안전도우미까지<br>
      <b>라이더에게 필요한 기능을 하나로.</b>
    </div>

    <div class="promoSub">현재 공개 버전은 테스트 버전이며 일부 기능은 테스트 중입니다.</div>
    </div>
  </div>
</section>
<script>
document.body.classList.add('promoLock');
(()=>{
  const intro=document.getElementById('promoIntro');
  function enterApp(){
    intro.style.opacity='0';
    intro.style.transition='opacity .32s ease';
    setTimeout(()=>{
      intro.remove();
      document.body.classList.remove('promoLock');
      window.scrollTo(0,0);
    },320);
  }
  document.getElementById('promoBrowse').addEventListener('click',enterApp);
})();
</script>
'''

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
.demoTestNote{display:none;margin-top:14px;padding:15px 16px;border-radius:16px;background:#fff4df;border:1px solid #f2c97a;color:#8a5a12;font-size:14px;font-weight:900;line-height:1.65}
.demoTestNote.show{display:block}
.demoActions{position:sticky;bottom:-26px;margin:14px -20px -26px;padding:8px 20px calc(12px + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);border-top:1px solid #e3ebf1;backdrop-filter:blur(10px);display:grid;gap:8px;z-index:3}
.demoFeedback{width:72%;justify-self:center;border:1px solid #f2b173;border-radius:13px;padding:10px 12px;background:#fff0df;color:#9a4d10;font-size:14px;font-weight:950;text-decoration:none;display:flex;align-items:center;justify-content:center}
.demoClose{width:100%;border:0;border-radius:16px;padding:15px;background:#118cf3;color:#fff;font-size:17px;font-weight:950}
.demoOnlyTag{position:fixed;right:max(10px,calc((100vw - 430px)/2 + 10px));bottom:calc(var(--navh) + 10px);z-index:30;padding:6px 9px;border-radius:999px;background:rgba(16,37,68,.78);color:#fff;font-size:9px;font-weight:900;backdrop-filter:blur(8px);pointer-events:none}
</style>

<div class="demoOnlyTag">웹 체험 · 실제 기능 미실행</div>
<div class="demoInfoSheet" id="demoInfoSheet" role="dialog" aria-modal="true">
  <div class="demoInfoCard">
    <div class="demoGrab"></div>
    <h3 id="demoInfoTitle">기능 안내</h3>
    <p id="demoInfoDesc"></p>
    <ol id="demoInfoSteps"></ol>
    <div class="demoTestNote" id="demoTestNote">⚠️ 현재 테스트 중이며 공개 버전에서는 일부 동작이 제한될 수 있습니다.</div>
    <div class="demoNote">홈페이지에서는 실제 자동기록·내비·위치·전화·저장 기능을 실행하지 않습니다. 실제 기능은 Android 앱에서 사용합니다.</div>
    <div class="demoActions">
      <a class="demoFeedback" href="../contact.html?source=homepage2">오류·제안 입력</a>
      <button class="demoClose" type="button" id="demoCloseBtn">확인</button>
    </div>
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
      desc:'배민 배달 완료 기록의 수익과 건수를 확인하는 영역입니다.',
      steps:['배민 배달 완료 후 기록 반영 여부를 확인합니다.','홈에서 배민 수익과 건수를 확인합니다.','이상이 있으면 운행기록에서 해당 기록을 점검합니다.'],
      test:true
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
      steps:['100일 목표관리에서 시작일과 목표금액을 설정합니다.','운행 수익이 기록되면 누적금액에 반영됩니다.','홈 카드에서 현재 누적금액과 달성률을 확인합니다.','남은 목표금액과 남은 기간을 함께 확인해 하루·주간 목표를 조절합니다.']
    },
    '100일 목표관리':{
      title:'100일 목표 챌린지',
      desc:'100일 동안 정한 목표금액을 얼마나 달성했는지 관리하는 기능입니다. 자동기록과 수동입력으로 쌓인 누적 수익을 기준으로 현재 누적금액, 달성률, 남은 금액, 남은 기간을 한눈에 보여줍니다. 홈의 100일 목표 카드는 전체 진행상황을 요약해서 보여주는 화면입니다.',
      steps:['100일 목표관리에서 시작일과 목표금액을 설정합니다.','운행 수익이 기록되면 누적금액에 반영됩니다.','홈 카드에서 현재 누적금액과 달성률을 확인합니다.','남은 목표금액과 남은 기간을 함께 확인해 하루·주간 목표를 조절합니다.']
    },
    '100일 목표 관리':{
      title:'100일 목표 챌린지',
      desc:'100일 동안 정한 목표금액을 얼마나 달성했는지 관리하는 기능입니다. 자동기록과 수동입력으로 쌓인 누적 수익을 기준으로 현재 누적금액, 달성률, 남은 금액, 남은 기간을 한눈에 보여줍니다. 홈의 100일 목표 카드는 전체 진행상황을 요약해서 보여주는 화면입니다.',
      steps:['100일 목표관리에서 시작일과 목표금액을 설정합니다.','운행 수익이 기록되면 누적금액에 반영됩니다.','홈 카드에서 현재 누적금액과 달성률을 확인합니다.','남은 목표금액과 남은 기간을 함께 확인해 하루·주간 목표를 조절합니다.']
    },
    '긴급정비':{
      desc:'운행 중 갑작스러운 고장이나 정비가 필요한 상황에서 관련 정보를 빠르게 확인하는 기능입니다.',
      steps:['안전한 곳에 정차합니다.','정비 관련 정보를 확인합니다.','필요한 경우 정비소나 긴급 도움을 이용합니다.']
    },
    '안전':{
      desc:'112·119 긴급연락, 사고메모, 사고사진과 함께 전방 단속·후면단속 경고 등 운행 중 필요한 안전 기능을 모아둔 메뉴입니다. 단속경고는 GPS 위치와 진행방향을 기준으로 실제 주행 통로에 가까운 단속 지점을 판단해 200m·100m·50m·30m 단계로 알려주며, 후면단속도 별도로 구분해 경고합니다.',
      steps:['운행 전 필요한 안전기능과 단속경고 설정을 확인합니다.','전방·후면 단속 접근 시 200m·100m·50m·30m 단계별 경고를 확인합니다.','후면단속 경고와 현재속도를 함께 확인하고 실제 도로표지와 제한속도를 우선합니다.','사고나 긴급상황에서는 112·119 등 공식 긴급서비스를 우선 이용합니다.','필요하면 사고메모와 증빙사진을 남깁니다.'],
      test:true
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
      steps:['메인폰과 보조폰 역할을 정합니다.','처음 한 번 QR로 페어링합니다.','두 기기가 연결됨 상태인지 확인합니다.','배달 목적지를 보조폰으로 전송해 선택한 내비로 안내를 시작합니다.'],
      test:true
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
    '단속·후면단속':{
      title:'단속·후면단속 경고',
      desc:'주행 중 진행 방향에 있는 전방 단속과 후면 단속 위치에 접근할 때 미리 알려주는 안전 보조 기능입니다. GPS 위치와 진행방향을 기준으로 실제 주행 통로에 가까운 단속 지점을 판단하고, 설정된 거리에서 화면·소리·진동으로 경고합니다. 후면단속은 지나친 뒤 촬영되는 방식까지 고려해 별도로 경고합니다.',
      steps:['관리 또는 전체 메뉴에서 단속·후면단속 기능을 확인합니다.','전방 단속과 후면 단속 경고 사용 여부를 설정합니다.','200m·100m·50m·30m 거리에서 단계별 경고를 확인합니다.','후면단속 접근 시 화면 경고와 현재속도를 함께 확인합니다.','일반 CCTV와 단속카메라는 구분해 판단하며 실제 도로표지와 제한속도를 항상 우선합니다.'],
      test:true
    },
    '후면단속':{
      title:'단속·후면단속 경고',
      desc:'주행 중 진행 방향에 있는 전방 단속과 후면 단속 위치에 접근할 때 미리 알려주는 안전 보조 기능입니다. GPS 위치와 진행방향을 기준으로 실제 주행 통로에 가까운 단속 지점을 판단하고, 설정된 거리에서 화면·소리·진동으로 경고합니다. 후면단속은 지나친 뒤 촬영되는 방식까지 고려해 별도로 경고합니다.',
      steps:['전방·후면 단속 경고를 켭니다.','200m·100m·50m·30m 거리 경고를 확인합니다.','후면단속 접근 시 화면 경고와 현재속도를 확인합니다.','실제 도로표지와 제한속도를 우선해 주행합니다.'],
      test:true
    },
    '단속경고':{
      title:'단속·후면단속 경고',
      desc:'전방·후면 단속 위치에 접근할 때 설정한 거리에서 화면·소리·진동으로 알려주는 운행 보조 기능입니다. 후면단속도 별도로 구분해 경고합니다.',
      steps:['전방·후면 단속경고 사용 여부를 설정합니다.','200m·100m·50m·30m 등 필요한 경고거리를 확인합니다.','후면단속 경고와 현재속도를 함께 확인합니다.','실제 도로의 제한속도와 표지판을 우선해 운행합니다.'],
      test:true
    }
  };

  const sheet=document.getElementById('demoInfoSheet');
  const title=document.getElementById('demoInfoTitle');
  const desc=document.getElementById('demoInfoDesc');
  const steps=document.getElementById('demoInfoSteps');
  const testNote=document.getElementById('demoTestNote');

  function showPage(id){
    if(!allowedPages.has(id)) return;
    document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===id));
    document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));
    window.scrollTo(0,0);
  }

  function labelFor(el){
    const onclick=(el.getAttribute&&el.getAttribute('onclick'))||'';
    if((el.classList && el.classList.contains('goal')) || onclick.includes('openGoal')) return '100일 목표 챌린지';
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
    title.textContent=info.title||label;
    desc.textContent=info.desc;
    steps.innerHTML=info.steps.map(x=>'<li>'+x+'</li>').join('');
    testNote.classList.toggle('show',!!info.test);
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
    if(!target || target.closest('.promoIntro') || target.closest('.nav') || target.id==='demoCloseBtn') return;
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

download_css = r'''<style id="homepage2DownloadStyle">
.appDownloadCard{position:relative;overflow:hidden;margin:8px 0 16px;padding:17px 14px 15px;border:1px solid rgba(107,181,231,.72);border-radius:25px;background:linear-gradient(145deg,#fbfeff 0%,#edf8ff 48%,#effdf7 100%);box-shadow:0 16px 34px rgba(25,103,162,.18),0 4px 10px rgba(38,76,114,.10),inset 0 2px 0 rgba(255,255,255,.96),inset 0 -2px 0 rgba(80,150,205,.06)}
.appDownloadCard:before{content:"";position:absolute;right:-45px;top:-58px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(68,177,255,.16) 0%,rgba(68,177,255,0) 68%);pointer-events:none}
.appDownloadHead{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.appDownloadHead h3{margin:0;font-size:18px;font-weight:1000;letter-spacing:-.6px;color:#123b63;text-shadow:0 1px 0 #fff}
.appDownloadHead span{padding:5px 9px;border-radius:999px;background:#173e69;color:#fff;font-size:9px;font-weight:950;box-shadow:0 4px 9px rgba(23,62,105,.16)}
.appDownloadGrid{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.appDownloadBtn{position:relative;min-height:76px;border-radius:19px;padding:13px 28px 12px 9px;text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-weight:950;box-sizing:border-box;transition:transform .12s ease,filter .12s ease,box-shadow .12s ease}
.appDownloadBtn:active{transform:translateY(2px);filter:brightness(.98)}
.appDownloadBtn:before{content:"↓";position:absolute;right:9px;top:9px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.82);font-size:13px;font-weight:1000;box-shadow:0 3px 8px rgba(39,82,119,.14)}
.appDownloadBtn strong{font-size:14.5px;line-height:1.25;letter-spacing:-.45px;text-shadow:0 1px 0 rgba(255,255,255,.9)}
.appDownloadBtn small{display:block;margin-top:5px;font-size:9.5px;font-weight:900;opacity:.82}
.appDownloadBtn.rider{background:linear-gradient(145deg,#eef9ff 0%,#c9eaff 48%,#b8e1ff 100%);border:1px solid #7fc7f4;color:#075f9d;box-shadow:0 10px 20px rgba(20,130,208,.24),inset 0 2px 0 rgba(255,255,255,.92),inset 0 -3px 0 rgba(31,132,202,.10)}
.appDownloadBtn.quickMate{background:linear-gradient(145deg,#effdf5 0%,#d3f4e2 48%,#c1ecd4 100%);border:1px solid #8bd4aa;color:#13663f;box-shadow:0 10px 20px rgba(28,145,89,.22),inset 0 2px 0 rgba(255,255,255,.92),inset 0 -3px 0 rgba(36,132,82,.09)}
.appDownloadNote{position:relative;z-index:1;margin:10px 3px 0;color:#60778d;font-size:9px;line-height:1.5;font-weight:850;text-align:center}
@media(max-width:380px){.appDownloadCard{padding:15px 12px 14px}.appDownloadGrid{gap:8px}.appDownloadBtn{min-height:72px;padding-right:25px}.appDownloadBtn strong{font-size:13.5px}}
.homepage2DownloadFloat{position:fixed;right:max(12px,calc((100vw - 430px)/2 + 12px));bottom:calc(var(--navh) + 48px);z-index:40;min-width:132px;height:43px;padding:0 15px;border:1px solid rgba(255,255,255,.78);border-radius:999px;background:linear-gradient(145deg,#188ff0,#0a6fd4);color:#fff;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:1000;letter-spacing:-.3px;box-shadow:0 10px 24px rgba(9,108,195,.34),inset 0 1px 0 rgba(255,255,255,.35);backdrop-filter:blur(8px)}
.homepage2DownloadFloat:active{transform:translateY(2px);box-shadow:0 6px 14px rgba(9,108,195,.28)}
.homepage2DownloadFloat .downIcon{font-size:15px;line-height:1}
@media(max-width:380px){.homepage2DownloadFloat{right:10px;min-width:124px;height:40px;padding:0 12px;font-size:11.5px}}
</style>'''
download_panel = r'''<div class="appDownloadCard" id="app-download">
  <div class="appDownloadHead"><h3>📲 앱 다운로드</h3><span>Android</span></div>
  <div class="appDownloadGrid">
    <a class="appDownloadBtn rider" href="https://github.com/sunpeaker1/baedal-jjakkung-download/releases/download/v1.57.78/RiderJjakkung-V1.57.78.apk" onclick="return confirm('파일을 저장하시겠습니까?')"><strong>라이더짝꿍 다운로드</strong><small>V1.57.78 TEST</small></a>
    <a class="appDownloadBtn quickMate" href="../quick.html#admin-download"><strong>퀵짝꿍 다운로드</strong><small>관리자 암호 인증</small></a>
  </div>
  <p class="appDownloadNote">라이더짝꿍은 공개 테스트 버전이며, 퀵짝꿍은 관리자 인증 후 다운로드됩니다.</p>
</div>'''
home_download_marker = '''<div class="quick"><button class="q em" onclick="showPage('emergency')"><span class="qicon">🔧</span><span><b>긴급정비</b><small>사고·고장 시 빠른 도움</small></span><span class="qa">›</span></button><button class="q safe" onclick="showPage('safety')"><span class="qicon">🛡</span><span><b>안전</b><small>사고를 예방하는 습관</small></span><span class="qa">›</span></button></div>'''
web_html = html.replace("</head>", download_css + "</head>", 1)
web_html = web_html.replace(home_download_marker, home_download_marker + download_panel, 1)
download_float = r'''<a class="homepage2DownloadFloat" href="#app-download" onclick="return homepage2GoDownload(event)"><span class="downIcon">⬇</span><span>앱 다운로드</span></a>
<script>
function homepage2GoDownload(e){
  if(e) e.preventDefault();
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='home'));
  document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.page==='home'));
  setTimeout(()=>document.getElementById('app-download')?.scrollIntoView({behavior:'smooth',block:'center'}),30);
  return false;
}
</script>'''
web_html = web_html.replace("</main>\n<nav class=\"nav\">", "</main>\n" + download_float + "\n<nav class=\"nav\">", 1)

(out_dir / "index.html").write_text(web_html.replace("<body", "<body", 1) + promo + demo, encoding="utf-8")
print("homepage2 generated from", apk)
