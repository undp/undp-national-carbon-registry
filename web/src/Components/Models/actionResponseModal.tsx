import { FC } from 'react';
import './Models.scss';
import { Button, Col, Modal } from 'antd';
import { ActionResponseType } from '../../Definitions/Enums/actionResponse.enum';
import { COLOR_CONFIGS } from '../../Config/colorConfigs';

export interface ActionResponseModalProps {
  type?: ActionResponseType;
  icon?: any;
  title?: string;
  buttonText?: string;
  onCancel: any;
  openModal: boolean;
}

export const ActionResponseModal: FC<ActionResponseModalProps> = (
  props: ActionResponseModalProps
) => {
  const { onCancel, buttonText, openModal, title, icon, type } = props;

  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{icon}</div>
          <div>{title}</div>
        </div>
      }
      className={'popup-' + type}
      open={openModal}
      width={Math.min(430, window.innerWidth)}
      centered={true}
      footer={null}
      onCancel={onCancel}
      destroyOnClose={true}
    >
      <div
        className="action-response-modal"
        style={{ marginRight: 30, display: 'flex', justifyContent: 'center' }}
      >
        <Col>
          <Button
            style={{
              backgroundColor:
                type === ActionResponseType.FAILED
                  ? COLOR_CONFIGS.FAILED_RESPONSE_COLOR
                  : type === ActionResponseType.SUCCESS
                  ? COLOR_CONFIGS.SUCCESS_RESPONSE_COLOR
                  : COLOR_CONFIGS.PROCESSED_RESPONSE_COLOR,
              borderColor:
                type === ActionResponseType.FAILED
                  ? COLOR_CONFIGS.FAILED_RESPONSE_COLOR
                  : type === ActionResponseType.SUCCESS
                  ? COLOR_CONFIGS.SUCCESS_RESPONSE_COLOR
                  : COLOR_CONFIGS.PROCESSED_RESPONSE_COLOR,
            }}
            onClick={onCancel}
            className="mg-left-2"
            type="primary"
            htmlType="submit"
          >
            {buttonText}
          </Button>
        </Col>
      </div>
    </Modal>
  );
};
