const CONFIG = {
  unlockTime: "2026-08-16T00:00:00+08:00",
  minVisitDate: "2026-08-16",
  herName: "晨晨",
  myName: "hrh",
  storageKey: "our-august-16-invitation",
};

function applyConfigPlaceholders() {
  const replacements = {
    "{她的称呼}": CONFIG.herName,
    "{你的署名}": CONFIG.myName,
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    let content = node.nodeValue;

    Object.entries(replacements).forEach(([placeholder, value]) => {
      content = content.replaceAll(placeholder, value);
    });

    node.nodeValue = content;
  });
}

applyConfigPlaceholders();

const elements = {
  canvas: document.querySelector("#ocean-canvas"),
  countdownScreen: document.querySelector("#countdown-screen"),
  celebrationSite: document.querySelector("#celebration-site"),
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
  previewButton: document.querySelector("#preview-button"),
  soundButton: document.querySelector("#sound-button"),
  catBgmToggle: document.querySelector("#cat-bgm-toggle"),
  music: document.querySelector("#background-music"),
  funnyMusic: document.querySelector("#funny-music"),
  dateForm: document.querySelector("#date-form"),
  visitDate: document.querySelector("#visit-date"),
  openEnvelope: document.querySelector("#open-envelope"),
  formMessage: document.querySelector("#form-message"),
  envelope: document.querySelector("#envelope"),
  ticketSection: document.querySelector("#ticket-section"),
  ticketDate: document.querySelector("#ticket-date"),
  ticketNumber: document.querySelector("#ticket-number"),
  ticket: document.querySelector("#ticket"),
  acceptAndDownload: document.querySelector("#accept-and-download"),
  changeDate: document.querySelector("#change-date"),
  ticketStatusCopy: document.querySelector("#ticket-status-copy"),
  toast: document.querySelector("#toast"),
};

const unlockTimestamp = new Date(CONFIG.unlockTime).getTime();
const isLocalhost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const previewMode = new URLSearchParams(window.location.search).get("preview");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let countdownTimer = null;
let toastTimer = null;
let isUnlocked = false;
let audioWanted = true;
let activeMusicMode = "romantic";
let currentPageId = "hero";
let isProgrammaticNavigation = false;

if (isLocalhost) {
  document.body.classList.add("local-preview");
}

elements.visitDate.min = CONFIG.minVisitDate;

function pad(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function updateCountdown() {
  const remaining = unlockTimestamp - Date.now();

  if (remaining <= 0) {
    elements.days.textContent = "00";
    elements.hours.textContent = "00";
    elements.minutes.textContent = "00";
    elements.seconds.textContent = "00";
    clearInterval(countdownTimer);
    unlockExperience(true);
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  elements.days.textContent = pad(days);
  elements.hours.textContent = pad(hours);
  elements.minutes.textContent = pad(minutes);
  elements.seconds.textContent = pad(seconds);
}

function unlockExperience(animate = false) {
  if (isUnlocked) return;
  isUnlocked = true;

  if (animate && !prefersReducedMotion) {
    document.body.classList.add("is-unlocking");
    window.setTimeout(showCelebration, 1200);
  } else {
    showCelebration();
  }
}

function showCelebration() {
  document.body.classList.remove("is-unlocking");
  document.body.classList.add("page-mode");
  elements.celebrationSite.classList.add("page-mode");
  elements.countdownScreen.hidden = true;
  elements.celebrationSite.hidden = false;
  restoreInvitation();
  setupObservers();
  navigateTo("hero", false);

  if (previewMode === "ticket") {
    const previewDate = "2026-08-20";
    document.body.classList.add("ticket-preview-mode");
    elements.visitDate.value = previewDate;
    elements.openEnvelope.disabled = false;
    updateTicket(previewDate);
    elements.envelope.classList.add("is-open");
    elements.ticketSection.hidden = false;
    elements.ticketSection.classList.add("is-visible");
    navigateTo("ticket-section", false);
  }
}

function navigateTo(pageId, animate = true) {
  const target = document.querySelector(`#${pageId}`);
  if (!target) return;

  isProgrammaticNavigation = true;
  document.querySelectorAll(".celebration-site > section").forEach((section) => {
    section.classList.toggle("is-current-page", section === target);
  });
  target.classList.add("is-visible");
  target.scrollTop = 0;
  currentPageId = pageId;
  window.scrollTo({ top: 0, behavior: "instant" });

  if (animate && !prefersReducedMotion) {
    target.animate(
      [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }

  requestAnimationFrame(() => {
    isProgrammaticNavigation = false;
  });
}

function attemptAutoplay() {
  if (!audioWanted) return;
  const activeAudio = getActiveAudio();
  activeAudio.volume = activeMusicMode === "funny" ? 0.48 : 0.38;
  activeAudio
    .play()
    .then(() => updateSoundButton(true))
    .catch(() => updateSoundButton(false));
}

function getActiveAudio() {
  return activeMusicMode === "funny" ? elements.funnyMusic : elements.music;
}

function updateSoundButton(isPlaying) {
  elements.soundButton.classList.toggle("is-playing", isPlaying);
  elements.soundButton.setAttribute("aria-label", isPlaying ? "暂停音乐" : "播放音乐");
  elements.soundButton.title = isPlaying ? "暂停音乐" : "播放音乐";
}

function toggleMusic() {
  const activeAudio = getActiveAudio();
  if (activeAudio.paused) {
    audioWanted = true;
    activeAudio
      .play()
      .then(() => updateSoundButton(true))
      .catch(() => showToast("音乐文件暂未放入，页面其他内容不受影响。"));
  } else {
    audioWanted = false;
    elements.music.pause();
    elements.funnyMusic.pause();
    updateSoundButton(false);
  }
}

function switchMusicMode() {
  const wasPlaying = !getActiveAudio().paused;
  elements.music.pause();
  elements.funnyMusic.pause();
  activeMusicMode = activeMusicMode === "romantic" ? "funny" : "romantic";
  elements.catBgmToggle.classList.toggle("is-funny", activeMusicMode === "funny");
  elements.catBgmToggle.setAttribute(
    "aria-label",
    activeMusicMode === "funny" ? "切回纪念日音乐" : "切换搞怪音乐",
  );

  if (!wasPlaying && !audioWanted) {
    updateSoundButton(false);
    showToast(activeMusicMode === "funny" ? "搞怪音乐已准备好，点音乐按钮播放" : "纪念日音乐已切回");
    return;
  }

  audioWanted = true;
  attemptAutoplay();
  showToast(activeMusicMode === "funny" ? "哈基哈基米！" : "浪漫 BGM 回来了");
}

function setupCatInteraction() {
  elements.catBgmToggle.addEventListener("click", () => {
    elements.catBgmToggle.classList.remove("is-clicked");
    requestAnimationFrame(() => elements.catBgmToggle.classList.add("is-clicked"));
    switchMusicMode();
  });

  elements.catBgmToggle.addEventListener("animationend", () => {
    elements.catBgmToggle.classList.remove("is-clicked");
  });

}

function setupObservers() {
  const observedSections = document.querySelectorAll(".section-observe");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.16 },
  );

  observedSections.forEach((section) => observer.observe(section));
}

function validateDate(value) {
  if (!value) return "请先选一个我们出发的日子。";
  if (value < CONFIG.minVisitDate) return "约会日期要从 2026 年 8 月 16 日开始哦。";
  return "";
}

function formatDate(value, separator = ".") {
  const [year, month, day] = value.split("-");
  return [year, month, day].join(separator);
}

function ticketNumber(value) {
  return `LOVE-${value.replaceAll("-", "")}`;
}

function updateTicket(value) {
  elements.ticketDate.textContent = formatDate(value);
  elements.ticketNumber.textContent = ticketNumber(value);
}

function revealTicket(value, scroll = true) {
  updateTicket(value);
  elements.envelope.classList.add("is-open");

  window.setTimeout(
    () => {
      elements.ticketSection.hidden = false;
      requestAnimationFrame(() => elements.ticketSection.classList.add("is-visible"));
      if (scroll) {
        navigateTo("ticket-section");
      }
    },
    prefersReducedMotion ? 0 : 1500,
  );
}

function readSavedState() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {};
  } catch {
    return {};
  }
}

function saveState(patch) {
  const state = { ...readSavedState(), ...patch };
  localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
}

function restoreInvitation() {
  const state = readSavedState();
  if (!state.visitDate || validateDate(state.visitDate)) return;

  elements.visitDate.value = state.visitDate;
  elements.openEnvelope.disabled = false;
}

function markAccepted(celebrate = true) {
  elements.ticket.classList.add("is-accepted");
  elements.ticketStatusCopy.textContent = "约定成立。下一站，是我们一起去看的海。";
  elements.acceptAndDownload.textContent = "已确认赴约，再次下载纪念票";

  if (celebrate) {
    particleField.celebrate();
    showToast("赴约成功，这份约定已经被好好收下。");
  }
}

function changeDate() {
  elements.ticketSection.hidden = true;
  elements.ticketSection.classList.remove("is-visible");
  elements.envelope.classList.remove("is-open");
  elements.ticket.classList.remove("is-accepted");
  elements.acceptAndDownload.textContent = "确认赴约并下载纪念票";
  elements.ticketStatusCopy.textContent = "这是一张只属于我们两个人的纪念邀请券。";
  saveState({ accepted: false });
  navigateTo("invitation");
  window.setTimeout(() => elements.visitDate.focus(), 500);
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawDownloadTicket() {
  const canvas = document.createElement("canvas");
  const width = 1800;
  const height = 920;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const selectedDate = elements.visitDate.value;

  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#0b3158");
  background.addColorStop(1, "#071b35");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  for (let index = 0; index < 34; index += 1) {
    const x = (index * 263) % width;
    const y = (index * 149) % height;
    const radius = 3 + ((index * 7) % 18);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const ticketX = 100;
  const ticketY = 110;
  const ticketWidth = 1600;
  const ticketHeight = 700;
  const stubWidth = 265;

  roundedRect(ctx, ticketX, ticketY, ticketWidth, ticketHeight, 18);
  ctx.fillStyle = "#fffaf5";
  ctx.fill();
  ctx.save();
  roundedRect(ctx, ticketX, ticketY, ticketWidth, ticketHeight, 18);
  ctx.clip();
  ctx.fillStyle = "#c96787";
  ctx.fillRect(ticketX + ticketWidth - stubWidth, ticketY, stubWidth, ticketHeight);

  const glow = ctx.createRadialGradient(1280, 210, 20, 1280, 210, 340);
  glow.addColorStop(0, "rgba(240,138,170,0.25)");
  glow.addColorStop(1, "rgba(240,138,170,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(ticketX, ticketY, ticketWidth - stubWidth, ticketHeight);
  ctx.restore();

  ctx.fillStyle = "#9c6175";
  ctx.font = "24px Georgia";
  ctx.fillText("OUR SIXTH ANNIVERSARY", 175, 190);

  ctx.fillStyle = "#153e57";
  ctx.font = '56px Georgia, "Microsoft YaHei"';
  ctx.fillText("海洋约会纪念邀请券", 175, 265);

  ctx.fillStyle = "#c06182";
  ctx.font = '36px Georgia, "Microsoft YaHei"';
  ctx.fillText("珠海 · 长隆海洋王国", 175, 450);

  ctx.fillStyle = "#5e7480";
  ctx.font = '28px Georgia, "Microsoft YaHei"';
  ctx.fillText(`邀请 ${CONFIG.herName} 与 ${CONFIG.myName}，一起去看鲸鲨、企鹅和海。`, 175, 510);

  ctx.strokeStyle = "rgba(21,62,87,0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(175, 568);
  ctx.lineTo(1365, 568);
  ctx.stroke();

  const detailColumns = [
    ["DATE", formatDate(selectedDate), 175],
    ["GUESTS", "2 PERSONS", 565],
    ["PASS NO.", ticketNumber(selectedDate), 900],
  ];

  detailColumns.forEach(([label, value, x]) => {
    ctx.fillStyle = "#9c6175";
    ctx.font = "20px Georgia";
    ctx.fillText(label, x, 625);
    ctx.fillStyle = "#153e57";
    ctx.font = "29px Georgia";
    ctx.fillText(value, x, 675);
  });

  ctx.fillStyle = "rgba(21,62,87,0.58)";
  ctx.font = '18px "Microsoft YaHei"';
  ctx.fillText("非官方票务 · 仅作六周年纪念与约会邀请", 175, 758);

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.setLineDash([10, 12]);
  ctx.beginPath();
  ctx.moveTo(1435, ticketY);
  ctx.lineTo(1435, ticketY + ticketHeight);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.save();
  ctx.translate(1568, 246);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "22px Georgia";
  ctx.fillText("ADMIT TWO", 0, 0);
  ctx.restore();

  ctx.fillStyle = "#fff8f1";
  ctx.font = "82px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("6TH", 1568, 490);
  ctx.textAlign = "start";

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "22px Georgia";
  ctx.fillText("WITH LOVE", 1505, 715);

  const link = document.createElement("a");
  link.download = `六周年海洋约会纪念票-${selectedDate}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("纪念票已经生成，可以保存下来啦。");
}

class OceanParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.bursts = [];
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener("resize", () => this.resize());
    if (!prefersReducedMotion) this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.createParticles();
    if (prefersReducedMotion) this.draw();
  }

  createParticles() {
    const count = Math.min(72, Math.floor(this.width / 18));
    this.particles = Array.from({ length: count }, (_, index) => ({
      x: (index * 173.3) % this.width,
      y: (index * 97.7) % this.height,
      size: 3 + ((index * 11) % 14),
      speed: 0.12 + ((index * 3) % 8) / 18,
      sway: 0.4 + ((index * 5) % 10) / 10,
      phase: index * 0.7,
      type: index % 9 === 0 ? "heart" : "bubble",
      alpha: 0.12 + ((index * 7) % 22) / 100,
    }));
  }

  heart(x, y, size, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 22, size / 22);
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.bezierCurveTo(-17, -4, -10, -17, 0, -8);
    ctx.bezierCurveTo(10, -17, 17, -4, 0, 7);
    ctx.fillStyle = `rgba(255, 170, 195, ${alpha})`;
    ctx.fill();
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.particles.forEach((particle) => {
      if (particle.type === "heart") {
        this.heart(particle.x, particle.y, particle.size * 1.4, particle.alpha);
        return;
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(225, 248, 255, ${particle.alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(
        particle.x - particle.size * 0.3,
        particle.y - particle.size * 0.3,
        Math.max(1, particle.size * 0.14),
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha * 1.7})`;
      ctx.fill();
    });

    this.bursts.forEach((particle) => {
      this.heart(particle.x, particle.y, particle.size, particle.life);
    });
  }

  animate(time = 0) {
    this.particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += Math.sin(time / 1500 + particle.phase) * particle.sway * 0.08;
      if (particle.y < -30) {
        particle.y = this.height + 30;
        particle.x = Math.random() * this.width;
      }
    });

    this.bursts.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.018;
      particle.life -= 0.008;
    });
    this.bursts = this.bursts.filter((particle) => particle.life > 0);

    this.draw();
    requestAnimationFrame((nextTime) => this.animate(nextTime));
  }

  celebrate() {
    const originX = this.width * 0.72;
    const originY = this.height * 0.55;
    for (let index = 0; index < 42; index += 1) {
      const angle = (Math.PI * 2 * index) / 42;
      const speed = 1.4 + (index % 7) * 0.25;
      this.bursts.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        size: 9 + (index % 5) * 2,
        life: 0.8,
      });
    }
  }
}

const particleField = new OceanParticleField(elements.canvas);

elements.soundButton.addEventListener("click", toggleMusic);
setupCatInteraction();
elements.previewButton.addEventListener("click", () => unlockExperience(false));

document.querySelectorAll("[data-scroll-to]").forEach((button) => {
  button.addEventListener("click", () => {
    navigateTo(button.dataset.scrollTo);
  });
});

elements.visitDate.addEventListener("input", () => {
  const message = validateDate(elements.visitDate.value);
  elements.formMessage.textContent = message;
  elements.openEnvelope.disabled = Boolean(message);
});

elements.dateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = elements.visitDate.value;
  const message = validateDate(value);

  elements.formMessage.textContent = message;
  if (message) return;

  elements.openEnvelope.disabled = true;
  saveState({ visitDate: value, accepted: false });
  revealTicket(value);
  window.setTimeout(() => {
    elements.openEnvelope.disabled = false;
  }, 1900);
});

elements.acceptAndDownload.addEventListener("click", () => {
  const wasAccepted = elements.ticket.classList.contains("is-accepted");
  saveState({ accepted: true });
  if (!wasAccepted) markAccepted(true);
  drawDownloadTicket();
});

elements.changeDate.addEventListener("click", changeDate);

window.addEventListener(
  "wheel",
  (event) => {
    if (isUnlocked) event.preventDefault();
  },
  { passive: false },
);

window.addEventListener("scroll", () => {
  if (!isUnlocked || isProgrammaticNavigation) return;
  if (window.scrollY !== 0) window.scrollTo(0, 0);
});

document.addEventListener("keydown", (event) => {
  if (!isUnlocked) return;
  if (["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
    event.preventDefault();
  }
});

document.addEventListener(
  "pointerdown",
  () => {
    if (audioWanted && getActiveAudio().paused) attemptAutoplay();
  },
  { once: true },
);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !isUnlocked) updateCountdown();
});

if (previewMode) {
  unlockExperience(false);
} else if (Date.now() >= unlockTimestamp) {
  unlockExperience(false);
} else {
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);
}

attemptAutoplay();
