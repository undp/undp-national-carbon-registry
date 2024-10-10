import { StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';

const EligibilityCriteria = (props: CustomStepsProps) => {
  const { next, prev, form, current } = props;
  return (
    <>
      {current === 4 && (
        <div>
          <h1>StepO7</h1>
          <button onClick={next}>next</button>
          <button onClick={prev}>prev</button>
        </div>
      )}
    </>
  );
};

export default EligibilityCriteria;
