import { Button, Col, DatePicker, Form, Input, Row, Select, StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';
import { t } from 'i18next';
import TextArea from 'antd/lib/input/TextArea';
import { InfoCircleOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

const ApplicationOfMethodology = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate } = props;

  const onFinish = (values: any) => {
    console.log('-----values---------', values);
    const tempValues: any = {
      titleAndReference: values?.titleAndReferenceOfMethodology,
      applicability: values?.applicabilityOfMethodology,
      baselineScenario: values?.baselineScenario,
      additionality: values?.additionality,
      methodologyDeviations: values?.methodologyDeviations,
      projectBoundary: (function () {
        const tempVal: any = {
          description: values?.projectBoundary,
        };

        const tempbaseline = [];
        const firstBaseline = {
          source: values?.baselineSource,
          isCO2Included: values?.baselineIsCO2Included,
          co2Justification: values?.baselineco2Justification,
          isCH4Included: values?.baselineIsCH4Included,
          ch4Justification: values?.baselinech4Justification,
          isN2OIncluded: values?.baselineIsN2OIncluded,
          n2oJustification: values?.baselinen2oJustification,
          isOtherIncluded: values?.baselineIsOtherIncluded,
          otherJustification: values?.baselineotherJustification,
        };

        tempbaseline.push(firstBaseline);

        if (values?.extraBaseline) {
          values.extraBaseline.forEach((item: any) => {
            const tempObj: any = {
              source: item?.source,
              isCO2Included: item?.isCO2Included,
              co2Justification: item?.co2Justification,
              isCH4Included: item?.isCH4Included,
              ch4Justification: item?.ch4Justification,
              isN2OIncluded: item?.isN2OIncluded,
              n2oJustification: item?.n2oJustification,
              isOtherIncluded: item?.isOtherIncluded,
              otherJustification: item?.otherJustification,
            };
            tempbaseline.push(tempObj);
          });
        }

        const tempProject: any = [];
        const firstProject = {
          source: values?.projectSource,
          isCO2Included: values?.projectIsCO2Included,
          co2Justification: values?.projectco2Justification,
          isCH4Included: values?.projectIsCH4Included,
          ch4Justification: values?.projectch4Justification,
          isN2OIncluded: values?.projectIsN2OIncluded,
          n2oJustification: values?.projectn2oJustification,
          isOtherIncluded: values?.projectIsOtherIncluded,
          otherJustification: values?.projectotherJustification,
        };
        tempProject.push(firstProject);
        if (values.extraProject) {
          values.extraProject.forEach((item: any) => {
            const tempObj: any = {
              source: item?.source,
              isCO2Included: item?.isCO2Included,
              co2Justification: item?.co2Justification,
              isCH4Included: item?.isCH4Included,
              ch4Justification: item?.ch4Justification,
              isN2OIncluded: item?.isN2OIncluded,
              n2oJustification: item?.n2oJustification,
              isOtherIncluded: item?.isOtherIncluded,
              otherJustification: item?.otherJustification,
            };
            tempProject.push(tempObj);
          });
        }

        tempVal.baseline = tempbaseline;
        tempVal.project = tempProject;

        return tempVal;
      })(),
    };

    console.log('---------tempVal----------', tempValues);
    handleValuesUpdate({ applicationOfMethodology: tempValues });
  };
  return (
    <>
      {current === 5 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              onFinish={(values: any) => {
                console.log('-----values---------', values);
                onFinish(values);
                if (next) {
                  next()
                }

              }}
            >
              <Form.Item
                className='className="full-width-form-item'
                label={`5.1 ${t('CMAForm:titleAndReferenceOfMethodology')}`}
                name="titleAndReferenceOfMethodology"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:titleAndReferenceOfMethodology')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:titleAndReferenceOfMethodologyPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`5.2 ${t('CMAForm:applicabilityOfMethodology')}`}
                name="applicabilityOfMethodology"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:applicabilityOfMethodology')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:applicabilityOfMethodologyPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                label={`5.3 ${t('CMAForm:projectBoundary')}`}
                name="projectBoundary"
                tooltip={{
                  title: (
                    <div className="tooltip">
                      <p>
                        Define the project boundary and identify the relevant GHG sources, sinks and
                        reservoirs for the project and baseline scenarios (including leakage if
                        applicable).
                      </p>
                      <p>
                        In addition to the table, provide a diagram or map of the project boundary,
                        showing clearly the physical locations of the various installations or
                        management activities taking place as part of the project activity based on
                        the description provided in Section 1.13 (Description of the Project
                        Activity) above.
                      </p>
                      <p>
                        For non-AFOLU projects, include in the diagram the equipment, systems and
                        flows of mass and energy. Include the GHG emission sources identified in the
                        project boundary.
                      </p>
                      <p>
                        For AFOLU projects, include in the diagram or map the locations of where the
                        various measures are taking place, any reference areas and leakage belts.
                      </p>
                    </div>
                  ),
                  icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                  placement: 'topLeft',
                }}
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:projectBoundary')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              {/* Gases Included Start */}
              <div className="gases-included-container">
                <div className="table">
                  <div className="sidebar-header">Baseline</div>
                  <div className="data-side">
                    <div className="header-row">
                      <div className="col1">Source</div>
                      <div className="col2"></div>
                      <div className="col3">Included?</div>
                      <div className="col4">Justification/Explanation</div>
                    </div>
                    <div className="data-row-wrapper">
                      <div className="data-row">
                        <div className="col1 data-col">
                          <Form.Item
                            name="baselineSource"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                        </div>
                        <div className="col2 data-col">
                          <div>
                            CO<sub>2</sub>
                          </div>
                          <div className="add-margin">
                            CH<sub>4</sub>
                          </div>
                          <div className="add-margin">
                            N<sub>2</sub>0
                          </div>
                          <div className="add-margin">Other</div>
                        </div>
                        <div className="col3 data-col">
                          <Form.Item
                            name="baselineIsCO2Included"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Select>
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="baselineIsCH4Included"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Select>
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="baselineIsN2OIncluded"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Select>
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="baselineIsOtherIncluded"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Select>
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                        </div>
                        <div className="col4 data-col">
                          <Form.Item
                            name="baselineco2Justification"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input></Input>
                          </Form.Item>
                          <Form.Item
                            name="baselinech4Justification"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input></Input>
                          </Form.Item>
                          <Form.Item
                            name="baselinen2oJustification"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input></Input>
                          </Form.Item>
                          <Form.Item
                            name="baselineotherJustification"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input></Input>
                          </Form.Item>
                        </div>
                      </div>
                    </div>

                    <div className="data-row-wrapper">
                      <Form.List name="extraBaseline">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <>
                                <div>
                                  <div className="data-row">
                                    <div className="col1 data-col">
                                      <Form.Item
                                        name={[name, 'source']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input />
                                      </Form.Item>
                                    </div>
                                    <div className="col2 data-col">
                                      <div>
                                        CO<sub>2</sub>
                                      </div>
                                      <div className="add-margin">
                                        CH<sub>4</sub>
                                      </div>
                                      <div className="add-margin">
                                        N<sub>2</sub>0
                                      </div>
                                      <div className="add-margin">Other</div>
                                    </div>
                                    <div className="col3 data-col">
                                      <Form.Item
                                        name={[name, 'isCO2Included']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Select>
                                          <Select.Option value={true}>Yes</Select.Option>
                                          <Select.Option value={false}>No</Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'isCH4Included']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Select>
                                          <Select.Option value={true}>Yes</Select.Option>
                                          <Select.Option value={false}>No</Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'isN2OIncluded']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Select>
                                          <Select.Option value={true}>Yes</Select.Option>
                                          <Select.Option value={false}>No</Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'isOtherIncluded']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Select>
                                          <Select.Option value={true}>Yes</Select.Option>
                                          <Select.Option value={false}>No</Select.Option>
                                        </Select>
                                      </Form.Item>
                                    </div>
                                    <div className="col4 data-col">
                                      <Form.Item
                                        name={[name, 'co2Justification']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'ch4Justification']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'n2oJustification']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'otherJustification']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input></Input>
                                      </Form.Item>
                                    </div>
                                    <div className="col5 data-col">
                                      <Form.Item>
                                        <Button
                                          // type="dashed"
                                          onClick={() => {
                                            // reduceTotalCreditingYears()
                                            remove(name);
                                          }}
                                          size="middle"
                                          className="addMinusBtn"
                                          // block
                                          icon={<MinusOutlined />}
                                        >
                                          {/* Add Entity */}
                                        </Button>
                                      </Form.Item>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ))}

                            <Form.Item>
                              <Button
                                // type="dashed"
                                onClick={() => {
                                  // reduceTotalCreditingYears()
                                  add();
                                }}
                                size="middle"
                                className="addMinusBtn"
                                // block
                                icon={<PlusOutlined />}
                              >
                                {/* Add Entity */}
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </div>
                  </div>

                  <div className="sidebar-header">Project</div>
                  <div className="data-side">
                    <div className="data-row-wrapper add-padding-top">
                      <div className="data-row">
                        <div className="col1 data-col">
                          <Form.Item
                            name="projectSource"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input />
                          </Form.Item>
                        </div>
                        <div className="col2 data-col">
                          <div>
                            CO<sub>2</sub>
                          </div>
                          <div className="add-margin">
                            CH<sub>4</sub>
                          </div>
                          <div className="add-margin">
                            N<sub>2</sub>0
                          </div>
                          <div className="add-margin">Other</div>
                        </div>
                        <div className="col3 data-col">
                          <Form.Item
                            name="projectIsCO2Included"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Select>
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="projectIsCH4Included"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Select>
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="projectIsN2OIncluded"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Select>
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="projectIsOtherIncluded"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Select>
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                        </div>
                        <div className="col4 data-col">
                          <Form.Item
                            name="projectco2Justification"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input></Input>
                          </Form.Item>
                          <Form.Item
                            name="projectch4Justification"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input></Input>
                          </Form.Item>
                          <Form.Item
                            name="projectn2oJustification"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input></Input>
                          </Form.Item>
                          <Form.Item
                            name="projectotherJustification"
                            rules={[
                              {
                                required: true,
                                message: `${t('CMAForm:required')}`,
                              },
                            ]}
                          >
                            <Input></Input>
                          </Form.Item>
                        </div>
                      </div>
                    </div>

                    <div className="data-row-wrapper">
                      <Form.List name="extraProject">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <>
                                <div>
                                  <div className="data-row">
                                    <div className="col1 data-col">
                                      <Form.Item
                                        name={[name, 'source']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input />
                                      </Form.Item>
                                    </div>
                                    <div className="col2 data-col">
                                      <div>
                                        CO<sub>2</sub>
                                      </div>
                                      <div className="add-margin">
                                        CH<sub>4</sub>
                                      </div>
                                      <div className="add-margin">
                                        N<sub>2</sub>0
                                      </div>
                                      <div className="add-margin">Other</div>
                                    </div>
                                    <div className="col3 data-col">
                                      <Form.Item
                                        name={[name, 'isCO2Included']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Select>
                                          <Select.Option value={true}>Yes</Select.Option>
                                          <Select.Option value={false}>No</Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'isCH4Included']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Select>
                                          <Select.Option value={true}>Yes</Select.Option>
                                          <Select.Option value={false}>No</Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'isN2OIncluded']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Select>
                                          <Select.Option value={true}>Yes</Select.Option>
                                          <Select.Option value={false}>No</Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'isOtherIncluded']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Select>
                                          <Select.Option value={true}>Yes</Select.Option>
                                          <Select.Option value={false}>No</Select.Option>
                                        </Select>
                                      </Form.Item>
                                    </div>
                                    <div className="col4 data-col">
                                      <Form.Item
                                        name={[name, 'co2Justification']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'ch4Justification']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'n2oJustification']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, 'otherJustification']}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t('CMAForm:required')}`,
                                          },
                                        ]}
                                      >
                                        <Input></Input>
                                      </Form.Item>
                                    </div>
                                    <div className="col5 data-col">
                                      <Form.Item>
                                        <Button
                                          // type="dashed"
                                          onClick={() => {
                                            // reduceTotalCreditingYears()
                                            remove(name);
                                          }}
                                          size="middle"
                                          className="addMinusBtn"
                                          // block
                                          icon={<MinusOutlined />}
                                        >
                                          {/* Add Entity */}
                                        </Button>
                                      </Form.Item>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ))}

                            <Form.Item>
                              <Button
                                // type="dashed"
                                onClick={() => {
                                  // reduceTotalCreditingYears()
                                  add();
                                }}
                                size="middle"
                                className="addMinusBtn"
                                // block
                                icon={<PlusOutlined />}
                              >
                                {/* Add Entity */}
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </div>
                  </div>
                </div>
              </div>
              {/* Gases Included End */}
              <br />
              <Form.Item
                className='className="full-width-form-item'
                label={`5.4 ${t('CMAForm:baselineScenario')}`}
                name="baselineScenario"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:baselineScenario')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder={`${t('CMAForm:baselineScenarioPlaceholder')}`} />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`5.5 ${t('CMAForm:additionality')}`}
                name="additionality"
                tooltip={{
                  title: (
                    <div className="tooltip">
                      <p>
                        Demonstrate and assess the additionality of the project, in accordance with
                        the applied methodology and any relevant tools, taking into account of the
                        following:
                      </p>
                      <p>
                        Where a project method is applied to demonstrate additionality and the
                        procedure in the applied methodology or tool involves several steps,
                        describe how each step is applied and clearly document the outcome of each
                        step. Indicate clearly the method selected to demonstrate additionality
                        (e.g., investment analysis or barrier analysis in the case of the CDM Tool
                        for the demonstration and assessment of additionality). Where barrier
                        analysis, or equivalent, is used to demonstrate additionality, only include
                        the most relevant barriers.
                      </p>
                      <p>
                        Justify the credibility of the barriers with key facts and/or assumptions
                        and the rationale. Provide all relevant references. Where a performance
                        method is applied to demonstrate additionality, demonstrate that performance
                        can be achieved to a level at least equivalent to the performance benchmark
                        metric.
                      </p>
                      <p>
                        Where the methodology applies an activity method for the demonstration of
                        additionality, use this section to demonstrate regulatory surplus (only) and
                        include a statement that notes that conformance with the positive list is
                        demonstrated in the Applicability of Methodology section above
                      </p>
                      <p>
                        Provide sufficient information (including all relevant data and parameters,
                        with sources) so that a reader can reproduce the additionality analysis and
                        obtain the same results. Note: Where a project is intended to be registered
                        under track II, additionality is not necessary to be demonstrated
                      </p>
                    </div>
                  ),
                  icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                  placement: 'topLeft',
                }}
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:additionality')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`5.6 ${t('CMAForm:methodologyDeviations')}`}
                name="methodologyDeviations"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:methodologyDeviations')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:methodologyDeviationsPlaceholder')}`}
                />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('CMAForm:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  // onClick={next}
                  htmlType="submit"
                >
                  {t('CMAForm:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default ApplicationOfMethodology;
