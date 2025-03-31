import { useEffect, useState } from 'react';
import { CreditActionType } from '../Enums/creditActionType.enum';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  RadioChangeEvent,
  Row,
  Select,
} from 'antd';
import { CreditBalanceInterface } from '../Interfaces/creditBalance.interface';
import { addCommSep } from '../../../Definitions/Definitions/programme.definitions';
import { API_PATHS } from '../../../Config/apiConfig';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { CreditRetirementInterface } from '../Interfaces/creditRetirement.interface';
import {
  CreditRetirementProceedAction,
  RetirementActionEnum,
} from '../Enums/creditRetirementProceedType.enum';
import { CreditRetirementTypeEmnum } from '../Enums/creditRetirementType.enum';

interface CreditActionModalProps {
  icon?: any;
  title?: string;
  type?: CreditActionType;
  onCancel: any;
  onFinish: any;
  loading: boolean;
  isProceed: boolean;
  proceedAction?: CreditRetirementProceedAction;
  actionBtnText?: string;
  openModal: boolean;
  remarkRequired?: boolean;
  t: any;
  data?: CreditBalanceInterface | CreditRetirementInterface;
}

enum RetirementType {
  CROSS_BORDER = 'crossBoarderTransaction',
  VOLUNTARY_CANCELLATION = 'voluntaryCancellations',
}

export const CreditActionModal = (props: CreditActionModalProps) => {
  const {
    onFinish,
    onCancel,
    actionBtnText,
    openModal,
    title,
    icon,
    isProceed,
    loading,
    type,
    remarkRequired,
    proceedAction,
    t,
    data,
  } = props;
  const { get, post } = useConnection();
  const { userInfoState } = useUserContext();
  const [remark, setRemark] = useState<string>('');
  const [actionDisable, setActionDisable] = useState<boolean>(true);
  const [retirementType, setRetirementType] = useState<RetirementType>(RetirementType.CROSS_BORDER);
  const [creditAmount, setCreditAmount] = useState<number>();
  const [checked, setChecked] = useState<boolean>(
    type === CreditActionType.TRANSFER ? true : false
  );
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [dropDownList, setDropDownList] = useState<{ value: string; label: string }[]>([]);
  const [reciveParty, setReciveParty] = useState<any>();

  const getDropDownList = async () => {
    setListLoading(true);
    try {
      setDropDownList([]);
      const response =
        type === CreditActionType.TRANSFER
          ? await post(API_PATHS.TRANSFER_ORGANIZATIONS, {
              type: userInfoState?.companyRole,
              filterOwn: true,
            })
          : await get(API_PATHS.CB_RETIRE_COINTRY_QUERY);
      if (response && response.data && response.data.length > 0) {
        setDropDownList(
          response.data.map((item: any) => ({
            value: type === CreditActionType.TRANSFER ? item.id : item.alpha2,
            label: item.name,
          }))
        );
      }
    } catch (error: any) {
      console.log('Error in getting List for the Action', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    let valid = true;
    if (type !== CreditActionType.TRANSFER && !checked) {
      valid = false;
    }
    if (isProceed) {
      if (remarkRequired && (!remark || remark.trim() === '')) {
        valid = false;
      }
    } else {
      if (
        type === CreditActionType.TRANSFER ||
        (type === CreditActionType.RETIREMENT && retirementType === RetirementType.CROSS_BORDER)
      ) {
        if (!reciveParty) {
          valid = false;
        }
      }
      if (creditAmount === undefined || creditAmount === null) {
        valid = false;
      }
      if (remarkRequired && (!remark || remark.trim() === '')) {
        valid = false;
      }
    }
    setActionDisable(!valid);
  }, [remark, retirementType, creditAmount, reciveParty, checked, isProceed, type]);

  useEffect(() => {
    setCreditAmount(undefined);
    setChecked(type === CreditActionType.TRANSFER ? true : false);
    setActionDisable(true);
    setRemark('');
    if (isProceed) {
      setRetirementType(
        data &&
          'retirementType' in data &&
          data.retirementType.trim() === CreditRetirementTypeEmnum.VOLUNTARY_CANCELLATIONS
          ? RetirementType.VOLUNTARY_CANCELLATION
          : RetirementType.CROSS_BORDER
      );
    }
    if (
      !(
        type === CreditActionType.RETIREMENT &&
        retirementType === RetirementType.VOLUNTARY_CANCELLATION
      )
    ) {
      getDropDownList();
    }
  }, [type, retirementType, openModal]);

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
      {data && (
        <div className="credit-action-model">
          <Form
            name="credit-action-model-form"
            layout="vertical"
            onFinish={() =>
              !isProceed && type === CreditActionType.TRANSFER
                ? onFinish(reciveParty, data.id, creditAmount, remark, undefined)
                : !isProceed && type === CreditActionType.RETIREMENT
                ? onFinish(
                    reciveParty,
                    data.id,
                    creditAmount,
                    remark,
                    retirementType === RetirementType.CROSS_BORDER
                      ? CreditRetirementTypeEmnum.CROSS_BORDER_TRANSACTIONS
                      : CreditRetirementTypeEmnum.VOLUNTARY_CANCELLATIONS
                  )
                : onFinish(
                    data.id,
                    proceedAction === CreditRetirementProceedAction.ACCEPT
                      ? RetirementActionEnum.ACCEPT
                      : proceedAction === CreditRetirementProceedAction.REJECT
                      ? RetirementActionEnum.REJECT
                      : RetirementActionEnum.CANCEL,
                    remark
                  )
            }
          >
            <Row>
              <Col span={24}>
                <Form.Item
                  className="credit-action-project-name"
                  label={t('project')}
                  name="project"
                >
                  <Input placeholder={data.projectName} disabled />
                </Form.Item>
              </Col>
            </Row>

            {type === CreditActionType.TRANSFER && (
              <Row>
                <Col span={24}>
                  <Form.Item
                    className="credit-action-company-select"
                    label={t('to')}
                    name="toCompanyId"
                    required
                  >
                    <Select
                      showSearch
                      loading={listLoading}
                      placeholder={t('searchOrganizationByName')}
                      showArrow={true}
                      autoClearSearchValue
                      filterOption={(input, option: any) => {
                        const optionLabel = option?.label?.props?.children || '';
                        const optionValue = option?.label ? option?.label : '';
                        const label =
                          typeof optionLabel === 'string' ? optionLabel : optionLabel.join('');
                        const value = optionValue.toString().toLowerCase();

                        return (
                          label.toLowerCase().includes(input.toLowerCase()) ||
                          value.includes(input.toLowerCase())
                        );
                      }}
                      options={dropDownList?.map((item) => ({
                        label: item.label,
                        value: item.value,
                      }))}
                      disabled={isProceed}
                      onChange={(val) => setReciveParty(val)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {type === CreditActionType.RETIREMENT && (
              <Form.Item
                label={
                  <span style={{ color: '#666', fontWeight: 500 }}>{t('retirementType')}</span>
                }
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
                required
              >
                <Radio.Group
                  onChange={(e: RadioChangeEvent) => setRetirementType(e.target.value)}
                  value={retirementType}
                  style={{
                    textAlign: 'left',
                  }}
                  disabled={isProceed}
                >
                  <Radio value={RetirementType.CROSS_BORDER}>
                    {t(RetirementType.CROSS_BORDER)}
                  </Radio>
                  <Radio value={RetirementType.VOLUNTARY_CANCELLATION}>
                    {t(RetirementType.VOLUNTARY_CANCELLATION)}
                  </Radio>
                </Radio.Group>
              </Form.Item>
            )}

            {type === CreditActionType.RETIREMENT &&
              retirementType === RetirementType.CROSS_BORDER && (
                <Row>
                  <Col span={24}>
                    <Form.Item
                      className="credit-action-country-select"
                      label={t('country')}
                      name="toCountry"
                      required
                    >
                      {!isProceed ? (
                        <Select
                          showSearch
                          placeholder={t('selectCountry')}
                          showArrow={true}
                          autoClearSearchValue
                          filterOption={(input, option: any) => {
                            const optionLabel = option?.label?.props?.children || '';
                            const optionValue = option?.label ? option?.label : '';
                            const label =
                              typeof optionLabel === 'string' ? optionLabel : optionLabel.join('');
                            const value = optionValue.toString().toLowerCase();

                            return (
                              label.toLowerCase().includes(input.toLowerCase()) ||
                              value.includes(input.toLowerCase())
                            );
                          }}
                          options={dropDownList?.map((item) => ({
                            label: item.label,
                            value: item.value,
                          }))}
                          disabled={isProceed}
                          onChange={(val) => setReciveParty(val)}
                        />
                      ) : (
                        <Input
                          placeholder={'receiverName' in data ? data.receiverName : data.senderName}
                          disabled
                        />
                      )}
                    </Form.Item>
                    <Form.Item
                      className="credit-action-organization-name"
                      label={t('organizationName')}
                      name="company"
                    >
                      <Input
                        placeholder={'receiverName' in data ? data.receiverName : data.senderName}
                        disabled
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

            <Row gutter={8} justify={'space-between'}>
              <Col>
                <label>
                  <span style={{ color: '#666', fontWeight: 500 }}>
                    {t('creditAmount')}
                    <span style={{ color: 'red' }}>*</span>
                  </span>
                </label>
              </Col>

              <Col lg={12} md={10}>
                <Row justify={'end'}>
                  <Col span={isProceed ? 12 : 24}>
                    <Form.Item
                      className="credit-action-credit-input"
                      label=""
                      name="creditAmount"
                      rules={[
                        {
                          validator: (_, value) => {
                            if (isProceed) return Promise.resolve();
                            if (
                              value === undefined ||
                              value === null ||
                              value.toString().trim() === ''
                            ) {
                              setActionDisable(true);
                              return Promise.reject(new Error(t('required')));
                            }
                            if (value <= 0 || isNaN(value)) {
                              setActionDisable(true);
                              return Promise.reject(new Error(t('wrongInput')));
                            }
                            if (!Number.isInteger(Number(value))) {
                              setActionDisable(true);
                              return Promise.reject(new Error(t('shouldBeInterger')));
                            }
                            if (Number(value) > data.creditAmount) {
                              setActionDisable(true);
                              return Promise.reject(new Error(t('insufficientBalance')));
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {!isProceed && (
                          <>
                            <InputNumber
                              onChange={(value) => setCreditAmount(Number(value))}
                              placeholder={addCommSep(data.creditAmount)}
                              style={{ flex: 1, marginRight: 8 }}
                              disabled={isProceed}
                              value={creditAmount}
                            />
                            <span style={{ margin: '0 8px' }}>/</span>
                          </>
                        )}
                        <InputNumber
                          placeholder={addCommSep(data.creditAmount)}
                          disabled
                          style={{ flex: 1 }}
                        />
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row>
              <Col span={24}>
                <Form.Item
                  className="remarks-label"
                  label={t('remark')}
                  name="comment"
                  rules={[
                    {
                      required: remarkRequired,
                      message: t('required'),
                    },
                    {
                      validator: (_, v) => {
                        if (remarkRequired && v !== undefined && v !== '' && v.trim() === '') {
                          return Promise.reject(t('required'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.TextArea onChange={(e) => setRemark(e.target.value)} placeholder="" />
                </Form.Item>
              </Col>
            </Row>

            {type === CreditActionType.RETIREMENT && (
              <Row>
                <Col span={24}>
                  <Form.Item className="text-left" valuePropName="checked" label="" name="confirm">
                    <Checkbox
                      className={
                        proceedAction === CreditRetirementProceedAction.ACCEPT
                          ? 'checkbox-accept'
                          : proceedAction === CreditRetirementProceedAction.REJECT
                          ? 'checkbox-reject'
                          : 'checkbox-process'
                      }
                      onChange={(e) => setChecked(e.target.checked)}
                    >
                      {t(!isProceed ? 'checkBoxCreate' : 'checkBoxProceed')}
                    </Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Form.Item className="footer">
              <Button htmlType="button" onClick={onCancel}>
                {t('view:cancel')}
              </Button>
              <Button
                style={
                  !actionDisable
                    ? {
                        backgroundColor:
                          proceedAction === CreditRetirementProceedAction.ACCEPT
                            ? '#70B554'
                            : proceedAction === CreditRetirementProceedAction.REJECT
                            ? '#FF4D4F'
                            : '#FF4D4F',
                        borderColor:
                          proceedAction === CreditRetirementProceedAction.ACCEPT
                            ? '#70B554'
                            : proceedAction === CreditRetirementProceedAction.REJECT
                            ? '#FF4D4F'
                            : '#FF4D4F',
                      }
                    : {}
                }
                className="mg-left-2"
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={actionDisable}
              >
                {actionBtnText}
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
};
