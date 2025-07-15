/* eslint-disable eqeqeq */
/* eslint-disable no-var */
import React, { FC } from 'react';
import './timelineBody.scss';

export interface TimelineBodyProps {
  text: string;
  remark?: string | null;
  via?: string | null;
  t: any;
}

const formatString = (str: string, vargs: any[]) => {
  const parts = str.split('{}');
  let insertAt = 1;
  for (const arg of vargs) {
    parts.splice(insertAt, 0, arg);
    insertAt += 2;
  }
  return parts.join('');
};

export const addNdcDesc = (props: any) => {
  const { ndcActions, t, creditUnit } = props;
  const actions = ndcActions.split('&');
  let ndcDesc = '';
  for (var id in actions) {
    const parts = actions[id].split('?');
    if (Number(id) == actions.length - 1 && actions.length > 1) {
      ndcDesc += ` and ${formatString(t('view:t1IssueNdcDesc'), [parts[1], creditUnit, parts[0]])}`;
    } else if (actions.length > 1 && Number(id) != actions.length - 2) {
      ndcDesc += `${formatString(t('view:t1IssueNdcDesc'), [parts[1], creditUnit, parts[0]])}, `;
    } else {
      ndcDesc += `${formatString(t('view:t1IssueNdcDesc'), [parts[1], creditUnit, parts[0]])}`;
    }
  }
  return ndcDesc;
};

export const TimelineBody: FC<TimelineBodyProps> = (props: TimelineBodyProps) => {
  const { text, remark, via, t } = props;
  return (
    <div>
      <div>
        {text}
        {via && <span>{` ${t('view:via')} ${via}`}</span>}
      </div>
      {remark && remark !== 'undefined' && remark !== 'null' && (
        <div className="remark">
          <div className="remark-title">{t('view:remarks')}</div>
          <div className="remark-body">{remark}</div>
        </div>
      )}
    </div>
  );
};
