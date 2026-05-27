(function () {
  // 只在被嵌入为 iframe 时生效，直接访问 player.bilibili.com 不干预
  if (window === window.top) return;

  var style = document.createElement("style");
  style.textContent = [
    ".bpx-player-relation-wrap",
    ".bpx-player-progress-wrap",
    ".bpx-player-shadow-progress-area"
  ].join(",") + "{display:none!important}";
  (document.head || document.documentElement).appendChild(style);

  var active = true;

  function hideControls() {
    if (!active) return;
    var container = document.querySelector(".bpx-player-container");
    if (container) {
      container.setAttribute("data-ctrl-hidden", "true");
    }
  }

  // 用户鼠标移入播放器后停止干预，恢复 B 站原生控制栏行为
  document.addEventListener("mouseenter", function () {
    active = false;
  }, { once: true, capture: true });

  // document_start 时 DOM 还未就绪，用轮询覆盖播放器初始化的各个阶段
  var delays = [0, 100, 300, 600, 1000, 1500, 2000, 3000, 4500];
  delays.forEach(function (ms) {
    setTimeout(hideControls, ms);
  });
}());
