import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const VentasChart = ({ labels = [], values = [], year }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const colors = [
      '#D3423E', '#F7A64A', '#3080ED', '#22BD3D', '#00A7C7',
      '#86BBFA', '#66BB6A', '#CEFCD0', '#FF7F7A', '#00ACC1',
      '#FFB6C1', '#FFD700', '#40E0D0', '#6A5ACD', '#FF4500'
    ];

    const chartOptions = {
      chart: {
        type: "bar",
        height: 350,
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
        },
      },
      title: {
        text: `Productos Vendidos en ${year}`,
        align: 'left',
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333'
        }
      },
      plotOptions: {
        bar: {
          distributed: true,
          borderRadius: 5,
          horizontal: false,
          columnWidth: "50%",
        },
      },
      colors: colors,
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
        },
      },
      xaxis: {
        categories: labels,
        labels: {
          rotate: -45,
          style: {
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        title: {
          text: "Cantidad vendida",
        },
      },
      series: [
        {
          name: "Cantidad",
          data: values,
        },
      ],
      tooltip: {
        y: {
          formatter: (val) => `${val} unidades`,
        },
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: { height: 300 },
            xaxis: { labels: { rotate: -30 } },
          },
        },
      ],
    };

    const chart = new ApexCharts(chartRef.current, chartOptions);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, [labels, values, year]);

  return (
    <div id="ventas-chart" ref={chartRef} />
  );
};

export default VentasChart;
