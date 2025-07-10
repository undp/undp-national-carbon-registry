import { Alert, Form, Modal, Button, Input, Radio, DatePicker, Select, Checkbox } from 'antd';
import React, { FC, useEffect, useState } from 'react';
import '../../Styles/app.scss';
const { TextArea } = Input;

export interface CarbonNeutralConfirmationPopupInfo {
  headerText: string;
  icon: any;
  actionBtnText: string;
  okAction: any;
  type: 'primary' | 'danger';
  remarkRequired: boolean;
}

export interface CarbonNeutralConfirmationProps {
  actionInfo: CarbonNeutralConfirmationPopupInfo;
  onActionCanceled: any;
  openModal: any;
  errorMsg: any;
  loading: any;
  t: any;
}

export const CarbonNeutralConfirmationModelSl: FC<CarbonNeutralConfirmationProps> = (
  props: CarbonNeutralConfirmationProps
) => {
  const { actionInfo, onActionCanceled, openModal, errorMsg, loading, t } = props;

  // const t = translator.t;
  const [comment, setComment] = useState<any>('');
  const [level, setLevel] = useState<string>('');
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    setComment('');
    setLevel('');
    setStartDate(null);
    setEndDate(null);
    setYear(null);
    setChecked(false);
  }, [openModal]);

  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{actionInfo.icon}</div>
          <div>{actionInfo.headerText}</div>
        </div>
      }
      className={'popup-' + actionInfo.type}
      open={openModal}
      width={Math.min(400, window.innerWidth)}
      centered={true}
      onCancel={onActionCanceled}
      destroyOnClose={true}
      footer={null}
    >
      <Form
        layout="vertical"
        onFinish={() => {
          actionInfo.okAction(comment, level, startDate, endDate, year);
        }}
      >
        {actionInfo.type !== 'danger' && (
          <>
            <Form.Item
              label={t('companyProfile:scope')}
              name="scope"
              rules={[
                {
                  required: true,
                  message: `${t('companyProfile:scope')}` + ' ' + `${t('common:isRequired')}`,
                },
              ]}
            >
              <Radio.Group
                onChange={(e) => setLevel(e.target.value)}
                value={level}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexGrow: 1,
                  justifyContent: 'space-around',
                }}
              >
                <Radio value="Organisation Level">{t('companyProfile:organisationLevel')}</Radio>
                <Radio value="Product Level">{t('companyProfile:productLevel')}</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label={t('companyProfile:assessmentStartDate')}
              name="startDate"
              rules={[
                {
                  required: true,
                  message: `${t('companyProfile:assessmentStartDate')} ${t('common:isRequired')}`,
                },
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                onChange={(date) => setStartDate(date ? date.valueOf() : null)}
              />
            </Form.Item>

            <Form.Item
              label={t('companyProfile:assessmentEndDate')}
              name="endDate"
              rules={[
                {
                  required: true,
                  message: `${t('companyProfile:assessmentEndDate')} ${t('common:isRequired')}`,
                },
                // Custom validation rule to ensure end date is not before start date
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDateValue = getFieldValue('startDate');
                    if (!value || !startDateValue || value.isAfter(startDateValue)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(t('companyProfile:endDateCannotBeBeforeStartDate'))
                    );
                  },
                }),
              ]}
            >
              <DatePicker
                style={{ width: '100%' }}
                onChange={(date) => setEndDate(date ? date.valueOf() : null)}
              />
            </Form.Item>

            {/* Year Selector */}
            <Form.Item
              label={t('companyProfile:year')}
              name="year"
              rules={[
                {
                  required: true,
                  message: `${t('companyProfile:year')} ${t('common:isRequired')}`,
                },
              ]}
            >
              <DatePicker
                picker="year"
                style={{ width: '100%' }}
                onChange={(date) => setYear(date ? date.year() : null)}
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          className="mg-bottom-0"
          label={
            actionInfo.type === 'danger'
              ? t('companyProfile:remarks')
              : t('companyProfile:organisationBoundary')
          }
          name="remarks"
          rules={[
            {
              required: true,
              message:
                `${
                  actionInfo.type === 'danger'
                    ? t('companyProfile:remarks')
                    : t('companyProfile:organisationBoundary')
                }` +
                ' ' +
                `${t('common:isRequired')}`,
            },
          ]}
        >
          <TextArea defaultValue={comment} rows={2} onChange={(v) => setComment(v.target.value)} />
        </Form.Item>
        <Form.Item
          className="text-left"
          valuePropName="checked"
          label=""
          name="confirm"
          // rules={[
          //   {
          //     required: true,
          //     message: 'Required field',
          //   },
          //   ({ getFieldValue }) => ({
          //     validator(rule, v) {
          //       if (v === false) {
          //         // eslint-disable-next-line prefer-promise-reject-errors
          //         return Promise.reject('Required field');
          //       }
          //       return Promise.resolve();
          //     },
          //   }),
          // ]}
        >
          <Checkbox className="label" onChange={(v) => setChecked(v.target.checked)}>
            {t('view:confirmClosure')}
          </Checkbox>
        </Form.Item>

        {errorMsg ? <Alert className="mg-top-1" message={errorMsg} type="error" showIcon /> : ''}

        <div className="mg-top-1 ant-modal-footer padding-bottom-0">
          <Button
            htmlType="button"
            onClick={() => {
              onActionCanceled();
            }}
          >
            CANCEL
          </Button>
          <Button
            className="mg-left-2"
            type="primary"
            danger={actionInfo.type === 'danger'}
            htmlType="submit"
            loading={loading}
            disabled={comment === '' || !checked}
          >
            {actionInfo.type === 'danger' ? 'REJECT' : 'APPROVE'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
