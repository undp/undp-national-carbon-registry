import { FC } from 'react';
import './Models.scss';
import { Button, Col, Modal } from 'antd';
import { ActionResponseType } from '../../Definitions/Enums/actionResponse.enum';

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
      <div className="action-response-modal" style={{ display: 'flex', justifyContent: 'center' }}>
        <Col>
          <Button
            style={{
              backgroundColor:
                type === ActionResponseType.FAILED
                  ? '#FF4D4F'
                  : type === ActionResponseType.SUCCESS
                  ? '#70B554'
                  : '#16B1FF',
              borderColor:
                type === ActionResponseType.FAILED
                  ? '#FF4D4F'
                  : type === ActionResponseType.SUCCESS
                  ? '#70B554'
                  : '#16B1FF',
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
