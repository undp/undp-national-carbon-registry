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
              const startDate = new Date(val[0]);
              const startYear = startDate.getFullYear();
              const startMonth = String(startDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
              const startDay = String(startDate.getDate()).padStart(2, '0');

              const startDateString = `${startYear}-${startMonth}-${startDay}`;

              const endDate = new Date(val[1]);
              const endYear = endDate.getFullYear();
              const endMonth = String(endDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
              const endDay = String(endDate.getDate()).padStart(2, '0');

              const endDateString = `${endYear}-${endMonth}-${endDay}`;

              return `${startDateString} - ${endDateString}`;
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
