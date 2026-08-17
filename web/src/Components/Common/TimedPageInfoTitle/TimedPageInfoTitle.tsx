import { InfoCircle } from 'react-bootstrap-icons';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import './TimedPageInfoTitle.scss';

type PageInfoState = 'waiting' | 'expanded' | 'collapsed';

interface TimedPageInfoTitleProps {
  title: string;
  description: string;
  infoButtonLabel: string;
  titleClassName?: string;
}

export const TimedPageInfoTitle = ({
  title,
  description,
  infoButtonLabel,
  titleClassName = 'body-title',
}: TimedPageInfoTitleProps) => {
  const [pageInfoState, setPageInfoState] = useState<PageInfoState>('waiting');
  const [displayCycle, setDisplayCycle] = useState(0);
  const [expandedWidth, setExpandedWidth] = useState(245);
  const messageRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!messageRef.current) return;
    setExpandedWidth(Math.min(Math.ceil(messageRef.current.scrollWidth) + 34, 900));
  }, [description]);

  useEffect(() => {
    const delay = pageInfoState === 'waiting' ? 2000 : pageInfoState === 'expanded' ? 5000 : 0;
    if (delay === 0) return;

    const timer = window.setTimeout(() => {
      setPageInfoState(pageInfoState === 'waiting' ? 'expanded' : 'collapsed');
    }, delay);

    return () => window.clearTimeout(timer);
  }, [displayCycle, pageInfoState]);

  const togglePageInfo = () => {
    if (pageInfoState === 'expanded') {
      setPageInfoState('collapsed');
      return;
    }

    setPageInfoState('expanded');
    setDisplayCycle((current) => current + 1);
  };

  return (
    <div className={`${titleClassName} timed-page-info-title`}>
      <span>{title}</span>
      <div
        className={`timed-page-info timed-page-info--${pageInfoState}`}
        style={{
          '--timed-page-info-expanded-width': `${expandedWidth}px`,
        } as CSSProperties}
      >
        <span
          ref={messageRef}
          className="timed-page-info__message"
          aria-hidden="true"
          title={description}
        >
          {description}
        </span>
        <button
          type="button"
          className="timed-page-info__button"
          aria-label={infoButtonLabel}
          aria-expanded={pageInfoState === 'expanded'}
          onClick={togglePageInfo}
        >
          <InfoCircle />
        </button>
      </div>
      <span className="timed-page-info__announcement" aria-live="polite">
        {pageInfoState === 'expanded' ? description : ''}
      </span>
    </div>
  );
};
