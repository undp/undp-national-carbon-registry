import { addCommSepRound } from '../../Definitions/Definitions/programme.definitions';

//MARK: Projects by status - Details
export const totalProgrammesOptions: any = {
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
  dataLabels: {
    enabled: true,
    offsetY: -20, // Adjust to position the label above the bar
    style: {
      fontSize: '12px',
      colors: ['#000'], // Optional: Customize label color
      fontWeight: 500,
    },
  },
  plotOptions: {
    bar: {
      dataLabels: {
        position: 'top', // Positions the label on top of the bar
      },
    },
  },
  chart: {
    type: 'bar',
    height: 400,
    stacked: true,
    stackType: 'normal',
    toolbar: {
      show: false, // Disables the toolbar, removing zoom, pan, and home icons
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0,
        },
      },
    },
  ],
  xaxis: {
    categories: [],
    labels: {
      style: {
        fontSize: '10px',
      },
    },
  },
  yaxis: {
    show: true,
    axisBorder: {
      show: true, // Enable the Y-axis line
      width: 1, // Thickness of the axis line
    },
    title: {
      text: '',
      rotate: -90,
      offsetX: 0,
      offsetY: 0,
      style: {
        color: '#263238',
        fontSize: '10px',
        fontFamily: 'Inter-Regular',
        fontWeight: 500,
        cssClass: 'apexcharts-yaxis-title',
      },
    },
    labels: {
      formatter: (value: any) => {
        return addCommSepRound(value);
      },
    },
  },
  noData: {
    text: 'No data available', // Message to display
    align: 'center', // Horizontal alignment
    verticalAlign: 'middle', // Vertical alignment
    style: {
      fontSize: '16px',
      color: '#999',
    },
  },
  fill: {
    opacity: 1,
    colors: [
      'rgba(72, 150, 254, 1)',
      'rgba(72, 150, 254, 1)',
      'rgba(255, 99, 97, 1)',
      'rgba(72, 150, 254, 1)',
      'rgba(72, 150, 254, 1)',
      'rgba(255, 99, 97, 1)',
      'rgba(72, 150, 254, 1)',
      'rgba(72, 150, 254, 1)',
      'rgba(72, 150, 254, 1)',
      'rgba(72, 150, 254, 1)',
      'rgba(72, 150, 254, 1)',
      'rgba(22, 200, 199, 1)',
    ],
  },
  title: {
    text: '',
    align: 'left',
    margin: 10,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
      fontFamily: 'Inter',
      color: '#263238',
    },
  },
  legend: {
    show: false,
    showForSingleSeries: false,
    showForNullSeries: false,
    showForZeroSeries: false,
    position: 'right',
    horizontalAlign: 'left',
    floating: false,
    fontSize: '10px',
    fontFamily: 'Inter',
    fontWeight: 400,
    // formatter: undefined,
    inverseOrder: false,
    width: undefined,
    height: undefined,
    tooltipHoverFormatter: undefined,
    // customLegendItems: [],
    offsetX: 0,
    offsetY: 5,
    labels: {
      colors: '#000000d9',
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: [
        'rgba(72, 150, 254, 1)',
        'rgba(72, 150, 254, 1)',
        'rgba(255, 99, 97, 1)',
        'rgba(72, 150, 254, 1)',
        'rgba(72, 150, 254, 1)',
        'rgba(255, 99, 97, 1)',
        'rgba(72, 150, 254, 1)',
        'rgba(72, 150, 254, 1)',
        'rgba(72, 150, 254, 1)',
        'rgba(72, 150, 254, 1)',
        'rgba(72, 150, 254, 1)',
        'rgba(22, 200, 199, 1)',
      ],
      radius: 12,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0,
    },
    itemMargin: {
      horizontal: 5,
      vertical: 0,
    },
    onItemClick: {
      toggleDataSeries: true,
    },
    onItemHover: {
      highlightDataSeries: true,
    },
  },
};

//MARK: Retirements by Date
export const retirementsByDateOptions: any = {
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
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '12px',
      colors: ['#000'],
      fontWeight: 500,
    },
  },
  annotations: {
    points: [],
  },
  chart: {
    type: 'bar',
    height: 400,
    stacked: true,
    stackType: 'normal',
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0,
        },
      },
    },
  ],
  xaxis: {
    categories: [],
    labels: {
      rotatealways: true,
    },
  },
  yaxis: {
    show: true,
    axisBorder: {
      show: true, // Enable the Y-axis line
      width: 1, // Thickness of the axis line
    },
    title: {
      text: '',
      rotate: -90,
      offsetX: 0,
      offsetY: 0,
      style: {
        color: '#263238',
        fontSize: '12px',
        fontFamily: 'Inter',
        fontWeight: 500,
        cssClass: 'apexcharts-yaxis-title',
      },
    },
    labels: {
      formatter: (value: any) => {
        return addCommSepRound(value);
      },
    },
  },
  fill: {
    opacity: 1,
    colors: ['rgba(255, 99, 97, 1)', 'rgba(72, 150, 254, 1)'],
  },
  title: {
    text: '',
    align: 'left',
    margin: 10,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
      fontFamily: 'Inter',
      color: '#263238',
    },
  },
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: false,
    showForZeroSeries: false,
    position: 'right',
    horizontalAlign: 'center',
    floating: false,
    fontSize: '12px',
    fontFamily: 'Inter',
    fontWeight: 400,
    inverseOrder: false,
    width: undefined,
    height: undefined,
    tooltipHoverFormatter: undefined,
    customLegendItems: ['Retirements', 'Transfers'],
    offsetX: 0,
    offsetY: 5,
    labels: {
      colors: '#000000d9',
      useSeriesColors: false,
    },
    formatter: function (seriesName: any) {
      // Return the legend item with added margin-top
      return `<span style="display: inline-block; margin-top: 10px; padding-left: 5px; color: rgba(140, 140, 140, 1);">${seriesName}</span>`;
    },
    markers: {
      width: 8,
      height: 8,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['rgba(255, 99, 97, 1)', 'rgba(72, 150, 254, 1)'],
      radius: 2,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0,
    },
    itemMargin: {
      horizontal: 5,
      vertical: 0,
    },
    onItemClick: {
      toggleDataSeries: false,
    },
    onItemHover: {
      highlightDataSeries: true,
    },
  },
};

//MARK: Credits by Date
export const creditsByDateOptions: any = {
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
  dataLabels: {
    enabled: false,
    formatter: function (val: any) {
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}k`;
      }
      return val;
    },
    style: {
      fontSize: '10px',
      fontFamily: 'Inter',
      fontWeight: 400,
      colors: ['#000000d9'],
    },
  },
  annotations: {
    points: [],
  },
  chart: {
    type: 'bar',
    height: 400,
    stacked: true,
    stackType: 'normal',
    toolbar: {
      show: false,
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0,
        },
      },
    },
  ],
  xaxis: {
    categories: [],
  },
  yaxis: {
    show: true,
    axisBorder: {
      show: true,
      width: 1,
    },
    title: {
      text: '',
      rotate: -90,
      offsetX: 0,
      offsetY: 0,
      style: {
        color: '#263238',
        fontSize: '12px',
        fontFamily: 'Inter-Regular',
        fontWeight: 500,
        cssClass: 'apexcharts-yaxis-title',
      },
    },
    labels: {
      formatter: (value: any) => {
        return addCommSepRound(value);
      },
    },
  },
  fill: {
    opacity: 1,
    colors: [
      'rgba(72, 150, 254, 1)',
      'rgba(22, 200, 199, 1)',
      'rgba(136, 124, 253, 1)',
      'rgba(255, 99, 97, 1)',
    ],
  },
  title: {
    text: '',
    align: 'left',
    margin: 10,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
      fontFamily: 'Inter',
      color: '#263238',
    },
  },
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: false,
    showForZeroSeries: false,
    position: 'bottom',
    horizontalAlign: 'left',
    floating: false,
    fontSize: '12px',
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
      colors: '#000000d9',
      useSeriesColors: false,
    },
    markers: {
      width: 8,
      height: 8,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: [
        'rgba(72, 150, 254, 1)',
        'rgba(22, 200, 199, 1)',
        'rgba(136, 124, 253, 1)',
        'rgba(255, 99, 97, 1)',
      ],
      radius: 2,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0,
    },
    itemMargin: {
      horizontal: 5,
      vertical: 0,
    },
    onItemClick: {
      toggleDataSeries: false,
    },
    onItemHover: {
      highlightDataSeries: true,
    },
  },
};

//MARK: Credits by Purpose
export const creditsByPurposeOptions: any = {
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
  dataLabels: {
    enabled: false,
    formatter: function (val: any) {
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}k`; // Convert to 'k' format for values >= 1000
      }
      return val; // For smaller values, show the original number
    },
    style: {
      fontSize: '10px',
      fontFamily: 'Inter',
      fontWeight: 400,
      colors: ['#000000d9'], // Customize label color
    },
  },
  annotations: {
    points: [], // To dynamically populate with totals
  },
  chart: {
    type: 'bar',
    height: 400,
    stacked: true,
    stackType: 'normal',
    toolbar: {
      show: false, // Disables the toolbar, removing zoom, pan, and home icons
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: {
          position: 'bottom',
          offsetX: -10,
          offsetY: 0,
        },
      },
    },
  ],
  xaxis: {
    categories: [],
  },
  yaxis: {
    show: true,
    axisBorder: {
      show: true, // Enable the Y-axis line
      width: 1, // Thickness of the axis line
    },
    title: {
      text: '',
      rotate: -90,
      offsetX: 0,
      offsetY: 0,
      style: {
        color: '#263238',
        fontSize: '12px',
        fontFamily: 'Inter-Regular',
        fontWeight: 500,
        cssClass: 'apexcharts-yaxis-title',
      },
    },
    labels: {
      formatter: (value: any) => {
        return addCommSepRound(value);
      },
    },
  },
  fill: {
    opacity: 1,
    colors: ['rgba(72, 150, 254, 1)', 'rgba(255, 99, 97, 1)'],
  },
  title: {
    text: '',
    align: 'left',
    margin: 10,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
      fontFamily: 'Inter',
      color: '#263238',
    },
  },
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: false,
    showForZeroSeries: false,
    position: 'bottom',
    horizontalAlign: 'left',
    floating: false,
    fontSize: '12px',
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
      colors: '#000000d9',
      useSeriesColors: false,
    },
    markers: {
      width: 8,
      height: 8,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['rgba(72, 150, 254, 1)', 'rgba(255, 99, 97, 1)'],
      radius: 2,
      customHTML: undefined,
      onClick: undefined,
      offsetX: 0,
      offsetY: 0,
    },
    itemMargin: {
      horizontal: 5,
      vertical: 0,
    },
    onItemClick: {
      toggleDataSeries: false,
    },
    onItemHover: {
      highlightDataSeries: true,
    },
  },
};

//MARK: Credits by Status Donut
export const optionDonutPieA: any = {
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
  colors: [
    'rgba(72, 150, 254, 1)',
    'rgba(22, 200, 199, 1)',
    'rgba(136, 124, 253, 1)',
    'rgba(255, 99, 97, 1)',
  ],
  labels: ['Renewable Energy', 'Afforestation', 'Reforestation', 'Other'],
  plotOptions: {
    pie: {
      expandOnClick: false,
      donut: {
        size: '80%',
        labels: {
          show: true,
          total: {
            showAlways: true,
            show: true,
            label: 'Total',
            formatter: () => {},
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
      colors: '#000000d9',
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: [
        'rgba(72, 150, 254, 1)',
        'rgba(22, 200, 199, 1)',
        'rgba(136, 124, 253, 1)',
        'rgba(255, 99, 97, 1)',
      ],
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
          width: 350,
        },
        legend: {
          position: 'bottom',
        },
      },
    },
  ],
};
