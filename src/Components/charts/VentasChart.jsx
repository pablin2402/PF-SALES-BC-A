import React, { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

const PALETTE = [
  "#D3423E", // brand red
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#84CC16", // lime
  "#6366F1", // indigo
  "#14B8A6", // teal
  "#F43F5E", // rose
];

const VentasChart = ({ labels = [], values = [], year, title }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chartOptions = {
      chart: {
        type: "bar",
        height: 380,
        toolbar: { show: false },
        background: "transparent",
        fontFamily: "inherit",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 900,
          animateGradually: { enabled: true, delay: 80 },
        },
        dropShadow: {
          enabled: true,
          top: 4,
          left: 0,
          blur: 10,
          color: "#D3423E",
          opacity: 0.1,
        },
      },
      ...(title && {
        title: {
          text: title,
          align: "left",
          margin: 0,
          style: {
            fontSize: "15px",
            fontWeight: "700",
            color: "#111827",
            fontFamily: "inherit",
          },
        },
      }),
      ...(year && {
        subtitle: {
          text: `Año ${year}`,
          align: "left",
          style: {
            fontSize: "12px",
            fontWeight: "500",
            color: "#6b7280",
            fontFamily: "inherit",
          },
        },
      }),
      plotOptions: {
        bar: {
          distributed: true,
          borderRadius: 8,
          borderRadiusApplication: "end",
          horizontal: false,
          columnWidth: "55%",
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.35,
          opacityFrom: 1,
          opacityTo: 0.78,
          stops: [0, 90, 100],
        },
      },
      colors: PALETTE,
      dataLabels: {
        enabled: true,
        formatter: (val) =>
          typeof val === "number" ? val.toLocaleString() : val,
        offsetY: -22,
        style: {
          fontSize: "11px",
          fontWeight: "700",
          colors: ["#374151"],
          fontFamily: "inherit",
        },
        background: {
          enabled: false,
        },
      },
      grid: {
        show: true,
        borderColor: "#f3f4f6",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 10, right: 12, bottom: 0, left: 12 },
      },
      xaxis: {
        categories: labels,
        labels: {
          rotate: -35,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          maxHeight: 80,
          style: {
            fontSize: "11px",
            fontWeight: "600",
            colors: "#6b7280",
            fontFamily: "inherit",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        title: {
          text: "Unidades vendidas",
          style: {
            fontSize: "11px",
            fontWeight: "600",
            color: "#6b7280",
            fontFamily: "inherit",
          },
        },
        labels: {
          style: {
            fontSize: "11px",
            colors: "#9ca3af",
            fontFamily: "inherit",
          },
          formatter: (val) =>
            typeof val === "number" ? val.toLocaleString() : val,
        },
      },
      legend: { show: false },
      series: [
        {
          name: "Unidades",
          data: values,
        },
      ],
      states: {
        hover: { filter: { type: "darken", value: 0.88 } },
        active: { filter: { type: "darken", value: 0.78 } },
      },
      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const category = w.globals.labels[dataPointIndex];
          const value = series[seriesIndex][dataPointIndex];
          const color = w.globals.colors[dataPointIndex];
          const formatted =
            typeof value === "number" ? value.toLocaleString() : value;
          return `
            <div style="
              background: #ffffff;
              padding: 10px 14px;
              border-radius: 12px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.08);
              border: 1px solid #f3f4f6;
              font-family: inherit;
              min-width: 140px;
            ">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;box-shadow:0 0 0 3px ${color}22;"></span>
                <span style="color:#374151;font-weight:700;font-size:12px;">${category}</span>
              </div>
              <div style="color:#111827;font-weight:800;font-size:20px;line-height:1.1;">
                ${formatted}
                <span style="color:#9ca3af;font-size:11px;font-weight:600;margin-left:4px;">unidades</span>
              </div>
            </div>
          `;
        },
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: { height: 320 },
            plotOptions: { bar: { columnWidth: "70%", borderRadius: 6 } },
            xaxis: { labels: { rotate: -45, style: { fontSize: "10px" } } },
            dataLabels: { style: { fontSize: "10px" } },
            yaxis: { title: { text: "" } },
          },
        },
      ],
    };

    const chart = new ApexCharts(chartRef.current, chartOptions);
    chart.render();

    return () => {
      chart.destroy();
    };
  }, [labels, values, year, title]);

  return <div ref={chartRef} />;
};

export default VentasChart;