const STORE_KEY = "retro-tv-channel-config-v2";
const TIMELINE_EPOCH = new Date("2026-01-01T00:00:00+08:00").getTime();

const seedPrograms = [
  {
    id: "yt-big-buck-bunny",
    title: "大兔子邦尼",
    source: "youtube",
    videoId: "aqz-KE-bpKQ",
    duration: 596,
    tags: ["动画", "短片", "电影"]
  },
  {
    id: "yt-sintel",
    title: "辛特尔",
    source: "youtube",
    videoId: "eRsGyueVLvQ",
    duration: 888,
    tags: ["动画", "短片", "电影"]
  },
  {
    id: "yt-tears",
    title: "钢铁之泪",
    source: "youtube",
    videoId: "R6MlUcmOul8",
    duration: 734,
    tags: ["科幻", "短片", "电影"]
  },
  {
    id: "yt-nasa",
    title: "NASA 地球窗口",
    source: "youtube",
    videoId: "86YLFOog4GM",
    duration: 1200,
    tags: ["太空", "科学", "档案", "氛围"]
  },
  {
    id: "yt-computer-history",
    title: "电脑历史档案",
    source: "youtube",
    videoId: "mCq8-xTH7jA",
    duration: 540,
    tags: ["电脑", "档案", "教育", "复古"]
  },
  {
    id: "yt-arcade",
    title: "街机长玩",
    source: "youtube",
    videoId: "Dk3mCZqB3jU",
    duration: 900,
    tags: ["游戏", "街机", "复古"]
  },
  {
    id: "yt-synth",
    title: "夜车合成器",
    source: "youtube",
    videoId: "MV_3Dpw-BRY",
    duration: 1200,
    tags: ["音乐", "合成器", "城市"]
  },
  {
    id: "yt-lofi",
    title: "低保真窗边",
    source: "youtube",
    videoId: "jfKfPfyJRdk",
    duration: 1200,
    tags: ["音乐", "低保真", "氛围"]
  },
  {
    id: "yt-jazz",
    title: "爵士房间",
    source: "youtube",
    videoId: "Dx5qFachd3A",
    duration: 1200,
    tags: ["音乐", "爵士", "现场"]
  },
  {
    id: "yt-train",
    title: "列车前窗",
    source: "youtube",
    videoId: "3rDjPLvOShM",
    duration: 1200,
    tags: ["旅行", "列车", "氛围"]
  },
  {
    id: "yt-city-walk",
    title: "夜色城市漫游",
    source: "youtube",
    videoId: "Fhg8tvyJbAo",
    duration: 1200,
    tags: ["旅行", "城市", "步行"]
  },
  {
    id: "direct-flower",
    title: "花朵测试片",
    source: "direct",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    duration: 30,
    tags: ["测试", "自然", "短片"]
  }
];

const defaultChannelBlueprints = [
  {
    id: "arcade",
    order: 1,
    name: "深夜街机台",
    description: "街机长玩、合成器、霓虹城市与夜间信号。",
    tags: ["游戏", "街机", "合成器", "复古"],
    scoutTerms: ["复古街机 gameplay", "synthwave night drive", "80s computer demo"],
    programIds: ["yt-arcade", "yt-synth", "yt-computer-history", "direct-flower"]
  },
  {
    id: "lab",
    order: 2,
    name: "公共实验室",
    description: "旧科学片、太空档案、电脑历史与公共频道气质。",
    tags: ["科学", "档案", "教育", "太空"],
    scoutTerms: ["public domain science film", "NASA archive", "vintage computer documentary"],
    programIds: ["yt-nasa", "yt-computer-history", "yt-tears", "direct-flower"]
  },
  {
    id: "music",
    order: 3,
    name: "午夜音乐台",
    description: "低保真、爵士现场和适合当背景的长段音乐。",
    tags: ["音乐", "低保真", "爵士", "氛围"],
    scoutTerms: ["lofi live set", "jazz performance archive", "ambient music video"],
    programIds: ["yt-lofi", "yt-jazz", "yt-synth"]
  },
  {
    id: "cinema",
    order: 4,
    name: "小型影院",
    description: "短片、动画与公共领域电影轮播。",
    tags: ["电影", "动画", "短片"],
    scoutTerms: ["short animation film", "public domain short film", "classic cartoon"],
    programIds: ["yt-big-buck-bunny", "yt-sintel", "yt-tears"]
  },
  {
    id: "travel",
    order: 5,
    name: "梦游旅行台",
    description: "列车前窗、城市漫步、雨夜街景和慢速移动。",
    tags: ["旅行", "城市", "列车", "步行"],
    scoutTerms: ["city walk night", "train cab view", "street food walk"],
    programIds: ["yt-train", "yt-city-walk", "yt-nasa"]
  }
];

const filters = [
  ["filter-clean", "原始"],
  ["filter-crt", "老电视"],
  ["filter-vhs", "录像带"],
  ["filter-noir", "黑白"],
  ["filter-acid", "霓虹"],
  ["filter-terminal", "绿屏"]
];

const state = {
  channels: [],
  channelIndex: 0,
  started: false,
  filter: "filter-crt",
  sideHidden: false,
  currentProgramKey: "",
  currentOffset: 0,
  tickTimer: null,
  osdTimer: null,
  staticTimer: null,
  hoverSuppressTimer: null,
  pointerInsideScreen: false
};

const el = {
  appShell: document.getElementById("appShell"),
  screenWrap: document.getElementById("screenWrap"),
  player: document.getElementById("player"),
  startButton: document.getElementById("startButton"),
  osd: document.getElementById("osd"),
  osdChannel: document.getElementById("osdChannel"),
  osdTitle: document.getElementById("osdTitle"),
  osdMeta: document.getElementById("osdMeta"),
  channelName: document.getElementById("channelName"),
  channelDescription: document.getElementById("channelDescription"),
  channelList: document.getElementById("channelList"),
  filterGrid: document.getElementById("filterGrid"),
  schedule: document.getElementById("schedule"),
  sourceInput: document.getElementById("sourceInput"),
  scoutButton: document.getElementById("scoutButton"),
  autoScoutButton: document.getElementById("autoScoutButton"),
  appendSourceButton: document.getElementById("appendSourceButton"),
  importBilibiliButton: document.getElementById("importBilibiliButton"),
  sourceStatus: document.getElementById("sourceStatus"),
  progressBar: document.getElementById("progressBar"),
  clock: document.getElementById("clock"),
  remaining: document.getElementById("remaining"),
  channelUp: document.getElementById("channelUp"),
  channelDown: document.getElementById("channelDown"),
  sideToggle: document.getElementById("sideToggle"),
  adminChannelSelect: document.getElementById("adminChannelSelect"),
  adminChannelName: document.getElementById("adminChannelName"),
  adminChannelOrder: document.getElementById("adminChannelOrder"),
  adminChannelDescription: document.getElementById("adminChannelDescription"),
  adminChannelTags: document.getElementById("adminChannelTags"),
  adminScoutTerms: document.getElementById("adminScoutTerms"),
  adminPrograms: document.getElementById("adminPrograms"),
  saveAdminButton: document.getElementById("saveAdminButton"),
  addChannelButton: document.getElementById("addChannelButton"),
  deleteChannelButton: document.getElementById("deleteChannelButton"),
  resetConfigButton: document.getElementById("resetConfigButton")
};

async function init() {
  state.channels = await loadChannels();
  bindEvents();
  renderAll();
  tune(state.channelIndex, { force: true, autoplay: false });
  state.tickTimer = window.setInterval(syncTimeline, 500);
}

function bindEvents() {
  el.startButton.addEventListener("click", start);
  el.channelUp.addEventListener("click", () => changeChannel(1));
  el.channelDown.addEventListener("click", () => changeChannel(-1));
  el.sideToggle.addEventListener("click", toggleSidePanel);
  el.screenWrap.addEventListener("mouseenter", () => {
    state.pointerInsideScreen = true;
  });
  el.screenWrap.addEventListener("mouseleave", () => {
    state.pointerInsideScreen = false;
    window.setTimeout(() => simulateBilibiliMouseExit(el.player.querySelector(".bilibili-frame")), 60);
    el.screenWrap.classList.remove("suppress-player-hover");
  });
  el.scoutButton.addEventListener("click", () => scoutFromInput());
  el.autoScoutButton.addEventListener("click", () => autoScoutForChannel());
  el.appendSourceButton.addEventListener("click", () => appendSourceFromInput());
  el.importBilibiliButton?.addEventListener("click", () => importBilibiliListFromInput());
  el.sourceInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") scoutFromInput();
  });
  el.adminChannelSelect.addEventListener("change", renderAdminForm);
  el.saveAdminButton.addEventListener("click", saveAdminForm);
  el.addChannelButton.addEventListener("click", addChannel);
  el.deleteChannelButton.addEventListener("click", deleteSelectedChannel);
  el.resetConfigButton.addEventListener("click", resetConfig);

  window.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.key === "Enter") {
      event.preventDefault();
      start();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      changeChannel(1);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      changeChannel(-1);
    }
    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      cycleFilter();
    }
    if (event.key.toLowerCase() === "h") {
      event.preventDefault();
      toggleSidePanel();
    }
    const number = Number(event.key);
    if (number >= 1 && number <= state.channels.length) {
      event.preventDefault();
      tune(number - 1);
    }
  });
}

async function loadChannels() {
  const serverChannels = await fetchChannelsFromServer();
  if (serverChannels.length) return normalizeChannels(serverChannels);

  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return normalizeChannels(saved);
  } catch (error) {
    localStorage.removeItem(STORE_KEY);
  }
  return normalizeChannels(defaultChannelBlueprints.map(hydrateDefaultChannel));
}

async function fetchChannelsFromServer() {
  try {
    const response = await fetch("/api/channels", {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload.channels) ? payload.channels : [];
  } catch (error) {
    return [];
  }
}

function hydrateDefaultChannel(channel) {
  return {
    ...channel,
    programs: channel.programIds
      .map((id) => seedPrograms.find((program) => program.id === id))
      .filter(Boolean)
      .map(cloneProgram)
  };
}

function normalizeChannels(channels) {
  const fallback = hydrateDefaultChannel(defaultChannelBlueprints[0]);
  return channels
    .map((channel, index) => ({
      id: channel.id || `channel-${Date.now()}-${index}`,
      order: Number(channel.order) || index + 1,
      name: channel.name || `频道 ${index + 1}`,
      description: channel.description || "未命名频道。",
      tags: normalizeList(channel.tags),
      scoutTerms: normalizeList(channel.scoutTerms),
      programs: normalizePrograms(channel.programs?.length ? channel.programs : fallback.programs)
    }))
    .sort((a, b) => a.order - b.order)
    .map((channel, index) => ({ ...channel, order: index + 1 }));
}

function normalizePrograms(programs) {
  return programs
    .map((program, index) => {
      const duration = clamp(Number(program.duration) || 300, 5, 86400);
      const skipStart = clamp(Number(program.skipStart) || 0, 0, duration - 1);
      const skipEnd = clamp(Number(program.skipEnd) || 0, 0, duration - skipStart - 1);
      return {
        id: program.id || `program-${Date.now()}-${index}`,
        title: program.title || `节目 ${index + 1}`,
        source: ["youtube", "bilibili", "direct", "iframe"].includes(program.source) ? program.source : "direct",
        videoId: program.videoId || "",
        bvid: program.bvid || "",
        cid: program.cid || "",
        page: clamp(Number(program.page) || 1, 1, 9999),
        url: program.url || "",
        duration,
        skipStart,
        skipEnd,
        tags: normalizeList(program.tags)
      };
    })
    .filter((program) => program.videoId || program.bvid || program.url);
}

async function persistChannels() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state.channels));
  try {
    const response = await fetch("/api/channels", {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ channels: state.channels })
    });
    if (!response.ok) throw new Error("保存失败");
    const payload = await response.json();
    if (Array.isArray(payload.channels)) {
      state.channels = normalizeChannels(payload.channels);
      localStorage.setItem(STORE_KEY, JSON.stringify(state.channels));
    }
    return true;
  } catch (error) {
    setStatus("数据库保存失败，已临时保存到当前浏览器。请确认使用 python3 server.py 启动。");
    return false;
  }
}

async function deleteChannelOnServer(channelId) {
  if (!channelId) return false;
  try {
    const response = await fetch(`/api/channels/${encodeURIComponent(channelId)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return false;
    const payload = await response.json();
    if (Array.isArray(payload.channels)) {
      state.channels = normalizeChannels(payload.channels);
      localStorage.setItem(STORE_KEY, JSON.stringify(state.channels));
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function resetChannelsOnServer() {
  try {
    const response = await fetch("/api/reset", {
      method: "POST",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload.channels) ? payload.channels : [];
  } catch (error) {
    return [];
  }
}

function renderAll() {
  renderChannels();
  renderFilters();
  renderSchedule();
  renderAdminOptions();
  renderAdminForm();
}

function start() {
  if (state.started) return;
  state.started = true;
  document.body.classList.add("has-started");
  tune(state.channelIndex, { force: true });
}

function tune(channelIndex, options = {}) {
  if (!state.channels.length) return;
  state.channelIndex = wrap(channelIndex, state.channels.length);
  flashStatic();
  refreshPlayback({ force: options.force !== false, autoplay: options.autoplay !== false });
  renderChannels();
  renderSchedule();
}

function refreshPlayback(options = {}) {
  const channel = currentChannel();
  const position = getTimelinePosition(channel);
  state.currentOffset = position.offset;
  const key = `${channel.id}:${position.program.id}:${Math.floor(position.offset)}`;
  const programChanged = state.currentProgramKey.split(":").slice(0, 2).join(":") !== `${channel.id}:${position.program.id}`;

  if (options.force || programChanged) {
    state.currentProgramKey = key;
    renderPlayer(position.program, state.started && options.autoplay !== false, position.offset);
    showOsd(channel, position.program, position.offset);
  }

  renderNow(channel, position);
  updateProgress(position);
}

function syncTimeline() {
  if (!state.channels.length) return;
  const channel = currentChannel();
  const position = getTimelinePosition(channel);
  const currentProgramId = state.currentProgramKey.split(":")[1];
  if (state.started && position.program.id !== currentProgramId) {
    refreshPlayback({ force: true });
    renderSchedule();
    return;
  }
  state.currentOffset = position.offset;
  updateProgress(position);
  updateScheduleActive(position.program.id);
}

function currentChannel() {
  return state.channels[state.channelIndex] || state.channels[0];
}

function getTimelinePosition(channel, at = Date.now()) {
  const programs = channel.programs?.length ? channel.programs : hydrateDefaultChannel(defaultChannelBlueprints[0]).programs;
  const total = programs.reduce((sum, program) => sum + playableDuration(program), 0) || 1;
  const channelOffset = (channel.order - 1) * 19;
  let elapsed = Math.floor((at - TIMELINE_EPOCH) / 1000 + channelOffset);
  elapsed = ((elapsed % total) + total) % total;

  let cursor = 0;
  for (const program of programs) {
    const effectiveDuration = playableDuration(program);
    const end = cursor + effectiveDuration;
    if (elapsed < end) {
      return {
        program,
        programIndex: programs.indexOf(program),
        offset: elapsed - cursor,
        remaining: end - elapsed,
        elapsed,
        total
      };
    }
    cursor = end;
  }

  return {
    program: programs[0],
    programIndex: 0,
    offset: 0,
    remaining: playableDuration(programs[0]),
    elapsed: 0,
    total
  };
}

function playableDuration(program) {
  const skipStart = Math.max(0, Number(program?.skipStart) || 0);
  const skipEnd = Math.max(0, Number(program?.skipEnd) || 0);
  const duration = Math.max(1, Number(program?.duration) || 1);
  return Math.max(1, duration - skipStart - skipEnd);
}

function playbackStartOffset(program, timelineOffset = 0) {
  return Math.max(0, Math.floor((Number(program?.skipStart) || 0) + timelineOffset));
}

function renderPlayer(program, autoplay, offset = 0) {
  if (!program) {
    el.player.innerHTML = "";
    return;
  }

  if (!state.started) {
    el.player.innerHTML = `
      <div class="test-pattern" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
        <strong>无信号</strong>
      </div>
    `;
    return;
  }

  const start = playbackStartOffset(program, offset);
  const auto = autoplay ? "1" : "0";

  if (program.source === "youtube") {
    const src = `https://www.youtube.com/embed/${encodeURIComponent(program.videoId)}?autoplay=${auto}&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&start=${start}`;
    el.player.innerHTML = `<iframe class="media-frame" tabindex="-1" title="${escapeAttr(program.title)}" src="${src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    return;
  }

  if (program.source === "bilibili") {
    const mobile = isMobile();
    const params = new URLSearchParams({
      bvid: program.bvid,
      page: String(program.page || 1),
      autoplay: mobile ? "0" : auto,
      danmaku: "0"
    });
    if (!mobile) {
      params.set("high_quality", "1");
      params.set("as_wide", "1");
      params.set("t", String(start));
    }
    if (program.cid) params.set("cid", program.cid);
    const src = `https://player.bilibili.com/player.html?${params.toString()}`;
    const biliPageUrl = `https://www.bilibili.com/video/${encodeURIComponent(program.bvid)}${program.page > 1 ? `?p=${program.page}` : ""}`;
    if (mobile) {
      el.player.innerHTML = `
        <iframe class="media-frame bilibili-frame" tabindex="-1" title="${escapeAttr(program.title)}" src="${src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        <a class="bilibili-mobile-link" href="${escapeAttr(biliPageUrl)}" target="_blank" rel="noopener" title="在 B站 中打开">B站</a>
      `;
    } else {
      el.player.innerHTML = `
        <iframe class="media-frame bilibili-frame" tabindex="-1" title="${escapeAttr(program.title)}" src="${src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        <div class="bilibili-hover-guard" aria-hidden="true"></div>
      `;
      wireBilibiliControlHidden();
    }
    return;
  }

  if (program.source === "direct") {
    el.player.innerHTML = `<video class="media-video" src="${escapeAttr(program.url)}" ${autoplay ? "autoplay" : ""} muted playsinline></video>`;
    const video = el.player.querySelector("video");
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = Math.min(start, Math.max(0, video.duration - 1 || start));
      if (autoplay) video.play().catch(() => {});
    }, { once: true });
    return;
  }

  const separator = program.url.includes("?") ? "&" : "?";
  const src = `${program.url}${separator}autoplay=${auto}&start=${start}`;
  el.player.innerHTML = `<iframe class="media-frame" tabindex="-1" title="${escapeAttr(program.title)}" src="${escapeAttr(src)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
}

function wireBilibiliControlHidden() {
  const frame = el.player.querySelector(".bilibili-frame");
  if (!frame) return;
  frame.addEventListener("load", () => {
    enforceBilibiliControlHidden(frame);
    simulateBilibiliMouseExit(frame);
  }, { once: true });
  [120, 350, 800, 1500, 2600, 4200].forEach((delay) => {
    window.setTimeout(() => {
      enforceBilibiliControlHidden(frame);
      simulateBilibiliMouseExit(frame);
    }, delay);
  });
}

function simulateBilibiliMouseExit(frame) {
  if (!frame) return;
  const rect = el.screenWrap.getBoundingClientRect();
  const enterPoint = {
    clientX: Math.round(rect.left + rect.width / 2),
    clientY: Math.round(rect.top + rect.height / 2)
  };
  const exitPoint = {
    clientX: Math.max(0, Math.round(rect.left - 32)),
    clientY: Math.max(0, Math.round(rect.top - 32))
  };

  el.screenWrap.classList.add("suppress-player-hover");
  dispatchPointerSequence(frame, enterPoint, exitPoint);
  dispatchPointerSequence(el.screenWrap, enterPoint, exitPoint);
  frame.blur();
  window.focus();

  window.clearTimeout(state.hoverSuppressTimer);
  state.hoverSuppressTimer = window.setTimeout(() => {
    if (!state.pointerInsideScreen) {
      el.screenWrap.classList.remove("suppress-player-hover");
    }
  }, 3200);
}

function dispatchPointerSequence(target, enterPoint, exitPoint) {
  [
    ["pointerover", enterPoint],
    ["pointerenter", enterPoint],
    ["mouseover", enterPoint],
    ["mouseenter", enterPoint],
    ["pointermove", enterPoint],
    ["mousemove", enterPoint],
    ["pointerout", exitPoint],
    ["pointerleave", exitPoint],
    ["mouseout", exitPoint],
    ["mouseleave", exitPoint]
  ].forEach(([type, point]) => {
    const EventClass = type.startsWith("pointer") && window.PointerEvent ? PointerEvent : MouseEvent;
    target.dispatchEvent(new EventClass(type, {
      bubbles: !type.endsWith("enter") && !type.endsWith("leave"),
      cancelable: true,
      view: window,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      clientX: point.clientX,
      clientY: point.clientY,
      screenX: point.clientX,
      screenY: point.clientY
    }));
  });
}

function enforceBilibiliControlHidden(frame) {
  try {
    const doc = frame.contentDocument || frame.contentWindow?.document;
    const container = doc?.querySelector(".bpx-player-container");
    if (!container) return false;
    container.setAttribute("data-ctrl-hidden", "true");

    if (!container.dataset.ctrlObserverAttached) {
      container.dataset.ctrlObserverAttached = "true";
      const observer = new MutationObserver(() => {
        if (container.getAttribute("data-ctrl-hidden") !== "true") {
          container.setAttribute("data-ctrl-hidden", "true");
        }
      });
      observer.observe(container, {
        attributes: true,
        attributeFilter: ["data-ctrl-hidden"]
      });
    }
    return true;
  } catch (error) {
    return false;
  }
}

function renderNow(channel, position) {
  el.channelName.textContent = channel.name;
  el.channelDescription.textContent = channel.description;
  el.osdChannel.textContent = `第 ${pad(channel.order)} 频道`;
  el.osdTitle.textContent = position.program.title;
  el.osdMeta.textContent = `${sourceLabel(position.program.source)} / ${formatDuration(position.offset)} / ${formatDuration(playableDuration(position.program))}`;
}

function renderChannels() {
  el.channelList.innerHTML = state.channels.map((channel, index) => {
    const active = index === state.channelIndex ? " is-active" : "";
    return `
      <button class="channel-btn${active}" type="button" data-channel="${index}">
        <span class="channel-number">第 ${pad(channel.order)} 台</span>
        <span class="channel-copy">
          <strong>${escapeHtml(channel.name)}</strong>
          <span>${escapeHtml(channel.tags.slice(0, 4).join(" / ") || "未分类")}</span>
        </span>
      </button>
    `;
  }).join("");

  el.channelList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => tune(Number(button.dataset.channel)));
  });
}

function renderFilters() {
  el.filterGrid.innerHTML = filters.map(([className, label]) => `
    <button class="filter-btn${className === state.filter ? " is-active" : ""}" type="button" data-filter="${className}">
      ${escapeHtml(label)}
    </button>
  `).join("");

  el.filterGrid.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });
}

function renderSchedule() {
  const channel = currentChannel();
  const position = getTimelinePosition(channel);
  let cursor = 0;
  el.schedule.innerHTML = channel.programs.map((program, index) => {
    const active = program.id === position.program.id ? " is-active" : "";
    const start = cursor;
    const effectiveDuration = playableDuration(program);
    cursor += effectiveDuration;
    const skipText = formatSkipText(program);
    return `
      <div class="program-row${active}" data-program-id="${escapeAttr(program.id)}">
        <span class="program-index">${pad(index + 1)}</span>
        <span>
          <strong>${escapeHtml(program.title)}</strong>
          <span>${formatDuration(start)} - ${formatDuration(cursor)} / ${escapeHtml(sourceLabel(program.source))}${skipText}</span>
        </span>
        <span class="program-kind">${program.id === position.program.id ? "直播中" : "排播"}</span>
      </div>
    `;
  }).join("");
}

function updateScheduleActive(programId) {
  el.schedule.querySelectorAll(".program-row").forEach((row) => {
    const active = row.dataset.programId === programId;
    row.classList.toggle("is-active", active);
    const kind = row.querySelector(".program-kind");
    if (kind) kind.textContent = active ? "直播中" : "排播";
  });
}

function formatSkipText(program) {
  const skipStart = Number(program?.skipStart) || 0;
  const skipEnd = Number(program?.skipEnd) || 0;
  if (!skipStart && !skipEnd) return "";
  const parts = [];
  if (skipStart) parts.push(`跳头 ${formatDuration(skipStart)}`);
  if (skipEnd) parts.push(`跳尾 ${formatDuration(skipEnd)}`);
  return ` / ${parts.join(" / ")}`;
}

function renderAdminOptions() {
  el.adminChannelSelect.innerHTML = state.channels.map((channel, index) => `
    <option value="${index}">第 ${pad(channel.order)} 台 · ${escapeHtml(channel.name)}</option>
  `).join("");
  el.adminChannelSelect.value = String(state.channelIndex);
}

function renderAdminForm() {
  const index = Number(el.adminChannelSelect.value || state.channelIndex);
  const channel = state.channels[index] || currentChannel();
  if (!channel) return;
  el.adminChannelName.value = channel.name;
  el.adminChannelOrder.value = channel.order;
  el.adminChannelDescription.value = channel.description;
  el.adminChannelTags.value = channel.tags.join(", ");
  el.adminScoutTerms.value = channel.scoutTerms.join(", ");
  el.adminPrograms.value = programsToText(channel.programs);
}

async function saveAdminForm() {
  const index = Number(el.adminChannelSelect.value || state.channelIndex);
  const channel = state.channels[index];
  if (!channel) return;

  const parsedPrograms = parseProgramLines(el.adminPrograms.value);
  if (!parsedPrograms.length) {
    setStatus("节目编排为空或格式无法识别，未保存。");
    return;
  }

  channel.name = el.adminChannelName.value.trim() || channel.name;
  channel.order = clamp(Number(el.adminChannelOrder.value) || channel.order, 1, 999);
  channel.description = el.adminChannelDescription.value.trim() || "未填写频道说明。";
  channel.tags = normalizeList(el.adminChannelTags.value);
  channel.scoutTerms = normalizeList(el.adminScoutTerms.value);
  channel.programs = parsedPrograms;

  const selectedId = channel.id;
  state.channels = normalizeChannels(state.channels);
  state.channelIndex = Math.max(0, state.channels.findIndex((item) => item.id === selectedId));
  const saved = await persistChannels();
  state.channelIndex = Math.max(0, state.channels.findIndex((item) => item.id === selectedId));
  renderAll();
  tune(state.channelIndex, { force: true });
  setStatus(saved ? "频道编排已保存到数据库，其他端刷新后会看到同一份编排。" : "频道编排已临时保存到当前浏览器。");
}

async function addChannel() {
  const nextOrder = state.channels.length + 1;
  const channel = {
    id: `channel-${Date.now()}`,
    order: nextOrder,
    name: `新频道 ${nextOrder}`,
    description: "新的排播频道。",
    tags: ["自定义"],
    scoutTerms: ["复古 视频"],
    programs: [cloneProgram(seedPrograms[seedPrograms.length - 1])]
  };
  state.channels.push(channel);
  state.channels = normalizeChannels(state.channels);
  state.channelIndex = state.channels.length - 1;
  const saved = await persistChannels();
  renderAll();
  tune(state.channelIndex, { force: true });
  setStatus(saved ? "已新增频道并保存到数据库，可以在管理后台继续编排。" : "已新增频道，但数据库保存失败。");
}

async function deleteSelectedChannel() {
  if (state.channels.length <= 1) {
    setStatus("至少需要保留一个频道。");
    return;
  }
  const index = Number(el.adminChannelSelect.value || state.channelIndex);
  const deletedId = state.channels[index]?.id;

  const deletedOnServer = await deleteChannelOnServer(deletedId);
  if (!deletedOnServer) {
    state.channels.splice(index, 1);
    state.channels = normalizeChannels(state.channels);
    await persistChannels();
  }

  state.channelIndex = wrap(Math.min(index, state.channels.length - 1), state.channels.length);
  renderAll();
  tune(state.channelIndex, { force: true });
  setStatus(deletedOnServer ? "频道已从数据库删除。" : "频道已删除，但数据库删除接口不可用。");
}

async function resetConfig() {
  localStorage.removeItem(STORE_KEY);
  const resetChannels = await resetChannelsOnServer();
  state.channels = normalizeChannels(resetChannels.length ? resetChannels : defaultChannelBlueprints.map(hydrateDefaultChannel));
  state.channelIndex = 0;
  localStorage.setItem(STORE_KEY, JSON.stringify(state.channels));
  renderAll();
  tune(0, { force: true });
  setStatus(resetChannels.length ? "已恢复默认频道编排，并写入数据库。" : "已恢复默认频道编排，但数据库接口不可用。");
}

function programsToText(programs) {
  return programs.map((program) => {
    const sourceValue = formatProgramSourceValue(program);
    return `${program.title} | ${program.source} | ${sourceValue} | ${program.duration} | ${program.tags.join(",")} | ${program.skipStart || 0} | ${program.skipEnd || 0}`;
  }).join("\n");
}

function formatProgramSourceValue(program) {
  if (program.source === "bilibili" && program.bvid) {
    const params = new URLSearchParams();
    if (program.page && Number(program.page) !== 1) params.set("p", program.page);
    if (program.cid) params.set("cid", program.cid);
    const suffix = params.toString();
    return suffix ? `${program.bvid}?${suffix}` : program.bvid;
  }
  return program.videoId || program.bvid || program.url;
}

function parseProgramLines(text) {
  return text
    .split(/\n+/)
    .map((line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      if (parts.length < 4) return null;
      const [title, source, sourceValue, duration, tags = "", skipStart = "0", skipEnd = "0"] = parts;
      const program = parseSourceValue(sourceValue, source.toLowerCase());
      if (!program) return null;
      const normalizedDuration = clamp(Number(duration) || 300, 5, 86400);
      const normalizedSkipStart = clamp(Number(skipStart) || 0, 0, normalizedDuration - 1);
      const normalizedSkipEnd = clamp(Number(skipEnd) || 0, 0, normalizedDuration - normalizedSkipStart - 1);
      return {
        ...program,
        id: `admin-${Date.now()}-${index}-${hashText(line)}`,
        title: title || `节目 ${index + 1}`,
        duration: normalizedDuration,
        skipStart: normalizedSkipStart,
        skipEnd: normalizedSkipEnd,
        tags: normalizeList(tags)
      };
    })
    .filter(Boolean);
}

function parseSourceValue(value, preferredSource = "") {
  const source = preferredSource === "b站" ? "bilibili" : preferredSource;

  if (source === "youtube") {
    const videoId = extractYouTubeIdFromText(value) || value;
    return { source: "youtube", videoId };
  }
  if (source === "bilibili") {
    return parseBilibiliSourceValue(value);
  }
  if (source === "direct") return { source: "direct", url: value };
  if (source === "iframe") return { source: "iframe", url: value };
  return parseSource(value);
}

function changeChannel(delta) {
  tune(state.channelIndex + delta);
}

function toggleSidePanel() {
  state.sideHidden = !state.sideHidden;
  el.appShell.classList.toggle("theater-mode", state.sideHidden);
  el.sideToggle.textContent = state.sideHidden ? "显示后台" : "隐藏后台";
  window.setTimeout(() => refreshPlayback({ force: false }), 180);
}

function cycleFilter() {
  const current = filters.findIndex(([className]) => className === state.filter);
  setFilter(filters[wrap(current + 1, filters.length)][0]);
}

function setFilter(className) {
  el.screenWrap.classList.remove(...filters.map(([name]) => name));
  el.screenWrap.classList.add(className);
  state.filter = className;
  renderFilters();
}

function showOsd(channel, program, offset) {
  el.osdChannel.textContent = `第 ${pad(channel.order)} 频道`;
  el.osdTitle.textContent = program?.title || "无节目";
  el.osdMeta.textContent = `${channel.name} / ${sourceLabel(program?.source)} / 已播 ${formatDuration(offset)}${formatSkipText(program)}`;
  el.osd.classList.add("show");
  window.clearTimeout(state.osdTimer);
  state.osdTimer = window.setTimeout(() => el.osd.classList.remove("show"), 2600);
}

function flashStatic() {
  el.screenWrap.classList.add("is-switching", "suppress-player-hover");
  window.clearTimeout(state.staticTimer);
  state.staticTimer = window.setTimeout(() => {
    el.screenWrap.classList.remove("is-switching");
    if (!state.pointerInsideScreen) {
      el.screenWrap.classList.remove("suppress-player-hover");
    }
  }, 1180);
}

function updateProgress(position) {
  const percent = Math.min(100, (position.offset / playableDuration(position.program)) * 100);
  el.clock.textContent = formatDuration(position.offset);
  el.remaining.textContent = formatDuration(position.remaining);
  el.progressBar.style.width = `${percent}%`;
}

async function scoutFromInput() {
  const value = el.sourceInput.value.trim();
  if (!value) {
    await autoScoutForChannel();
    return;
  }

  const parsed = parseSource(value);
  if (parsed) {
    await addProgramsToCurrentChannel([parsed], "已把链接加入当前频道节目表，并保存到数据库。");
    el.sourceInput.value = "";
    return;
  }

  await scoutSources(value);
}

async function appendSourceFromInput() {
  const parsed = parseSource(el.sourceInput.value.trim());
  if (!parsed) {
    setStatus("请粘贴 YouTube、B站、mp4、webm、m3u8 或 iframe 链接。");
    return;
  }
  await addProgramsToCurrentChannel([parsed], "已加入节目表，并保存到数据库。");
  el.sourceInput.value = "";
}

async function importBilibiliListFromInput() {
  const value = el.sourceInput.value.trim();
  if (!value) {
    setStatus("请先粘贴 B站番剧、合集或多 P 视频链接。");
    return;
  }

  el.importBilibiliButton.disabled = true;
  setStatus("正在解析 B站剧集列表...");
  try {
    const result = await importBilibiliList(value);
    if (!result.programs.length) {
      setStatus("没有解析到可导入的 B站节目。请确认链接是番剧、合集或多 P 视频。");
      return;
    }
    await addProgramsToCurrentChannel(
      result.programs,
      `已导入「${result.title || "B站剧集"}」共 ${result.programs.length} 集，并保存到数据库。`
    );
    el.sourceInput.value = "";
  } catch (error) {
    setStatus(`导入失败：${error.message || "请确认已用 server.py 启动，并粘贴正确的 B站链接。"}`);
  } finally {
    el.importBilibiliButton.disabled = false;
  }
}

async function importBilibiliList(url) {
  const response = await fetch(`/api/bilibili/import?url=${encodeURIComponent(url)}`, {
    headers: { Accept: "application/json" }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "服务端解析失败");
  }
  return {
    title: payload.title || "",
    kind: payload.kind || "",
    programs: normalizePrograms(Array.isArray(payload.programs) ? payload.programs : [])
  };
}

async function autoScoutForChannel() {
  const channel = currentChannel();
  const terms = channel.scoutTerms.length ? channel.scoutTerms : channel.tags;
  const query = terms[Math.floor(Math.random() * terms.length)] || channel.name;
  el.sourceInput.value = query;
  await scoutSources(query);
}

async function scoutSources(query) {
  const channel = currentChannel();
  setStatus(`正在为「${channel.name}」搜索：${query}`);
  el.scoutButton.disabled = true;
  el.autoScoutButton.disabled = true;

  let results = await searchViaLocalProxy(query).catch(() => []);
  if (!results.length) {
    const tasks = [
      searchYouTubeViaInvidious(query).catch(() => []),
      searchBilibili(query).catch(() => [])
    ];
    results = (await Promise.all(tasks)).flat();
  }

  const ranked = rankIncomingPrograms(channel, dedupePrograms(results)).slice(0, 7);

  if (!ranked.length) {
    setStatus("本地搜源服务没有返回结果。请确认已用 server.py 启动，或直接粘贴视频链接加入节目表。");
  } else {
    await addProgramsToCurrentChannel(ranked, `找到 ${ranked.length} 个节目源，已加入当前频道节目表并保存到数据库。`);
  }

  el.scoutButton.disabled = false;
  el.autoScoutButton.disabled = false;
}

async function searchViaLocalProxy(query) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload.programs) ? payload.programs : [];
}

async function addProgramsToCurrentChannel(programs, message) {
  const channel = currentChannel();
  channel.programs = dedupePrograms([...channel.programs, ...programs]);
  const saved = await persistChannels();
  renderSchedule();
  renderAdminOptions();
  renderAdminForm();
  refreshPlayback({ force: true });
  setStatus(saved ? message : `${message} 但数据库保存失败，当前仅临时保存在本浏览器。`);
}

function rankIncomingPrograms(channel, programs) {
  return programs
    .map((program) => ({
      ...program,
      tags: program.tags?.length ? program.tags : [...channel.tags],
      score: scoreProgram(channel, program) + seededNoise(`${program.id}-${channel.id}`)
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...program }) => program);
}

function scoreProgram(channel, program) {
  const channelTags = new Set(channel.tags);
  let score = 0;
  (program.tags || []).forEach((tag) => {
    if (channelTags.has(tag)) score += 5;
  });
  if (program.source === "youtube" || program.source === "bilibili") score += 1;
  return score;
}

async function searchYouTubeViaInvidious(query) {
  const endpoints = [
    "https://yewtu.be/api/v1/search",
    "https://inv.nadeko.net/api/v1/search",
    "https://vid.puffyan.us/api/v1/search"
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${endpoint}?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`;
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) continue;
      const data = await response.json();
      const videos = data
        .filter((item) => item.type === "video" && item.videoId)
        .slice(0, 8)
        .map((item) => ({
          id: `yt-${item.videoId}`,
          title: stripHtml(item.title || "YouTube 视频"),
          source: "youtube",
          videoId: item.videoId,
          duration: clamp(Number(item.lengthSeconds) || 300, 45, 1200),
          skipStart: 0,
          skipEnd: 0,
          tags: tokenize(`${query} ${item.title || ""}`)
        }));
      if (videos.length) return videos;
    } catch (error) {
      // 尝试下一个公开实例。
    }
  }
  return [];
}

function searchBilibili(query) {
  return new Promise((resolve) => {
    const callbackName = `__biliScout_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(cleanup, 6500);

    window[callbackName] = (payload) => {
      const list = payload?.data?.result || [];
      const programs = list
        .filter((item) => item.bvid)
        .slice(0, 8)
        .map((item) => ({
          id: `bili-${item.bvid}`,
          title: stripHtml(item.title || "B站视频"),
          source: "bilibili",
          bvid: item.bvid,
          duration: clamp(parseBiliDuration(item.duration), 45, 1200),
          skipStart: 0,
          skipEnd: 0,
          tags: tokenize(`${query} ${item.tag || ""} ${item.author || ""}`)
        }));
      cleanup(programs);
    };

    script.onerror = () => cleanup([]);
    script.src = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${encodeURIComponent(query)}&page=1&callback=${callbackName}`;
    document.head.appendChild(script);

    function cleanup(programs = []) {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
      resolve(programs);
    }
  });
}

function parseSource(value) {
  if (!value) return null;

  const youtubeId = extractYouTubeIdFromText(value);
  if (youtubeId) {
    return {
      id: `custom-yt-${youtubeId}`,
      title: "自定义 YouTube 源",
      source: "youtube",
      videoId: youtubeId,
      duration: 360,
      skipStart: 0,
      skipEnd: 0,
      tags: ["自定义", "YouTube"]
    };
  }

  const bvid = extractBvid(value);
  if (bvid) {
    const bili = parseBilibiliSourceValue(value);
    return {
      ...bili,
      id: `custom-bili-${bvid}`,
      title: "自定义 B站源",
      duration: 360,
      skipStart: 0,
      skipEnd: 0,
      tags: ["自定义", "B站"]
    };
  }

  let url;
  try {
    url = new URL(value);
  } catch (error) {
    return null;
  }

  const pathname = url.pathname.toLowerCase();
  if (/\.(mp4|webm|ogg|m3u8)$/.test(pathname)) {
    return {
      id: `custom-direct-${hashText(value)}`,
      title: url.hostname,
      source: "direct",
      url: value,
      duration: 300,
      skipStart: 0,
      skipEnd: 0,
      tags: ["自定义", "直连"]
    };
  }

  return {
    id: `custom-iframe-${hashText(value)}`,
    title: url.hostname,
    source: "iframe",
    url: value,
    duration: 300,
    skipStart: 0,
    skipEnd: 0,
    tags: ["自定义", "网页"]
  };
}

function parseBilibiliSourceValue(value) {
  const bvid = extractBvid(value) || value.split("?")[0].trim();
  const program = { source: "bilibili", bvid, page: 1, cid: "" };
  try {
    const url = value.startsWith("http") ? new URL(value) : new URL(`https://www.bilibili.com/video/${value}`);
    const p = Number(url.searchParams.get("p"));
    if (p > 0) program.page = p;
    if (url.searchParams.get("cid")) program.cid = url.searchParams.get("cid");
  } catch (error) {
    const query = value.split("?")[1] || "";
    const params = new URLSearchParams(query);
    const p = Number(params.get("p"));
    if (p > 0) program.page = p;
    if (params.get("cid")) program.cid = params.get("cid");
  }
  return program;
}

function extractYouTubeIdFromText(value) {
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) return url.pathname.replace("/", "");
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      const embed = url.pathname.match(/\/embed\/([^/?]+)/);
      if (embed) return embed[1];
      const shorts = url.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
    }
  } catch (error) {
    if (/^[a-zA-Z0-9_-]{8,}$/.test(value)) return value;
  }
  return null;
}

function extractBvid(text) {
  const match = String(text).match(/BV[a-zA-Z0-9]{10}/);
  return match ? match[0] : null;
}

function dedupePrograms(programs) {
  const seen = new Set();
  return programs.filter((program) => {
    const key = program.id || `${program.source}-${program.videoId || program.bvid || program.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || "")
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .slice(0, 12);
}

function parseBiliDuration(value) {
  if (typeof value === "number") return value;
  const parts = String(value || "0").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(value) || 300;
}

function sourceLabel(source) {
  return {
    youtube: "YouTube",
    bilibili: "B站",
    direct: "直连",
    iframe: "网页"
  }[source] || "来源";
}

function setStatus(message) {
  el.sourceStatus.textContent = message;
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
}

function wrap(index, length) {
  return ((index % length) + length) % length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatDuration(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

function pad(value) {
  return String(Math.floor(value)).padStart(2, "0");
}

function hashText(text) {
  let hash = 0;
  for (let i = 0; i < String(text).length; i += 1) {
    hash = (hash << 5) - hash + String(text).charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededNoise(text) {
  return (hashText(text) % 1000) / 1000;
}

function cloneProgram(program) {
  return JSON.parse(JSON.stringify(program));
}

function stripHtml(value) {
  const div = document.createElement("div");
  div.innerHTML = String(value);
  return div.textContent || div.innerText || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

init();
