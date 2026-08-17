document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('obs-select');
  const image = document.getElementById('obs-image');
  const metarInput = document.getElementById('metar-input');
  const metarBtn = document.getElementById('metar-btn');
  const metarDisplay = document.getElementById('metar-display');
  const satRegion = document.getElementById('sat-region');
  const satMode = document.getElementById('sat-mode');
  const satType = document.getElementById('sat-type');
  const satImage = document.getElementById('sat-image');
  let lastMetarTimestamp = null;

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
  });

  async function fetchMetarData() {
    const rawInput = metarInput.value.trim().toUpperCase();
    if (!rawInput) return;

    const icaos = rawInput.replace(/\s+/g, '');
    metarBtn.disabled = true;
    metarBtn.textContent = 'Consultando...';

    try {
     const targetUrl = `https://aviationweather.gov/api/data/metar?ids=${icaos}&format=json`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

      const response = await fetch(proxyUrl);
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
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour < 17) {
      satType.value = 'vistruecol';
    } else {
      satType.value = 'ir';
    }
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
  const ANIMATION_DELAY_MS = 500;
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

  function createRadarLayer(frame) {
    return new L.TileLayer(apiData.host + frame.path + '/' + TILE_SIZE + '/{z}/{x}/{y}/2/1_1.png', {
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
        const delay = (position === mapFrames.length - 1) ? 2000 : ANIMATION_DELAY_MS;
        animationTimer = setTimeout(playAnimation, delay);
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
        const delay = (position === mapFrames.length - 1) ? 2000 : ANIMATION_DELAY_MS;
        animationTimer = setTimeout(playAnimation, delay);
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
