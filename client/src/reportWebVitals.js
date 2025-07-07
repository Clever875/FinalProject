// reportWebVitals.js

/**
 * Отправляет метрики производительности в аналитическую систему
 * @param {function} onPerfEntry - Функция обратного вызова для обработки метрик
 * @param {object} options - Дополнительные опции
 * @param {boolean} [options.logToConsole=false] - Логировать метрики в консоль
 * @param {string} [options.endpoint] - URL для отправки метрик
 * @param {object} [options.additionalMetrics] - Дополнительные метрики для сбора
 */
const reportWebVitals = (onPerfEntry, options = {}) => {
  // Если нет функции обратного вызова, ничего не делаем
  if (!onPerfEntry || typeof onPerfEntry !== 'function') return;

  // Деструктурируем опции
  const {
    logToConsole = false,
    endpoint,
    additionalMetrics = {}
  } = options;

  // Импортируем web-vitals динамически
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB, ...rest }) => {
    // Основные метрики
    const coreMetrics = [
      { name: 'CLS', fn: getCLS },
      { name: 'FID', fn: getFID },
      { name: 'FCP', fn: getFCP },
      { name: 'LCP', fn: getLCP },
      { name: 'TTFB', fn: getTTFB }
    ];

    // Дополнительные метрики
    const extraMetrics = Object.entries(additionalMetrics).map(
      ([name, fn]) => ({ name, fn })
    );

    // Все метрики
    const allMetrics = [...coreMetrics, ...extraMetrics];

    // Обработка каждой метрики
    allMetrics.forEach(({ name, fn }) => {
      fn(metric => {
        // Обработка метрики
        onPerfEntry(metric);

        // Логирование в консоль
        if (logToConsole) {
          console.log(`[Web Vitals] ${name}:`, metric);
        }

        // Отправка на сервер
        if (endpoint) {
          sendMetricToServer(metric, endpoint);
        }
      });
    });

    // Логирование успешной инициализации
    if (logToConsole) {
      console.log('[Web Vitals] Tracking initialized');
    }
  }).catch(error => {
    console.error('[Web Vitals] Failed to initialize:', error);
  });
};

/**
 * Отправляет метрику на сервер
 * @param {object} metric - Объект метрики
 * @param {string} endpoint - URL для отправки
 */
function sendMetricToServer(metric, endpoint) {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      });
    }
  } catch (error) {
    console.error('[Web Vitals] Failed to send metric:', error);
  }
}

export default reportWebVitals;
