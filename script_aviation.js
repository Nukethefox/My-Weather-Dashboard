document.addEventListener('DOMContentLoaded', () => {
  const tafInput = document.getElementById('taf-input');
  const tafBtn = document.getElementById('taf-btn');
  const tafDisplay = document.getElementById('taf-display');
  let lastTafTimestamp = null;

  async function fetchTafData() {
    const rawInput = tafInput.value.trim().toUpperCase();
    if (!rawInput) return;

    const icaos = rawInput.replace(/\s+/g, '');
    tafBtn.disabled = true;
    tafBtn.textContent = 'Consultando...';

    try {
      const targetUrl = `https://aviationweather.gov/api/data/taf?ids=${icaos}&format=json`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const parsed = await response.json();

      if (!Array.isArray(parsed) || parsed.length === 0) {
        alert('No se encontraron datos TAF para los códigos ICAO indicados.');
        return;
      }

      renderTafCards(parsed);
    } catch (error) {
      alert('Error al consultar TAF: ' + error.message);
    } finally {
      tafBtn.disabled = false;
      tafBtn.textContent = 'Consultar TAF';
    }
  }

  function formatUtcTimestamp(seconds) {
    if (!seconds) return '--:--';
    const d = new Date(seconds * 1000);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${hours}:${mins}Z`;
  }

  function decodeWxString(rawWx) {
    if (!rawWx) return '';

    const intensityMap = {
      '-': 'ligera',
      '+': 'fuerte',
      'VC': 'en las proximidades',
      'RE': 'reciente'
    };

    const descriptorMap = {
      'FZ': 'congelante',
      'TS': 'tormenta',
      'SH': 'chubasco',
      'BL': 'alto por el viento',
      'DR': 'bajo por el viento',
      'PR': 'parcial',
      'BC': 'bancos de',
      'MI': 'bajo'
    };

    const weatherMap = {
      'DZ': 'llovizna',
      'RA': 'lluvia',
      'SN': 'nieve',
      'SG': 'cinarra',
      'PL': 'hielo granulado',
      'GR': 'granizo',
      'GS': 'granizo pequeño',
      'BR': 'neblina',
      'FG': 'niebla',
      'FU': 'humo',
      'VA': 'ceniza volcánica',
      'DU': 'polvo',
      'SA': 'arena',
      'HZ': 'calima',
      'PO': 'remolinos de polvo',
      'SQ': 'turbonada',
      'FC': 'tromba/tornado',
      'SS': 'tormenta de arena',
      'DS': 'tormenta de polvo'
    };

    const tokens = rawWx.trim().split(/\s+/);
    const decodedTokens = tokens.map(token => {
      let str = token;
      let intensity = '';

      if (str.startsWith('-')) {
        intensity = intensityMap['-'];
        str = str.slice(1);
      } else if (str.startsWith('+')) {
        intensity = intensityMap['+'];
        str = str.slice(1);
      } else if (str.startsWith('RE')) {
        intensity = intensityMap['RE'];
        str = str.slice(2);
      } else if (str.startsWith('VC')) {
        intensity = intensityMap['VC'];
        str = str.slice(2);
      }

      let descriptors = [];
      let foundDescriptor = true;
      while (foundDescriptor && str.length >= 2) {
        let code = str.slice(0, 2);
        if (descriptorMap[code]) {
          descriptors.push(descriptorMap[code]);
          str = str.slice(2);
        } else {
          foundDescriptor = false;
        }
      }

      let phenomena = [];
      let foundPhenomenon = true;
      while (foundPhenomenon && str.length >= 2) {
        let code = str.slice(0, 2);
        if (weatherMap[code]) {
          phenomena.push(weatherMap[code]);
          str = str.slice(2);
        } else {
          foundPhenomenon = false;
        }
      }

      let parts = [];
      if (descriptors.length > 0) parts.push(descriptors.join(' '));
      if (phenomena.length > 0) parts.push(phenomena.join(' '));
      if (intensity) parts.push(intensity);

      const translated = parts.length > 0 ? parts.join(' ') : token;
      return `${token} (${translated.charAt(0).toUpperCase() + translated.slice(1)})`;
    });

    return decodedTokens.join(' ');
  }

  function renderTafCards(reports) {
    tafDisplay.innerHTML = '';

    const coverTranslations = {
      'FEW': 'Pocas nubes (FEW)',
      'SCT': 'Nubes dispersas (SCT)',
      'BKN': 'Nubes casi enteras (BKN)',
      'OVC': 'Cubierto (OVC)',
      'NSC': 'Sin nubes significativas (NSC)',
      'SKC': 'Cielo despejado (SKC)'
    };

    reports.forEach(report => {
      const validFromStr = formatUtcTimestamp(report.validTimeFrom);
      const validToStr = formatUtcTimestamp(report.validTimeTo);

      if (!report.fcsts || report.fcsts.length === 0) return;

      const baseFcst = report.fcsts[0];
      const startHourTimestamp = report.validTimeFrom;
      const endHourTimestamp = report.validTimeTo;

      const hourlyData = [];
      let currentTs = startHourTimestamp;

      while (currentTs <= endHourTimestamp) {
        const hourEndTs = currentTs + 3600;

        let activeBase = { ...baseFcst };
        const activeChanges = [];

        for (let i = 1; i < report.fcsts.length; i++) {
          const fc = report.fcsts[i];

          if (fc.timeFrom <= currentTs && fc.timeTo >= currentTs) {
            activeChanges.push(fc);
          }
        }

        hourlyData.push({
          timestamp: currentTs,
          base: activeBase,
          changes: activeChanges
        });

        currentTs += 3600;
      }

      function parseTxTn(raw) {
        if (!raw) return { tx: null, tn: null };
        const txMatch = raw.match(/TX(\d{2})\/(\d{2})(\d{2})Z/);
        const tnMatch = raw.match(/TN(\d{2})\/(\d{2})(\d{2})Z/);
        return {
          tx: txMatch ? `${txMatch[1]}°C (${txMatch[2]} ${txMatch[3]}:00Z)` : null,
          tn: tnMatch ? `${tnMatch[1]}°C (${tnMatch[2]} ${tnMatch[3]}:00Z)` : null
        };
      }

      function formatWindObj(wdir, wspd, wgst) {
        if (wdir === null || wdir === undefined) return '--';
        const wdirStr = wdir === 'VRB' ? 'VRB' : `${wdir}°`;
        if (wspd === null || wspd === undefined) return wdirStr;
        const wspdKmh = Math.round(wspd * 1.852);
        const wgstStr = wgst ? ` G${wgst}kt` : '';
        const wgstKmhStr = wgst ? ` G${Math.round(wgst * 1.852)}km/h` : '';
        return `${wdirStr} ${wspd}kt (${wspdKmh}km/h)${wgstStr ? ` / G${wgst}kt (${wgstKmhStr.trim()})` : ''}`;
      }

      function parseVisibVal(v) {
        if (!v) return 9999;
        if (v === '6+') return 10000;
        const vMiles = parseFloat(v);
        return !isNaN(vMiles) ? vMiles * 1.60934 * 1000 : 9999;
      }

      function formatVisibVal(v) {
        if (!v) return '--';
        if (v === '6+' || parseVisibVal(v) >= 10000) return '>10 km';
        const vMiles = parseFloat(v);
        return !isNaN(vMiles) ? `${(vMiles * 1.60934).toFixed(1)} km` : `${v}`;
      }

      function formatCloudsArr(clouds) {
        if (!clouds || clouds.length === 0) return 'NSC / CAVOK';
        return clouds.map(c => {
          const trans = coverTranslations[c.cover] || c.cover;
          const baseStr = c.base ? ` ${c.base}ft` : '';
          let typeStr = '';
          if (c.type === 'CB') {
            typeStr = ' <strong class="cloud-type-badge cb"> Cumulonimbos</strong>';
          } else if (c.type === 'TCU') {
            typeStr = ' <strong class="cloud-type-badge tcu"> Torrecúmulos</strong>';
          }
          return `${trans}${baseStr}${typeStr}`;
        }).join('<br>');
      }

      let headerRow = '<th class="cell-label">Hora UTC</th>';
      let windRow = '<tr><td class="cell-label">Viento</td>';
      let visibRow = '<tr><td class="cell-label">Visibilidad</td>';
      let cloudsRow = '<tr><td class="cell-label">Nubes</td>';
      let wxRow = '<tr><td class="cell-label">Fenómenos</td>';

      hourlyData.forEach(item => {
        const dateObj = new Date(item.timestamp * 1000);
        const day = String(dateObj.getUTCDate()).padStart(2, '0');
        const hour = String(dateObj.getUTCHours()).padStart(2, '0');

        headerRow += `<th>${day}/${hour}Z</th>`;

        let effWind = formatWindObj(item.base.wdir, item.base.wspd, item.base.wgst);
        let windClass = '';
        
        for (let ch of item.changes) {
          if (ch.wdir !== null && ch.wdir !== undefined) {
            const chWind = formatWindObj(ch.wdir, ch.wspd, ch.wgst);
            if (chWind !== formatWindObj(item.base.wdir, item.base.wspd, item.base.wgst)) {
              effWind = chWind;
              const idx = report.fcsts.indexOf(ch) - 1;
              windClass = `change-color-${idx >= 0 ? idx % 6 : 0}`;
            }
          }
        }

        let minVisVal = parseVisibVal(item.base.visib);
        let effVisStr = formatVisibVal(item.base.visib);
        let visClass = '';

        item.changes.forEach(ch => {
          if (ch.visib) {
            const val = parseVisibVal(ch.visib);
            if (val < minVisVal) {
              minVisVal = val;
              effVisStr = formatVisibVal(ch.visib);
              const idx = report.fcsts.indexOf(ch) - 1;
              visClass = `change-color-${idx >= 0 ? idx % 6 : 0}`;
            }
          }
        });

        let effCloudsStr = formatCloudsArr(item.base.clouds);
        let cloudsClass = '';

        item.changes.forEach(ch => {
          if (ch.clouds && ch.clouds.length > 0) {
            const chCloudStr = formatCloudsArr(ch.clouds);
            if (chCloudStr !== formatCloudsArr(item.base.clouds)) {
              effCloudsStr = chCloudStr;
              const idx = report.fcsts.indexOf(ch) - 1;
              cloudsClass = `change-color-${idx >= 0 ? idx % 6 : 0}`;
            }
          }
        });

        let wxItems = [];
        if (item.base.wxString) {
          wxItems.push({ text: decodeWxString(item.base.wxString), css: '' });
        }
        item.changes.forEach(ch => {
          if (ch.wxString) {
            const idx = report.fcsts.indexOf(ch) - 1;
            const probStr = ch.probability ? `PROB${ch.probability} ` : '';
            const type = ch.fcstChange || 'TEMPO';
            const tag = `${probStr}${type}`;
            const colorClass = `change-color-${idx >= 0 ? idx % 6 : 0}`;
            wxItems.push({
              text: `<div class="cell-change ${colorClass}"><span class="change-tag">${tag}</span>${decodeWxString(ch.wxString)}</div>`,
              css: ''
            });
          }
        });

        const windHtml = windClass ? `<div class="cell-change ${windClass}">${effWind}</div>` : effWind;
        const visHtml = visClass ? `<div class="cell-change ${visClass}">${effVisStr}</div>` : effVisStr;
        const cloudsHtml = cloudsClass ? `<div class="cell-change ${cloudsClass}">${effCloudsStr}</div>` : effCloudsStr;
        const wxHtml = wxItems.length > 0 ? wxItems.map(i => i.text).join('') : '--';

        windRow += `<td>${windHtml}</td>`;
        visibRow += `<td>${visHtml}</td>`;
        cloudsRow += `<td>${cloudsHtml}</td>`;
        wxRow += `<td>${wxHtml}</td>`;
      });

      windRow += '</tr>';
      visibRow += '</tr>';
      cloudsRow += '</tr>';
      wxRow += '</tr>';

      const temps = parseTxTn(report.rawTAF);
      let tempHtml = '';
      if (temps.tx || temps.tn) {
        tempHtml = `<div class="taf-temps">`;
        if (temps.tx) tempHtml += `<span class="temp-max">🔥 Máx: ${temps.tx}</span>`;
        if (temps.tn) tempHtml += `<span class="temp-min">❄️ Mín: ${temps.tn}</span>`;
        tempHtml += `</div>`;
      }

      const card = document.createElement('div');
      card.className = 'taf-card';
      card.innerHTML = `
        <div class="taf-header">
          <div class="taf-title">
            <h3>${report.icaoId} - ${report.name || 'Aeropuerto'}</h3>
            <span>Elevación: ${report.elev || 0} m | Lat: ${report.lat}, Lon: ${report.lon}</span>
          </div>
          <div class="taf-validity">
            Válido: ${validFromStr} ➔ ${validToStr}
          </div>
        </div>
        ${tempHtml}
        <div class="taf-body">
          <div class="table-wrapper">
            <table class="taf-table">
              <thead>
                <tr>${headerRow}</tr>
              </thead>
              <tbody>
                ${windRow}
                ${visibRow}
                ${cloudsRow}
                ${wxRow}
              </tbody>
            </table>
          </div>
          <div class="raw-taf">${report.rawTAF || ''}</div>
        </div>
      `;

      tafDisplay.appendChild(card);
    });
  }

  tafBtn.addEventListener('click', fetchTafData);
  tafInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchTafData();
  });

  const vedurSelect = document.getElementById("vedurRun");
      const vedurImage = document.getElementById("vedurImage");
      const vedurBase = "https://www.vedur.is/photos/flugkort/PGDE14_EGRR_";
      vedurSelect.addEventListener("change", () => {
        const val = vedurSelect.value;
        vedurImage.src = `${vedurBase}${val}.png`;
      });
});
