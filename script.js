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
})();
