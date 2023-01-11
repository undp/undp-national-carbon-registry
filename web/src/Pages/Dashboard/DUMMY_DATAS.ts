export const DUmData = [
  {
    value: 220,
    title: 'Programmes Registered',
    updatedDate: 1669788334,
    level: '1',
  },
  {
    value: 220,
    title: 'Programmes Authorized',
    updatedDate: 1669781334,
    level: '1',
  },
  {
    value: 80,
    title: 'Programmes Rejected',
    updatedDate: 1669788334,
    level: '1',
  },
  {
    value: 72,
    title: 'Programmes Certified',
    updatedDate: 1669788334,
    level: '2',
  },
  {
    value: 25,
    title: 'Certified Credits Available',
    updatedDate: 1669763334,
    level: '2',
  },
  {
    value: 200,
    title: 'Certified Credits Transferred',
    updatedDate: 1669783334,
    level: '3',
  },
  {
    value: 22,
    title: 'Certified Credits Available',
    updatedDate: 1669783334,
    level: '3',
  },
  {
    value: 80,
    title: 'Programmes Rejected',
    updatedDate: 1669788334,
    level: '4',
  },
  {
    value: 72,
    title: 'Programmes Certified',
    updatedDate: 1669788334,
    level: '5',
  },
  {
    value: 25,
    title: 'Certified Credits Available',
    updatedDate: 1669763334,
    level: '6',
  },
  {
    value: 200,
    title: 'Certified Credits Transferred',
    updatedDate: 1669783334,
    level: '7',
  },
  {
    value: 22,
    title: 'Certified Credits Available',
    updatedDate: 1669783334,
    level: '7',
  },
];

export const options: any = {
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
    categories: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
  },
  yaxis: {
    show: true,
    title: {
      text: 'Programmes count',
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
    colors: ['#E83250', '#72B829', '#D7D8DB'],
  },
  title: {
    text: 'Total Programmes',
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
      colors: undefined,
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['#E83250', '#72B829', '#D7D8DB'],
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

export const optionsX: any = {
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
    categories: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
  },
  yaxis: {
    show: true,
    title: {
      text: 'Programmes count',
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
    colors: ['#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
  },
  title: {
    text: 'Total Programmes, Sector Wise',
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
};

export const optionsA: any = {
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
    categories: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
  },
  yaxis: {
    show: true,
    title: {
      text: 'Programmes count',
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
    colors: ['#A8006D', '#D3014C', '#FF3701', '#FFAB00', '#FDE725'],
  },
  title: {
    text: 'Total Programmes, Sub Sector Wise',
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
};

export const series = [
  {
    name: 'Approved',
    data: [2, 5, 2, 5, 1, 5, 3, 8],
  },
  {
    name: 'Rejected',
    data: [10, 10, 6, 15, 6, 10, 6, 22],
  },
  {
    name: 'Pending',
    data: [10, 6, 3, 10, 12, 10, 5, 6],
  },
];

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

export const optionsY: any = {
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
    categories: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
  },
  yaxis: {
    show: true,
    title: {
      text: 'Credit count',
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
    colors: ['#0A97B7', '#31C4C3', '#D1D1D1'],
  },
  title: {
    text: 'Total Credits Issued',
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
      colors: ['#0A97B7', '#31C4C3', '#D1D1D1'],
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['#0A97B7', '#31C4C3', '#D1D1D1'],
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

export const optionsZ: any = {
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
    categories: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'],
  },
  yaxis: {
    show: true,
    title: {
      text: 'Credit count',
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
    colors: ['#0088BE', '#FB6D85', '#D1D1D1'],
  },
  title: {
    text: 'Total Credits Certified',
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
      colors: ['#0088BE', '#FB6D85', '#D1D1D1'],
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['#0088BE', '#FB6D85', '#D1D1D1'],
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
    name: 'Approved',
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
    name: 'Approved',
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
  colors: ['#6ACDFF', '#FF8183', '#CDCDCD'],
  labels: ['Available', 'Rejected', 'Transfered'],
  plotOptions: {
    pie: {
      donut: {
        total: {
          show: true,
          showAlways: true,
          label: 'Total',
          fontSize: '0.875rem',
          fontFamily: 'Inter',
          fontWeight: 400,
          color: 'black',
          formatter: () => {
            return 44000;
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

export const seriesDonutPieA = [3, 2, 1];

export const optionsR: any = {
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
    colors: ['#2EDFFC', '#FD646F'],
  },
  labels: ['Certified', 'Uncertified'],
  legend: {
    show: true,
    showForSingleSeries: false,
    showForNullSeries: true,
    showForZeroSeries: true,
    position: 'bottom',
    horizontalAlign: 'left',
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
      colors: ['#2EDFFC', '#FD646F'],
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      strokeWidth: 0,
      strokeColor: '#fff',
      fillColors: ['#2EDFFC', '#FD646F'],
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
  colors: ['#2EDFFC', '#FD646F'],
};

export const seriesP = [25.49, 12.75, 17.65, 28.43, 15.69];

export const seriesQ = [25.49, 12.75, 17.65, 28.43, 15.69];

export const seriesR = [34, 66];
