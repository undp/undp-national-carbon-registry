export const seriesX = [
  {
    name: 'Land',
    data: [3, 5, 2, 5, 3, 5, 3, 2],
  },
  {
    name: 'Agriculture',
    data: [2, 2, 6, 1, 6, 2, 6, 2],
  },
  {
    name: 'Manufacturing',
    data: [2, 4, 3, 3, 2, 3, 5, 4],
  },
  {
    name: 'Forest',
    data: [3, 2, 3, 4, 2, 1, 3, 3],
  },
  {
    name: 'Energy',
    data: [2, 4, 2, 4, 2, 5, 2, 2],
  },
];

export const seriesA = [
  {
    name: 'Rice crops',
    data: [8, 5, 2, 4, 9, 2, 2, 3],
  },
  {
    name: 'CO&#8322; Recycling',
    data: [4, 5, 4, 5, 2, 4, 4, 6],
  },
  {
    name: 'Agriculture',
    data: [4, 3, 2, 3, 2, 2, 2, 4],
  },
  {
    name: 'Iron & steel',
    data: [2, 2, 2, 6, 2, 5, 4, 3],
  },
  {
    name: 'Solar & hydro',
    data: [4, 7, 6, 3, 4, 3, 3, 7],
  },
];

export const totalProgrammesOptions: any = {
  states: {
    active: {
      filter: {
        type: 'none',
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
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
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
      colors: ['#4FB8E7', '#FF8183', '#D8D8D8'],
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
    active: {
      filter: {
        type: 'none',
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
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
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
    active: {
      filter: {
        type: 'none',
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
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
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
  },
  fill: {
    opacity: 1,
    colors: ['#4FB8E7', '#7FEABF', '#D8D8D8', '#FF8183'],
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
      colors: ['#4FB8E7', '#7FEABF', '#D8D8D8', '#FF8183'],
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['#4FB8E7', '#7FEABF', '#D8D8D8', '#FF8183'],
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
    active: {
      filter: {
        type: 'none',
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
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
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
      colors: ['#6ACDFF', '#FF8183', '#CDCDCD'],
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

export const seriesY = [
  {
    name: 'Authorised',
    data: [44, 55, 41, 67, 22, 43, 21, 49],
  },
  {
    name: 'Rejected',
    data: [13, 23, 20, 8, 13, 27, 33, 12],
  },
  {
    name: 'Pending',
    data: [11, 17, 15, 15, 21, 14, 15, 13],
  },
];

export const seriesZ = [
  {
    name: 'Authorised',
    data: [22, 31, 41, 67, 22, 40, 21, 11],
  },
  {
    name: 'Rejected',
    data: [13, 12, 20, 15, 23, 27, 43, 12],
  },
  {
    name: 'Pending',
    data: [11, 23, 15, 33, 21, 14, 15, 13],
  },
];

export const optionsP: any = {
  chart: {
    type: 'pie',
    height: 400,
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
      fontFamily: 'Inter-Regular',
      color: '#263238',
    },
  },
  fill: {
    opacity: 1,
    colors: ['#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
  },
  labels: ['Energy', 'Manufacturing', 'Agriculture', 'Forest', 'Land'],
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: 'bottom',
    horizontalAlign: 'center',
    floating: false,
    fontSize: '14px',
    fontFamily: 'Inter-Regular',
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
      colors: ['#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
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
    fillSeriesColor: ['#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
  },
  colors: ['#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
};

export const optionsQ: any = {
  chart: {
    type: 'pie',
    height: 400,
  },
  title: {
    text: 'Overall Rejected Programmes',
    align: 'left',
    margin: 10,
    offsetX: 0,
    offsetY: 0,
    floating: false,
    style: {
      fontSize: '16px',
      fontWeight: 'bold',
      fontFamily: 'Inter-Regular',
      color: '#263238',
    },
  },
  fill: {
    opacity: 1,
    colors: ['#A8006D', '#D3014C', '#FF3701', '#FFAB00', '#FDE725'],
  },
  labels: ['Energy', 'Manufacturing', 'Agriculture', 'Forest', 'Land'],
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: 'right',
    horizontalAlign: 'center',
    floating: false,
    fontSize: '14px',
    fontFamily: 'Inter-Regular',
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
      colors: ['#A8006D', '#D3014C', '#FF3701', '#FFAB00', '#FDE725'],
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['#A8006D', '#D3014C', '#FF3701', '#FFAB00', '#FDE725'],
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
  colors: ['#A8006D', '#D3014C', '#FF3701', '#FFAB00', '#FDE725'],
};

export const optionDonutPieA: any = {
  chart: {
    type: 'donut',
  },
  dataLabels: {
    enabled: false,
  },
  colors: ['#6ACDFF', '#7FEABF', '#CDCDCD', '#FF8183'],
  labels: ['Authorised', 'Issued', 'Transfered', 'Retired'],
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
    horizontalAlign: 'left',
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
    offsetX: 20,
    offsetY: 5,
    labels: {
      colors: ['#6ACDFF', '#7FEABF', '#CDCDCD', '#FF8183'],
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['#6ACDFF', '#7FEABF', '#CDCDCD', '#FF8183'],
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
    horizontalAlign: 'left',
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
    offsetX: 15,
    offsetY: 5,
    labels: {
      colors: ['#6ACDFF', '#FF8183', '#CDCDCD'],
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
