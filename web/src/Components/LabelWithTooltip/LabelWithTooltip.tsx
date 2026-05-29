import React, { useEffect, useRef, useState } from 'react';
import './LabelWithTooltip.scss';
import { InfoCircleOutlined } from '@ant-design/icons';

export enum TooltipPostion {
  top,
  bottom,
}

interface ILabelWithTooltip {
  label: string;
  required?: boolean;
  tooltipContent?: JSX.Element;
  tooltipWidth?: number;
  tooltipPosition?: TooltipPostion | undefined;
  labelStyles?: any;
}

interface IHoverTooltip {
  content: JSX.Element;
  tooltipPosition?: TooltipPostion | undefined;
  width?: number;
}

const HoverTooltip = (props: IHoverTooltip) => {
  const { content, tooltipPosition, width } = props;
  const tempTooltipPosition: TooltipPostion = tooltipPosition || TooltipPostion.top;

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = useState<number>(100);

  useEffect(() => {
    console.log('-------useEffect running----------');
    if (
      tooltipRef !== null &&
      tooltipRef.current !== null &&
      tempTooltipPosition === TooltipPostion.top
    ) {
      const height = tooltipRef.current.offsetHeight;
      console.log('height', height);
      setTooltipHeight(height + 10);
    }
  }, []);

  return (
    <div
      ref={tooltipRef}
      className={`hover-tooltip ${
        tempTooltipPosition === TooltipPostion.top ? 'tooltip-top' : 'tooltip-bottom'
      }`}
      style={{
        width: width ? width + 'px' : '250px',
        top: tempTooltipPosition === TooltipPostion.top ? tooltipHeight * -1 + 'px' : '30px',
      }}
    >
      {content}
    </div>
  );
};

const LabelWithTooltip = (props: ILabelWithTooltip) => {
  const { label, required, tooltipContent, tooltipWidth, tooltipPosition, labelStyles } = props;

  return (
    <div className="label-with-tooltip">
      <label
        className={`${required ? 'custom-required' : ''}`}
        style={labelStyles ? labelStyles : {}}
      >
        {label}
      </label>

      {tooltipContent !== undefined && (
        <div className="tooltip-section">
          <InfoCircleOutlined />
          <div className="tooltip-container">
            <HoverTooltip
              tooltipPosition={tooltipPosition}
              content={tooltipContent}
              width={tooltipWidth}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelWithTooltip;
