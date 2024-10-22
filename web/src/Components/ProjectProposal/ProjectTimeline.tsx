import moment from 'moment';
import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';

export interface IProjectTimelineData {
  data: { x: string; y: [number, number] }[];
}
const ProjectTimeline = (props: IProjectTimelineData) => {
  const { data } = props;

  console.log('-----------timelineData---------', data);
  const [height, setHeight] = useState<number>(80);

  useEffect(() => {
    let tempHeight = 100;
    data.forEach((item: any) => {
      tempHeight += 60;
    });

    setHeight(tempHeight);
  }, [data]);
  return (
    <>
      <h4 className="section-title">Timeline</h4>
      <Chart
        id={'projectTimeline'}
        options={{
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: 50,
            },
          },
          dataLabels: {
            enabled: true,
            formatter: function (val: [number, number]) {
              const start = moment(val[0]).format('DD/MM/YYYY');
              const end = moment(val[1]).format('DD/MM/YYYY');

              return `${start} - ${end}`;
            },
          },
          xaxis: {
            type: 'datetime',
          },
        }}
        series={[
          {
            data: data,
          },
        ]}
        type={'rangeBar'}
        height={height}
      />
    </>
  );
};

export default ProjectTimeline;
