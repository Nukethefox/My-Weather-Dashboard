document.addEventListener('DOMContentLoaded', () => {
  const tafInput = document.getElementById('taf-input');
  const tafBtn = document.getElementById('taf-btn');
  const tafDisplay = document.getElementById('taf-display');

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
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      if (!data || data.length === 0) {
        alert('No se encontraron datos TAF para los códigos ICAO indicados.');
        return;
      }

      renderTafCards(data);
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

      while (currentTs < endHourTimestamp) {
        const hourEndTs = currentTs + 3600;

        let activeBase = { ...baseFcst };
        const activeChanges = [];

        for (let i = 1; i < report.fcsts.length; i++) {
          const fc = report.fcsts[i];
          const changeType = fc.fcstChange || '';

          if (fc.timeFrom <= currentTs && fc.timeTo >= hourEndTs) {
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

      function formatWind(wdir, wspd, wgst) {
        if (wdir === null || wdir === undefined) return '--';
        const wdirStr = wdir === 'VRB' ? 'VRB' : `${wdir}°`;
        const wspdStr = wspd !== null ? `${wspd}kt` : '';
        const wgstStr = wgst ? ` G${wgst}kt` : '';
        return `${wdirStr} ${wspdStr}${wgstStr}`;
      }

      function formatVisib(visib) {
        if (!visib) return '--';
        if (visib === '6+') return '>10 km';
        const vMiles = parseFloat(visib);
        return !isNaN(vMiles) ? `${(vMiles * 1.60934).toFixed(1)} km` : `${visib}`;
      }

      function formatClouds(clouds) {
        if (!clouds || clouds.length === 0) return 'NSC / CAVOK';
        return clouds.map(c => {
          const trans = coverTranslations[c.cover] || c.cover;
          const baseStr = c.base ? ` ${c.base}ft` : '';
          return `${trans}${baseStr}`;
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

        let windChangesHtml = '';
        let visibChangesHtml = '';
        let cloudsChangesHtml = '';
        let wxChangesHtml = '';

        item.changes.forEach(ch => {
          const probStr = ch.probability ? `PROB${ch.probability} ` : '';
          const type = ch.fcstChange || 'CAMBIO';
          const tag = `${probStr}${type}`;
          
          let blockClass = 'cell-change-tempo';
          let tagClass = 'tag-tempo';

          if (type === 'BECMG' || type === 'FM') {
            blockClass = 'cell-change-becmg';
            tagClass = 'tag-becmg';
          }

          if (ch.wdir !== null && ch.wdir !== undefined) {
            windChangesHtml += `<div class="cell-change ${blockClass}"><span class="change-tag ${tagClass}">${tag}</span>${formatWind(ch.wdir, ch.wspd, ch.wgst)}</div>`;
          }
          if (ch.visib) {
            visibChangesHtml += `<div class="cell-change ${blockClass}"><span class="change-tag ${tagClass}">${tag}</span>${formatVisib(ch.visib)}</div>`;
          }
          if (ch.clouds && ch.clouds.length > 0) {
            cloudsChangesHtml += `<div class="cell-change ${blockClass}"><span class="change-tag ${tagClass}">${tag}</span>${formatClouds(ch.clouds)}</div>`;
          }
          if (ch.wxString) {
            wxChangesHtml += `<div class="cell-change ${blockClass}"><span class="change-tag ${tagClass}">${tag}</span>${decodeWxString(ch.wxString)}</div>`;
          }
        });

        const windCell = windChangesHtml || formatWind(item.base.wdir, item.base.wspd, item.base.wgst);
        const visibCell = visibChangesHtml || formatVisib(item.base.visib);
        const cloudsCell = cloudsChangesHtml || formatClouds(item.base.clouds);
        const wxCell = wxChangesHtml || (item.base.wxString ? decodeWxString(item.base.wxString) : '--');

        windRow += `<td>${windCell}</td>`;
        visibRow += `<td>${visibCell}</td>`;
        cloudsRow += `<td>${cloudsCell}</td>`;
        wxRow += `<td>${wxCell}</td>`;
      });

      windRow += '</tr>';
      visibRow += '</tr>';
      cloudsRow += '</tr>';
      wxRow += '</tr>';

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
