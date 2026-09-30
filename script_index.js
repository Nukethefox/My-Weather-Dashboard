document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('obs-select');
  const image = document.getElementById('obs-image');
  const link = document.getElementById('obs-link');
  const metarInput = document.getElementById('metar-input');
  const metarBtn = document.getElementById('metar-btn');
  const metarDisplay = document.getElementById('metar-display');
  const satRegion = document.getElementById('sat-region');
  const satMode = document.getElementById('sat-mode');
  const satType = document.getElementById('sat-type');
  const satImage = document.getElementById('sat-image');
  let lastMetarTimestamp = null;

  const linksMap = {
  'https://www.meteociel.fr/cartes_obs/temp2_sp_1h.png': 'https://www.meteociel.fr/observations-meteo/temps-reel.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/temp_sp.png': 'https://www.meteociel.fr/observations-meteo/temperatures.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/tn_sp.png': 'https://www.meteociel.fr/observations-meteo/tmini.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/txint_sp.png': 'https://www.meteociel.fr/observations-meteo/tmaxi.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/pointrosee_sp.png': 'https://www.meteociel.fr/observations-meteo/point-de-rosee.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/humi_sp.png': 'https://www.meteociel.fr/observations-meteo/humi.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/humidex_sp.png': 'https://www.meteociel.fr/observations-meteo/humidex.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/windchill_sp.png': 'https://www.meteociel.fr/observations-meteo/windchill.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/vent_sp.png': 'https://www.meteociel.fr/observations-meteo/vent.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/rafales_sp.png': 'https://www.meteociel.fr/observations-meteo/vent-rafales.php?region=sp',
  'https://www.meteociel.fr/cartes_obs/pression2_sp.png': 'https://www.meteociel.fr/observations-meteo/pression.php?region=sp',
  'sst': 'https://www.meteociel.fr/observations-meteo/temperature-de-la-mer.php?region=sp'
};

  function normalizeWeatherReportArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.metar)) return payload.metar;
    if (Array.isArray(payload.METAR)) return payload.METAR;
    return [];
  }

  function getNewestReport(reports) {
    return reports.reduce((latest, report) => {
      if (!report || !report.reportTime) return latest;
      if (!latest || !latest.reportTime) return report;
      return new Date(report.reportTime) > new Date(latest.reportTime) ? report : latest;
    }, null);
  }

  function getSstUrl() {
  const date = new Date();
  date.setDate(date.getDate() - 2);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `https://www.meteociel.fr/obs/sst/${year}-${month}-${day}sp.gif`;
}

select.addEventListener('change', (e) => {
  const value = e.target.value;
  if (value === 'sst') {
    image.src = getSstUrl();
  } else {
    image.src = value;
  }
  link.href = linksMap[value] || '#';
});

async function fetchMetarData() {
  const rawInput = metarInput.value.trim().toUpperCase();
  if (!rawInput) return;

  const icaos = rawInput.replace(/\s+/g, '');
  metarBtn.disabled = true;
  metarBtn.textContent = 'Consultando...';

  try {
    const targetUrl = `https://aviationweather.gov/api/data/metar?ids=${icaos}&format=json`;
    const proxyUrl = `https://metar-proxy.abusomfernandez.workers.dev/?url=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    if (!data || data.length === 0) {
      alert('No se encontraron datos METAR para los códigos ICAO indicados.');
      return;
    }

    renderMetarCards(data);
  } catch (error) {
    alert('Error al consultar AviationWeather: ' + error.message);
  } finally {
    metarBtn.disabled = false;
    metarBtn.textContent = 'Consultar METAR';
  }
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

  function renderMetarCards(reports) {
    metarDisplay.innerHTML = '';

    const coverTranslations = {
      'FEW': 'Pocas nubes',
      'SCT': 'Nubes dispersas',
      'BKN': 'Nubes casi enteras',
      'OVC': 'Cubierto'
    };

    function renderChangeGroups(rawOb) {
      const tokens = rawOb.toUpperCase().match(/\S+/g) || [];
      if (tokens.includes('NOSIG')) return '';

      const groupsHtml = [];
      for (let index = 0; index < tokens.length; index++) {
        const changeType = tokens[index];
        if (changeType !== 'TEMPO' && changeType !== 'BECMG') continue;

        let groupEnd = index + 1;
        while (groupEnd < tokens.length &&
          !['TEMPO', 'BECMG', 'NOSIG', 'RMK'].includes(tokens[groupEnd])) {
          groupEnd++;
        }

        const groupTokens = tokens.slice(index + 1, groupEnd);
        const timeRangeToken = groupTokens.find(token => /^\d{4}\/\d{4}$/.test(token));
        const visibilityToken = groupTokens.find(token => /^\d{4}$/.test(token));
        const weatherTokenPattern = /^(?:[-+])?(?:VC|RE)?(?:(?:FZ|TS|SH|BL|DR|PR|BC|MI)*(?:DZ|RA|SN|SG|PL|GR|GS|BR|FG|FU|VA|DU|SA|HZ|PO|SQ|FC|SS|DS)+|TS)$/;
        const cloudItems = [];
        const weatherTokens = [];
        let windHtml = '';

        groupTokens.forEach(token => {
          const cloudMatch = token.match(/^(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?$/);
          if (cloudMatch) {
            const [, cover, height, cloudType] = cloudMatch;
            const baseFeet = Number(height) * 100;
            const translation = coverTranslations[cover] ? ` (${coverTranslations[cover]})` : '';
            const typeLabel = cloudType === 'CB'
              ? ' <strong style="color: #ef4444;">Cumulonimbos</strong>'
              : cloudType === 'TCU'
                ? ' <strong style="color: #f97316;">Torrecúmulos</strong>'
                : '';

            cloudItems.push({
              baseFeet,
              html: `
                <div class="cloud-item">
                  <span>☁️ ${cover}${translation}${typeLabel}</span>
                  <span>Base: ${baseFeet} ft (${Math.round(baseFeet * 0.3048)} m)</span>
                </div>
              `
            });
          } else if (/^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?(KT|MPS|KMH)$/.test(token)) {
            const [, direction, speed, gust, unit] = token.match(/^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?(KT|MPS|KMH)$/);
            const unitLabel = unit === 'KT' ? 'kt' : unit === 'MPS' ? 'm/s' : 'km/h';
            const toKmh = unit === 'KT' ? 1.852 : unit === 'MPS' ? 3.6 : 1;
            const windDescription = direction === 'VRB'
              ? `Viento variable a ${speed} ${unitLabel} (${Math.round(Number(speed) * toKmh)} km/h)`
              : `Viento de ${direction}° a ${speed} ${unitLabel} (${Math.round(Number(speed) * toKmh)} km/h)`;
            const gustDescription = gust
              ? `, con rachas de ${gust} ${unitLabel} (${Math.round(Number(gust) * toKmh)} km/h)`
              : '';
            windHtml = `<div class="cloud-item"><span>Viento</span><span>${windDescription}${gustDescription}</span></div>`;
          } else if (weatherTokenPattern.test(token)) {
            weatherTokens.push(token);
          }
        });

        const detailsHtml = [];
        if (timeRangeToken) {
          const [, startDay, startHour, endDay, endHour] = timeRangeToken.match(/^(\d{2})(\d{2})\/(\d{2})(\d{2})$/);
          detailsHtml.push(`<div class="cloud-item"><span>Franja horaria</span><span>Día ${startDay}, ${startHour}Z – día ${endDay}, ${endHour}Z</span></div>`);
        }
        if (visibilityToken) {
          const visibility = visibilityToken === '9999'
            ? '9999 m (10 km o más)'
            : `${Number(visibilityToken)} m`;
          detailsHtml.push(`<div class="cloud-item"><span>Visibilidad</span><span>${visibility}</span></div>`);
        }
        if (windHtml) detailsHtml.push(windHtml);
        detailsHtml.push(...cloudItems.sort((a, b) => b.baseFeet - a.baseFeet).map(cloud => cloud.html));
        if (weatherTokens.length > 0) {
          detailsHtml.push(`<div class="cloud-item"><span>🌧️ ${decodeWxString(weatherTokens.join(' '))}</span></div>`);
        }
        if (detailsHtml.length === 0) {
          detailsHtml.push('<div class="cloud-item"><span>Sin datos de visibilidad, nubes o fenómenos para descifrar.</span></div>');
        }

        const changeLabel = changeType === 'TEMPO' ? 'cambios temporales' : 'cambios graduales';
        groupsHtml.push(`
          <div>
            <div class="stat-label">${changeType} · ${changeLabel}</div>
            ${detailsHtml.join('')}
          </div>
        `);
        index = groupEnd - 1;
      }

      if (groupsHtml.length === 0) return '';
      return `
        <div class="cloud-layers">
          <div class="stat-label">Cambios próximos</div>
          ${groupsHtml.join('')}
        </div>
      `;
    }

    reports.forEach(report => {
      let visibKm = '--';
      if (report.visib !== undefined) {
        const rawVisib = String(report.visib);
        const prefix = rawVisib.includes('+') ? '>' : '';
        const visibMiles = parseFloat(rawVisib.replace('+', ''));
        if (!isNaN(visibMiles)) {
          visibKm = `${prefix}${Math.round(visibMiles * 1.60934)}`;
        }
      }
      const windKmh = report.wspd !== undefined ? Math.round(report.wspd * 1.852) : '--';
      const windGustsKmh = report.wgst !== undefined ? Math.round(report.wgst * 1.852) : null;
      
      let reportDateStr = '--';
      if (report.reportTime) {
        const d = new Date(report.reportTime);
        const hours = String(d.getUTCHours()).padStart(2, '0');
        const minutes = String(d.getUTCMinutes()).padStart(2, '0');
        reportDateStr = `${hours}:${minutes} Z`;
      }

      const rawOb = report.rawOb || '';

      let variableWindHtml = '';
      const varWindMatch = rawOb.match(/\b(\d{3})V(\d{3})\b/);
      if (varWindMatch) {
        variableWindHtml = `<div class="stat-label" style="color:#eab308; margin-top:2px;">(Variable entre ${varWindMatch[1]}° y ${varWindMatch[2]}°)</div>`;
      }

      const catClass = `flt-${(report.fltCat || 'vfr').toLowerCase()}`;

      let cloudsHtml = '';
      if (report.clouds && report.clouds.length > 0) {
        const sortedClouds = [...report.clouds].sort((a, b) => b.base - a.base);

        cloudsHtml = sortedClouds.map(c => {
          const translation = coverTranslations[c.cover] ? ` (${coverTranslations[c.cover]})` : '';
          
          let cloudTypeExtra = '';
          if (c.base !== undefined) {
            const baseHundredStr = String(Math.round(c.base / 100)).padStart(3, '0');
            const cloudRegex = new RegExp(`\\b${c.cover}${baseHundredStr}(CB|TCU)\\b`, 'i');
            const cloudMatch = rawOb.match(cloudRegex);

            if (cloudMatch) {
              const typeCode = cloudMatch[1].toUpperCase();
              if (typeCode === 'CB') {
                cloudTypeExtra = ' <strong style="color: #ef4444; background: rgba(239, 68, 68, 0.15); padding: 1px 5px; border-radius: 4px;">⚠️ Cumulonimbos</strong>';
              } else if (typeCode === 'TCU') {
                cloudTypeExtra = ' <strong style="color: #f97316; background: rgba(249, 115, 22, 0.15); padding: 1px 5px; border-radius: 4px;">⚠️ Torrecúmulos</strong>';
              }
            }
          }

          return `
            <div class="cloud-item">
              <span>☁️ ${c.cover}${translation}${cloudTypeExtra}</span>
              <span>Base: ${c.base} ft (${Math.round(c.base * 0.3048)} m)</span>
            </div>
          `;
        }).join('');
      } else {
        cloudsHtml = '<div class="cloud-item"><span>☀️ Cielo despejado/sin nubes significativas (SKC/NSC)</span></div>';
      }

      let weatherHtml = '';
      if (report.wxString) {
        const wxDecoded = decodeWxString(report.wxString);
        weatherHtml = `
          <div class="cloud-layers">
            <div class="stat-label">Fenómenos meteorológicos</div>
            <div class="cloud-item">
              <span style="color: #38bdf8; font-weight: 600;">🌧️ ${wxDecoded}</span>
            </div>
          </div>
        `;
      }
      const changeGroupsHtml = renderChangeGroups(rawOb);

      const card = document.createElement('div');
      card.className = 'metar-card';
      card.innerHTML = `
        <div class="metar-header">
          <div class="metar-title">
            <h3>${report.icaoId} - ${report.name || 'Aeropuerto'}</h3>
            <span>Reporte: ${reportDateStr} | Elevación: ${report.elev || 0} m</span>
          </div>
          <span class="flt-cat ${catClass}">${report.fltCat || 'N/A'}</span>
        </div>

        <div class="metar-body">
          <div class="metar-main-stats">
            <div class="stat-item">
              <span class="stat-label">Temperatura</span>
              <span class="stat-value">${report.temp !== undefined ? report.temp : '--'} °C</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Punto de Rocío</span>
              <span class="stat-value">${report.dewp !== undefined ? report.dewp : '--'} °C</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Visibilidad</span>
              <span class="stat-value">${visibKm} km</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">QNH (Presión)</span>
              <span class="stat-value">${report.altim || '--'} hPa</span>
            </div>
          </div>

          <div class="wind-compass-wrapper">
            <div class="compass-circle">
              <div class="compass-arrow" style="transform: rotate(${report.wdir || 0}deg);"></div>
            </div>
            <div>
              <div class="stat-label">Viento</div>
              <div class="stat-value">${report.wdir || 0}° a ${report.wspd || 0} kt (${windKmh} km/h)</div>
              ${variableWindHtml}
              ${windGustsKmh ? `<div class="stat-label" style="color:#ef4444;">Ráfagas: ${report.wgst} kt (${windGustsKmh} km/h)</div>` : ''}
            </div>
          </div>

          <div class="cloud-layers">
            <div class="stat-label">Capas de nubes</div>
            ${cloudsHtml}
          </div>

          ${weatherHtml}
          ${changeGroupsHtml}

          <div class="raw-ob">${rawOb}</div>
        </div>
      `;

      metarDisplay.appendChild(card);
    });
  }

  metarBtn.addEventListener('click', fetchMetarData);
  metarInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fetchMetarData();
  });

  function setDefaultSatType() {
  const now = new Date();
  const month = now.getMonth();
  const currentDecimalTime = now.getHours() + now.getMinutes() / 60;

  const visibleHours = [
    [9.0, 17.25], [8.9, 17.9], [8.25, 18.4], [7.9, 19.9],
    [7.5, 20.5], [7.0, 21.0], [7.5, 20.9], [8.0, 20.0],
    [8.3, 19.1], [8.5, 18.4], [8.75, 17.25], [9.0, 17.25]
  ];

  const [start, end] = visibleHours[month];
  satType.value = (currentDecimalTime >= start && currentDecimalTime < end) ? 'vistruecol' : 'ir';
}

  function updateSatImage() {
    const region = satRegion.value;
    const mode = satMode.value;
    const type = satType.value;
    const ext = mode === 'anim' ? 'gif' : 'png';

    const url = `https://modeles20.meteociel.fr/satellite/${mode}sat${type}mtg${region}.${ext}`;
    satImage.src = url;
  }

  satRegion.addEventListener('change', updateSatImage);
  satMode.addEventListener('change', updateSatImage);
  satType.addEventListener('change', updateSatImage);

  setDefaultSatType();
  updateSatImage();

  const TILE_SIZE = window.devicePixelRatio >= 2 ? 512 : 256;
  const RADAR_OPACITY = 0.8;
  const RADAR_MIN_DBZ = 15;
  const radarAnimationSpeedSelect = document.getElementById('radar-animation-speed-select');
  const API_URL = "https://api.rainviewer.com/public/weather-maps.json";

  let apiData = {};
  let mapFrames = [];
  let animationPosition = 0;
  let animationTimer = false;
  let currentLayer = null;
  let isLoading = false;
  let layerCache = {};

  const map = L.map('radar-map', { maxZoom: 12 }).setView([40.4167, -3.7037], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    className: 'base-tiles'
  }).addTo(map);

  function wrapPosition(position) {
    while (position >= mapFrames.length) {
      position -= mapFrames.length;
    }
    while (position < 0) {
      position += mapFrames.length;
    }
    return position;
  }

  function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const RAIN_SOURCE_COLORS = `
    63615914 66635a19 69665c1e 6c685d24 6f6b5f29 726e612e 75706234 78736439
    7c75653e 7f786744 827b6949 857d6a4e 88806c54 8b826d59 8e856f5e 92887164
    9e93756e aa9e7978 b6a97e82 c2b4828c cec08796 d2c48ba0 d6c88faa dacc93b4
    ded097be 88ddeeff 6cd1ebff 51c5e8ff 36bae5ff 1baee2ff 00a3e0ff 009ad5ff
    0091caff 0088bfff 007fb4ff 0077aaff 0070a3ff 00699cff 006295ff 005b8eff
    005588ff 005180ff 004e78ff 004a70ff 004768ff ffee00ff ffe000ff ffd200ff
    ffc500ff ffb700ff ffaa00ff ff9f00ff ff9500ff ff8b00ff ff8100ff ff4400ff
    f23600ff e62800ff d91b00ff cd0d00ff c10000ff a80000ff 8f0000ff 760000ff
    5d0000ff ffaaffff ff9fffff ff95ffff ff8bffff ff81ffff ff77ffff ff6cffff
    ff62ffff ff58ffff ff4effff
  `.trim().split(/\s+/).map((hex, index) => ({ dbz: index - 10, rgba: hex.match(/../g).map(value => parseInt(value, 16)) }));
  RAIN_SOURCE_COLORS.push({ dbz: 65, rgba: [255, 255, 255, 255] });
  RAIN_SOURCE_COLORS.push({ dbz: 75, rgba: [0, 255, 0, 255] });

  const SNOW_SOURCE_COLORS = `
    ceffff0c cdffff19 ccffff26 cbffff33 cbffff3f caffff4c c9ffff59 c8ffff66
    c7ffff72 c7ffff7f c6ffff8c c5ffff99 c4ffffa5 c3ffffb2 c3ffffbf c2ffffcc
    c1ffffd8 c0ffffe5 bffffff2 bfffffff b8f8ffff b2f2ffff abebffff a5e5ffff
    9fdfffff 98d8ffff 92d2ffff 8bcbffff 85c5ffff 7fbfffff 78b8ffff 72b2ffff
    6babffff 65a5ffff 5f9fffff 5b9bffff 5898ffff 5595ffff 5292ffff 4f8fffff
    4b8bffff 4888ffff 4585ffff 4282ffff 3f7fffff 3b7bffff 3878ffff 3575ffff
    3272ffff 2f6fffff 2b6bffff 2868ffff 2565ffff 2262ffff 1f5fffff 1b5bffff
    1858ffff 1555ffff 1252ffff 0f4fffff 0c4bffff 0948ffff 0645ffff 0242ffff
    003fffff 003bffff 0038ffff 0035ffff 0032ffff 002fffff 002bffff 0028ffff
    0025ffff 0022ffff 001fffff 001bffff 0018ffff 0015ffff 0012ffff 000fffff
    000cffff 0009ffff 0006ffff 0002ffff 0000ffff
  `.trim().split(/\s+/).map(hex => hex.match(/../g).map(value => parseInt(value, 16)));

  const CUSTOM_RADAR_STOPS = [
    [15, 154, 191, 252, 255], [32, 125, 153, 255, 255],
    [34.8561, 45, 214, 97, 255], [38.2782, 24, 173, 19, 255],
    [43.4704, 255, 237, 0, 255], [47.7154, 255, 0, 0, 255],
    [50.8561, 240, 143, 219, 255], [55.0103, 255, 255, 255, 255],
    [68, 255, 255, 255, 255], [100, 255, 255, 255, 255],
    [101, 0, 0, 0, 0], [255, 0, 0, 0, 0]
  ];

  const recoloredColorCache = new Map();
  let warnedAboutRadarRecolor = false;

  function colorDistanceSquared(first, second) {
    return first.reduce((distance, value, index) => distance + (value - second[index]) ** 2, 0);
  }

  function findClosestColor(color, palette) {
    let closest = null;
    for (const entry of palette) {
      const rgba = entry.rgba || entry;
      const distance = colorDistanceSquared(color, rgba);
      if (!closest || distance < closest.distance) closest = { entry, distance };
    }
    return closest;
  }

  function getCustomRadarColor(dbz) {
    if (dbz < RADAR_MIN_DBZ) return [0, 0, 0, 0];

    let upperIndex = CUSTOM_RADAR_STOPS.findIndex(stop => stop[0] >= dbz);
    if (upperIndex < 0) upperIndex = CUSTOM_RADAR_STOPS.length - 1;
    const upper = CUSTOM_RADAR_STOPS[upperIndex];
    const lower = CUSTOM_RADAR_STOPS[Math.max(0, upperIndex - 1)];
    const fraction = upper[0] === lower[0] ? 0 : (dbz - lower[0]) / (upper[0] - lower[0]);
    return upper.slice(1).map((value, index) => Math.round(lower[index + 1] + (value - lower[index + 1]) * fraction));
  }

  function recolorRadarTile(context) {
    const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    const pixels = imageData.data;
    for (let index = 0; index < pixels.length; index += 4) {
      const color = [pixels[index], pixels[index + 1], pixels[index + 2], pixels[index + 3]];
      if (color[3] === 0) continue;

      const cacheKey = color.join(',');
      let result = recoloredColorCache.get(cacheKey);
      if (!recoloredColorCache.has(cacheKey)) {
        const rainMatch = findClosestColor(color, RAIN_SOURCE_COLORS);
        const snowMatch = findClosestColor(color, SNOW_SOURCE_COLORS);
        result = snowMatch.distance < rainMatch.distance
          ? null
          : getCustomRadarColor(rainMatch.entry.dbz);
        recoloredColorCache.set(cacheKey, result);
      }

      if (result) {
        pixels[index] = result[0];
        pixels[index + 1] = result[1];
        pixels[index + 2] = result[2];
        pixels[index + 3] = result[3];
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  const CustomRadarTileLayer = L.TileLayer.extend({
    createTile(coords, done) {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        try {
          context.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);
          recolorRadarTile(context);
          done(null, canvas);
        } catch (error) {
          if (!warnedAboutRadarRecolor) {
            console.warn('No se pudo repintar un tile RainViewer; se muestra el original.', error);
            warnedAboutRadarRecolor = true;
          }
          done(null, canvas);
        }
      };
      image.onerror = () => done(new Error('No se pudo cargar un tile RainViewer.'), canvas);
      image.src = this.getTileUrl(coords);
      return canvas;
    }
  });

  function createRadarLayer(frame) {
    return new CustomRadarTileLayer(apiData.host + frame.path + '/' + TILE_SIZE + '/{z}/{x}/{y}/2/0_1.png', {
      tileSize: 256,
      opacity: 0.001,
      maxNativeZoom: 7,
      maxZoom: 12
    });
  }

  function clearLayerCache() {
    stopAnimation();
    for (let pos in layerCache) {
      if (parseInt(pos) !== animationPosition) {
        map.removeLayer(layerCache[pos]);
        delete layerCache[pos];
      }
    }
  }

  function stopAnimation() {
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = false;
      document.getElementById("radar-play-btn").innerHTML = "▶";
      return true;
    }
    return false;
  }

  function playAnimation() {
    animationTimer = true;
    document.getElementById("radar-play-btn").innerHTML = "⏸";
    showFrame(animationPosition + 1);
  }

  function playStopAnimation() {
    if (!stopAnimation()) {
      playAnimation();
    }
  }

  function getRadarAnimationDelay(position) {
    return position === mapFrames.length - 1
      ? 2000
      : Number(radarAnimationSpeedSelect.value) || 400;
  }

  function updateTimestamp(frame) {
    document.getElementById("radar-timestamp").innerHTML = formatTime(frame.time);
  }

  function showFrame(position) {
    if (isLoading) return;

    position = wrapPosition(position);
    const frame = mapFrames[position];

    updateTimestamp(frame);

    const oldLayer = currentLayer;

    if (layerCache[position]) {
      if (oldLayer) {
        oldLayer.setOpacity(0);
      }
      layerCache[position].setOpacity(RADAR_OPACITY);
      currentLayer = layerCache[position];
      animationPosition = position;

      if (animationTimer) {
        animationTimer = setTimeout(playAnimation, getRadarAnimationDelay(position));
      }
      return;
    }

    isLoading = true;

    const newLayer = createRadarLayer(frame);

    newLayer.on('load', function() {
      newLayer.setOpacity(RADAR_OPACITY);
      if (oldLayer) {
        oldLayer.setOpacity(0);
      }
      layerCache[position] = newLayer;
      currentLayer = newLayer;
      animationPosition = position;
      isLoading = false;

      if (animationTimer) {
        animationTimer = setTimeout(playAnimation, getRadarAnimationDelay(position));
      }
    });

    newLayer.addTo(map);
  }

  function initializeRadar(api) {
    clearLayerCache();
    currentLayer = null;
    mapFrames = [];
    animationPosition = 0;

    if (!api || !api.radar || !api.radar.past) return;

    mapFrames = api.radar.past;
    showFrame(mapFrames.length - 1);
  }

  async function loadRadarApiData() {
    try {
      const response = await fetch(`${API_URL}?_t=${Date.now()}`);
      if (!response.ok) throw new Error('Error al conectar con RainViewer');
      apiData = await response.json();
      initializeRadar(apiData);
    } catch (err) {
      document.getElementById("radar-timestamp").innerHTML = "Error al cargar";
    }
  }

  document.getElementById("radar-play-btn").addEventListener("click", playStopAnimation);
  radarAnimationSpeedSelect.addEventListener('change', () => {
    if (animationTimer && animationTimer !== true) {
      clearTimeout(animationTimer);
      animationTimer = setTimeout(playAnimation, getRadarAnimationDelay(animationPosition));
    }
  });
  document.getElementById("radar-prev-btn").addEventListener("click", () => {
    stopAnimation();
    showFrame(animationPosition - 1);
  });
  document.getElementById("radar-next-btn").addEventListener("click", () => {
    stopAnimation();
    showFrame(animationPosition + 1);
  });

  map.on('movestart', clearLayerCache);
  loadRadarApiData();

function getNasaDate() {
  const date = new Date();
  date.setHours(date.getHours() - 3);
  return date.toISOString().split('T')[0];
}

const nasaCloudsLayer = L.tileLayer(
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${getNasaDate()}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
  {
    attribution: '&copy; <a href="https://earthdata.nasa.gov">NASA GIBS</a>',
    opacity: 0.5,
    maxZoom: 9
  }
);

const cloudsCheckbox = document.getElementById('clouds-checkbox');
cloudsCheckbox.addEventListener('change', (e) => {
  if (e.target.checked) {
    nasaCloudsLayer.addTo(map);
  } else {
    map.removeLayer(nasaCloudsLayer);
  }
});
});
