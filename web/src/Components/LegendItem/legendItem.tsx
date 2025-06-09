import React, { FC } from 'react';
import { CircleFill } from 'react-bootstrap-icons';
import './legendItem.scss';

export interface LegendItemItemProps {
  text: string;
  color: string;
}

export const LegendItem: FC<LegendItemItemProps> = (props: LegendItemItemProps) => {
  const { text, color } = props;

  return (
    <div className="legend-item-container">
      <CircleFill color={color} size={12} />
      <div className="text">{text}</div>
    </div>
  );
};
