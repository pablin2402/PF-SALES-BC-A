import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const TrendLineChart = ({ products, limit }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    function obtenerMes(plus) {
      const date = new Date();
      date.setMonth(date.getMonth() + plus);
      return date.toLocaleString('default', { month: 'long' }).toUpperCase();
    }

    const meses = [obtenerMes(1), obtenerMes(2), obtenerMes(3)];

    const limitedProducts = limit ? products.slice(0, limit) : products;

    const series = limitedProducts.map((prod) => ({
      name: prod.nombre,
      data: prod.forecast.map((f) => f.valor)
    }));

    const options = {
      chart: {
        type: 'line',
        height: 400,
        toolbar: { show: false }
      },
      stroke: { width: 3, curve: 'smooth' },
      markers: { size: 4 },
      title: {
        text: 'Predicción de ventas por producto',
        align: 'left',
        style: { fontSize: '18px', fontWeight: 'bold', color: '#333' }
      },
      xaxis: {
        categories: meses,
        labels: { style: { fontSize: '12px' } }
      },
      yaxis: {
        title: { text: 'Unidades' }
      },
      tooltip: {
        shared: true,
        intersect: false,
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          const productName = w.globals.seriesNames[seriesIndex];
          const value = series[seriesIndex][dataPointIndex];
          const month = w.globals.categoryLabels[dataPointIndex];
          return `
            <div style="
              background: white; 
              color: black; 
              padding: 8px 12px; 
              border-radius: 8px; 
              box-shadow: 0 2px 5px rgba(0,0,0,0.15);
              font-size: 13px;
            ">
              <strong>${productName}</strong><br />
              Mes: ${month}<br />
              Unidades: ${value}
            </div>
          `;
        }
      },
      legend: {
        position: 'bottom',
        labels: { colors: '#333' }
      },
      series
    };

    const chart = new ApexCharts(chartRef.current, options);
    chart.render();

    return () => chart.destroy();
  }, [products, limit]);

  return <div ref={chartRef} />;
};

export default TrendLineChart;
