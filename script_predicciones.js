document.addEventListener('DOMContentLoaded', () => {
  const regionSelect = document.getElementById('region-select');
  const modelsContainer = document.getElementById('models-container');
  const productSelect = document.getElementById('product-select');
  const prevTimeBtn = document.getElementById('prev-time-btn');
  const nextTimeBtn = document.getElementById('next-time-btn');
  const forecastHourLabel = document.getElementById('forecast-hour-label');
  const imagesDisplayContainer = document.getElementById('images-display-container');
  const preloadBtn = document.getElementById('preload-btn');
  const modelSelectorButtons = document.getElementById('model-selector-buttons');
  let activeModelId = null;
  const datePickerSelect = document.getElementById('date-picker-select');

  let offsetFromNow = 1;

  const MODELS_CONFIG = {
    peninsula: [
      { id: 'ecmwf', name: 'ECMWF 9KM', runInterval: 6, delayHours: 6, maxHour: 360, step: 1 },
      { id: 'icon_eu', name: 'ICON-EU', runInterval: 3, delayHours: 2, maxHour: 120, step: 1 },
      { id: 'ukmo_hd', name: 'UKMO HD', runInterval: 6, delayHours: 3, maxHour: 144, step: 1 },
      { id: 'arome', name: 'AROME 1.3KM', runInterval: 6, delayHours: 6, maxHour: 42, step: 1 },
      { id: 'arome25', name: 'AROME 2.5KM', runInterval: 6, delayHours: 6, maxHour: 42, step: 1 },
      { id: 'wrf', name: 'WRF 2KM', runInterval: 6, delayHours: 6, maxHour: 36, step: 1 },
      { id: 'gfs', name: 'GFS', runInterval: 6, delayHours: 6, maxHour: 240, step: 3 },
      { id: 'arpege', name: 'ARPEGE', runInterval: 6, delayHours: 3, maxHour: 114, step: 1 }
    ],
    europa: [
      { id: 'ecmwf_eu', name: 'ECMWF Europa', runInterval: 6, delayHours: 6, maxHour: 360, step: 3 },
      { id: 'gfs_eu', name: 'GFS Europa', runInterval: 6, delayHours: 6, maxHour: 192, step: 6 },
      { id: 'ukmo_eu', name: 'UKMO Europa', runInterval: 12, delayHours: 6, maxHour: 168, step: 12 },
      { id: 'arpege_eu', name: 'ARPEGE Europa', runInterval: 6, delayHours: 3, maxHour: 114, step: 3 },
      { id: 'wrf_eu', name: 'WRF Europa', runInterval: 6, delayHours: 6, maxHour: 120, step: 1 },
      { id: 'icon_eu_eu', name: 'ICON-EU Europa', runInterval: 3, delayHours: 2, maxHour: 120, step: 1 }
    ]
  };

  const PRODUCTS_MAP = {
    arome: { precip: '1', precip_acc: '25', clouds: '54', t2m: '0', wind10m: '3', gust10m: '11', cape: '28' },
    arome25: { t850: '16', t500: '21', agua_precip: '46', geop500: '2', wind700_850: '35', wind900: '8' },
    wrf: { precip: '1', precip_acc: '25', agua_precip: '46', clouds: '4', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '35', wind900: '8', geop500: '2', cape: '28' },
    ukmo_hd: { precip: '1', precip_acc: '25', clouds: '4', t2m: '40', t850: '16', t500: '21', wind10m: '3', gust10m: '11', geop500: '2' },
    arpege: { precip: '1', precip_acc: '25', agua_precip: '46', clouds: '4', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '35', wind900: '8', geop500: '2', cape: '28' },
    gfs: { precip: '574', precip_acc: '777', clouds: '562', t2m: '580', t850: '7', t500: '21', wind10m: '602', gust10m: '289', wind700_850: '314', wind900: '104', geop500: '21', cape: '109' },
    ecmwf: { precip: '2', precip_acc: '25', agua_precip: '26', clouds: '35', t2m: '19', t850: '1', t500: '13', wind10m: '14', gust10m: '27', wind700_850: '6', wind900: '10', geop500: '0', cape: '11' },
    icon_eu: { precip: '1', precip_acc: '25', clouds: '4', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '34', wind900: '33', geop500: '2', cape: '28' },

    ecmwf_eu: { anom850: '15', precip: '2', t2m: '9', t850: '1', clouds: '35', precip_acc: '25', agua_precip: '26', t500: '13', wind10m: '14', wind700_850: '6', jetstream: '5', geop500: '0' },
    gfs_eu: { anom850: '15', precip: '2', t2m: '9', t850: '1', t500: '13', precip_acc: '25', wind10m: '14', jetstream: '5', geop500: '0', cape: '11' },
    ukmo_eu: { precip: '2', t850: '1', t500: '13', geop500: '0' },
    arpege_eu: { jetstream: '5', cape: '11', precip_acc: '25', wind10m: '14', geop500: '13', anom850: '15', t850: '1', t2m: '9', precip: '2'},
    icon_eu_eu: { precip: '1', t2m: '0', t850: '16', clouds: '4', t500: '21', precip_acc: '25', wind10m: '3', gust10m: '11', wind700_850: '34', geop500: '2', cape: '28' },
    wrf_eu: { precip: '2', t2m: '0', t850: '16', clouds: '4', t500: '21', precip_acc: '25', agua_precip: '46', wind10m: '14', jetstream: '9', geop500: '2', cape: '28', wind700_850: '35', gust10m: '11', wind10m: '3', precip: '1',}
  };

  function getModelLimitDate(modelLimitHours, runHourUtc) {
    const now = new Date();
    const currentUtcHour = now.getUTCHours() + (now.getUTCMinutes() / 60);
    let elapsedSinceRun = currentUtcHour - runHourUtc;
    if (elapsedSinceRun < 0) elapsedSinceRun += 24;

    const remainingHours = modelLimitHours - elapsedSinceRun;
    const limitDate = new Date(now.getTime() + remainingHours * 60 * 60 * 1000);

    const day = limitDate.getDate();
    const month = limitDate.getMonth() + 1;
    const hours = String(limitDate.getHours()).padStart(2, '0');

    return `${day}/${month} ${hours}h`;
  }

  function getLatestAvailableRun(runInterval, delayHours) {
    const now = new Date();
    const utcDate = new Date(now.getTime() - delayHours * 3600 * 1000);

    let year = utcDate.getUTCFullYear();
    let month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    let day = String(utcDate.getUTCDate()).padStart(2, '0');
    let hour = utcDate.getUTCHours();

    hour = Math.floor(hour / runInterval) * runInterval;
    let hourStr = String(hour).padStart(2, '0');

    return `${year}${month}${day}${hourStr}`;
  }

  function generateAvailableRuns(runInterval, delayHours) {
    const runs = [];
    const latestRunStr = getLatestAvailableRun(runInterval, delayHours);

    let year = parseInt(latestRunStr.substring(0, 4));
    let month = parseInt(latestRunStr.substring(4, 6)) - 1;
    let day = parseInt(latestRunStr.substring(6, 8));
    let hour = parseInt(latestRunStr.substring(8, 10));

    let currentDate = new Date(Date.UTC(year, month, day, hour));

    for (let i = 0; i < 4; i++) {
      let y = currentDate.getUTCFullYear();
      let m = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
      let d = String(currentDate.getUTCDate()).padStart(2, '0');
      let h = String(currentDate.getUTCHours()).padStart(2, '0');

      runs.push({
        value: `${y}${m}${d}${h}`,
        label: `${d}/${m} ${h}Z`
      });

      currentDate.setUTCHours(currentDate.getUTCHours() - runInterval);
    }

    return runs;
  }

  function renderModelCheckboxes() {
    modelsContainer.innerHTML = '';
    const region = regionSelect.value;
    const models = MODELS_CONFIG[region] || [];

    const optWind900 = document.getElementById('opt-wind900');
    const optJetstream = document.getElementById('opt-jetstream');

    if (region === 'europa') {
      if (optWind900) optWind900.style.display = 'none';
      if (optJetstream) optJetstream.style.display = 'block';
      if (productSelect.value === 'wind900') productSelect.value = 'precip';
    } else {
      if (optWind900) optWind900.style.display = 'block';
      if (optJetstream) optJetstream.style.display = 'none';
      if (productSelect.value === 'jetstream') productSelect.value = 'precip';
    }

    if (!activeModelId || !models.some(m => m.id === activeModelId)) {
      activeModelId = models[0] ? models[0].id : null;
    }

    models.forEach(model => {
      const runs = generateAvailableRuns(model.runInterval, model.delayHours);

      const wrapper = document.createElement('div');
      wrapper.className = 'model-option';

      const label = document.createElement('label');
      label.textContent = model.name;
      label.style.minWidth = 'auto';

      const runSelect = document.createElement('select');
      runSelect.id = `run-${model.id}`;

      runs.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.value;
        opt.textContent = r.label;
        runSelect.appendChild(opt);
      });

      wrapper.appendChild(label);
      wrapper.appendChild(runSelect);
      modelsContainer.appendChild(wrapper);

      runSelect.addEventListener('change', updateImages);
    });

    renderModelButtons();
    updateImages();
  }

  function renderModelButtons() {
    modelSelectorButtons.innerHTML = '';
    const region = regionSelect.value;
    const models = MODELS_CONFIG[region] || [];
    const selectedProduct = productSelect.value;

    const availableModels = models.filter(model => {
      return PRODUCTS_MAP[model.id] && PRODUCTS_MAP[model.id][selectedProduct] !== undefined;
    });

    if (!activeModelId || !availableModels.some(m => m.id === activeModelId)) {
      activeModelId = availableModels[0] ? availableModels[0].id : null;
    }

    availableModels.forEach((model, index) => {
      if (index > 0) {
        const prevId = availableModels[index - 1].id;
        const currId = model.id;

        const isUkmoToArome = prevId.startsWith('ukmo') && currId.startsWith('arome');
        const isWrfToGfs = prevId === 'wrf' && currId === 'gfs';
        const isArpegeToIcon = prevId === 'arpege_eu' && currId === 'icon_eu_eu';

        if (isUkmoToArome || isWrfToGfs || isArpegeToIcon) {
          const separator = document.createElement('span');
          separator.className = 'model-separator';
          modelSelectorButtons.appendChild(separator);
        }
      }

      const btn = document.createElement('button');
      btn.className = 'model-select-btn';
      btn.setAttribute('data-model-id', model.id);
      if (model.id === activeModelId) {
        btn.classList.add('active');
      }

      const runSelect = document.getElementById(`run-${model.id}`);
      const selectedRunStr = runSelect ? runSelect.value : getLatestAvailableRun(model.runInterval, model.delayHours);
      const runHourUtc = parseInt(selectedRunStr.substring(8, 10), 10);

      const limitText = getModelLimitDate(model.maxHour, runHourUtc);
      btn.innerHTML = `${model.name}<br><small>Hasta ${limitText}</small>`;

      btn.addEventListener('click', () => {
        activeModelId = model.id;
        document.querySelectorAll('.model-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateImages();
      });

      modelSelectorButtons.appendChild(btn);
    });

    let minLimitDateObj = null;

    availableModels.forEach(model => {
      const runSelect = document.getElementById(`run-${model.id}`);
      const selectedRunStr = runSelect ? runSelect.value : getLatestAvailableRun(model.runInterval, model.delayHours);
      const runHourUtc = parseInt(selectedRunStr.substring(8, 10), 10);

      const now = new Date();
      const currentUtcHour = now.getUTCHours() + (now.getUTCMinutes() / 60);
      let elapsedSinceRun = currentUtcHour - runHourUtc;
      if (elapsedSinceRun < 0) elapsedSinceRun += 24;

      const remainingHours = model.maxHour - elapsedSinceRun;
      const limitDate = new Date(now.getTime() + remainingHours * 60 * 60 * 1000);

      if (!minLimitDateObj || limitDate < minLimitDateObj) {
        minLimitDateObj = limitDate;
      }
    });

    if (minLimitDateObj) {
      const day = minLimitDateObj.getDate();
      const month = minLimitDateObj.getMonth() + 1;
      const hours = String(minLimitDateObj.getHours()).padStart(2, '0');
      const minLimitText = `${day}/${month} ${hours}h`;

      const textInfo = document.getElementById('models-limit-info');
      if (textInfo) {
        textInfo.textContent = `Todos los modelos disponibles hasta ${minLimitText}`;
      }
    }
    updateModelButtonsState();
  }

  function snapToValidHour(targetHour, step) {
    if (targetHour < 1) targetHour = 1;
    let remainder = targetHour % step;
    if (remainder === 0) return targetHour;
    return remainder >= step / 2 ? targetHour + (step - remainder) : targetHour - remainder;
  }

  function buildImageUrl(modelId, runStr, productKey, modelConfig) {
    const productCode = PRODUCTS_MAP[modelId]?.[productKey];
    if (!productCode) return null;

    const runYear = parseInt(runStr.substring(0, 4));
    const runMonth = parseInt(runStr.substring(4, 6)) - 1;
    const runDay = parseInt(runStr.substring(6, 8));
    const runHour = parseInt(runStr.substring(8, 10));

    const runDate = new Date(Date.UTC(runYear, runMonth, runDay, runHour));
    const now = new Date();

    const diffMs = now.getTime() - runDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    let targetForecastHour = diffHours + offsetFromNow;

    let currentStep = modelConfig.step || 1;

    if (modelId === 'ukmo_hd') {
      if (targetForecastHour > 48) currentStep = 3;
    } else if (modelId === 'arpege') {
      const is3hVars = ['t850', 't500', 'cape', 'geop500', 'wind700_850', 'wind900'].includes(productKey);
      if (is3hVars && targetForecastHour > 12) currentStep = 3;
    } else if (modelId === 'gfs') {
      currentStep = targetForecastHour > 84 ? 6 : 3;
    } else if (modelId === 'ecmwf') {
      if (targetForecastHour > 144) currentStep = 6;
      else if (targetForecastHour > 90) currentStep = 3;
      else currentStep = 1;
    } else if (modelId === 'icon_eu') {
      if (targetForecastHour > 78) currentStep = 3;
    } else if (modelId === 'ecmwf_eu') {
      if (productKey === 'anom850') currentStep = 6;
      else if (targetForecastHour > 144) currentStep = 6;
      else currentStep = 3;
    } else if (modelId === 'icon_eu_eu') {
      if (targetForecastHour > 78) currentStep = 3;
      else currentStep = 1;
    } else if (modelId === 'gfs_eu') {
      currentStep = 6;
    } else if (modelId === 'ukmo_eu') {
      currentStep = 12;
    }

    targetForecastHour = snapToValidHour(targetForecastHour, currentStep);

    if (targetForecastHour > modelConfig.maxHour) return null;

    if (modelId === 'arome') {
      return `https://modeles7.meteociel.fr/modeles/arome_sp1/runs/${runStr}/aromehd-${productCode}-${targetForecastHour}-0.png`;
    }
    if (modelId === 'arome25') {
      return `https://modeles7.meteociel.fr/modeles/arome_sp1/runs/${runStr}/arome-${productCode}-${targetForecastHour}-0.png`;
    }
    if (modelId === 'wrf') {
      return `https://modeles16.meteociel.fr/modeles/wrfnmm/runs/${runStr}/nmm_sp1-${productCode}-${targetForecastHour}-0.png`;
    }
    if (modelId === 'ukmo_hd') {
      return `https://modeles14.meteociel.fr/modeles/ukmo/runs/${runStr}/ukmohd_sp1-${productCode}-${targetForecastHour}-0.png`;
    }
    if (modelId === 'arpege') {
      return `https://modeles7.meteociel.fr/modeles/arpege/runs/${runStr}/arpegesp-${productCode}-${targetForecastHour}-0.png`;
    }
    if (modelId === 'gfs') {
      return `https://modeles2.meteociel.fr/modeles_gfs/runs/${runStr}/${targetForecastHour}-${productCode}SP.GIF`;
    }
    if (modelId === 'ecmwf') {
      return `https://modeles3.meteociel.fr/modeles/ecmwf2/run/ecmwfsp-${productCode}-${targetForecastHour}.png`;
    }
    if (modelId === 'icon_eu') {
      return `https://modeles12.meteociel.fr/modeles/icon/runs/${runStr}/iconeu_sp1-${productCode}-${targetForecastHour}-0.png`;
    }

    if (modelId === 'ecmwf_eu') {
      return `https://modeles3.meteociel.fr/modeles/ecmwf2/run/ecmwf-${productCode}-${targetForecastHour}.png`;
    }
    if (modelId === 'icon_eu_eu') {
      return `https://modeles12.meteociel.fr/modeles/icon/runs/${runStr}/iconeu_euw-${productCode}-${targetForecastHour}-0.png`;
    }
    if (modelId === 'gfs_eu') {
      return `https://modeles16.meteociel.fr/modeles/gfs/runs/${runStr}/gfs-${productCode}-${targetForecastHour}.png`;
    }
    if (modelId === 'wrf_eu') {
      return `https://modeles16.meteociel.fr/modeles/wrfnmm-eur/runs/${runStr}/nmm-${productCode}-${targetForecastHour}-0.png`;
    }
    if (modelId === 'arpege_eu') {
      return `https://modeles7.meteociel.fr/modeles/arpege/runs/${runStr}/arpegeeur-${productCode}-${targetForecastHour}.png`;
    }
    if (modelId === 'ukmo_eu') {
      return `https://modeles14.meteociel.fr/modeles/ukmo/runs/${runStr}/ukmo-${productCode}-${targetForecastHour}.png`;
    }

    return null;
  }

  function updateImages() {
    const region = regionSelect.value;
    const models = MODELS_CONFIG[region] || [];
    const selectedProduct = productSelect.value;

    const sign = offsetFromNow >= 0 ? '+' : '';
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + offsetFromNow);
    const day = targetDate.getDate();
    const month = targetDate.getMonth() + 1;
    const localHours = String(targetDate.getHours()).padStart(2, '0');
    const localMinutes = String(targetDate.getMinutes()).padStart(2, '0');
    forecastHourLabel.textContent = `Ahora ${sign}${offsetFromNow}h (Imágen más cercana a: ${day}/${month} ${localHours}h)`;

    updateModelButtonsState();

    if (!activeModelId) {
      imagesDisplayContainer.innerHTML = '';
      return;
    }

    const model = models.find(m => m.id === activeModelId);
    if (!model) {
      imagesDisplayContainer.innerHTML = '';
      return;
    }

    const runSelect = document.getElementById(`run-${model.id}`);
    const selectedRun = runSelect ? runSelect.value : getLatestAvailableRun(model.runInterval, model.delayHours);

    const imgUrl = buildImageUrl(model.id, selectedRun, selectedProduct, model);

    if (!imgUrl) {
      imagesDisplayContainer.innerHTML = '';
      return;
    }

    const existingImg = imagesDisplayContainer.querySelector('img');

    if (existingImg) {
      existingImg.src = imgUrl;
      existingImg.alt = `${model.name} - ${selectedProduct}`;
    } else {
      const currentHeight = imagesDisplayContainer.offsetHeight;
      if (currentHeight > 0) {
        imagesDisplayContainer.style.minHeight = `${currentHeight}px`;
      }

      imagesDisplayContainer.innerHTML = '';

      const card = document.createElement('div');
      card.className = 'model-card-img';

      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = `${model.name} - ${selectedProduct}`;
      
      img.onload = () => {
        imagesDisplayContainer.style.minHeight = '';
      };

      card.appendChild(img);
      imagesDisplayContainer.appendChild(card);
    }
  }

  function preloadImages() {
    preloadBtn.disabled = true;
    preloadBtn.textContent = 'Cargando...';

    const region = regionSelect.value;
    const models = MODELS_CONFIG[region] || [];
    const selectedProduct = productSelect.value;
    
    const originalOffset = offsetFromNow;
    const urlsToPreload = [];

    for (let h = 0; h <= 24; h++) {
      offsetFromNow = originalOffset + h;

      models.forEach(model => {
        const runSelect = document.getElementById(`run-${model.id}`);
        const selectedRun = runSelect ? runSelect.value : getLatestAvailableRun(model.runInterval, model.delayHours);
        const imgUrl = buildImageUrl(model.id, selectedRun, selectedProduct, model);

        if (imgUrl && !urlsToPreload.includes(imgUrl)) {
          urlsToPreload.push(imgUrl);
        }
      });
    }

    offsetFromNow = originalOffset;

    let loadedCount = 0;
    if (urlsToPreload.length === 0) {
      preloadBtn.disabled = false;
      preloadBtn.textContent = 'Precargar serie';
      return;
    }

    urlsToPreload.forEach(url => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loadedCount++;
        if (loadedCount === urlsToPreload.length) {
          preloadBtn.disabled = false;
          preloadBtn.textContent = 'Serie Lista ✓';
          setTimeout(() => {
            preloadBtn.textContent = 'Precargar serie';
          }, 3000);
        }
      };
      img.src = url;
    });
  }

  preloadBtn.addEventListener('click', preloadImages);

  regionSelect.addEventListener('change', renderModelCheckboxes);
  productSelect.addEventListener('change', () => {
    renderModelButtons();
    updateImages();
  });

  prevTimeBtn.addEventListener('click', () => {
    offsetFromNow -= 1;
    updateImages();
  });

  nextTimeBtn.addEventListener('click', () => {
    offsetFromNow += 1;
    updateImages();
  });

  renderModelCheckboxes();

  let meteogramChartInstance = null;

const wmoIconMap = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌧️', 53: '🌧️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '❄️', 73: '❄️', 75: '❄️',
  80: '🌦️', 81: '🌦️', 82: '🌧️',
  95: '⛈️', 96: '⛈️', 99: '⛈️'
};

document.getElementById('openMeteogramBtn').addEventListener('click', () => {
  document.getElementById('meteogramModal').classList.remove('hidden');
});

document.getElementById('closeMeteogramBtn').addEventListener('click', () => {
  document.getElementById('meteogramModal').classList.add('hidden');
});

async function fetchMeteogramForCoords(latitude, longitude, locationName = '') {
  const modelParam = document.getElementById('meteogramModelSelect').value;
  const loadingEl = document.getElementById('meteogramLoading');
  loadingEl.classList.remove('hidden');

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=temperature_2m,dew_point_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_850hPa,cloud_cover,weather_code&models=${modelParam}&cell_selection=nearest&timezone=auto`;

    const weatherRes = await fetch(url);
    const weatherData = await weatherRes.json();
    weatherData.locationName = locationName;

    renderMeteogram(weatherData);
  } catch (err) {
    alert('Error al obtener datos de predicción');
  } finally {
    loadingEl.classList.add('hidden');
  }
}

document.getElementById('fetchMeteogramBtn').addEventListener('click', async () => {
  const query = document.getElementById('citySearchInput').value.trim();
  if (!query) return;

  const coordMatch = query.match(/^([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    await fetchMeteogramForCoords(lat, lon, `Coordenadas manuales (${lat}, ${lon})`);
    return;
  }

  const loadingEl = document.getElementById('meteogramLoading');
  loadingEl.classList.remove('hidden');

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      alert('Población no encontrada');
      loadingEl.classList.add('hidden');
      return;
    }

    const place = geoData.results.find(r => r.country_code === 'ES') || geoData.results[0];
    const placeName = [place.name, place.admin1, place.country].filter(Boolean).join(', ');

    await fetchMeteogramForCoords(place.latitude, place.longitude, placeName);
  } catch (err) {
    alert('Error en la búsqueda geográfica');
    loadingEl.classList.add('hidden');
  }
});

document.getElementById('useLocationBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('La geolocalización no está soportada por tu navegador.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      document.getElementById('citySearchInput').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      await fetchMeteogramForCoords(lat, lon, 'Ubicación GPS actual');
    },
    () => {
      alert('No se pudo obtener la ubicación GPS.');
    }
  );
});

function renderMeteogram(data) {
  const hourly = data.hourly;
  const daily = data.daily;

  const tHead = document.getElementById('meteogramTableHead');
  const tBody = document.getElementById('meteogramTableBody');
  tHead.innerHTML = '';
  tBody.innerHTML = '';

  const totalCols = hourly.time.length + 1;
  const lat = data.latitude !== undefined ? data.latitude.toFixed(4) : '--';
  const lon = data.longitude !== undefined ? data.longitude.toFixed(4) : '--';
  const ele = data.elevation !== undefined ? `${data.elevation}m` : '--';
  const tz = data.timezone || 'UTC';

  const locTitle = data.locationName ? ` 🏢 ${data.locationName} |` : '';
  const metaRow = document.createElement('tr');
  metaRow.innerHTML = `<td colspan="${totalCols}" style="text-align: left; background-color: #0f172a; color: #38bdf8; font-weight: 600; padding: 8px 12px; border-bottom: 1px solid #334155;">📍${locTitle} Lat ${lat}°, Lon ${lon}° | Altitud: ${ele} | Zona: ${tz}</td>`;
  tHead.appendChild(metaRow);
  const dayGroups = [];
  let currentDayStr = null;
  let currentGroup = null;

  hourly.time.forEach((tStr, idx) => {
    const dayStr = tStr.split('T')[0];
    if (dayStr !== currentDayStr) {
      currentDayStr = dayStr;
      currentGroup = { dayStr, count: 0, startIndex: idx };
      dayGroups.push(currentGroup);
    }
    currentGroup.count++;
  });

  const row1 = document.createElement('tr');
  row1.innerHTML = `<td class="sticky-col">Día</td>`;
  dayGroups.forEach((g, idx) => {
    const d = new Date(g.dayStr);
    const cell = document.createElement('td');
    cell.colSpan = g.count;
    if (idx > 0) cell.className = 'day-border';
    cell.textContent = `${d.getDate()}/${d.getMonth()+1}`;
    row1.appendChild(cell);
  });
  tHead.appendChild(row1);

  const row2 = document.createElement('tr');
  row2.innerHTML = `<td class="sticky-col">Temp Min / Max</td>`;
  dayGroups.forEach((g, idx) => {
    const dayIdx = daily ? daily.time.indexOf(g.dayStr) : -1;
    const cell = document.createElement('td');
    cell.colSpan = g.count;
    if (idx > 0) cell.className = 'day-border';
    if (dayIdx !== -1) {
      cell.textContent = `${daily.temperature_2m_min[dayIdx]}°C / ${daily.temperature_2m_max[dayIdx]}°C`;
    } else {
      cell.textContent = '--';
    }
    row2.appendChild(cell);
  });
  tHead.appendChild(row2);

  const row3 = document.createElement('tr');
  row3.innerHTML = `<td class="sticky-col">Salida / Puesta del sol</td>`;
  dayGroups.forEach((g, idx) => {
    const dayIdx = daily ? daily.time.indexOf(g.dayStr) : -1;
    const cell = document.createElement('td');
    cell.colSpan = g.count;
    if (idx > 0) cell.className = 'day-border';
    if (dayIdx !== -1 && daily.sunrise[dayIdx] && daily.sunset[dayIdx]) {
      const sunrise = daily.sunrise[dayIdx].split('T')[1];
      const sunset = daily.sunset[dayIdx].split('T')[1];
      cell.textContent = `☀️ ${sunrise} - 🌙 ${sunset}`;
    } else {
      cell.textContent = '--';
    }
    row3.appendChild(cell);
  });
  tHead.appendChild(row3);

  const getWindArrow = (deg) => {
    const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
    return arrows[Math.round(deg / 45) % 8];
  };

  const isNightHour = (tStr) => {
    const dayStr = tStr.split('T')[0];
    const hour = new Date(tStr).getHours();
    const dayIdx = daily ? daily.time.indexOf(dayStr) : -1;
    if (dayIdx !== -1 && daily.sunrise[dayIdx] && daily.sunset[dayIdx]) {
      const sunriseHour = new Date(daily.sunrise[dayIdx]).getHours();
      const sunsetHour = new Date(daily.sunset[dayIdx]).getHours();
      return hour < sunriseHour || hour >= sunsetHour;
    }
    return false;
  };

  const rowsData = [
    { label: 'Hora', values: hourly.time.map(t => `${String(new Date(t).getHours()).padStart(2, '0')}:00`) },
    { label: 'General', values: hourly.weather_code.map(code => `<span class="weather-icon">${wmoIconMap[code] || '❓'}</span>`) },
    { label: 'ºC a 2m', values: hourly.temperature_2m.map(v => `${v}°`) },
    { label: 'ºC sensación', values: hourly.apparent_temperature.map(v => `${v}°`) },
    { label: 'ºC punto de rocío', values: hourly.dew_point_2m.map(v => `${v}°`) },
    { label: 'ºC a 850 hPa', values: hourly.temperature_850hPa.map(v => `${v}°`) },
    { label: 'Dirección media del viento', values: hourly.wind_direction_10m.map(v => `${v}° ${getWindArrow(v)}`) },
    { label: 'Velocidad media del viento', values: hourly.wind_speed_10m.map(v => `${v} km/h`) },
    { label: 'Ráfagas de viento medias', values: hourly.wind_gusts_10m.map(v => `${v} km/h`) },
    { label: '% Cobertura nubes', values: hourly.cloud_cover.map(v => `${v}%`) },
    { label: 'Precipitación esperada', values: hourly.precipitation.map(v => `${v} mm`) }
  ];

  rowsData.forEach(r => {
    const tr = document.createElement('tr');
    let html = `<td class="sticky-col">${r.label}</td>`;
    r.values.forEach((val, idx) => {
      const tStr = hourly.time[idx];
      const dateObj = new Date(tStr);
      
      const classes = [];
      if (dateObj.getHours() === 0) classes.push('day-border');
      if (isNightHour(tStr)) classes.push('night-cell');

      const classAttr = classes.length ? ` class="${classes.join(' ')}"` : '';
      html += `<td${classAttr}>${val}</td>`;
    });
    tr.innerHTML = html;
    tBody.appendChild(tr);
  });
}

datePickerSelect.addEventListener('change', () => {
    if (!datePickerSelect.value) return;

    const selectedDate = new Date(datePickerSelect.value);
    selectedDate.setMinutes(0, 0, 0);

    const now = new Date();
    now.setMinutes(0, 0, 0);

    const diffMs = selectedDate.getTime() - now.getTime();
    offsetFromNow = Math.round(diffMs / (1000 * 60 * 60));

    updateImages();
  });

  function updateModelButtonsState() {
    const modelButtons = document.querySelectorAll('.model-select-btn');
    const region = regionSelect.value;
    const models = MODELS_CONFIG[region] || [];

    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + offsetFromNow);

    modelButtons.forEach(btn => {
      const modelId = btn.getAttribute('data-model-id');
      const model = models.find(m => m.id === modelId);

      if (model) {
        const runSelect = document.getElementById(`run-${model.id}`);
        const selectedRunStr = runSelect ? runSelect.value : getLatestAvailableRun(model.runInterval, model.delayHours);
        const runHourUtc = parseInt(selectedRunStr.substring(8, 10), 10);

        const now = new Date();
        const currentUtcHour = now.getUTCHours() + (now.getUTCMinutes() / 60);
        let elapsedSinceRun = currentUtcHour - runHourUtc;
        if (elapsedSinceRun < 0) elapsedSinceRun += 24;

        const remainingHours = model.maxHour - elapsedSinceRun;
        const limitDate = new Date(now.getTime() + remainingHours * 60 * 60 * 1000);

        if (targetDate > limitDate) {
          btn.classList.add('disabled-model');
        } else {
          btn.classList.remove('disabled-model');
        }
      }
    });
  }

});
