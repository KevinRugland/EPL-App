/* ════════════════════════════════════════
   KONFIGURASJON — endre her
════════════════════════════════════════ */
const BEDRIFT      = 'Egenes Brannteknikk'; // ← Firmanavn i topbar
const APP_VERSION  = 'v1.0.24';

/* ════════════════════════════════════════
   TILSTAND
════════════════════════════════════════ */
let curStep = 1;
const TOTAL  = 4;
const imgs   = {};
const imgData = {};

/* ════════════════════════════════════════
   INITIALISERING
════════════════════════════════════════ */
document.getElementById('topbarBrand').textContent = BEDRIFT;
document.getElementById('topbarVersion').textContent = APP_VERSION;
document.getElementById('datoOpprettet').valueAsDate = new Date();

// Knytt alle knapper til funksjoner her — ingen onclick i HTML
document.getElementById('btnNext').addEventListener('click', goNext);
document.getElementById('btnBack').addEventListener('click', goBack);
document.getElementById('btnApnePDF').addEventListener('click', showPDF);
document.getElementById('btnNyEPL').addEventListener('click', resetAll);
document.getElementById('btnTilbakeEndringer').addEventListener('click', function() {
  curStep = TOTAL;
  updateUI();
});
document.getElementById('btnPrint').addEventListener('click', doPrint);
document.getElementById('btnLukkPDF').addEventListener('click', hidePDF);
document.getElementById('btnSendEpost').addEventListener('click', oppdaterEpostlenke);

/* ════════════════════════════════════════
   HJELPEFUNKSJONER
════════════════════════════════════════ */
// Hent verdi fra felt
function v(id) {
  const el = document.getElementById(id);
  return el ? (el.value || '').trim() : '';
}

// Vis kort toast-melding
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2800);
}

/* ════════════════════════════════════════
   NAVIGASJON
════════════════════════════════════════ */
function updateUI() {
  // Vis riktig steg
  document.querySelectorAll('.step').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById(curStep <= TOTAL ? 'step' + curStep : 'stepDone').classList.add('active');

  // Oppdater progress og steg-indikator
  const pct = Math.round(Math.max(0, (curStep - 1) / TOTAL * 100));
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('stepInd').textContent = curStep <= TOTAL ? 'Steg ' + curStep + ' av ' + TOTAL : 'Fullført';

  // Oppdater knapper
  document.getElementById('btnBack').disabled = curStep <= 1;
  document.getElementById('btnNext').textContent = curStep === TOTAL ? 'Generer EPL ✓' : 'Neste →';
  document.getElementById('navBar').style.display = curStep > TOTAL ? 'none' : 'block';

  window.scrollTo(0, 0);
}

function goNext() {
  if (curStep === 1 && !validateSteg1()) return;
  if (curStep === 2) byggBildeblokker();
  if (curStep === 3) byggOppsummering();
  if (curStep === TOTAL) {
    byggOppsummering();
    curStep = TOTAL + 1;
    updateUI();
    return;
  }
  curStep++;
  updateUI();
}

function goBack() {
  curStep--;
  updateUI();
}

/* ════════════════════════════════════════
   VALIDERING
════════════════════════════════════════ */
function validateSteg1() {
  const pakrevde = ['tittel', 'lagetAv', 'datoOpprettet'];
  for (let i = 0; i < pakrevde.length; i++) {
    const el = document.getElementById(pakrevde[i]);
    if (!el || !el.value.trim()) {
      if (el) {
        el.focus();
        el.style.borderColor = '#cc1515';
        el.style.boxShadow = '0 0 0 3px rgba(204,21,21,0.15)';
        setTimeout(function() { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2500);
      }
      showToast('Fyll ut alle påkrevde felt');
      return false;
    }
  }
  return true;
}

/* ════════════════════════════════════════
   BILDEBLOKKER
════════════════════════════════════════ */
function byggBildeblokker() {
  const n = parseInt(document.getElementById('antallBilder').value) || 3;
  const container = document.getElementById('imgBlocks');
  container.innerHTML = '';

  for (let i = 1; i <= n; i++) {
    const div = document.createElement('div');
    div.className = 'img-block';
    div.innerHTML = `
      <div class="img-block-head">
        <span class="img-block-num">0${i}</span>
        <span class="img-block-lbl">Steg ${i}</span>
        <span class="img-opt">Valgfritt</span>
      </div>
      <div class="hint-text" style="margin:10px 12px 0;">
        Tips: Ta bildet i <strong>stående (portrett)</strong> orientasjon for best resultat i dokumentet.
      </div>
      <div class="upload-zone" id="zone${i}">
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <label class="btn btn-primary" style="max-width:180px;">
            Ta bilde
            <input type="file" accept="image/*" capture="environment" data-steg="${i}" style="display:none;">
          </label>
          <label class="btn btn-dark" style="max-width:180px;">
            Velg fra galleri
            <input type="file" accept="image/*" data-steg="${i}" style="display:none;">
          </label>
        </div>
      </div>
      <div class="img-caption">
        <label>Instruksjonstekst for steg ${i}</label>
        <textarea id="cap${i}" placeholder="Beskriv hva som skal gjøres...">${imgData['cap'+i] || ''}</textarea>
      </div>`;
    container.appendChild(div);

    // Fil-input lyttere — begge knapper
    div.querySelectorAll('input[type=file]').forEach(function(input) {
      input.addEventListener('change', function() {
        const steg = parseInt(this.dataset.steg);
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) { imgs[steg] = e.target.result; visForhåndsvisning(steg); };
        reader.readAsDataURL(file);
      });
    });

    // Gjenopprett bilde hvis det allerede er lastet opp
    if (imgs[i]) visForhåndsvisning(i);
  }
}

function visForhåndsvisning(n) {
  const zone = document.getElementById('zone' + n);
  if (!zone) return;
  zone.style.cssText = 'margin:0;padding:0;border:none;background:none;';
  zone.innerHTML = `
    <img class="img-preview" src="${imgs[n]}" alt="Bilde ${n}">
    <div class="img-remove" data-fjern="${n}">✕ Fjern bilde</div>`;
  zone.querySelector('.img-remove').addEventListener('click', function() {
    fjernBilde(parseInt(this.dataset.fjern));
  });
}

function fjernBilde(n) {
  imgs[n] = null;
  const zone = document.getElementById('zone' + n);
  zone.style.cssText = '';
  zone.innerHTML = `
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
      <label class="btn btn-primary" style="max-width:180px;">
        Ta bilde
        <input type="file" accept="image/*" capture="environment" data-steg="${n}" style="display:none;">
      </label>
      <label class="btn btn-dark" style="max-width:180px;">
        Velg fra galleri
        <input type="file" accept="image/*" data-steg="${n}" style="display:none;">
      </label>
    </div>`;
  zone.querySelectorAll('input[type=file]').forEach(function(input) {
    input.addEventListener('change', function() {
      const steg = parseInt(this.dataset.steg);
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) { imgs[steg] = e.target.result; visForhåndsvisning(steg); };
      reader.readAsDataURL(file);
    });
  });
}

/* ════════════════════════════════════════
   OPPSUMMERING
════════════════════════════════════════ */
function byggOppsummering() {
  const n = parseInt(document.getElementById('antallBilder').value) || 3;

  // Lagre caption-tekster
  for (let i = 1; i <= n; i++) {
    const el = document.getElementById('cap' + i);
    if (el) imgData['cap' + i] = el.value;
  }

  // Metadatarad
  const rader = [
    ['EPL-nr.', v('eplNr')],
    ['Tittel',  v('tittel')],
    ['Maskin',  v('maskin') || '—'],
    ['Beskrivelse', v('beskrivelse') || '—'],
    ['Laget av', v('lagetAv')],
    ['Dato',    v('datoOpprettet')],
    ['Sign.',   v('signLaget') || '—'],
    ['Send til', v('mottakerEpost')],
    ['Bilder',  String(n)],
  ];
  document.getElementById('summaryMeta').innerHTML =
    rader.map(function(r) { return `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`; }).join('');

  // Bilde-oppsummering
  const imgCont = document.getElementById('summaryImgs');
  imgCont.innerHTML = '';
  let harNoe = false;
  for (let i = 1; i <= n; i++) {
    const cap = imgData['cap' + i] || '';
    if (imgs[i] || cap) {
      harNoe = true;
      imgCont.innerHTML += `
        <div class="summary-img-block">
          <div class="summary-img-lbl">Steg ${i}</div>
          ${imgs[i] ? `<img src="${imgs[i]}" alt="Steg ${i}">` : '<div class="no-img">Ingen bilde</div>'}
          ${cap ? `<div class="summary-img-cap">${cap}</div>` : ''}
        </div>`;
    }
  }
  if (!harNoe) {
    imgCont.innerHTML = '<div class="no-img" style="padding:20px;border:1.5px solid #bbb;border-radius:6px;background:white;">Ingen bilder eller tekst lagt til</div>';
  }
}

/* ════════════════════════════════════════
   EPL-DOKUMENT
════════════════════════════════════════ */
function genererEPL() {
  document.getElementById('eplDocOutput').innerHTML = `
<div class="epl-doc">

  <!-- HEADER -->
  <table class="epl-header-table">
    <colgroup>
      <col class="epl-col-1">
      <col class="epl-col-2">
      <col class="epl-col-3">
      <col class="epl-col-4">
      <col class="epl-col-5">
      <col class="epl-col-6">
    </colgroup>
    <tbody>
      <tr class="epl-header-row-1">
        <td colspan="3" class="epl-title-cell">ETTPUNKTSLEKSJON</td>
        <td colspan="2" class="epl-eplnr-cell">
          <span class="cell-label">EPL.nr</span>
          <span class="cell-val">${v('eplNr')}</span>
        </td>
        <td rowspan="4" class="epl-logo-cell">
          <img src="Egenes_Brannteknikk.png" alt="Logo" class="epl-logo">
        </td>
      </tr>
      <tr class="epl-header-row-2">
        <td class="epl-tittel-cell">
          <span class="cell-label">Tittel:</span>
          <span class="cell-val">${v('tittel')}</span>
        </td>
        <td class="epl-maskin-cell">
          <span class="cell-label">Maskin:</span>
          <span class="cell-val">${v('maskin')}</span>
        </td>
        <td class="epl-revisjon-cell">
          <span class="cell-label">Revisjon:</span>
          <span class="cell-val">${v('revisjon') || 'A'}</span>
        </td>
        <td class="epl-laget-cell">
          <span class="cell-label">Laget av:</span>
          <span class="cell-val">${v('lagetAv')}</span>
        </td>
        <td class="epl-godkjent-cell">
          <span class="cell-label">Godkjent av:</span>
          <span class="cell-val epl-editable">${v('godkjentAv')}</span>
        </td>
      </tr>
      <tr class="epl-header-row-3">
        <td colspan="3" rowspan="2" class="epl-beskrivelse-cell">
          <span class="cell-label">Beskrivelse:</span>
          <span class="cell-val">${v('beskrivelse')}</span>
        </td>
        <td class="epl-dato-cell">
          <span class="cell-label">dato</span>
          <span class="cell-val">${v('datoOpprettet')}</span>
        </td>
        <td class="epl-dato-cell">
          <span class="cell-label">dato</span>
          <span class="cell-val epl-editable">${v('datoGodkjent')}</span>
        </td>
      </tr>
      <tr class="epl-header-row-4">
        <td class="epl-sign-cell">
          <span class="cell-label">sign</span>
          <span class="cell-val">${v('signLaget')}</span>
        </td>
        <td class="epl-sign-cell">
          <span class="cell-label">sign</span>
          <span class="cell-val epl-editable">${v('signGodkjent')}</span>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- INNHOLD: flex: 1 -->
  <div class="epl-content">
    ${[0,1,2].map(i => `
      <div class="epl-img-cell${i === 2 ? ' epl-last-row' : ''}">
        ${imgs[i+1]
          ? `<img src="${imgs[i+1]}" class="epl-bilde" alt="Bilde ${i+1}">`
          : `<span class="epl-ingen-bilde">Ingen bilde</span>`}
      </div>
      <div class="epl-text-cell${i === 2 ? ' epl-last-row' : ''}">
        <span>${imgData['cap' + (i+1)] || ''}</span>
      </div>
    `).join('')}
  </div>

</div>`;
}

/* ════════════════════════════════════════
   E-POST
════════════════════════════════════════ */
function oppdaterEpostlenke() {
  const n = parseInt(v('antallBilder')) || 3;
  const subject = encodeURIComponent('EPL ' + (v('eplNr') ? v('eplNr') + ' – ' : '') + v('tittel'));
  let stegTekst = '';
  for (let i = 1; i <= n; i++) {
    const cap = imgData['cap' + i] || '';
    if (cap) stegTekst += '\nSteg ' + i + ':\n' + cap + '\n';
  }
  const body = encodeURIComponent(
    'Ny Ettpunktsleksjon er registrert og klar for gjennomgang.\n\n' +
    '──────────────────────────────\nEPL-INFORMASJON\n──────────────────────────────\n' +
    (v('eplNr') ? 'EPL-nummer:  ' + v('eplNr') + '\n' : 'EPL-nummer:  (fylles ut av godkjenner)\n') +
    'Tittel:      ' + v('tittel') + '\n' +
    'Maskin:      ' + (v('maskin') || '—') + '\n' +
    'Beskrivelse: ' + (v('beskrivelse') || '—') + '\n\n' +
    'Laget av:    ' + v('lagetAv') + ' (' + (v('signLaget') || '—') + ')\n' +
    'Dato:        ' + v('datoOpprettet') + '\n' +
    'Godkjent av: (fylles ut av godkjenner)\n' +
    '──────────────────────────────\nINSTRUKSJONER\n──────────────────────────────\n' +
    (stegTekst || '(Ingen instruksjonstekst registrert)') +
    '\n──────────────────────────────\n' +
    'Merk: Husk å legge ved PDF-filen i denne e-posten.'
  );
  const el = document.getElementById('btnSendEpost');
  if (el) el.href = 'mailto:?subject=' + subject + '&body=' + body;
}

/* ════════════════════════════════════════
   PDF OG PRINT
════════════════════════════════════════ */
function showPDF() {
  genererEPL();
  oppdaterEpostlenke();
  document.getElementById('pdfScreen').classList.add('visible');
}

function hidePDF() {
  document.getElementById('pdfScreen').classList.remove('visible');
}

function doPrint() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isPWA = window.navigator.standalone === true;

  if (isIOS && isPWA) {
    // PWA på iOS — window.print() fungerer ikke, vis tydelig instruksjon
    document.getElementById('pdfInfoBar').textContent =
      'NB: For å lagre PDF: Trykk "Lukk", åpne siden i Safari og bruk Del-knappen (□↑) → "Skriv ut"';
    document.getElementById('pdfInfoBar').style.background = '#cc1515';
  } else if (isIOS) {
    // Safari på iOS — prøv print, vis instruksjon som backup
    try {
      window.print();
    } catch(e) {}
    document.getElementById('pdfInfoBar').textContent =
      'NB: Hvis utskrift ikke åpnet: Trykk Del-knappen (□↑) → "Skriv ut" → klyp ut på forhåndsvisning';
  } else {
    window.print();
  }
}

/* ════════════════════════════════════════
   NULLSTILL
════════════════════════════════════════ */
function resetAll() {
  curStep = 1;
  ['eplNr','tittel','beskrivelse','lagetAv','signLaget',
   'godkjentAv','signGodkjent'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const maskin = document.getElementById('maskin');
  if (maskin) maskin.selectedIndex = 0;
  const datoG = document.getElementById('datoGodkjent');
  if (datoG) datoG.value = '';
  document.getElementById('datoOpprettet').valueAsDate = new Date();
  document.getElementById('antallBilder').value = '3';
  for (let i = 1; i <= 3; i++) { imgs[i] = null; imgData['cap'+i] = ''; }
  document.getElementById('imgBlocks').innerHTML = '';
  updateUI();
}

/* ════════════════════════════════════════
   START
════════════════════════════════════════ */
updateUI();

// Registrer service worker for PWA / offline-støtte
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').then(function(reg) {
      reg.update();
      console.log('Service worker registrert:', reg.scope);
    }).catch(function(err) {
      console.log('Service worker feilet:', err);
    });
  });
}
