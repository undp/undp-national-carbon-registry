/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-var */
/* eslint-disable prefer-const */
import { Alert, Button, Col, Divider, Form, Input, InputNumber, Modal, Row, Space } from 'antd';
import react, { FC, useState } from 'react';
import { addCommSep, Programme } from '../../Definitions/Definitions/programme.definitions';
import { creditUnit } from '../../Definitions/Definitions/common.definitions';

export interface ProgrammeIssueFormProps {
  programme: Programme;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText: string;
  enableIssue: boolean;
  translator: any;
  ndcActions?: any[];
}

export const getValidNdcActions = (programme: any) => {
  let actionCreditsArray: any[] = [];
  programme.mitigationActions?.map((action: any) => {
    let verfiedAction = false;
    if (action.projectMaterial) {
      for (var documentDetails of action.projectMaterial) {
        let document: any;
        documentDetails.url ? (document = documentDetails.url) : (document = documentDetails);
        if (document.includes('VERIFICATION_REPORT') && action.properties?.availableCredits) {
          verfiedAction = true;
          break;
        }
      }
    }
    if (verfiedAction && 0 < action.properties.availableCredits) {
      actionCreditsArray.push({
        actionId: action.actionId,
        availableCredits: action.properties.availableCredits,
      });
    }
  });
  return actionCreditsArray;
};

export const ProgrammeIssueForm: FC<ProgrammeIssueFormProps> = (props: ProgrammeIssueFormProps) => {
  const {
    programme,
    onFinish,
    onCancel,
    actionBtnText,
    subText,
    enableIssue,
    translator,
    ndcActions,
  } = props;
  const t = translator.t;
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div className="transfer-form">
      <Row>
        <Col span={24} className="sub-text">
          {subText}
        </Col>
      </Row>
      <Form
        name="transfer_init_popup"
        layout="vertical"
        onChange={() => setPopupError(undefined)}
        onFinish={async (d) => {
          let totalAmount: any;
          let validIssues: any[] = [];
          if (enableIssue) {
            totalAmount = 0;
            d.issueAmount.map((action: any) => {
              totalAmount += action.issueCredit;
              if (action.issueCredit > 0) {
                validIssues.push({
                  actionId: action.actionId,
                  issueCredit: action.issueCredit,
                });
              }
            });
            d.issueAmount = validIssues;
          }
          if (totalAmount === 0) {
            setPopupError('Issue amount should be greater than 0');
            setLoading(false);
            return;
          }
          setLoading(true);
          const res = await onFinish(d);
          setPopupError(res);
          setLoading(false);
        }}
      >
        {ndcActions && enableIssue ? (
          <Form.List name="issueAmount" initialValue={ndcActions}>
            {(fields, { add, remove }) => {
              return (
                <div style={{ width: '100%' }} className="space-container">
                  {fields.map(({ key, name, ...restField }) => {
                    return (
                      <Space
                        wrap={true}
                        key={key}
                        style={{
                          display: 'flex',
                          marginBottom: 8,
                        }}
                        align="center"
                        size={'large'}
                      >
                        <div style={{ width: '100%' }}>
                          <Row>
                            <Col lg={11} md={24}>
                              <div className="label">{`${t('view:issueCreditNdcIdText')}: ${
                                ndcActions[name].actionId
                              }`}</div>
                            </Col>
                            <Col lg={6} md={12}>
                              <Form.Item
                                initialValue={0}
                                className="popup-credit-input"
                                name={[name, 'issueCredit']}
                                rules={[
                                  {
                                    pattern: new RegExp(/^[+]?([.]\d+|\d+[.]?\d*)$/g),
                                    message: 'Credit Should be a positive number',
                                  },
                                  {
                                    required: true,
                                    message: 'Required field',
                                  },
                                  ({ getFieldValue }) => ({
                                    validator(rule, value) {
                                      if (
                                        value &&
                                        parseFloat(value) > ndcActions[name].availableCredits
                                      ) {
                                        // eslint-disable-next-line prefer-promise-reject-errors
                                        return Promise.reject('Amount > Authorised');
                                      }
                                      return Promise.resolve();
                                    },
                                  }),
                                ]}
                              >
                                <InputNumber
                                  placeholder=""
                                  controls={false}
                                  onKeyPress={(event) => {
                                    if (!/[0-9\.]/.test(event.key)) {
                                      event.preventDefault();
                                    }
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col lg={1} md={1} className="seperator">
                              {'/'}
                            </Col>
                            <Col lg={6} md={12}>
                              <Form.Item
                                className="popup-credit-input"
                                {...restField}
                                name={[name, 'availableCredits']}
                              >
                                <InputNumber formatter={(value) => addCommSep(value)} disabled />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      </Space>
                    );
                  })}
                </div>
              );
            }}
          </Form.List>
        ) : (
          <Row>
            <Col lg={18} md={20}>
              <div className="label">{`${t('view:authCreditText')} (${creditUnit})`}</div>
            </Col>
            <Col lg={6} md={6}>
              <Form.Item className="popup-credit-input">
                <InputNumber
                  placeholder={addCommSep(programme.creditEst - programme.creditIssued)}
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Row>
          <Col span={24}>
            <Form.Item
              className="remarks-label"
              label="Remarks"
              name="comment"
              // rules={[
              //   {
              //     required: true,
              //     message: 'Required field',
              //   },
              // ]}
            >
              <Input.TextArea placeholder="" />
            </Form.Item>
          </Col>
        </Row>

        {popupError ? <Alert className="error" message={popupError} type="error" showIcon /> : ''}

        <Form.Item className="footer">
          <Button htmlType="button" onClick={onCancel}>
            {t('view:cancel')}
          </Button>
          <Button className="mg-left-2" type="primary" htmlType="submit" loading={loading}>
            {actionBtnText}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
