document.addEventListener('DOMContentLoaded', () => {
  const regionSelect = document.getElementById('region-select');
  const modelsContainer = document.getElementById('models-container');
  const productSelect = document.getElementById('product-select');
  const prevTimeBtn = document.getElementById('prev-time-btn');
  const nextTimeBtn = document.getElementById('next-time-btn');
  const forecastHourLabel = document.getElementById('forecast-hour-label');
  const imagesDisplayContainer = document.getElementById('images-display-container');
  const preloadBtn = document.getElementById('preload-btn');

  let offsetFromNow = 1;

  const MODELS_CONFIG = {
    peninsula: [
      { id: 'arome', name: 'AROME 1.3KM', runInterval: 6, delayHours: 6, maxHour: 42, step: 1 },
      { id: 'arome25', name: 'AROME 2.5KM', runInterval: 6, delayHours: 6, maxHour: 42, step: 1 },
      { id: 'wrf', name: 'WRF 2KM', runInterval: 6, delayHours: 6, maxHour: 36, step: 1 },
      { id: 'ukmo_hd', name: 'UKMO HD', runInterval: 6, delayHours: 6, maxHour: 144, step: 1 },
      { id: 'arpege', name: 'ARPEGE', runInterval: 6, delayHours: 6, maxHour: 114, step: 1 },
      { id: 'gfs', name: 'GFS', runInterval: 6, delayHours: 6, maxHour: 240, step: 3 },
      { id: 'ecmwf', name: 'ECMWF 9KM', runInterval: 6, delayHours: 6, maxHour: 360, step: 1 },
      { id: 'icon_eu', name: 'ICON-EU', runInterval: 3, delayHours: 3, maxHour: 120, step: 1 }
    ],
    europa: [
      { id: 'ecmwf_eu', name: 'ECMWF Europa', runInterval: 6, delayHours: 6, maxHour: 360, step: 3 },
      { id: 'icon_eu_eu', name: 'ICON-EU Europa', runInterval: 6, delayHours: 3, maxHour: 120, step: 1 },
      { id: 'gfs_eu', name: 'GFS Europa', runInterval: 6, delayHours: 6, maxHour: 192, step: 6 },
      { id: 'ukmo_eu', name: 'UKMO Europa', runInterval: 12, delayHours: 6, maxHour: 168, step: 12 }
    ]
  };

  const PRODUCTS_MAP = {
    arome: { precip: '1', t2m: '0', wind10m: '3', gust10m: '11', cape: '28' },
    arome25: { t850: '16', t500: '21', geop500: '2', wind700_850: '35', wind900: '8' },
    wrf: { precip: '1', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '35', wind900: '8', geop500: '2', cape: '28' },
    ukmo_hd: { precip: '1', t2m: '40', t850: '16', t500: '21', wind10m: '3', gust10m: '11', geop500: '2' },
    arpege: { precip: '1', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '35', wind900: '8', geop500: '2', cape: '28' },
    gfs: { precip: '574', t2m: '580', t850: '7', t500: '21', wind10m: '602', gust10m: '289', wind700_850: '314', wind900: '104', geop500: '21', cape: '109' },
    ecmwf: { precip: '2', t2m: '19', t850: '1', t500: '13', wind10m: '14', gust10m: '27', wind700_850: '6', wind900: '10', geop500: '0', cape: '11' },
    icon_eu: { precip: '1', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '34', wind900: '33', geop500: '2', cape: '28' },

    ecmwf_eu: { precip: '2', t2m: '9', t850: '1', t500: '13', wind10m: '14', gust10m: '27', wind700_850: '6', jetstream: '5', geop500: '0' },
    icon_eu_eu: { precip: '1', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '34', geop500: '2', cape: '28' },
    gfs_eu: { precip: '2', t2m: '9', t850: '1', t500: '13', wind10m: '14', jetstream: '5', geop500: '0', cape: '11' },
    ukmo_eu: { precip: '2', t850: '1', t500: '13', geop500: '0' }
  };

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

    models.forEach(model => {
      const runs = generateAvailableRuns(model.runInterval, model.delayHours);

      const wrapper = document.createElement('div');
      wrapper.className = 'model-option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `chk-${model.id}`;
      checkbox.value = model.id;
      checkbox.checked = true;

      const label = document.createElement('label');
      label.htmlFor = `chk-${model.id}`;
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

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      wrapper.appendChild(runSelect);
      modelsContainer.appendChild(wrapper);

      checkbox.addEventListener('change', updateImages);
      runSelect.addEventListener('change', updateImages);
    });

    updateImages();
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
      if (targetForecastHour > 144) currentStep = 6;
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
    if (modelId === 'ukmo_eu') {
      return `https://modeles14.meteociel.fr/modeles/ukmo/runs/${runStr}/ukmo-${productCode}-${targetForecastHour}.png`;
    }

    return null;
  }

  function updateImages() {
    imagesDisplayContainer.innerHTML = '';
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
    forecastHourLabel.textContent = `Ahora ${sign}${offsetFromNow}h (${day}/${month} ${localHours}:${localMinutes}LT)`;

    models.forEach(model => {
      const chk = document.getElementById(`chk-${model.id}`);
      if (!chk || !chk.checked) return;

      const runSelect = document.getElementById(`run-${model.id}`);
      const selectedRun = runSelect ? runSelect.value : getLatestAvailableRun(model.runInterval, model.delayHours);

      const imgUrl = buildImageUrl(model.id, selectedRun, selectedProduct, model);

      if (imgUrl) {
        const card = document.createElement('div');
        card.className = 'model-card-img';

        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = `${model.name} - ${selectedProduct}`;
        card.appendChild(img);

        imagesDisplayContainer.appendChild(card);
      }
    });
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
        const chk = document.getElementById(`chk-${model.id}`);
        if (!chk || !chk.checked) return;

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
  productSelect.addEventListener('change', updateImages);

  prevTimeBtn.addEventListener('click', () => {
    offsetFromNow -= 1;
    updateImages();
  });

  nextTimeBtn.addEventListener('click', () => {
    offsetFromNow += 1;
    updateImages();
  });

  renderModelCheckboxes();
});