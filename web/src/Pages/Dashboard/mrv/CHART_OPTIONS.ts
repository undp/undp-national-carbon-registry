import { addCommSepRound } from '@undp/carbon-library';

export const getChartOptions = (labels: string[], colors: string[]) => {
  return {
    states: {
      normal: {
        filter: {
          type: 'none',
          value: 0,
        },
      },
      hover: {
        filter: {
          type: 'none',
          value: 0,
        },
      },
      active: {
        allowMultipleDataPointsSelection: true,
        filter: {
          type: 'darken',
          value: 0.7,
        },
      },
    },
    chart: {
      type: 'donut',
    },
    dataLabels: {
      enabled: false,
    },
    colors: colors,
    labels: labels,
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          labels: {
            show: true,
            total: {
              showAlways: true,
              show: true,
              label: 'Total',
              formatter: function (w: any) {
                return addCommSepRound(
                  w.globals.seriesTotals.reduce((a: number, b: number) => {
                    return a + b;
                  }, 0)
                );
              },
            },
            value: {
              formatter: (value: any) => {
                return addCommSepRound(value);
              },
            },
          },
        },
      },
    },
    legend: {
      show: true,
      showForSingleSeries: false,
      showForNullSeries: true,
      showForZeroSeries: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '14px',
      fontFamily: 'Inter',
      fontWeight: 400,
      formatter: undefined,
      inverseOrder: false,
      width: undefined,
      height: undefined,
      tooltipHoverFormatter: undefined,
      customLegendItems: [],
      offsetX: 0,
      offsetY: 5,
      labels: {
        colors: colors,
        useSeriesColors: false,
      },
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        strokeColor: '#fff',
        fillColors: colors,
        radius: 12,
        customHTML: undefined,
        onClick: undefined,
        offsetX: 0,
        offsetY: 0,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 3,
      },
      onItemClick: {
        toggleDataSeries: true,
      },
      onItemHover: {
        highlightDataSeries: true,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
    tooltip: {
      enabled: true,
      y: {
        formatter: function (value: any) {
          return addCommSepRound(value);
        },
      },
    },
  };
};
