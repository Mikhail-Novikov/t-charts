'use strict';

// Создаем массив для хранения экземпляров графиков
const chartInstances = new Map();

$(document).ready(function() {
  initTableRowClickHandlers();
});

/**
 * Метод для инициализации обработчиков кликов по строкам таблицы
 */
function initTableRowClickHandlers() {
  $('.metrics-table__data-row').on('click', function() {
    const rowId = $(this).data('row-id');
    const currentDay = $(this).data('current-day');
    const yesterday = $(this).data('yesterday');
    const today = $(this).data('today');
    const label = $(this).data('label');

    const chartRow = $(`.metrics-table__chart-row[data-row-id="${rowId}"]`);
    if (!chartRow.length) return;

    if (chartRow.is(':visible')) {
      chartRow.hide();
      const existing = chartInstances.get(rowId);
      if (existing) {
        try { existing.destroy(); } catch (e) {return;}
        chartInstances.delete(rowId);
      }
      return;
    }

    // show this chart (close others first)
    hideAllCharts();
    chartRow.show();

    // рендерим график с данными из строки
    renderChart(rowId, currentDay, yesterday, today, label);
  });
}

/**
 * Метод для скрытия всех графиков
 * @returns {void}
 */
function hideAllCharts() {
  $('.metrics-table__chart-row').hide();
  
  // деактивируем графики
  chartInstances.forEach((chart) => {
    if (chart) {
      chart.destroy();
    }
  });
  chartInstances.clear();
}

/**
 * Метод для рендеринга графика
 * @param {string} rowId - id строки
 * @param {number} currentDay - текущий день
 * @param {number} yesterday - вчера
 * @param {number} today - этот день недели
 * @returns {void}
 */
function renderChart(rowId, currentDay, yesterday, today, label) {
  const canvas = $(`.metrics-table__chart-row[data-row-id="${rowId}"] .metrics-table__canvas`)[0];
  if (!canvas) return;

  // Ensure canvas has explicit display size before creating Chart.js instance
  canvas.style.width = '100%';

  // генерируем данные для графика
  const chartData = generateChartData(currentDay, yesterday, today);

  var chart = null;
  window.requestAnimationFrame(function() {
    // проверяем, виден ли график
    var chartRowEl = $(canvas).closest('.metrics-table__chart-row');
    if (!chartRowEl.length || !chartRowEl.is(':visible')) return;

    // создаем контекст графика
    const ctx = canvas.getContext('2d');

    chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.categories,
      datasets: [{
        label: label,
        data: chartData.values,
        borderColor: '#006400',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: '#006400',
        pointBorderColor: '#006400',
        pointBorderWidth: 2,
        tension: 0,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          display: true,
          border: {
            color: '#000000',
            width: 1
          },
          ticks: {
            display: true
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          border: {
            color: '#000000',
            width: 1
          },
          ticks: {
            display: true
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
    });

    // обновляем график при изменении размеров
    try { chart.resize(); } catch (e) {}

    // запоминаем экземпляр графика
    chartInstances.set(rowId, chart);
  });
}

/**
 * Метод для генерации данных для графика
 * @param currentDay - текущий день
 * @param yesterday - предыдущий день
 * @param today - текущий день
 * @returns {{values: number[], categories: string[]}}
 */
function generateChartData(currentDay, yesterday, today) {
  const minValue = 0;
  const maxValue = Math.max(currentDay, yesterday, today);

  const values = [
    minValue,
    maxValue * 0.65,
    maxValue * 0.75,
    maxValue,
    currentDay,
    yesterday,
    today
  ];

  return {
    values: values,
    categories: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  };
}
