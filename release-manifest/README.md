# 공개 APK 자동 배포

홈페이지 다운로드 버튼은 고정 URL을 사용합니다.

- 라이더짝꿍: `rider-latest/RiderJjakkung-latest.apk`
- 배달내비: `delivery-navi-latest/BaedalNavi-latest.apk`
- 퀵짝꿍: `quickmate-latest/QuickMateClean-latest.apk`

새 공개본을 올릴 때 APK를 홈페이지 저장소에 직접 복사하지 않습니다.

1. 앱의 비공개 저장소에서 공개할 APK를 먼저 확정합니다.
2. `release-manifest/rider.json`, `release-manifest/delivery-navi.json` 또는 `release-manifest/quickmate.json`의 버전과 원본 위치만 수정합니다.
3. main에 반영되면 `.github/workflows/publish-public-apk.yml`이 원본 APK를 읽어 고정 Release 자산을 교체합니다.
4. 홈페이지 버튼 URL은 수정하지 않습니다.

필수 Repository Secret:
- `APP_SOURCE_READ_TOKEN`
- 권한: 원본 비공개 앱 저장소에 대한 Contents read-only
- 토큰 값은 코드, 문서, manifest에 기록하지 않습니다.

테스트 빌드는 자동 공개하지 않습니다. 공개 대상으로 확정한 버전만 manifest를 변경합니다.
