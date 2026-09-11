/**
 * 플라밍고CC 자료받기 리드 수집 서버 (Google Apps Script)
 * 구글시트에 리드 저장 + 담당 영업사원에게 솔라피(SOLAPI) 문자 발송
 *
 * 사용법: "플라밍고 리드 DB" 구글시트 → 확장 프로그램 → Apps Script → 이 코드 전체 붙여넣기
 *         → 배포 → 새 배포 → 웹 앱 (실행: 나 / 액세스: 모든 사용자) → 웹 앱 URL을 _build/lead_config.json 의 endpoint 에
 * 문자: 솔라피 키 3개(SOLAPI_API_KEY / SECRET / FROM)를 CONFIG에 넣고 배포 관리 → 새 버전
 * 카시아 apps_script.gs 와 같은 구조. 시트 이름과 문자 머리말만 다르다.
 */

// ===== 설정 (키 발급되면 여기만 채우면 됨) =====
var CONFIG = {
  SITE: '플라밍고',
  SOLAPI_API_KEY: '',        // 솔라피 API Key (console.solapi.com → API Key 관리)
  SOLAPI_API_SECRET: '',     // 솔라피 API Secret
  SOLAPI_FROM: '',           // 솔라피에 등록·인증된 발신번호 (숫자만, 예: 0244498221)
  TURNSTILE_SECRET: '0x4AAAAAAEmqDucfcWhxZqJZ-zR_k29axlY',      // Cloudflare Turnstile 시크릿 (culeisure.github.io 공용)
  ADMIN_EMAIL: 'yorang2@gmail.com',  // 문자 실패 시 알림 받을 이메일
  ALERT_PHONE: '',           // 긴급 알림 받을 번호 (이요한)
  ALERT_AT: 25,              // 담당자 1인당 일일 이 건수 도달 시 긴급 알림
  DAILY_CAP_PER_SP: 30       // 담당자 1인당 하루 최대 문자 발송 수 (악용 방지)
};

// ===== 영업사원 명단 (전화번호는 서버에만 보관) =====
var SALES = {
  mdw: { name: '명대웅', phone: '01040873443' }
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // 1. 허니팟: 봇이 채우는 숨은 칸이 차 있으면 조용히 성공 처리
    if (data.hp) return json_({ ok: true });

    // 2. 필수값, 형식 검증
    var sp = SALES[data.sp];
    var name = String(data.name || '').trim().slice(0, 20);
    var phone = String(data.phone || '').replace(/[^0-9]/g, '');
    var email = String(data.email || '').trim().slice(0, 60);
    if (!sp || !name || !/^01[016789][0-9]{7,8}$/.test(phone)) {
      return json_({ ok: false, msg: '입력 정보를 확인해 주세요.' });
    }

    // 3. Turnstile 사람 확인
    if (CONFIG.TURNSTILE_SECRET) {
      var tv = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'post',
        payload: { secret: CONFIG.TURNSTILE_SECRET, response: String(data.token || '') },
        muteHttpExceptions: true
      });
      var tr = JSON.parse(tv.getContentText());
      if (!tr.success) return json_({ ok: false, msg: '확인에 실패했습니다. 새로고침 후 다시 시도해 주세요.' });
    }

    // 4. 시트 저장
    var sheet = getSheet_();
    var now = new Date();
    var rows = sheet.getDataRange().getValues();

    // 같은 번호가 24시간 안에 이미 제출했으면 저장만 하고 문자는 생략
    var dup = false, todayCount = 0;
    var dayAgo = now.getTime() - 24 * 3600 * 1000;
    var today = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd');
    for (var i = Math.max(1, rows.length - 500); i < rows.length; i++) {
      var r = rows[i];
      if (String(r[4]).replace(/[^0-9]/g, '') === phone && new Date(r[0]).getTime() > dayAgo) dup = true;
      if (r[2] === sp.name && Utilities.formatDate(new Date(r[0]), 'Asia/Seoul', 'yyyy-MM-dd') === today) todayCount++;
    }

    sheet.appendRow([now, sp.company || '씨유레저', sp.name, name, fmtPhone_(phone), email, dup ? '중복(24h)' : '']);

    // 일일 건수 경보: 25건, 30건 도달 시점에 딱 한 번씩 관리자 긴급 알림
    var count = todayCount + 1;
    if (count === CONFIG.ALERT_AT) {
      notifyAdmin_('[' + CONFIG.SITE + ' 긴급] ' + sp.name + ' 오늘 ' + count + '건 도달');
    } else if (count === CONFIG.DAILY_CAP_PER_SP) {
      notifyAdmin_('[' + CONFIG.SITE + ' 긴급] ' + sp.name + ' 오늘 ' + count + '건 상한 도달, 문자 발송 중단됨');
    }

    // 5. 담당자 문자 발송 (중복이거나 일일 상한 초과 시 생략)
    if (!dup && todayCount < CONFIG.DAILY_CAP_PER_SP) {
      var msg = '[' + CONFIG.SITE + '] 자료 다운 완료\n' + name + ' ' + fmtPhone_(phone);
      var sent = sendSms_(sp.phone, msg);
      if (!sent && CONFIG.ADMIN_EMAIL) {
        MailApp.sendEmail(CONFIG.ADMIN_EMAIL, '[' + CONFIG.SITE + '] 자료 다운 리드 - ' + sp.name,
          '리드: ' + name + ' / ' + fmtPhone_(phone) + ' / ' + email + '\n담당: ' + sp.name + '\n시트에 저장됨. 솔라피 키가 없으면 문자는 발송되지 않습니다.');
      }
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, msg: '일시적인 오류입니다. 잠시 후 다시 시도해 주세요.' });
  }
}

// ===== 관리자 긴급 알림 (솔라피 연결 전에는 이메일로) =====
function notifyAdmin_(text) {
  var viaSms = CONFIG.ALERT_PHONE && sendSms_(CONFIG.ALERT_PHONE.replace(/[^0-9]/g, ''), text);
  if (!viaSms && CONFIG.ADMIN_EMAIL) {
    MailApp.sendEmail(CONFIG.ADMIN_EMAIL, text, text + '\n\n' + CONFIG.SITE + ' 리드 DB 시트를 확인하세요.');
  }
}

// ===== 솔라피 문자 발송 =====
// 인증: HMAC-SHA256. signature = HMAC_SHA256(date + salt, apiSecret) 를 16진수로
function sendSms_(to, text) {
  if (!CONFIG.SOLAPI_API_KEY || !CONFIG.SOLAPI_API_SECRET || !CONFIG.SOLAPI_FROM) return false;
  try {
    var date = new Date().toISOString();
    var salt = Utilities.getUuid().replace(/-/g, '');
    var sigBytes = Utilities.computeHmacSha256Signature(date + salt, CONFIG.SOLAPI_API_SECRET);
    var signature = sigBytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
    var res = UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'HMAC-SHA256 apiKey=' + CONFIG.SOLAPI_API_KEY + ', date=' + date + ', salt=' + salt + ', signature=' + signature
      },
      payload: JSON.stringify({
        message: { to: to, from: CONFIG.SOLAPI_FROM.replace(/[^0-9]/g, ''), text: text }
      }),
      muteHttpExceptions: true
    });
    return res.getResponseCode() === 200;
  } catch (err) {
    return false;
  }
}

// ===== 유틸 =====
function getSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('리드');
  if (!sheet) {
    sheet = ss.insertSheet('리드');
    sheet.appendRow(['일시', '소속', '담당자', '성함', '연락처', '이메일', '비고']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function fmtPhone_(p) {
  return p.replace(/^(01[0-9])([0-9]{3,4})([0-9]{4})$/, '$1-$2-$3');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 배포 확인용: 웹 앱 URL을 브라우저로 열면 이 문구가 보이면 정상
function doGet() {
  return ContentService.createTextOutput('flamingo lead server ok');
}
