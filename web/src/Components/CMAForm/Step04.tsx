import { StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';

const Step04 = (props: CustomStepsProps) => {
  const { next, prev, form } = props;
  return (
    <div>
      <h1>StepO7</h1>
      <button onClick={next}>next</button>
      <button onClick={prev}>prev</button>
    </div>
  );
};

export default Step04;
