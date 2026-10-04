const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: false,
  maximumAge: 300000,
  timeout: 10000
};

document.addEventListener('DOMContentLoaded', () => {
  const regionSelect = document.getElementById('region-select');
  const modelAvailabilityStatus = document.getElementById('model-availability-status');
  const modelsContainer = document.getElementById('models-container');
  const productSelect = document.getElementById('product-select');
  const prevTimeBtn = document.getElementById('prev-time-btn');
  const nextTimeBtn = document.getElementById('next-time-btn');
  const minus12TimeBtn = document.getElementById('minus12-time-btn');
  const plus12TimeBtn = document.getElementById('plus12-time-btn');
  const animateModelBtn = document.getElementById('animate-model-btn');
  const animationSpeedSelect = document.getElementById('animation-speed-select');
  const forecastHourLabel = document.getElementById('forecast-hour-label');
  const imagesDisplayContainer = document.getElementById('images-display-container');
  const modelSelectorButtons = document.getElementById('model-selector-buttons');
  let activeModelId = null;
  const datePickerSelect = document.getElementById('date-picker-select');
  const hourPickerSlider = document.getElementById('hour-picker-slider');
  const sliderTicksLabels = document.getElementById('slider-ticks-labels');

  let offsetFromNow = 1;
  let animationTimer = null;

  const MODELS_CONFIG = {
    peninsula: [
      { id: 'ecmwf', name: 'ECMWF 9km', runInterval: 6, delayHours: 7.25, delayHoursByRun: { 0: 7.25, 6: 7.25, 12: 7.25, 18: 7.25 }, maxHour: 360, step: 1 },
      { id: 'icon_eu', name: 'ICON-EU 7km', runInterval: 3, delayHours: 3, delayHoursByRun: { 0: 3, 3: 3, 6: 3, 9: 3, 12: 3, 15: 3, 18: 3, 21: 3 }, maxHour: 120, maxHoursByRun: { 0: 120, 3: 30, 6: 120, 9: 30, 12: 120, 15: 30, 18: 120, 21: 30 }, step: 1 },
      { id: 'ukmo_hd', name: 'UKMO HD 10km', runInterval: 6, delayHours: 5, delayHoursByRun: { 0: 5, 6: 5, 12: 4.5, 18: 5 }, maxHour: 168, maxHoursByRun: { 0: 168, 6: 66, 12: 168, 18: 66 }, step: 1 },
      { id: 'aromeIFS', name: 'AROME', defaultVariant: 'classic', runHoursByVariant: { classic: [0, 3, 6, 9, 12, 15, 18, 21] }, variants: { classic: { delayHours: 3.75, delayHoursByRun: { 0: 5.083, 6: 6.25, 12: 5.083, 18: 4.5 } }, ifs: { delayHours: 7.5 } }, maxHour: 51, runInterval: 6, step: 1 },
      { id: 'arome25', name: 'AROME 2.5km', runInterval: 6, delayHours: 5.083, delayHoursByRun: { 0: 5.083, 6: 6.25, 12: 5.083, 18: 6.25 }, maxHour: 51, step: 1 },
      { id: 'wrf', name: 'WRF 2km', runInterval: 6, delayHours: 7.5, delayHoursByRun: { 0: 7.5, 6: 7.5, 12: 7.5, 18: 7.5 }, maxHour: 36, step: 1 },
      { id: 'gfs', name: 'GFS 25km', runInterval: 6, delayHours: 5.5, maxHour: 384, step: 3 },
      { id: 'arpege', name: 'ARPEGE 10km', runInterval: 6, delayHours: 5, delayHoursByRun: { 0: 5, 6: 6.083, 12: 4.5, 18: 5 }, maxHour: 114, maxHoursByRun: { 0: 102, 6: 102, 12: 114, 18: 102 }, step: 1 }
    ],
    europa: [
      { id: 'ecmwf_eu', name: 'ECMWF 25km', runInterval: 6, delayHours: 7.25, delayHoursByRun: { 0: 7.25, 6: 7.25, 12: 7.25, 18: 7.25 }, maxHour: 360, step: 3 },
      { id: 'gfs_eu', name: 'GFS 25km', runInterval: 6, delayHours: 5.5, maxHour: 192, step: 6 },
      { id: 'ukmo_eu', name: 'UKMO 10km', runInterval: 6, delayHours: 5, maxHour: 168, maxHoursByRun: { 0: 168, 6: 60, 12: 168, 18: 60 }, step: 12 },
      { id: 'arpege_eu', name: 'ARPEGE 25km', runInterval: 6, delayHours: 6, maxHour: 114, maxHoursByRun: { 0: 102, 6: 102, 12: 114, 18: 102 }, step: 3 },
      { id: 'wrf_eu', name: 'WRF 10km', runInterval: 6, delayHours: 5, delayHoursByRun: { 0: 5, 6: 5, 12: 5, 18: 5 }, maxHour: 120, step: 1 },
      { id: 'icon_eu_eu', name: 'ICON-EU 7km', runInterval: 3, delayHours: 3.5, delayHoursByRun: { 0: 3.5, 3: 3.5, 6: 3.5, 9: 3.5, 12: 3.5, 15: 3.5, 18: 3.5, 21: 3.5 }, maxHour: 120, maxHoursByRun: { 0: 120, 3: 30, 6: 120, 9: 30, 12: 120, 15: 30, 18: 120, 21: 30 }, step: 1 }
    ]
  };

  const RUN_HOUR_COLORS = {
    '00': { background: '#0e346d', accent: '#1d2992' },
    '03': { background: '#811a08', accent: '#c6170e' },
    '06': { background: '#339128', accent: '#198c11' },
    '09': { background: '#b01a9e', accent: '#b40eae' },
    '12': { background: '#0e346d', accent: '#1d2992' },
    '15': { background: '#811a08', accent: '#c6170e' },
    '18': { background: '#339128', accent: '#198c11' },
    '21': { background: '#b01a9e', accent: '#b40eae' }
  };

  function getModelVariant(modelId) {
    const model = MODELS_CONFIG.peninsula.find(item => item.id === modelId);
    return document.getElementById(`variant-${modelId}`)?.value ?? model?.defaultVariant;
  }

  function getModelDisplayName(model) {
    if (model.id === 'aromeIFS') {
      return getModelVariant(model.id) === 'ifs' ? 'AROME-IFS 2.5km' : 'AROME clásico 1.3km';
    }
    return model.name;
  }

  function getModelDelayHours(model, runHourUtc) {
    const variantConfig = model.variants?.[getModelVariant(model.id)];
    return variantConfig?.delayHoursByRun?.[runHourUtc]
      ?? variantConfig?.delayHours
      ?? model.delayHoursByRun?.[runHourUtc]
      ?? model.delayHours;
  }

  function getModelRunHours(model) {
    return model.runHoursByVariant?.[getModelVariant(model.id)] ?? null;
  }

  function getPreviousModelRunDate(model, runDate) {
    const previousDate = new Date(runDate);
    const runHours = getModelRunHours(model);
    if (!runHours) {
      previousDate.setUTCHours(previousDate.getUTCHours() - model.runInterval);
      return previousDate;
    }

    const previousHour = runHours.filter(hour => hour < runDate.getUTCHours()).at(-1);
    if (previousHour === undefined) {
      previousDate.setUTCDate(previousDate.getUTCDate() - 1);
      previousDate.setUTCHours(runHours[runHours.length - 1]);
    } else {
      previousDate.setUTCHours(previousHour);
    }
    return previousDate;
  }

  function getNextModelRunDate(model, runDate) {
    const nextDate = new Date(runDate);
    const runHours = getModelRunHours(model);
    if (!runHours) {
      nextDate.setUTCHours(nextDate.getUTCHours() + model.runInterval);
      return nextDate;
    }

    const nextHour = runHours.find(hour => hour > runDate.getUTCHours());
    if (nextHour === undefined) {
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      nextDate.setUTCHours(runHours[0]);
    } else {
      nextDate.setUTCHours(nextHour);
    }
    return nextDate;
  }

  function updateModelFreshnessInfo(model) {
    const runSelect = document.getElementById(`run-${model.id}`);
    const info = runSelect?.parentElement?.querySelector('.model-update-info');
    if (!runSelect || !info || !runSelect.value) return;

    const runStr = runSelect.value;
    const runDate = new Date(Date.UTC(
      Number(runStr.slice(0, 4)),
      Number(runStr.slice(4, 6)) - 1,
      Number(runStr.slice(6, 8)),
      Number(runStr.slice(8, 10))
    ));
    const now = new Date();
    const ageMinutes = Math.max(0, Math.floor((now.getTime() - runDate.getTime()) / 60000));
    const ageHours = Math.floor(ageMinutes / 60);
    const remainingMinutes = ageMinutes % 60;
    const verification = modelRunVerification.get(model.id) || { state: 'checking' };

    const ageLabel = document.createElement('span');
    ageLabel.textContent = `Salida calculada hace ${ageHours} h ${remainingMinutes} min`;
    const freshnessLabel = document.createElement('span');
    freshnessLabel.className = `model-freshness-${verification.state}`;
    const preparingRunHour = verification.preparingRun?.slice(8, 10);
    const statusLabels = {
      checking: 'Comprobando despliegue del modelo...',
      current: 'Mostrando última salida completa',
      preparing: `Ciclo ${preparingRunHour ?? ''}Z en preparación`,
      unavailable: 'No se pudo verificar el ciclo completo'
    };
    freshnessLabel.textContent = statusLabels[verification.state] || statusLabels.checking;
    info.replaceChildren(ageLabel, document.createElement('br'), freshnessLabel);
  }

  function formatUtcTime(date) {
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}Z`;
  }

  function getModelMaxHour(model, runHourUtc) {
    return model.maxHoursByRun?.[runHourUtc] ?? model.maxHour;
  }

  function updateModelOptionRunColor(model) {
    const runSelect = document.getElementById(`run-${model.id}`);
    const wrapper = runSelect?.closest('.model-option');
    if (!runSelect || !wrapper || !runSelect.value) return;

    const runHour = runSelect.value.slice(8, 10);
    const colors = RUN_HOUR_COLORS[runHour];
    wrapper.dataset.runHour = runHour;
    if (colors) wrapper.style.setProperty('--model-run-background', colors.background);
  }

  function updateForecastSliderRange() {
    if (!hourPickerSlider) return;

    const models = MODELS_CONFIG[regionSelect.value] || [];
    const model = models.find(item => item.id === activeModelId);
    if (!model) {
      hourPickerSlider.style.setProperty('--forecast-limit-percent', '100%');
      hourPickerSlider.style.setProperty('--forecast-limit-color', '#38bdf8');
      return;
    }

    const runSelect = document.getElementById(`run-${model.id}`);
    const runStr = runSelect ? runSelect.value : getLatestAvailableRun(model);
    if (!runStr) return;

    const runHour = Number(runStr.slice(8, 10));
    const elapsedHours = Math.floor(getRunElapsedHours(runStr));
    const remainingForecastHours = getModelMaxHour(model, runHour) - elapsedHours;
    const maxSliderValue = Math.max(0, Math.min(239, remainingForecastHours - 1));
    const limitPercent = (maxSliderValue / 239) * 100;
    const colors = RUN_HOUR_COLORS[runStr.slice(8, 10)];

    hourPickerSlider.dataset.runHour = runStr.slice(8, 10);
    hourPickerSlider.style.setProperty('--forecast-limit-percent', `${limitPercent}%`);
    hourPickerSlider.style.setProperty('--forecast-limit-color', colors?.accent || '#38bdf8');
  }

  let runDetectionGeneration = 0;
  let lastRunDetectionAt = 0;
  const modelRunVerification = new Map();
  const RUN_DETECTION_INTERVAL_MS = 5 * 60 * 1000;

  function formatRunString(date) {
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}${String(date.getUTCHours()).padStart(2, '0')}`;
  }

  function getRunCandidates(model, count = 5) {
    const now = new Date();
    const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const runHours = getModelRunHours(model);
    if (runHours) {
      const currentRunHour = runHours.filter(hour => hour <= now.getUTCHours()).at(-1);
      if (currentRunHour === undefined) {
        candidate.setUTCDate(candidate.getUTCDate() - 1);
        candidate.setUTCHours(runHours[runHours.length - 1]);
      } else {
        candidate.setUTCHours(currentRunHour);
      }
    } else {
      candidate.setUTCHours(Math.floor(now.getUTCHours() / model.runInterval) * model.runInterval);
    }

    return Array.from({ length: count }, () => {
      const runStr = formatRunString(candidate);
      candidate.setTime(getPreviousModelRunDate(model, candidate).getTime());
      return runStr;
    });
  }

  function getProbeProductKey(modelId) {
    const products = PRODUCTS_MAP[modelId] || {};
    return products.precip !== undefined ? 'precip' : Object.keys(products)[0];
  }

  function probeImage(url) {
    return new Promise(resolve => {
      const image = new Image();
      const timeout = setTimeout(() => finish(false), 2500);
      const finish = loaded => {
        clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
        resolve(loaded);
      };

      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      image.src = `${url}${url.includes('?') ? '&' : '?'}run-check=${Date.now()}`;
    });
  }

  function refreshRunOptions(model, verifiedRun) {
    const runSelect = document.getElementById(`run-${model.id}`);
    if (!runSelect) return;

    const manuallySelectedRun = runSelect.dataset.userSelected === 'true' ? runSelect.value : null;
    const runDate = new Date(Date.UTC(
      Number(verifiedRun.slice(0, 4)),
      Number(verifiedRun.slice(4, 6)) - 1,
      Number(verifiedRun.slice(6, 8)),
      Number(verifiedRun.slice(8, 10))
    ));
    const runs = [];

    for (let index = 0; index < 4; index++) {
      const value = formatRunString(runDate);
      runs.push({ value, label: `${value.slice(6, 8)}/${value.slice(4, 6)} ${value.slice(8, 10)}Z` });
      runDate.setTime(getPreviousModelRunDate(model, runDate).getTime());
    }

    if (manuallySelectedRun && !runs.some(run => run.value === manuallySelectedRun)) {
      runs.push({
        value: manuallySelectedRun,
        label: `${manuallySelectedRun.slice(6, 8)}/${manuallySelectedRun.slice(4, 6)} ${manuallySelectedRun.slice(8, 10)}Z`
      });
    }

    runSelect.replaceChildren(...runs.map(run => new Option(run.label, run.value)));
    runSelect.value = manuallySelectedRun || verifiedRun;
    updateModelOptionRunColor(model);
  }

  async function verifyModelRun(model, generation) {
    if (generation !== runDetectionGeneration) return;
    const checkedVariant = getModelVariant(model.id);
    modelRunVerification.set(model.id, { state: 'checking' });
    updateModelFreshnessInfo(model);

    const productKey = getProbeProductKey(model.id);
    if (!productKey) return;

    let preparingRun = null;
    for (const runStr of getRunCandidates(model)) {
      if (generation !== runDetectionGeneration) return;
      const runHourUtc = Number(runStr.slice(8, 10));
      const verificationMaxHour = (model.id === 'ecmwf' || model.id === 'ecmwf_eu') &&
        (runHourUtc === 6 || runHourUtc === 18)
        ? 144
        : getModelMaxHour(model, runHourUtc);
      const validForecastHours = getValidForecastHours(model, productKey, runHourUtc, verificationMaxHour);
      const firstForecastHour = validForecastHours[0];
      const finalForecastHour = validForecastHours.at(-1);
      if (firstForecastHour === undefined || finalForecastHour === undefined) continue;

      const firstImageUrl = buildImageUrl(model.id, runStr, productKey, model, firstForecastHour);
      if (!firstImageUrl || !await probeImage(firstImageUrl)) continue;
      if (generation !== runDetectionGeneration || getModelVariant(model.id) !== checkedVariant) return;

      let finalImageLoaded = firstForecastHour === finalForecastHour;
      if (!finalImageLoaded) {
        const finalImageUrl = buildImageUrl(model.id, runStr, productKey, model, finalForecastHour);
        finalImageLoaded = Boolean(finalImageUrl && await probeImage(finalImageUrl));
        if (generation !== runDetectionGeneration || getModelVariant(model.id) !== checkedVariant) return;
      }

      if (finalImageLoaded) {
        modelRunVerification.set(model.id, { state: preparingRun ? 'preparing' : 'current', preparingRun });
        refreshRunOptions(model, runStr);
        updateModelFreshnessInfo(model);
        renderModelButtons();
        updateImages();
        return;
      }

      preparingRun ||= runStr;
    }

    if (generation === runDetectionGeneration && getModelVariant(model.id) === checkedVariant) {
      modelRunVerification.set(model.id, { state: preparingRun ? 'preparing' : 'unavailable', preparingRun });
      updateModelFreshnessInfo(model);
    }
  }

  async function detectRegionRuns(region, force = false) {
    if (!force && Date.now() - lastRunDetectionAt < RUN_DETECTION_INTERVAL_MS) return;
    lastRunDetectionAt = Date.now();
    const generation = ++runDetectionGeneration;
    const models = MODELS_CONFIG[region] || [];
    const firstModel = models.find(model => model.id === activeModelId) || models[0];
    if (!firstModel) return;
    if (modelAvailabilityStatus) modelAvailabilityStatus.textContent = 'Comprobando disponibilidad de modelos...';

    await verifyModelRun(firstModel, generation);
    const remainingModels = models.filter(model => model.id !== firstModel.id);
    let nextModelIndex = 0;
    const workers = Array.from({ length: Math.min(2, remainingModels.length) }, async () => {
      while (generation === runDetectionGeneration && nextModelIndex < remainingModels.length) {
        const model = remainingModels[nextModelIndex++];
        await verifyModelRun(model, generation);
      }
    });
    await Promise.all(workers);
    if (generation === runDetectionGeneration && modelAvailabilityStatus) {
      modelAvailabilityStatus.textContent = `Disponibilidad de modelos comprobada por última vez a las ${formatUtcTime(new Date())}`;
    }
  }

  const PRODUCTS_MAP = {
    aromeIFS: { precip: '1', precip_acc: '25', clouds: '55', t2m: '0', wind10m: '3', gust10m: '11', cape: '28' },
    arome25: { t850: '16', t500: '21', agua_precip: '46', geop500: '2', wind700_850: '35', wind900: '8', velocidad_vertical: '15' },
    wrf: { precip: '1', precip_acc: '25', agua_precip: '46', clouds: '4', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '35', wind900: '8', geop500: '2', cape: '28', velocidad_vertical: '15' },
    ukmo_hd: { precip: '1', precip_acc: '25', clouds: '4', t2m: '40', t850: '16', t500: '21', wind10m: '3', gust10m: '11', geop500: '2' },
    arpege: { precip: '1', precip_acc: '25', agua_precip: '46', clouds: '4', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '35', wind900: '8', geop500: '2', cape: '28', velocidad_vertical: '15' },
    gfs: { precip: '574', precip_acc: '777', clouds: '562', t2m: '580', t850: '7', t500: '21', wind10m: '602', gust10m: '289', wind700_850: '314', wind900: '104', geop500: '21', cape: '109', velocidad_vertical: '107' },
    ecmwf: { precip: '2', precip_acc: '25', agua_precip: '26', clouds: '35', t2m: '19', t850: '1', t500: '13', wind10m: '14', gust10m: '27', wind700_850: '6', wind900: '10', geop500: '0', cape: '11' },
    icon_eu: { precip: '1', precip_acc: '25', clouds: '4', t2m: '0', t850: '16', t500: '21', wind10m: '3', gust10m: '11', wind700_850: '34', wind900: '33', geop500: '2', cape: '28' },

    ecmwf_eu: { anom850: '15', precip: '2', t2m: '9', t850: '1', clouds: '35', precip_acc: '25', agua_precip: '26', t500: '13', wind10m: '14', wind700_850: '6', jetstream: '5', geop500: '0' },
    gfs_eu: { anom850: '15', precip: '2', t2m: '9', t850: '1', t500: '13', precip_acc: '25', wind10m: '14', jetstream: '5', geop500: '0', cape: '11' },
    ukmo_eu: { precip: '2', t850: '1', t500: '13', geop500: '0' },
    arpege_eu: { jetstream: '5', cape: '11', precip_acc: '25', wind10m: '14', geop500: '13', anom850: '15', t850: '1', t2m: '9', precip: '2'},
    icon_eu_eu: { precip: '1', t2m: '0', t850: '16', clouds: '4', t500: '21', precip_acc: '25', wind10m: '3', gust10m: '11', wind700_850: '34', geop500: '2', cape: '28' },
    wrf_eu: { precip: '2', t2m: '0', t850: '16', clouds: '4', t500: '21', precip_acc: '25', agua_precip: '46', wind10m: '14', jetstream: '9', geop500: '2', cape: '28', wind700_850: '35', gust10m: '11', wind10m: '3', precip: '1',}
  };

  function getRunElapsedHours(runStr, now = new Date()) {
    const runDate = new Date(Date.UTC(
      Number(runStr.substring(0, 4)),
      Number(runStr.substring(4, 6)) - 1,
      Number(runStr.substring(6, 8)),
      Number(runStr.substring(8, 10))
    ));
    return (now.getTime() - runDate.getTime()) / 3600000;
  }

  function getModelLimitDate(modelLimitHours, runStr) {
    const now = new Date();
    const remainingHours = modelLimitHours - getRunElapsedHours(runStr, now);
    const limitDate = new Date(now.getTime() + remainingHours * 60 * 60 * 1000);

    const day = limitDate.getDate();
    const month = limitDate.getMonth() + 1;
    const hours = String(limitDate.getHours()).padStart(2, '0');

    return `${day}/${month} ${hours}h`;
  }

  function getLatestAvailableRun(model) {
    const now = new Date();
    if (getModelRunHours(model)) {
      for (const runStr of getRunCandidates(model, 10)) {
        const runDate = new Date(Date.UTC(
          Number(runStr.slice(0, 4)),
          Number(runStr.slice(4, 6)) - 1,
          Number(runStr.slice(6, 8)),
          Number(runStr.slice(8, 10))
        ));
        const availableAt = runDate.getTime() + getModelDelayHours(model, runDate.getUTCHours()) * 3600000;
        if (now.getTime() >= availableAt) return runStr;
      }
      return getRunCandidates(model, 1)[0];
    }

    const candidate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      Math.floor(now.getUTCHours() / model.runInterval) * model.runInterval
    ));

    while (true) {
      const runHourUtc = candidate.getUTCHours();
      const availableAt = candidate.getTime() + getModelDelayHours(model, runHourUtc) * 3600000;
      if (now.getTime() >= availableAt) {
        return `${candidate.getUTCFullYear()}${String(candidate.getUTCMonth() + 1).padStart(2, '0')}${String(candidate.getUTCDate()).padStart(2, '0')}${String(runHourUtc).padStart(2, '0')}`;
      }
      candidate.setUTCHours(candidate.getUTCHours() - model.runInterval);
    }
  }

  function generateAvailableRuns(model) {
    const runs = [];
    const latestRunStr = getLatestAvailableRun(model);
    const currentDate = new Date(Date.UTC(
      Number(latestRunStr.slice(0, 4)),
      Number(latestRunStr.slice(4, 6)) - 1,
      Number(latestRunStr.slice(6, 8)),
      Number(latestRunStr.slice(8, 10))
    ));

    for (let i = 0; i < 4; i++) {
      let y = currentDate.getUTCFullYear();
      let m = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
      let d = String(currentDate.getUTCDate()).padStart(2, '0');
      let h = String(currentDate.getUTCHours()).padStart(2, '0');

      runs.push({
        value: `${y}${m}${d}${h}`,
        label: `${d}/${m} ${h}Z`
      });

      currentDate.setTime(getPreviousModelRunDate(model, currentDate).getTime());
    }

    return runs;
  }

  function renderModelCheckboxes() {
    modelsContainer.innerHTML = '';
    const region = regionSelect.value;
    const models = MODELS_CONFIG[region] || [];

    const optWind900 = document.getElementById('opt-wind900');
    const optJetstream = document.getElementById('opt-jetstream');
    const optVerticalVelocity = document.getElementById('opt-vertical-velocity');

    if (region === 'europa') {
      if (optWind900) optWind900.style.display = 'none';
      if (optJetstream) optJetstream.style.display = 'block';
      if (optVerticalVelocity) optVerticalVelocity.style.display = 'none';
      if (productSelect.value === 'wind900') productSelect.value = 'precip';
      if (productSelect.value === 'velocidad_vertical') productSelect.value = 'precip';
    } else {
      if (optWind900) optWind900.style.display = 'block';
      if (optJetstream) optJetstream.style.display = 'none';
      if (optVerticalVelocity) optVerticalVelocity.style.display = 'block';
      if (productSelect.value === 'jetstream') productSelect.value = 'precip';
    }

    if (!activeModelId || !models.some(m => m.id === activeModelId)) {
      activeModelId = models[0] ? models[0].id : null;
    }

    models.forEach(model => {
      const runs = generateAvailableRuns(model);

      const wrapper = document.createElement('div');
      wrapper.className = model.id === 'aromeIFS' ? 'model-option model-option-arome' : 'model-option';

      const label = document.createElement('label');
      label.textContent = model.name;
      label.style.minWidth = 'auto';

      if (model.variants) {
        const variantSelect = document.createElement('select');
        variantSelect.id = `variant-${model.id}`;
        variantSelect.setAttribute('aria-label', 'Variante AROME');
        variantSelect.appendChild(new Option('1,3 km', 'classic'));
        variantSelect.appendChild(new Option('IFS 2,5 km', 'ifs'));
        variantSelect.value = model.defaultVariant;
        wrapper.appendChild(label);
        wrapper.appendChild(variantSelect);

        variantSelect.addEventListener('change', () => {
          const runSelect = document.getElementById(`run-${model.id}`);
          if (runSelect) {
            runSelect.dataset.userSelected = 'false';
            runSelect.replaceChildren(...generateAvailableRuns(model).map(run => new Option(run.label, run.value)));
          }
          updateModelOptionRunColor(model);
          updateModelFreshnessInfo(model);
          const generation = runDetectionGeneration;
          verifyModelRun(model, generation);
          renderModelButtons();
          updateImages();
        });
      } else {
        wrapper.appendChild(label);
      }

      const runSelect = document.createElement('select');
      runSelect.id = `run-${model.id}`;

      runs.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.value;
        opt.textContent = r.label;
        runSelect.appendChild(opt);
      });

      const updateInfo = document.createElement('small');
      updateInfo.className = 'model-update-info';
      updateInfo.textContent = 'Comprobando último run...';

      wrapper.appendChild(runSelect);
      wrapper.appendChild(updateInfo);
      modelsContainer.appendChild(wrapper);
      updateModelOptionRunColor(model);
      updateModelFreshnessInfo(model);

      runSelect.addEventListener('change', () => {
        runSelect.dataset.userSelected = 'true';
        updateModelOptionRunColor(model);
        updateModelFreshnessInfo(model);
        stopModelAnimation();
        renderModelButtons();
        updateImages();
      });
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
      const selectedRunStr = runSelect ? runSelect.value : getLatestAvailableRun(model);
      const runHourUtc = parseInt(selectedRunStr.substring(8, 10), 10);

      const limitText = getModelLimitDate(getModelMaxHour(model, runHourUtc), selectedRunStr);
      btn.innerHTML = `${getModelDisplayName(model)}<br><small>Hasta ${limitText}</small>`;

      btn.addEventListener('click', () => {
        stopModelAnimation();
        activeModelId = model.id;
        document.querySelectorAll('.model-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateImages();
      });

      modelSelectorButtons.appendChild(btn);
    });

    updateModelButtonsState();
  }

  function snapToValidHour(targetHour, step) {
    if (targetHour < 1) targetHour = 1;
    let remainder = targetHour % step;
    if (remainder === 0) return targetHour;
    return remainder >= step / 2 ? targetHour + (step - remainder) : targetHour - remainder;
  }

  function getForecastStep(modelId, productKey, targetForecastHour, modelConfig) {
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
      else if (targetForecastHour > 90) currentStep = 3;
      else currentStep = 3;
    } else if (modelId === 'icon_eu_eu') {
      if (targetForecastHour > 78) currentStep = 3;
      else currentStep = 1;
    } else if (modelId === 'gfs_eu') {
      currentStep = 6;
    } else if (modelId === 'ukmo_eu') {
      currentStep = 12;
    }

    return currentStep;
  }

  function getValidForecastHours(model, productKey, runHourUtc, maxHourOverride = null) {
    const forecastHours = new Set();
    const maxHour = maxHourOverride ?? getModelMaxHour(model, runHourUtc);
    for (let targetHour = 1; targetHour <= maxHour; targetHour++) {
      const step = getForecastStep(model.id, productKey, targetHour, model);
      const validHour = snapToValidHour(targetHour, step);
      if (validHour > 0 && validHour <= maxHour) forecastHours.add(validHour);
    }
    return [...forecastHours].sort((a, b) => a - b);
  }

  function stopModelAnimation() {
    if (animationTimer !== null) {
      clearInterval(animationTimer);
      animationTimer = null;
    }
    if (animateModelBtn) {
      animateModelBtn.textContent = '▶';
      animateModelBtn.setAttribute('aria-label', 'Animar modelo');
      animateModelBtn.setAttribute('aria-pressed', 'false');
      animateModelBtn.title = 'Animar modelo';
    }
  }

  function advanceAnimationFrame() {
    const models = MODELS_CONFIG[regionSelect.value] || [];
    const model = models.find(item => item.id === activeModelId);
    if (!model) {
      stopModelAnimation();
      return;
    }

    const runSelect = document.getElementById(`run-${model.id}`);
    const runStr = runSelect ? runSelect.value : getLatestAvailableRun(model);
    const runHourUtc = parseInt(runStr.substring(8, 10), 10);
    const forecastHours = getValidForecastHours(model, productSelect.value, runHourUtc);
    if (forecastHours.length === 0) {
      stopModelAnimation();
      return;
    }
    const runDate = new Date(Date.UTC(
      Number(runStr.slice(0, 4)),
      Number(runStr.slice(4, 6)) - 1,
      Number(runStr.slice(6, 8)),
      Number(runStr.slice(8, 10))
    ));
    const elapsedHours = Math.floor((Date.now() - runDate.getTime()) / (60 * 60 * 1000));
    const currentForecastHour = elapsedHours + offsetFromNow;
    const currentStep = getForecastStep(model.id, productSelect.value, currentForecastHour, model);
    const displayedForecastHour = snapToValidHour(currentForecastHour, currentStep);
    const nextForecastHour = forecastHours.find(hour => hour > displayedForecastHour) || forecastHours[0];

    offsetFromNow = nextForecastHour - elapsedHours;
    updateImages();
  }

  function toggleModelAnimation() {
    if (!animateModelBtn) return;
    if (animationTimer !== null) {
      stopModelAnimation();
      return;
    }
    if (!activeModelId || !PRODUCTS_MAP[activeModelId]?.[productSelect.value]) return;

    animateModelBtn.textContent = '⏸';
    animateModelBtn.setAttribute('aria-label', 'Pausar animación');
    animateModelBtn.setAttribute('aria-pressed', 'true');
    animateModelBtn.title = 'Pausar animación';
    animationTimer = setInterval(advanceAnimationFrame, Number(animationSpeedSelect?.value) || 600);
  }

  if (animateModelBtn) {
    animateModelBtn.addEventListener('click', toggleModelAnimation);
  }

  if (animationSpeedSelect) {
    animationSpeedSelect.addEventListener('change', () => {
      if (animationTimer !== null) {
        clearInterval(animationTimer);
        animationTimer = setInterval(advanceAnimationFrame, Number(animationSpeedSelect.value) || 600);
      }
    });
  }

  function buildImageUrl(modelId, runStr, productKey, modelConfig, forecastHourOverride = null) {
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

    let targetForecastHour = forecastHourOverride ?? diffHours + offsetFromNow;

    const currentStep = getForecastStep(modelId, productKey, targetForecastHour, modelConfig);
    targetForecastHour = snapToValidHour(targetForecastHour, currentStep);

    const maxHour = getModelMaxHour(modelConfig, runHour);
    if (targetForecastHour > maxHour) return null;

    let sourceRunStr = runStr;
    if ((modelId === 'ecmwf' || modelId === 'ecmwf_eu') && targetForecastHour > 144 && (runHour === 6 || runHour === 18)) {
      const sourceRunDate = new Date(runDate);
      sourceRunDate.setUTCHours(sourceRunDate.getUTCHours() - 6);
      sourceRunStr = formatRunString(sourceRunDate);
    }

    if (modelId === 'aromeIFS') {
      if (getModelVariant(modelId) === 'classic') {
        const intermediateRun = [3, 9, 15, 21].includes(runHour);
        const modelDirectory = intermediateRun ? `arome${runHour}z_sp1` : 'arome_sp1';
        return `https://modeles7.meteociel.fr/modeles/${modelDirectory}/runs/${runStr}/aromehd-${productCode}-${targetForecastHour}-0.png`;
      }
      return `https://modeles7.meteociel.fr/modeles/aromeifs_sp1/runs/${runStr}/aromeifs-${productCode}-${targetForecastHour}-0.png`;
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
      return `https://modeles3.meteociel.fr/modeles/ecmwf2/runs/${sourceRunStr}/ecmwfsp-${productCode}-${targetForecastHour}.png`;
    }
    if (modelId === 'icon_eu') {
      return `https://modeles12.meteociel.fr/modeles/icon/runs/${runStr}/iconeu_sp1-${productCode}-${targetForecastHour}-0.png`;
    }

    if (modelId === 'ecmwf_eu') {
      return `https://modeles3.meteociel.fr/modeles/ecmwf2/runs/${sourceRunStr}/ecmwf-${productCode}-${targetForecastHour}.png`;
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
      return `https://modeles7.meteociel.fr/modeles/arpege/run/${runStr}/arpegeeur-${productCode}-${targetForecastHour}.png`;
    }
    if (modelId === 'ukmo_eu') {
      return `https://modeles14.meteociel.fr/modeles/ukmo/runs/${runStr}/ukmo-${productCode}-${targetForecastHour}.png`;
    }

    return null;
  }

  function syncControlInputs() {
    if (hourPickerSlider) {
      const sliderVal = Math.max(0, Math.min(239, offsetFromNow - 1));
      hourPickerSlider.value = sliderVal;
    }

    if (datePickerSelect) {
      const targetDate = new Date();
      targetDate.setHours(targetDate.getHours() + offsetFromNow);
      targetDate.setMinutes(0, 0, 0);

      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      const hours = String(targetDate.getHours()).padStart(2, '0');

      datePickerSelect.value = `${year}-${month}-${day}T${hours}:00`;
    }
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
    forecastHourLabel.textContent = `Ahora ${sign}${offsetFromNow}h (${day}/${month} ${localHours}h)`;

    syncControlInputs();
    updateForecastSliderRange();
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
    const selectedRun = runSelect ? runSelect.value : getLatestAvailableRun(model);

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

  regionSelect.addEventListener('change', () => {
    stopModelAnimation();
    renderModelCheckboxes();
    detectRegionRuns(regionSelect.value, true);
  });
  window.addEventListener('focus', () => detectRegionRuns(regionSelect.value));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) detectRegionRuns(regionSelect.value);
  });
  setInterval(() => {
    if (!document.hidden) detectRegionRuns(regionSelect.value);
  }, RUN_DETECTION_INTERVAL_MS);
  setInterval(() => {
    (MODELS_CONFIG[regionSelect.value] || []).forEach(updateModelFreshnessInfo);
  }, 60 * 1000);
  productSelect.addEventListener('change', () => {
    stopModelAnimation();
    renderModelButtons();
    updateImages();
  });

  function buildSliderTicks() {
    if (!sliderTicksLabels) return;
    sliderTicksLabels.innerHTML = '';

    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() + 1, 0, 0, 0);

    for (let step = 0; step < 240; step++) {
      const tickDate = new Date(baseDate.getTime() + step * 60 * 60 * 1000);

      if (tickDate.getHours() === 0) {
        const percent = (step / 239) * 100;
        const label = document.createElement('span');
        label.className = 'tick-label';
        label.style.left = `${percent}%`;
        label.textContent = `${tickDate.getDate()}/${tickDate.getMonth() + 1}`;
        sliderTicksLabels.appendChild(label);
      }
    }
  }

  prevTimeBtn.addEventListener('click', () => {
    stopModelAnimation();
    offsetFromNow -= 1;
    updateImages();
  });

  nextTimeBtn.addEventListener('click', () => {
    stopModelAnimation();
    offsetFromNow += 1;
    updateImages();
  });

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const target = event.target;
    if (target instanceof HTMLElement && (
      target.isContentEditable || target.closest('input, textarea, select, button, a')
    )) return;

    if (event.code === 'Space') {
      if (event.repeat) return;
      event.preventDefault();
      toggleModelAnimation();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prevTimeBtn.click();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextTimeBtn.click();
    }
  });

  if (minus12TimeBtn) {
    minus12TimeBtn.addEventListener('click', () => {
      stopModelAnimation();
      offsetFromNow -= 6;
      updateImages();
    });
  }

  if (plus12TimeBtn) {
    plus12TimeBtn.addEventListener('click', () => {
      stopModelAnimation();
      offsetFromNow += 6;
      updateImages();
    });
  }

  if (hourPickerSlider) {
    hourPickerSlider.addEventListener('input', (e) => {
      stopModelAnimation();
      const stepVal = parseInt(e.target.value, 10);
      offsetFromNow = stepVal + 1;
      updateImages();
    });
  }

  if (datePickerSelect) {
    datePickerSelect.addEventListener('change', () => {
      if (!datePickerSelect.value) return;
      stopModelAnimation();

      const selectedDate = new Date(datePickerSelect.value);
      selectedDate.setMinutes(0, 0, 0);

      const now = new Date();
      now.setMinutes(0, 0, 0);

      const diffMs = selectedDate.getTime() - now.getTime();
      offsetFromNow = Math.round(diffMs / (1000 * 60 * 60));

      updateImages();
    });
  }

  buildSliderTicks();

  renderModelCheckboxes();
  detectRegionRuns(regionSelect.value);

  let lastMeteogramData = null;
  let meteogramChartInstance = null;
  let lastMeteogramLocation = null;


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
  lastMeteogramLocation = { latitude, longitude, locationName };
  const modelParam = document.getElementById('meteogramModelSelect').value;
  const loadingEl = document.getElementById('meteogramLoading');
  loadingEl.classList.remove('hidden');

  try {
const [modelName, extraParams] = modelParam.split('&');
    let url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&hourly=temperature_2m,dew_point_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_850hPa,cloud_cover,weather_code&models=${modelName}&cell_selection=nearest&timezone=auto`;
    if (extraParams) url += `&${extraParams}`;

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

document.getElementById('meteogramModelSelect').addEventListener('change', () => {
  if (lastMeteogramLocation) {
    const { latitude, longitude, locationName } = lastMeteogramLocation;
    fetchMeteogramForCoords(latitude, longitude, locationName);
  }
});

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
  const loadingEl = document.getElementById('meteogramLoading');
  loadingEl.classList.remove('hidden');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      document.getElementById('citySearchInput').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      await fetchMeteogramForCoords(lat, lon, 'Ubicación GPS actual');
    },
    () => {
      loadingEl.classList.add('hidden');
      alert('No se pudo obtener la ubicación GPS.');
    },
    GEOLOCATION_OPTIONS
  );
});


function renderMeteogramChart(data) {
  const ctx = document.getElementById('meteogramChart')?.getContext('2d');
  if (!ctx) return;

  if (meteogramChartInstance) {
    meteogramChartInstance.destroy();
  }

  const hourly = data.hourly;
  const labels = hourly.time.map(t => {
    const d = new Date(t);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const hours = String(d.getHours()).padStart(2, '0');
    const timeStr = `${hours}:00`;

    if (timeStr === '00:00') {
      return `${day}/${month} 00:00`;
    }
    return `${day}/${month} ${timeStr}`;
  });

  const weatherIconsPlugin = {
    id: 'weatherIcons',
    afterDraw: (chart) => {
      const { ctx, chartArea: { left, right }, scales: { x } } = chart;
      ctx.save();
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      
      hourly.weather_code.forEach((code, index) => {
        const xPos = x.getPixelForValue(index);
        if (xPos >= left && xPos <= right) {
          const icon = wmoIconMap[code] || '❓';
          ctx.fillText(icon, xPos, 20);
        }
      });
      ctx.restore();
    }
  };

  const totalHours = data.hourly.time.length;
  const chartContainer = document.getElementById('meteogramChartWrapper');
  const canvas = document.getElementById('meteogramChart');

  if (chartContainer && canvas) {
    const pxPerHour = 20;
    const fixedHeight = 500;
    const computedWidth = totalHours * pxPerHour;

    chartContainer.style.width = `${computedWidth}px`;
    chartContainer.style.height = `${fixedHeight}px`;

    canvas.removeAttribute('width');
    canvas.removeAttribute('height');

    canvas.style.width = `${computedWidth}px`;
    canvas.style.height = `${fixedHeight}px`;
    canvas.width = computedWidth;
    canvas.height = fixedHeight;
  }

  meteogramChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Precipitación (mm)',
          data: hourly.precipitation,
          backgroundColor: 'rgba(56, 189, 248, 0.6)',
          borderColor: '#38bdf8',
          borderWidth: 1,
          yAxisID: 'yPrecip',
          type: 'bar'
        },
        {
          label: 'Temperatura 2m (°C)',
          data: hourly.temperature_2m,
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
          yAxisID: 'yTemp',
          type: 'line'
        },
        {
          label: 'Temperatura sensación (°C)',
          data: hourly.apparent_temperature,
          borderColor: '#efb044',
          backgroundColor: '#efb044',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
          yAxisID: 'yTemp',
          type: 'line'
        }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 30 }
      },
      scales: {
        x: {
          ticks: { 
            color: '#94a3b8',
            autoSkip: false
          },
          grid: {
            color: (context) => {
              const label = context.chart.data.labels[context.index];
              if (label && label.includes('00:00')) {
                return 'rgba(0, 212, 255, 0.6)';
              }
              return 'rgba(255, 255, 255, 0.05)';
            },
            lineWidth: (context) => {
              const label = context.chart.data.labels[context.index];
              return label && label.includes('00:00') ? 1.5 : 1;
            }
          }
        },
        yTemp: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Temperatura 2m (°C)', color: '#ef4444' },
          ticks: { color: '#ef4444' },
          grid: { color: '#334155' }
        },
        yPrecip: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          title: { display: true, text: 'Precipitación (mm)', color: '#38bdf8' },
          ticks: { color: '#38bdf8' },
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#f8fafc' }
        }
      }
    },
    plugins: [weatherIconsPlugin]
  });
}

function updateMeteogramView() {
  const mode = document.getElementById('meteogram-mode').value;
  const chartWrapper = document.getElementById('meteogramChartWrapper');
  const table = document.getElementById('meteogramTable');

  if (mode === 'MeteoGraph') {
    chartWrapper.classList.remove('hidden');
    table.classList.add('hidden');
    if (lastMeteogramData) renderMeteogramChart(lastMeteogramData);
  } else {
    chartWrapper.classList.add('hidden');
    table.classList.remove('hidden');
  }
}

document.getElementById('meteogram-mode').addEventListener('change', updateMeteogramView);

function renderMeteogram(data) {
  lastMeteogramData = data;
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

  updateMeteogramView();
}

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
      const selectedRunStr = runSelect ? runSelect.value : getLatestAvailableRun(model);
      const runHourUtc = parseInt(selectedRunStr.substring(8, 10), 10);

      const now = new Date();
      const remainingHours = getModelMaxHour(model, runHourUtc) - getRunElapsedHours(selectedRunStr, now);
      const limitDate = new Date(now.getTime() + remainingHours * 60 * 60 * 1000);

      const warningThresholdMs = 3 * 60 * 60 * 1000;

      btn.classList.remove('disabled-model', 'warning-model');

      if (targetDate > limitDate) {
        btn.classList.add('disabled-model');
      } else if (limitDate.getTime() - targetDate.getTime() <= warningThresholdMs) {
        btn.classList.add('warning-model');
      }
    }
  });
}

});

const compareModal = document.getElementById('modelCompareModal');
  const openCompareBtn = document.getElementById('models-comparasion');
  const closeCompareBtn = document.getElementById('closeCompareBtn');
  const fetchCompareBtn = document.getElementById('fetchCompareBtn');
  const compareUseLocationBtn = document.getElementById('compareUseLocationBtn');
  const compareCitySearchInput = document.getElementById('compareCitySearchInput');
  const compareVariableSelect = document.getElementById('compareVariableSelect');
  const compareLoading = document.getElementById('compareLoading');

  const COMPARE_MODELS = [
    { key: 'ecmwf_ifs', label: 'ECMWF' },
    { key: 'dwd_icon_seamless', label: 'ICON' },
    { key: 'meteofrance_seamless', label: 'ARPEGE-AROME' },
    { key: 'ncep_gfs_seamless', label: 'GFS' },
    { key: 'ukmo_seamless', label: 'UKMO' }
  ];

  let lastCompareCoords = null;
  let compareChartInstance = null;

  if (openCompareBtn) {
    openCompareBtn.addEventListener('click', () => {
      compareModal.classList.remove('hidden');
    });
  }

  if (closeCompareBtn) {
    closeCompareBtn.addEventListener('click', () => {
      compareModal.classList.add('hidden');
    });
  }

  async function fetchCompareData(lat, lon, locationName = '') {
    lastCompareCoords = { lat, lon, locationName };
    compareLoading.classList.remove('hidden');

    const variable = compareVariableSelect.value;
    const modelKeys = COMPARE_MODELS.map(m => m.key).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${variable}&models=${modelKeys}&timezone=auto`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.reason || 'Error de Open-Meteo');
      data.locationName = locationName;
      renderCompareChart(data, variable);
    } catch (err) {
      alert('Error al obtener datos del comparador de modelos');
    } finally {
      compareLoading.classList.add('hidden');
    }
  }

  function renderCompareChart(data, variable) {
    const hourly = data.hourly;
    if (!hourly || !hourly.time) return;

    const chartWrapper = document.getElementById('compareChartWrapper');
    const canvas = document.getElementById('compareChart');
    const ctx = canvas?.getContext('2d');
    if (!chartWrapper || !canvas || !ctx) return;

    if (compareChartInstance) compareChartInstance.destroy();

    const labels = hourly.time.map(time => {
      const date = new Date(time);
      const hour = String(date.getHours()).padStart(2, '0');
      return hour === '00'
        ? `${date.getDate()}/${date.getMonth() + 1} ${hour}:00`
        : `${hour}:00`;
    });
    const colors = ['#38bdf8', '#fb546d', '#faeb15', '#1aed67', '#cf6edb'];
    const modelValues = COMPARE_MODELS.map(model => hourly[`${variable}_${model.key}`] || []);
    const meanValues = labels.map((_, index) => {
      const values = modelValues
        .map(series => series[index])
        .filter(value => value !== null && value !== undefined && Number.isFinite(value));
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    });

    const totalHours = labels.length;
    const chartWidth = Math.max(800, totalHours * 20);
    chartWrapper.style.width = `${chartWidth}px`;
    chartWrapper.style.height = '500px';
    canvas.width = chartWidth;
    canvas.height = 500;
    canvas.style.width = `${chartWidth}px`;
    canvas.style.height = '500px';

    const variableLabels = {
      temperature_2m: 'Temperatura 2m (°C)',
      precipitation: 'Precipitación (mm)',
      wind_speed_10m: 'Viento (km/h)',
      wind_gusts_10m: 'Rachas de viento (km/h)',
      cloud_cover: 'Nubosidad (%)',
      dew_point_2m: 'Punto de rocío (°C)'
    };

    const datasets = COMPARE_MODELS.map((model, index) => ({
      label: model.label,
      data: modelValues[index].map(value => value ?? null),
      borderColor: colors[index],
      backgroundColor: colors[index],
      borderWidth: 1,
      pointRadius: 0,
      pointHitRadius: 8,
      tension: 0.2,
      spanGaps: false
    }));
    datasets.push({
      label: 'Media',
      data: meanValues,
      borderColor: '#ffffff',
      backgroundColor: '#ffffff',
      borderWidth: 6,
      pointRadius: 0,
      pointHitRadius: 9,
      tension: 0.2,
      spanGaps: false
    });

    compareChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 12, right: 18, bottom: 8 } },
        scales: {
          x: {
            ticks: { color: '#94a3b8', autoSkip: false },
            grid: {
              color: context => labels[context.index]?.includes('00:00')
                ? 'rgba(56, 189, 248, 0.5)'
                : 'rgba(255, 255, 255, 0.05)',
              lineWidth: context => labels[context.index]?.includes('00:00') ? 1.5 : 1
            }
          },
          y: {
            title: {
              display: true,
              text: variableLabels[variable] || variable,
              color: '#cbd5e1'
            },
            ticks: { color: '#cbd5e1' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ...(variable === 'precipitation' ? { beginAtZero: true } : {}),
            ...(variable === 'cloud_cover' ? { min: 0, max: 100 } : {})
          }
        },
        plugins: {
          legend: { labels: { color: '#f8fafc', usePointStyle: true, pointStyle: 'line' } },
          tooltip: { mode: 'index', intersect: false },
          title: {
            display: Boolean(data.locationName),
            text: data.locationName || '',
            color: '#cbd5e1',
            align: 'start'
          }
        }
      }
    });
  }

  fetchCompareBtn.addEventListener('click', async () => {
    const query = compareCitySearchInput.value.trim();
    if (!query) {
      if (lastCompareCoords) {
        fetchCompareData(lastCompareCoords.lat, lastCompareCoords.lon, lastCompareCoords.locationName);
      }
      return;
    }

    const coordMatch = query.match(/^([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      await fetchCompareData(lat, lon, `Coordenadas manuales (${lat}, ${lon})`);
      return;
    }

    compareLoading.classList.remove('hidden');
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        alert('Población no encontrada');
        return;
      }

      const place = geoData.results.find(r => r.country_code === 'ES') || geoData.results[0];
      const placeName = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
      await fetchCompareData(place.latitude, place.longitude, placeName);
    } catch (err) {
      alert('Error en la búsqueda geográfica');
    } finally {
      compareLoading.classList.add('hidden');
    }
  });

  compareUseLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador.');
      return;
    }
    compareLoading.classList.remove('hidden');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        compareCitySearchInput.value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        await fetchCompareData(lat, lon, 'Ubicación GPS actual');
      },
      () => {
        compareLoading.classList.add('hidden');
        alert('No se pudo obtener la ubicación GPS.');
      },
      GEOLOCATION_OPTIONS
    );
  });

  compareVariableSelect.addEventListener('change', () => {
    if (lastCompareCoords) {
      fetchCompareData(lastCompareCoords.lat, lastCompareCoords.lon, lastCompareCoords.locationName);
    }
  });
