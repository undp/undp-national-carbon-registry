import { addCommSepRound } from '../../Definitions/Definitions/programme.definitions';

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
    enabled: false,
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
  },
  yaxis: {
    show: true,
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
    colors: ['#4FB8E7', '#FF8183', '#D8D8D8'],
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
      fillColors: ['#4FB8E7', '#FF8183', '#D8D8D8'],
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

export const totalProgrammesOptionsSub: any = {
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
    colors: [
      '#16B1FF',
      '#FF8183',
      '#7FEABF',
      '#FFB480',
      '#666699',
      '#009999',
      '#c2c2d6',
      '#ddddbb',
      '#ff9900',
      '#D8D8D8',
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
        '#16B1FF',
        '#FF8183',
        '#7FEABF',
        '#FFB480',
        '#666699',
        '#009999',
        '#c2c2d6',
        '#ddddbb',
        '#ff9900',
        '#D8D8D8',
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
export const totalCreditsOptions: any = {
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
  },
  yaxis: {
    show: true,
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
    colors: ['#4FB8E7', '#7FEABF', '#D8D8D8', '#FF8183', '#B7A4FE'],
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
      fillColors: ['#4FB8E7', '#7FEABF', '#D8D8D8', '#FF8183', '#B7A4FE'],
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

export const totalCreditsCertifiedOptions: any = {
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
  },
  yaxis: {
    show: true,
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
    colors: ['#6ACDFF', '#FF8183', '#CDCDCD'],
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
      fillColors: ['#6ACDFF', '#FF8183', '#CDCDCD'],
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
  colors: ['#6ACDFF', '#7FEABF', '#CDCDCD', '#FF8183', '#B7A4FE'],
  labels: ['Authorised', 'Issued', 'Transferred', 'Retired', 'Frozen'],
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
      fillColors: ['#6ACDFF', '#7FEABF', '#CDCDCD', '#FF8183', '#B7A4FE'],
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
};

export const optionDonutPieB: any = {
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
  colors: ['#6ACDFF', '#FF8183', '#CDCDCD'],
  labels: ['Certified', 'Uncertified', 'Revoked'],
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
      fillColors: ['#6ACDFF', '#FF8183', '#CDCDCD'],
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
};
