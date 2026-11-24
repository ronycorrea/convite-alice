/* =========================================================
   CONFIGURAÇÕES DO CONVITE — edite aqui
   ========================================================= */
const CONFIG = {
  // Data e hora da festa (fuso de Brasília). Usado na contagem regressiva.
  dataFesta: "2027-01-15T18:00:00-03:00",

  // WhatsApp que recebe as confirmações: DDI + DDD + número, só dígitos.
  // Ex.: "5511999998888". Se ficar vazio, o WhatsApp abre para a pessoa escolher o contato.
  whatsapp: "",

  // Local da festa
  localNome: "Espaço 7",
  endereco: "[preencher endereço do Espaço 7]",
  // Texto usado para buscar no mapa (de preferência o endereço completo com cidade)
  buscaMapa: "Espaço 7",

  // Sugestões de presentes (provisórias — ajuste à vontade)
  presentes: [
    { icone: "👗", titulo: "Roupinhas", detalhe: "Tamanho [preencher]" },
    { icone: "👟", titulo: "Calçados", detalhe: "Número [preencher]" },
    { icone: "📚", titulo: "Livrinhos infantis", detalhe: "De pano, banho ou cartonados" },
    { icone: "🧸", titulo: "Brinquedos educativos", detalhe: "Para a idade de 1 ano" },
    { icone: "🍼", titulo: "Fraldas", detalhe: "Tamanho [preencher]" },
  ],

  // Chave Pix opcional. Deixe vazio para esconder o botão.
  pix: "",
};

/* ========================================================= */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

document.body.classList.add("locked");

/* ---------- Envelope ---------- */
const envelope = $("#envelope");
const envScreen = $("#envelopeScreen");
const invite = $("#invite");
let opened = false;

envelope.addEventListener("click", async () => {
  if (opened) return;
  opened = true;
  requestTiltPermission();

  const t = reduceMotion ? 0 : 1;
  envelope.classList.add("open");
  setTimeout(() => envelope.classList.add("flap-behind"), 450 * t);
  setTimeout(() => envelope.classList.add("letter-out"), 650 * t);
  setTimeout(() => {
    envScreen.classList.add("gone");
    invite.classList.add("show");
    invite.setAttribute("aria-hidden", "false");
    document.body.classList.remove("locked");
    startParticles();
  }, 1900 * t);
  setTimeout(() => envScreen.remove(), 2900 * t);
});

/* ---------- Encaixar o convite numa tela só (sem rolar) ---------- */
const card = $("#card");
function fitCard() {
  const vw = innerWidth, vh = innerHeight;
  // Tela deitada e larga → layout horizontal; senão → layout vertical (celular)
  const wide = vw >= 800 && vw / vh > 1.15;
  card.classList.toggle("wide", wide);
  const [minW, maxW] = wide ? [1100, 2600] : [380, 900];
  // O cartão ganha a mesma proporção da tela e depois é escalado para caber inteiro
  let W = wide ? 1400 : 480;
  card.style.setProperty("--cw", W + "px");
  let s = Math.min(vw / W, vh / card.offsetHeight);
  for (let i = 0; i < 4; i++) {
    W = Math.min(Math.max(vw / s, minW), maxW);
    card.style.setProperty("--cw", W + "px");
    s = Math.min(vw / W, vh / card.offsetHeight);
  }
  card.style.setProperty("--s", s.toFixed(4));
}
fitCard();
addEventListener("resize", fitCard);
addEventListener("orientationchange", () => setTimeout(fitCard, 250));
if (document.fonts) document.fonts.ready.then(fitCard);
$$("#card img").forEach((img) => img.complete || img.addEventListener("load", fitCard));

/* ---------- Efeito 3D / parallax ---------- */
const root = document.documentElement;
$$("[data-depth]").forEach((el) => el.style.setProperty("--depth", el.dataset.depth));

let target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
function setTarget(x, y) {
  target.x = Math.max(-1, Math.min(1, x));
  target.y = Math.max(-1, Math.min(1, y));
}
window.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch") return;
  setTarget((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
});
function onOrientation(e) {
  if (e.gamma == null) return;
  setTarget(e.gamma / 25, (e.beta - 45) / 25);
}
function requestTiltPermission() {
  if (reduceMotion) return;
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    DOE.requestPermission().then((s) => s === "granted" && addEventListener("deviceorientation", onOrientation)).catch(() => {});
  } else if (DOE) {
    addEventListener("deviceorientation", onOrientation);
  }
}
(function loop() {
  cur.x += (target.x - cur.x) * 0.08;
  cur.y += (target.y - cur.y) * 0.08;
  root.style.setProperty("--mx", cur.x.toFixed(3));
  root.style.setProperty("--my", cur.y.toFixed(3));
  requestAnimationFrame(loop);
})();

/* ---------- Partículas (pétalas + brilhos) ---------- */
function startParticles() {
  if (reduceMotion) return;
  const box = $("#particles");
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = 9 + Math.random() * 8 + "s";
    p.style.animationDelay = -Math.random() * 15 + "s";
    p.style.setProperty("--sx", (Math.random() * 160 - 80) + "px");
    p.style.scale = 0.6 + Math.random() * 0.7;
    box.appendChild(p);
  }
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = -Math.random() * 3 + "s";
    s.style.animationDuration = 2 + Math.random() * 3 + "s";
    box.appendChild(s);
  }
}

/* ---------- Contagem regressiva ---------- */
const cd = $("#countdown");
const festa = new Date(CONFIG.dataFesta).getTime();
const pad = (n) => String(n).padStart(2, "0");
function tick() {
  const diff = festa - Date.now();
  if (isNaN(festa)) { cd.hidden = true; return; }
  if (diff <= 0) {
    cd.classList.add("done");
    cd.textContent = diff > -6 * 3600e3 ? "É hoje! 🍎" : "Obrigado por celebrar com a gente!";
    return;
  }
  const s = Math.floor(diff / 1000);
  $("#cdD").textContent = Math.floor(s / 86400);
  $("#cdH").textContent = pad(Math.floor((s % 86400) / 3600));
  $("#cdM").textContent = pad(Math.floor((s % 3600) / 60));
  $("#cdS").textContent = pad(s % 60);
  setTimeout(tick, 1000);
}
tick();

/* ---------- Modais ---------- */
let lastFocus = null;
function openModal(name) {
  const m = $("#modal-" + name);
  if (!m) return;
  lastFocus = document.activeElement;
  m.hidden = false;
  document.body.classList.add("locked");
  if (name === "location") loadMap();
  setTimeout(() => ($("input, button.modal-close", m) || m).focus(), 50);
}
function closeModal(m) {
  m.hidden = true;
  document.body.classList.remove("locked");
  lastFocus && lastFocus.focus();
}
$$("[data-modal]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.modal)));
$$(".modal").forEach((m) => {
  $$("[data-close]", m).forEach((c) => c.addEventListener("click", () => closeModal(m)));
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const open = $(".modal:not([hidden])");
  if (open) closeModal(open);
});

/* ---------- Confirmar presença ---------- */
const form = $("#rsvpForm");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  const nome = (d.nome || "").trim();
  $("#rsvpError").hidden = !!nome;
  if (!nome) { form.nome.focus(); return; }

  const vai = d.resposta === "sim";
  let msg = vai
    ? `👑 *Confirmação de presença – Alice 1 ano*\n\nNome: ${nome}\nAdultos: ${d.adultos || 0}\nCrianças: ${d.criancas || 0}\n\nEstaremos lá! 🍎`
    : `*Alice 1 ano*\n\nOlá! Aqui é ${nome}. Infelizmente não poderei comparecer. 😢`;
  if (d.recado && d.recado.trim()) msg += `\n\nRecado: ${d.recado.trim()}`;

  const num = CONFIG.whatsapp.replace(/\D/g, "");
  const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener");

  form.hidden = true;
  $("#rsvpThanks").hidden = false;
  if (vai) confetti();
});
$("#rsvpAgain").addEventListener("click", () => {
  form.hidden = false;
  $("#rsvpThanks").hidden = true;
});

/* ---------- Localização ---------- */
let mapLoaded = false;
$("#locAddress").textContent = CONFIG.endereco;
$("#locTitle").textContent = CONFIG.localNome;
const q = encodeURIComponent(CONFIG.buscaMapa);
$("#gmapsLink").href = `https://www.google.com/maps/search/?api=1&query=${q}`;
$("#wazeLink").href = `https://waze.com/ul?q=${q}&navigate=yes`;
function loadMap() {
  if (mapLoaded) return;
  mapLoaded = true;
  $("#mapFrame").src = `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
}

/* ---------- Presentes ---------- */
$("#giftList").innerHTML = CONFIG.presentes
  .map((g, i) => `<li style="animation-delay:${0.08 * i}s"><span class="gi">${g.icone}</span><span>${g.titulo}<small>${g.detalhe}</small></span></li>`)
  .join("");
if (CONFIG.pix) {
  $("#pixBox").hidden = false;
  $("#pixCopy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(CONFIG.pix); toast("Chave Pix copiada! 💝"); }
    catch { toast("Chave Pix: " + CONFIG.pix); }
  });
}

/* ---------- Utilidades ---------- */
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}
function confetti() {
  if (reduceMotion) return;
  const colors = ["#d4202c", "#f0c75a", "#1f6fb5", "#ffffff", "#9be15d"];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.setProperty("--cx", Math.random() * 200 - 100 + "px");
    c.style.setProperty("--cr", Math.random() * 1080 + "deg");
    c.style.animationDelay = Math.random() * 0.5 + "s";
    c.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

// Atalho: abrir direto o convite com #aberto no fim do link (útil para testes)
if (location.hash === "#aberto") { envelope.click(); }
