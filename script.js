/* =========================================================
   플라밍고CC 이용권 안내 랜딩 - 동작 스크립트
   인트로 / 스크롤 리빌 / 진행바 / 헤더 / 트래킹
   ========================================================= */
(function () {
  "use strict";

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  /* 1) 인트로 (세션 첫 진입 1회) */
  (function () {
    var intro = document.getElementById("intro");
    if (!intro) return;
    var seen = false;
    try { seen = sessionStorage.getItem("flamingoIntro") === "1"; } catch (e) {}
    if (seen || reduce) {
      intro.classList.add("is-done");
      window.setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 100);
      return;
    }
    try { sessionStorage.setItem("flamingoIntro", "1"); } catch (e) {}
    document.documentElement.style.overflow = "hidden";
    window.setTimeout(function () {
      intro.classList.add("is-done");
      document.documentElement.style.overflow = "";
      window.setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 650);
    }, 1300);
  })();

  /* 2) 스크롤 리빌 */
  (function () {
    var items = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 0.07 + "s";
      io.observe(el);
    });
  })();

  /* 3) 진행바 + 헤더 */
  (function () {
    var bar = document.getElementById("progress");
    var head = document.getElementById("head");
    var lock = document.getElementById("lock");
    function onScroll() {
      var sc = window.scrollY || window.pageYOffset;
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (sc / max) * 100 : 0) + "%";
      }
      if (head) {
        var gate = lock ? lock.offsetHeight - 80 : 12;
        head.classList.toggle("is-stuck", sc > gate);
        var bar = document.querySelector(".bar");
        if (bar) bar.classList.toggle("is-on", sc > (lock ? lock.offsetHeight * 0.45 : 12));
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  })();

  /* 4) 전환 트래킹 (GA4 연결 시 gtag 사용) */
  (function () {
    function sendEvent(name, params) {
      try {
        if (typeof gtag === "function") gtag("event", name, params);
      } catch (e) {}
    }
    document.querySelectorAll("[data-track]").forEach(function (el) {
      el.addEventListener("click", function () {
        sendEvent(el.getAttribute("data-track"), {
          position: el.getAttribute("data-track-pos") || "unknown",
          href: el.getAttribute("href") || ""
        });
      });
    });
  })();

  /* 5) FAQ: 한 번에 하나만 열기 */
  (function () {
    document.querySelectorAll(".acc").forEach(function (acc) {
      acc.querySelectorAll("details").forEach(function (d) {
        d.addEventListener("toggle", function () {
          if (!d.open) return;
          acc.querySelectorAll("details[open]").forEach(function (o) { if (o !== d) o.open = false; });
        });
      });
    });
  })();

  /* 6) 사진 라이트박스: 카드 · 갤러리 · 풀폭 사진 클릭 시 확대 */
  (function () {
    var imgs = Array.prototype.slice.call(document.querySelectorAll(".feat img, .gal img, .full img"));
    if (!imgs.length) return;
    var lb = document.createElement("div");
    lb.className = "lb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-label", "사진 크게 보기");
    lb.innerHTML = '<button class="lb__x" type="button" aria-label="닫기">&times;</button>' +
      '<button class="lb__nav lb__prev" type="button" aria-label="이전">&#8249;</button>' +
      '<button class="lb__nav lb__next" type="button" aria-label="다음">&#8250;</button>' +
      '<figure class="lb__fig"><img alt="" /><figcaption></figcaption></figure>' +
      '<p class="lb__count"></p>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector("figcaption");
    var lbCount = lb.querySelector(".lb__count");
    var idx = 0;

    function caption(img) {
      var fig = img.closest("figure");
      var fc = fig && fig.querySelector("figcaption");
      if (fc && !fc.classList.contains("full__cap")) return fc.textContent.trim();
      var feat = img.closest(".feat");
      if (feat) { var b = feat.querySelector("b"); if (b) return b.textContent.trim(); }
      return img.alt || "";
    }
    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      var img = imgs[idx];
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      lbCap.textContent = caption(img);
      lbCount.textContent = (idx + 1) + " / " + imgs.length;
    }
    function open(i) {
      show(i);
      lb.classList.add("is-on");
      document.documentElement.style.overflow = "hidden";
    }
    function close() {
      lb.classList.remove("is-on");
      document.documentElement.style.overflow = "";
    }
    imgs.forEach(function (img, i) {
      img.classList.add("zoomable");
      img.addEventListener("click", function () { open(i); });
    });
    lb.querySelector(".lb__x").addEventListener("click", close);
    lb.querySelector(".lb__prev").addEventListener("click", function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector(".lb__next").addEventListener("click", function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-on")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show(dx < 0 ? idx + 1 : idx - 1);
    }, { passive: true });
  })();

  /* 7) 자료받기 리드 폼 */
  (function () {
    var cfg = window.LEAD_CFG || {};
    var leadBtn = document.getElementById("leadBtn");
    if (!leadBtn) return;
    if (!cfg.endpoint) { leadBtn.style.display = "none"; return; }
    var leadBox = document.getElementById("leadBox");
    var leadForm = document.getElementById("leadForm");
    function track(name, params) { try { if (typeof gtag === "function") gtag("event", name, params || {}); } catch (e) {} }
    if (cfg.sitekey) {
      var tw = document.getElementById("tsWidget");
      tw.className = "cf-turnstile";
      tw.setAttribute("data-sitekey", cfg.sitekey);
      var tsc = document.createElement("script");
      tsc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      tsc.async = true;
      document.head.appendChild(tsc);
    }
    leadBtn.addEventListener("click", function () {
      leadBox.hidden = false;
      leadBtn.style.display = "none";
      leadBox.scrollIntoView({ behavior: "smooth", block: "center" });
      track("lead_open");
    });
    var privacyLink = document.getElementById("privacyLink");
    if (privacyLink) privacyLink.addEventListener("click", function () { var d = document.getElementById("privacyD"); if (d) d.open = true; });
    leadForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var btn = document.getElementById("leadSubmit");
      var name = leadForm.lname.value.trim();
      var phone = leadForm.lphone.value.replace(/[^0-9]/g, "");
      var email = leadForm.lemail.value.trim();
      if (!name) { alert("성함을 입력해 주세요."); return; }
      if (!/^01[016789][0-9]{7,8}$/.test(phone)) { alert("휴대폰 번호를 확인해 주세요."); return; }
      if (!leadForm.lagree.checked) { alert("개인정보 수집 · 이용에 동의해 주세요."); return; }
      var token = "";
      if (cfg.sitekey && window.turnstile) token = window.turnstile.getResponse() || "";
      btn.disabled = true; btn.textContent = "전송 중...";
      fetch(cfg.endpoint, {
        method: "POST",
        body: JSON.stringify({ sp: cfg.sp || "", name: name, phone: phone, email: email, token: token, hp: leadForm.company ? leadForm.company.value : "" })
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.ok) {
          leadForm.hidden = true;
          var done = document.getElementById("leadDone");
          done.hidden = false;
          document.getElementById("leadPdf").href = atob(cfg.pdf);
          track("lead_submit");
        } else {
          alert(res.msg || "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
          btn.disabled = false; btn.textContent = "제출하고 안내문 받기";
        }
      }).catch(function () {
        alert("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        btn.disabled = false; btn.textContent = "제출하고 안내문 받기";
      });
    });
  })();
})();
