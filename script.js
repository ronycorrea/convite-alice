/* =========================================================
   CONFIGURAÇÕES DO CONVITE — edite aqui
   ========================================================= */
const CONFIG = {
  // Data e hora da festa (fuso de Brasília). Usado na contagem regressiva.
  dataFesta: "2027-01-31T18:00:00-04:00", // horário do Amazonas (UTC-4)

  // Nome usado nas mensagens
  aniversariante: "Jade Helena",

  // Banco de dados (Supabase) que guarda as confirmações de presença.
  // Use a URL do projeto e a chave PÚBLICA (anon ou publishable). Nunca a service_role/secret.
  supabaseUrl: "",
  supabaseKey: "",

  // WhatsApp (opcional): DDI + DDD + número, só dígitos. Ex.: "5597999998888".
  // Se preenchido, depois de confirmar aparece o botão "Avisar também pelo WhatsApp".
  whatsapp: "",

  // Local da festa (o lugar não está cadastrado no Google Maps, por isso usamos as coordenadas)
  localNome: "Local da festa",
  endereco: "Rua do Cauá · Bairro Itamarati",
  coordenadas: "-4.092949156064189,-63.14113510740256",

  // Sugestões de presentes
  presentes: [
    { icone: "🍼", titulo: "Fraldas", detalhe: "Tamanho G" },
    { icone: "👗", titulo: "Roupinhas", detalhe: "Tamanho 1 a 2 anos" },
    { icone: "👟", titulo: "Sapatinhos", detalhe: "Número 21/22" },
    { icone: "🧴", titulo: "Produtos de higiene", detalhe: "Sabonete, shampoo, lenços…" },
    { icone: "🧸", titulo: "Brinquedos educativos", detalhe: "Para a idade de 1 ano" },
  ],

  // Pix: gera o QR Code e o botão "copiar chave". Deixe chave vazia para esconder.
  // ⚠️ EXEMPLO: troque pela chave real (CPF, celular com +55, e-mail ou chave aleatória).
  pix: {
    chave: "chavepix@exemplo.com",
    nome: "Jade Helena", // nome do recebedor (aparece no app do banco)
    cidade: "Coari",     // cidade do recebedor
  },
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
  setTimeout(() => envelope.classList.add("flap-behind"), 950 * t);
  setTimeout(() => envelope.classList.add("letter-out"), 1000 * t);
  setTimeout(() => {
    envScreen.classList.add("gone");
    invite.classList.add("show");
    invite.setAttribute("aria-hidden", "false");
    document.body.classList.remove("locked");
    startParticles();
  }, 2600 * t);
  setTimeout(() => envScreen.remove(), 3600 * t);
});

// pétalas caindo na tela do envelope
if (!reduceMotion) {
  const box = $("#envPetals");
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDuration = 10 + Math.random() * 8 + "s";
    p.style.animationDelay = -Math.random() * 16 + "s";
    p.style.setProperty("--sx", (Math.random() * 160 - 80) + "px");
    p.style.scale = 0.6 + Math.random() * 0.7;
    box.appendChild(p);
  }
}

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
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  const nome = (d.nome || "").trim();
  const err = $("#rsvpError");
  if (!nome) { err.textContent = "Por favor, informe seu nome."; err.hidden = false; form.nome.focus(); return; }
  err.hidden = true;

  const num = (n) => Math.max(0, Math.min(20, parseInt(n, 10) || 0));
  const dados = {
    nome: nome.slice(0, 120),
    adultos: num(d.adultos),
    criancas: num(d.criancas),
    vai: d.resposta === "sim",
    recado: (d.recado || "").trim().slice(0, 500) || null,
  };

  const btn = form.querySelector("button[type=submit]");
  btn.disabled = true;
  const textoOriginal = btn.innerHTML;
  btn.textContent = "Enviando…";
  try {
    var salvouNoBanco = await salvarConfirmacao(dados);
  } catch (falha) {
    console.error(falha);
    err.textContent = "Não foi possível enviar agora. Verifique a internet e tente de novo.";
    err.hidden = false;
    btn.disabled = false; btn.innerHTML = textoOriginal;
    return;
  }
  btn.disabled = false; btn.innerHTML = textoOriginal;

  // mensagem pronta para o WhatsApp (opcional)
  const nomeFesta = `${CONFIG.aniversariante} 1 ano`;
  let msg = dados.vai
    ? `👑 *Confirmação de presença – ${nomeFesta}*\n\nNome: ${dados.nome}\nAdultos: ${dados.adultos}\nCrianças: ${dados.criancas}\n\nEstaremos lá! 🍎`
    : `*${nomeFesta}*\n\nOlá! Aqui é ${dados.nome}. Infelizmente não poderei comparecer. 😢`;
  if (dados.recado) msg += `\n\nRecado: ${dados.recado}`;
  const zap = CONFIG.whatsapp.replace(/\D/g, "");
  const zapBtn = $("#rsvpWhats");
  zapBtn.hidden = !zap;
  if (zap) zapBtn.href = `https://wa.me/${zap}?text=${encodeURIComponent(msg)}`;
  // Sem banco configurado: usa o WhatsApp como antes
  if (!salvouNoBanco) window.open(`https://wa.me/${zap}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");

  $("#rsvpThanksTitle").textContent = dados.vai ? "Presença confirmada!" : "Resposta enviada";
  $("#rsvpThanksText").textContent = dados.vai
    ? "Que alegria! Sua presença foi registrada. Nos vemos na festa! 👑"
    : "Que pena! Obrigado por avisar com carinho. 💛";
  form.hidden = true;
  $("#rsvpThanks").hidden = false;
  if (dados.vai) confetti();
});
$("#rsvpAgain").addEventListener("click", () => {
  form.hidden = false;
  $("#rsvpThanks").hidden = true;
});

/* Grava a confirmação no Supabase (tabela public.confirmacoes) */
async function salvarConfirmacao(dados) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    return false; // banco ainda não configurado
  }
  const resp = await fetch(`${CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/confirmacoes`, {
    method: "POST",
    headers: {
      apikey: CONFIG.supabaseKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(dados),
  });
  if (!resp.ok) throw new Error(`Supabase respondeu HTTP ${resp.status}: ${await resp.text()}`);
  return true;
}

/* ---------- Localização ---------- */
let mapLoaded = false;
$("#locAddress").textContent = CONFIG.endereco;
$("#locTitle").textContent = CONFIG.localNome;
const coords = CONFIG.coordenadas.replace(/\s/g, "");
// Rota automática até as coordenadas: sem "origin", o Google Maps usa a localização atual de quem abriu
$("#gmapsLink").href = `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=driving`;
$("#wazeLink").href = `https://waze.com/ul?ll=${coords}&navigate=yes`;
function loadMap() {
  if (mapLoaded) return;
  mapLoaded = true;
  $("#mapFrame").src = `https://maps.google.com/maps?q=${coords}&z=17&output=embed`;
}

/* ---------- Presentes ---------- */
$("#giftList").innerHTML = CONFIG.presentes
  .map((g, i) => `<li style="animation-delay:${0.08 * i}s"><span class="gi">${g.icone}</span><span>${g.titulo}<small>${g.detalhe}</small></span></li>`)
  .join("");
if (CONFIG.pix && CONFIG.pix.chave) {
  const { chave, nome, cidade } = CONFIG.pix;
  const codigo = pixPayload(chave, nome, cidade);
  $("#pixBox").hidden = false;
  $("#pixKey").textContent = chave;
  if (window.qrcode) {
    const qr = qrcode(0, "M");
    qr.addData(codigo);
    qr.make();
    $("#pixQr").innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  }
  $("#pixCopy").addEventListener("click", () => copy(chave, "Chave Pix copiada! 💝"));
  $("#pixCopyCode").addEventListener("click", () => copy(codigo, "Código Pix copia e cola copiado! 💝"));
}

/* Monta o código Pix (BR Code estático, padrão do Banco Central) */
function pixPayload(chave, nome, cidade) {
  const clean = (s, max) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase().slice(0, max);
  const f = (id, v) => id + String(v.length).padStart(2, "0") + v;
  const conta = f("00", "br.gov.bcb.pix") + f("01", chave.trim());
  let p = f("00", "01") + f("26", conta) + f("52", "0000") + f("53", "986") + f("58", "BR") +
    f("59", clean(nome || "N", 25)) + f("60", clean(cidade || "BRASIL", 15)) + f("62", f("05", "***")) + "6304";
  return p + crc16(p);
}
function crc16(str) {
  let crc = 0xffff;
  for (const b of new TextEncoder().encode(str)) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast(msg); } catch { toast(text); }
    ta.remove();
  }
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
