import { useEffect, useRef, useState } from 'react';
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
import { COLOR_CONFIGS } from '../../../Config/colorConfigs';

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
  const [form] = Form.useForm();
  const [retirementType, setRetirementType] = useState<RetirementType>(RetirementType.CROSS_BORDER);
  const creditAmountRef = useRef<number | undefined>(undefined);
  const recivePartyRef = useRef<any>(undefined);
  const remarkRef = useRef<string>('');
  const checkedRef = useRef<boolean>(type === CreditActionType.TRANSFER);
  const [actionDisable, setActionDisable] = useState<boolean>(true);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [dropDownList, setDropDownList] = useState<{ value: string; label: string }[]>([]);

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

  // eslint-disable-next-line no-unused-vars
  const handleValuesChange = (_: any, allValues: any) => {
    creditAmountRef.current = allValues.creditAmount;
    recivePartyRef.current =
      type === CreditActionType.TRANSFER
        ? allValues.toCompanyId
        : type === CreditActionType.RETIREMENT &&
          allValues.retirementType === RetirementType.CROSS_BORDER
        ? allValues.toCountry
        : undefined;
    remarkRef.current = allValues.comment || '';
    checkedRef.current = allValues.confirm || false;

    let valid = true;
    if (allValues.retirementType) {
      if (type === CreditActionType.RETIREMENT && allValues.retirementType !== retirementType) {
        form.setFieldValue('confirm', false);
        valid = false;
      }
      setRetirementType(allValues.retirementType);
    }
    if (type !== CreditActionType.TRANSFER && !checkedRef.current) {
      valid = false;
    }
    if (isProceed) {
      if (remarkRequired && !remarkRef.current.trim()) {
        valid = false;
      }
    } else {
      if (
        (type === CreditActionType.TRANSFER ||
          (type === CreditActionType.RETIREMENT &&
            allValues.retirementType === RetirementType.CROSS_BORDER)) &&
        !recivePartyRef.current
      ) {
        valid = false;
      }

      const amountNum = Number(creditAmountRef.current);
      if (!Number.isInteger(amountNum) || amountNum <= 0 || !data?.creditAmount) {
        valid = false;
      } else if (amountNum > data.creditAmount) {
        valid = false;
      }
      if (remarkRequired && !remarkRef.current.trim()) {
        valid = false;
      }
    }
    setActionDisable(!valid);
  };

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const handleSubmit = (_: any) => {
    if (isProceed) {
      onFinish(
        data?.id,
        proceedAction === CreditRetirementProceedAction.ACCEPT
          ? RetirementActionEnum.ACCEPT
          : proceedAction === CreditRetirementProceedAction.REJECT
          ? RetirementActionEnum.REJECT
          : RetirementActionEnum.CANCEL,
        remarkRef.current
      );
      return;
    }

    if (type === CreditActionType.TRANSFER) {
      onFinish(
        recivePartyRef.current,
        data?.id,
        creditAmountRef.current,
        remarkRef.current,
        undefined
      );
    } else if (type === CreditActionType.RETIREMENT) {
      const retType =
        retirementType === RetirementType.CROSS_BORDER
          ? CreditRetirementTypeEmnum.CROSS_BORDER_TRANSACTIONS
          : CreditRetirementTypeEmnum.VOLUNTARY_CANCELLATIONS;

      onFinish(
        recivePartyRef.current,
        data?.id,
        creditAmountRef.current,
        remarkRef.current,
        retType
      );
    }
  };

  useEffect(() => {
    if (openModal) {
      form.resetFields();
      let retirementTypeRef: RetirementType;
      if (isProceed && data && 'retirementType' in data) {
        retirementTypeRef =
          data.retirementType.trim() === CreditRetirementTypeEmnum.VOLUNTARY_CANCELLATIONS
            ? RetirementType.VOLUNTARY_CANCELLATION
            : RetirementType.CROSS_BORDER;
      } else {
        retirementTypeRef = RetirementType.CROSS_BORDER;
      }

      if (
        !isProceed &&
        !(
          type === CreditActionType.RETIREMENT &&
          retirementType === RetirementType.VOLUNTARY_CANCELLATION
        )
      ) {
        getDropDownList();
      }

      form.setFieldsValue({
        project: data?.projectName,
        retirementType: retirementTypeRef,
        comment: '',
        confirm: type === CreditActionType.TRANSFER,
      });

      remarkRef.current = '';
      creditAmountRef.current = undefined;
      recivePartyRef.current = undefined;
      checkedRef.current = type === CreditActionType.TRANSFER ? true : false;

      setRetirementType(retirementTypeRef);
      setActionDisable(true);
    }
  }, [openModal]);

  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{icon}</div>
          <div>{title}</div>
        </div>
      }
      className={`popup-${type}`}
      open={openModal}
      width={Math.min(430, window.innerWidth)}
      centered
      footer={null}
      onCancel={onCancel}
      destroyOnClose
    >
      {data && (
        <div className="credit-action-model">
          <Form
            form={form}
            name="credit-action-model-form"
            layout="vertical"
            onValuesChange={handleValuesChange}
            onFinish={handleSubmit}
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
                    rules={[
                      {
                        required: !isProceed,
                        message: t('required'),
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      loading={listLoading}
                      placeholder={t('searchOrganizationByName')}
                      showArrow
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
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {type === CreditActionType.RETIREMENT && (
              <Form.Item
                label={
                  <span style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}>
                    {t('retirementType')}
                  </span>
                }
                name="retirementType"
                required
              >
                <Radio.Group disabled={isProceed}>
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
                      rules={[
                        {
                          required: !isProceed,
                          message: t('required'),
                        },
                      ]}
                    >
                      {!isProceed ? (
                        <Select
                          showSearch
                          placeholder={t('selectCountry')}
                          showArrow
                          autoClearSearchValue
                          loading={listLoading}
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

            <Row gutter={8} justify="space-between">
              <Col>
                <label>
                  <span style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}>
                    {t('creditAmount')}
                    <span
                      style={{
                        color: `${COLOR_CONFIGS.PRIMARY_RED_COLOR}`,
                        position: 'relative',
                        top: '2px',
                        marginLeft: 2,
                      }}
                    >
                      *
                    </span>
                  </span>
                </label>
              </Col>

              <Col lg={12} md={10}>
                <Row justify="end">
                  <Col span={isProceed ? 12 : 24}>
                    <Form.Item
                      className="credit-action-credit-input"
                      name="creditAmount"
                      rules={[
                        {
                          // eslint-disable-next-line no-unused-vars
                          validator: (_, value) => {
                            if (isProceed) return Promise.resolve();
                            if (
                              value === undefined ||
                              value === null ||
                              value.toString().trim() === ''
                            ) {
                              return Promise.reject(new Error(t('required')));
                            }
                            if (value <= 0 || isNaN(value)) {
                              return Promise.reject(new Error(t('wrongInput')));
                            }
                            if (!Number.isInteger(Number(value))) {
                              return Promise.reject(new Error(t('shouldBeInterger')));
                            }
                            if (Number(value) > data.creditAmount) {
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
                              placeholder={data?.creditAmount ? addCommSep(data.creditAmount) : ''}
                              style={{ flex: 1, marginRight: 8 }}
                              disabled={isProceed}
                            />
                            <span style={{ margin: '0 8px' }}>/</span>
                          </>
                        )}

                        <InputNumber
                          placeholder={data?.creditAmount ? addCommSep(data.creditAmount) : ''}
                          disabled
                          style={{ flex: 1 }}
                          value={data?.creditAmount ?? ''}
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
                      // eslint-disable-next-line no-unused-vars
                      validator: (_, val) => {
                        if (remarkRequired && val && val.trim() === '') {
                          return Promise.reject(t('required'));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.TextArea placeholder="" />
                </Form.Item>
              </Col>
            </Row>

            {type === CreditActionType.RETIREMENT && (
              <Row>
                <Col span={24}>
                  <Form.Item className="text-left" name="confirm" valuePropName="checked">
                    <Checkbox
                      className={
                        proceedAction === CreditRetirementProceedAction.ACCEPT
                          ? 'checkbox-accept'
                          : proceedAction === CreditRetirementProceedAction.REJECT
                          ? 'checkbox-reject'
                          : 'checkbox-process'
                      }
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
                            ? COLOR_CONFIGS.PRIMARY_THEME_COLOR
                            : proceedAction === CreditRetirementProceedAction.REJECT
                            ? COLOR_CONFIGS.FAILED_RESPONSE_COLOR
                            : COLOR_CONFIGS.FAILED_RESPONSE_COLOR,
                        borderColor:
                          proceedAction === CreditRetirementProceedAction.ACCEPT
                            ? COLOR_CONFIGS.PRIMARY_THEME_COLOR
                            : proceedAction === CreditRetirementProceedAction.REJECT
                            ? COLOR_CONFIGS.FAILED_RESPONSE_COLOR
                            : COLOR_CONFIGS.FAILED_RESPONSE_COLOR,
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
