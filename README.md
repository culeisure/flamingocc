# 플라밍고CC 이용권 안내 랜딩

충남 당진 플라밍고컨트리클럽(라미드그룹) 이용권 2종의 SMS 발송용 모바일 랜딩.
일라이트·오션비치 랜딩과 같은 구조(GitHub Pages 정적 배포).

## 배포

GitHub: culeisure/flamingocc (public, noindex)
URL: https://culeisure.github.io/flamingocc/

## 콘텐츠 기준 (2026-09-09 부사장 전달, 저녁 사용자 확정 반영)

- 상품 2종만: 동반자 이용권 4,400만원(보증금 4,000 + 시설이용관리비 400 소멸), 무기명 이용권 9,900만원(9,000 + 900 소멸)
- 동반자: 기명 2인 + 동반 3인, 기명자 중 1인 내장, 주중 2회 · 주말 2회
- 무기명: 기명 2인 + 동반 3인 또는 무기명 4인, 주중 3회 · 주말 3회, 6회 모두 무기명 가능
- 그린피: 실시간 예약 요금의 50% (금액 표기 안 함), 예약 보장 없음
- 만기 10년 이용권, 중도 해지 없음, 명의변경 가능
- "이용권"으로만 표기, "연회원" 표기 금지
- 부대 혜택은 한 줄만(호텔 30%, 동백 골프연습장 20%)
- 골프장 부각: 36홀, 평지형, 홀 간 독립, 잔디 관리
- 안내문 · 리플렛 PDF 다운로드는 동부(투모로우 제작) 시안 확정 후 추가

## 연락처

상담: 명대웅 010-4087-3443 (헤더 · CTA · 하단 고정바 · 푸터). 영업사원 세팅 시 폴더 복사 후 번호만 교체.

## 사진

flamingocc 공식 사이트(clublonge.com) 코스 · 클럽하우스 사진과 자료 폴더의 항공 사진을 웹용으로 최적화.

## v6 (2026-09-09 저녁) 확정 사항

- 톤: 공식 카드뉴스 톤(하늘색 배경 · 핑크 제목 · 검정 본문 · 금색 얇은 프레임). CSS 끝의 "v6 톤 전환" 블록이 앞의 토큰을 덮어씀
- 히어로: "당진 플라밍고CC" + 공식 문안 한 줄 + 4인 전원 50% 배지 + P3 4,400 / P4 9,900 / 10년 만기
- 표기: "분양가 4,400만원 / 10년 만기 시 반환금 4,000만원"만 표기. 시설이용관리비 · 보증금 · 소멸 문구 금지(차액은 영업사원이 상담에서 설명). "정회원" 대신 "기명"
- 그린피 예시 표: 이벤트가 주중 6만 · 주말 8만 기준, "예시" 각주
- 사진: ref/base/*_sunny.png (사용자가 GPT로 맑은 날 생성) -> img/*.webp
- 로컬 확인: `python _dev/serve.py 8770` 후 http://127.0.0.1:8770/ (자동 새로고침, _dev는 gitignore)

## 자료받기 리드 폼 (2026-09-11)

- 상담 카드 아래 "가입 안내문 받기" → 성함 · 연락처 · 이메일(선택) · 동의 · Turnstile → Apps Script → 시트 저장 + 담당자 문자 → PDF 다운로드
- PDF: `docs/flamingo_info_q7v2.pdf` (원본 `../_asset/flamingo_Info.pdf`). 직접 URL 노출을 피하려고 파일명을 무작위로 두고 페이지에는 base64로 넣음
- 설정: `_build/lead_config.json` (endpoint · sitekey · pdf). 값은 `index.html` head의 `window.LEAD_CFG`에 그대로 복사. endpoint가 비어 있으면 버튼이 숨겨짐
- 서버: `_build/apps_script.gs`. 시트 "플라밍고 리드 DB"는 씨유레저 회사 구글 계정(culeisure89046@gmail.com, 카시아 리드 DB와 같은 계정)에 새로 만든다
- 배포 절차: 회사 계정으로 새 구글시트 "플라밍고 리드 DB" 생성 → 확장 프로그램 → Apps Script → apps_script.gs 붙여넣기 → 배포 → 새 배포 → 웹 앱(실행: 나, 액세스: 모든 사용자) → 웹 앱 URL을 lead_config.json과 index.html LEAD_CFG.endpoint에 → 커밋 · push
- 문자: 솔라피(SOLAPI) 사용. console.solapi.com에서 API Key/Secret 발급, 발신번호 등록 후 apps_script.gs CONFIG(SOLAPI_API_KEY / SOLAPI_API_SECRET / SOLAPI_FROM)에 넣고 "배포 관리 → 새 버전". 키가 없으면 관리자 이메일(yorang2@gmail.com)로 리드가 옴. 인증은 HMAC-SHA256(date+salt, secret), 엔드포인트 /messages/v4/send
- Turnstile: culeisure.github.io 도메인 공용 sitekey/secret(카시아와 동일)
