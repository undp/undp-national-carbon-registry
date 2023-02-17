import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './TimelineBody.scss';

export interface TimelineBodyProps {
  text: string;
  remark?: string | null;
  via?: string | null;
}

const TimelineBody: FC<TimelineBodyProps> = (props: TimelineBodyProps) => {
  const { i18n, t } = useTranslation(['view']);
  const { text, remark, via } = props;
  return (
    <div>
      <div>
        {text}
        {via && <span>{` ${t('view:via')} ${via}`}</span>}
      </div>
      {remark && remark != 'undefined' && (
        <div className="remark">
          <div className="remark-title">{t('view:remarks')}</div>
          <div className="remark-body">{remark}</div>
        </div>
      )}
    </div>
  );
};

export default TimelineBody;
