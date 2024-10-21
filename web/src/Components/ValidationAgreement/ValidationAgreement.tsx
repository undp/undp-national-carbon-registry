import { Button, Col, DatePicker, Form, Input, Row, Upload } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { i18n } from 'i18next';
import moment from 'moment';
import React from 'react';
import './ValidationAgreement.scss';
import TextArea from 'antd/lib/input/TextArea';
import { UploadOutlined } from '@ant-design/icons';
import { isValidateFileType } from '../../Utils/DocumentValidator';
import { DocType } from '../../Definitions/Enums/document.type';

const ValidationAgreement = (props: { translator: i18n }) => {
  const { translator } = props;
  const t = translator.t;
  const [form] = useForm();

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  return (
    <div className="validation-agreement-container">
      <div className="title-container">
        <div className="main">Validation Service Agreement</div>
      </div>

      <div className="agreement-container">
        <Form
          labelCol={{ span: 20 }}
          wrapperCol={{ span: 24 }}
          className="agreement-form"
          layout="vertical"
          requiredMark={true}
          form={form}
          onFinish={(values) => {
            console.log('------onFinish----', values);
          }}
        >
          <Form.Item
            name="dateOfIssue"
            label="Date of Issue"
            rules={[
              // {
              //   required: true,
              //   // message: `Date of Issue ${t('isRequired')}`,
              // },
              {
                validator: async (rule, value) => {
                  if (
                    String(value).trim() === '' ||
                    String(value).trim() === undefined ||
                    value === null ||
                    value === undefined
                  ) {
                    throw new Error(`Date of Issue ${t('isRequired')}`);
                  }
                },
              },
            ]}
          >
            <DatePicker
              size="large"
              disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="between"
            label="Between"
            rules={[
              {
                required: true,
                message: `Between ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="and"
            label="And"
            rules={[
              {
                required: true,
                message: `And ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="definiitons"
            label="Definitions"
            rules={[
              {
                required: true,
                message: `Definitions ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="whereas"
            label="Whereas"
            rules={[
              {
                required: true,
                message: `Whereas ${t('isRequired')}`,
              },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>

          {/* section 1 start */}
          <>
            <h4 className="mg-top-1 section-title">
              NOW THIS AGREEMENT THEREFORE WITNESSETH that the parties hereto agree as follows:{' '}
              <br />
              1. Obligation of the Project Proponent with regard to the SLCCS Project development
              referred to in (E).
            </h4>

            <div className="section-list mg-bottom-1">
              <ul>
                <li className="mg-bottom-1">
                  1.1 The Project Proponent shall provide all assistance to the Verifier to
                  successfully complete the Verification procedure laid down in the SLCCS guideline.
                </li>
                <li className="mg-bottom-1">
                  1.2 The Project Proponent shall assist the Verifier to prepare all documentation
                  required for making the applications for verification, in accordance with the
                  SLCCS guidelines.
                </li>
                <li className="mg-bottom-1">
                  1.3 The Project Proponent shall also be responsible for providing necessary
                  information after the signing this agreement for the Verification of project as
                  per the SLCCS.
                  <ul className="inner-list">
                    <li>(a) Information pertaining to locations of the projects.</li>
                    <li>(b) Details of technology adopted for the project </li>
                    <li>(c) Details of project developer and project collaborators.</li>
                    <li>
                      (d) Information used to calculate project emission and emission reduction
                      values for the project.
                    </li>
                    <li>(e) Feasibility Report and other documents as mentioned by the Verifier</li>
                  </ul>
                </li>
                <li>
                  1.4 The Project Proponent shall bear the costs of verification and shall make the
                  payment for this to the Verifier as per the 3rd Paragraph of this agreement.
                </li>
              </ul>
            </div>
          </>
          {/* section 1 end */}
          <br />
          {/* section 2 start */}
          <div></div>
          <h4 className="section-title">
            2. Obligations of the Verifier with regard to the SLCCS projects development referred to
            in (B).
          </h4>

          <div className="section-list mg-bottom-1">
            <ul>
              <li>
                {' '}
                2.1 In order to obtain SCERs of the project, the Verifier undertakes to perform the
                following activities:
                <ul className="inner-list">
                  <li>
                    a) Undertake verification by the SLCFV/V according to SLCCS standards and
                    guidelines
                  </li>
                  <li>b) Present findings of verification for SLCCS EB approval</li>
                  <li>c) If approved, issue SCERs to the account of Project Proponent</li>
                </ul>
              </li>
            </ul>
          </div>
          {/* section 2 end */}
          <br />
          {/* section 3 start */}
          <>
            <h4 className="section-title">3. Settlement of Fees</h4>
            <div className="section-description mg-bottom-1">
              <p>3.1 Verification fee</p>
              <p className="mg-left-1">Project Proponent shall pay</p>

              <p>3.2 Payment Conditions</p>
              <p className="no-margin-p">50% of the payment on upfront </p>
              <p className="no-margin-p">
                50% of the payment on issuance of project registration certificate
              </p>
            </div>
          </>
          {/* section 3 end */}
          <br />
          {/* section 4 start */}
          <h4 className="section-title">4. Termination of Agreement</h4>
          <div className="section-list">
            <ul>
              <li>
                4.1 Project Proponent or the Validator shall have the right at any time during the
                period of this Agreement by giving written notice to each party to terminate this
                Agreement forthwith in any of the following events:
                <ul className="inner-list">
                  <li className="mg-bottom-1">
                    i) If a party enters into liquidation whether compulsory or voluntarily,
                    (otherwise than for the purpose of amalgamation or reconstruction) or compounds
                    with its creditors or has a receiver appointed over all or part of its assets;
                  </li>
                  <li className="mg-bottom-1">
                    ii) If a party hereto is prevented by an event of Force Majeure from performing
                    its obligations under this Agreement, if such event cannot be remedied within a
                    reasonable time.
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          {/* section 4 end */}

          {/* section 5 start */}
          <>
            <h4 className="section-title">5. Indemnity</h4>
            <div className="section-description mg-bottom-1">
              5.1 The Project Proponent and the Validator shall indemnify and save harmless each
              other against any claim, demand or proceedings brought against any of the parties
              hereto, arising from any action taken for the achievements of the Objectives of this
              Agreement.
            </div>
          </>
          {/* section 5 end */}
          <br />

          {/* section 6 start */}
          <>
            <h4 className="section-title">6. Cooperation</h4>
            <div className="section-description mg-bottom-1">
              6.1 During the continuance of the Agreement the Project Proponent and the Validator
              shall fully and in good faith co-operate with each other in order to perform with all
              possible expedition all their obligations hereunder and to take all reasonable action
              as is necessary to enable each party to fulfil its obligations under the Agreement and
              to benefit from its terms.
            </div>
          </>
          {/* section 6 end */}
          <br />
          {/* section 7 start */}
          <>
            <h4 className="section-title">7. Entire Agreement</h4>
            <div className="section-description mg-bottom-1">
              <p>
                7.1 This Agreement contains the whole agreement between the parties hereto and
                supersedes all previous agreements, memorandum of understandings, letters, writings,
                arrangements and negotiations between the parties hereto.
              </p>
              <p>
                7.2 No amendment to this Agreement shall be valid unless made by a written
                instrument made in the same manner as these presents.
              </p>
            </div>
          </>
          {/* section 7 end */}
          <br />
          {/* section 8 start */}
          <>
            <h4 className="section-title">8. Resolution of Disputes</h4>
            <div className="section-description mg-bottom-1">
              <p>
                8.1 Any dispute or difference between the parties hereto arising out of this
                Agreement which cannot be amicably settled shall be referred to arbitration by a
                sole Arbitrator.
              </p>
              <p>
                8.2 Any party desiring Arbitration shall write to the other party or parties to the
                dispute, nominating an arbitrator of their choice, and notify the other party who
                shall have the right to either agree to the arbitrator already nominated to act as a
                sole arbitrator or nominate another arbitrator of its choice.{' '}
              </p>
              <p>
                8.3 All Arbitration proceedings shall be conducted in compliance with the provision
                of the Arbitration Act No.11 of 1995.
              </p>
            </div>
          </>
          {/* section 8 end */}
          <br />
          {/* section 9 start */}
          <>
            <h4 className="section-title">9. Notices</h4>
            <div className="section-description mg-bottom-1">
              <p>
                9.1 Any notice required or authorized to be given hereunder and any process to be
                served in relation to or arising out of this agreement shall be in writing and may
                be served personally or sent by pre-paid recorded delivery letter or facsimile
                addressed to the address of the relevant party as specified below or to such other
                address as either party may from time to time notify to the other in writing
              </p>
            </div>
          </>
          {/* section 9 end */}
          <br />
          <br />

          {/* Signatures and annexures start */}
          <div className="signatures-annexures">
            <h4 className="section-description">
              IN WITNESS WHEREOF, the Parties hereto have caused this Contract to be signed in their
              respective names as of the day and year first above written.
            </h4>

            <Row justify={'space-between'} gutter={40} className="mg-top-1">
              <Col md={24} xl={10}>
                <p className="no-margin-p">On behalf Of;</p>
                <p className="no-margin-p">Sri Lanka Climate Fund (Pvt) Ltd.</p>

                <div className="signature-upload">
                  <Form.Item
                    name="SLCFSignature"
                    label="Signature"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    // required={true}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                      {
                        validator: async (rule, file) => {
                          if (file?.length > 0) {
                            if (
                              !isValidateFileType(
                                file[0]?.type,
                                DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                              )
                            ) {
                              throw new Error(`${t('CMAForm:invalidFileFormat')}`);
                            } else if (file[0]?.size > maximumImageSize) {
                              // default size format of files would be in bytes -> 1MB = 1000000bytes
                              throw new Error(`${t('common:maxSizeVal')}`);
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Upload
                      accept=".doc, .docx, .pdf, .png, .jpg"
                      beforeUpload={(file: any) => {
                        return false;
                      }}
                      className="design-upload-section"
                      name="design"
                      action="/upload.do"
                      listType="picture"
                      multiple={false}
                      maxCount={1}
                    >
                      <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                        Upload
                      </Button>
                    </Upload>
                  </Form.Item>
                </div>

                <div className="authorized-signatory">
                  <p>Authorized Signatory </p>
                  <p>Sri Lanka Climate Fund (Pvt) Ltd.</p>
                  <p>“Sobadam Piyasa”, </p>
                  <p>No. 416/C/1, </p>
                  <p>Robert Gunawardana Mawatha, </p>
                  <p>Battaramulla, Sri Lanka.</p>
                </div>
              </Col>

              <Col md={24} xl={10}>
                <span className="client-behalf">
                  <Form.Item
                    name="clientBehalf"
                    label="On behalf of;"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </span>

                <span className="signature-upload">
                  <Form.Item
                    name="clientSignature"
                    label="Signature"
                    className="mg-top-1 "
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    // required={true}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                      {
                        validator: async (rule, file) => {
                          if (file?.length > 0) {
                            if (
                              !isValidateFileType(
                                file[0]?.type,
                                DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                              )
                            ) {
                              throw new Error(`${t('CMAForm:invalidFileFormat')}`);
                            } else if (file[0]?.size > maximumImageSize) {
                              // default size format of files would be in bytes -> 1MB = 1000000bytes
                              throw new Error(`${t('common:maxSizeVal')}`);
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Upload
                      accept=".doc, .docx, .pdf, .png, .jpg"
                      beforeUpload={(file: any) => {
                        return false;
                      }}
                      className="design-upload-section"
                      name="design"
                      action="/upload.do"
                      listType="picture"
                      multiple={false}
                      maxCount={1}
                    >
                      <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                        Upload
                      </Button>
                    </Upload>
                  </Form.Item>
                  <Form.Item name="clientAuthorized-signatory" className="authorized-signatory">
                    <TextArea rows={5} />
                  </Form.Item>
                </span>
              </Col>
            </Row>

            <Row justify={'space-between'} gutter={40} className="mg-top-1">
              <Col md={24} xl={10}>
                <Form.Item
                  name="SLCFWitness"
                  label="Witness"
                  rules={[
                    {
                      required: true,
                      message: `${t('validationAgreement:required')}`,
                    },
                  ]}
                >
                  <Input placeholder="<The Project participant Name>" />
                </Form.Item>

                <div>
                  <Form.Item
                    name="SLCFWitnessSignature"
                    label="Signature"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    // required={true}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                      {
                        validator: async (rule, file) => {
                          if (file?.length > 0) {
                            if (
                              !isValidateFileType(
                                file[0]?.type,
                                DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                              )
                            ) {
                              throw new Error(`${t('CMAForm:invalidFileFormat')}`);
                            } else if (file[0]?.size > maximumImageSize) {
                              // default size format of files would be in bytes -> 1MB = 1000000bytes
                              throw new Error(`${t('common:maxSizeVal')}`);
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Upload
                      accept=".doc, .docx, .pdf, .png, .jpg"
                      beforeUpload={(file: any) => {
                        return false;
                      }}
                      className="design-upload-section"
                      name="design"
                      action="/upload.do"
                      listType="picture"
                      multiple={false}
                      maxCount={1}
                    >
                      <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                        Upload
                      </Button>
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    name="SLCFWitnessName"
                    label="Name"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="SLCFWitnessDesignation"
                    label="Designation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </div>
              </Col>
              <Col md={24} xl={10}>
                <Form.Item
                  name="ClientWitness"
                  label="Witness"
                  rules={[
                    {
                      required: true,
                      message: `${t('validationAgreement:required')}`,
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <div>
                  <Form.Item
                    name="ClientWitnessSignature"
                    label="Signature"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    // required={true}
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                      {
                        validator: async (rule, file) => {
                          if (file?.length > 0) {
                            if (
                              !isValidateFileType(
                                file[0]?.type,
                                DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT
                              )
                            ) {
                              throw new Error(`${t('CMAForm:invalidFileFormat')}`);
                            } else if (file[0]?.size > maximumImageSize) {
                              // default size format of files would be in bytes -> 1MB = 1000000bytes
                              throw new Error(`${t('common:maxSizeVal')}`);
                            }
                          }
                        },
                      },
                    ]}
                  >
                    <Upload
                      accept=".doc, .docx, .pdf, .png, .jpg"
                      beforeUpload={(file: any) => {
                        return false;
                      }}
                      className="design-upload-section"
                      name="design"
                      action="/upload.do"
                      listType="picture"
                      multiple={false}
                      maxCount={1}
                    >
                      <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                        Upload
                      </Button>
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    name="clientWitnessName"
                    label="Name"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="clientWitnessDesignation"
                    label="Designation"
                    rules={[
                      {
                        required: true,
                        message: `${t('validationAgreement:required')}`,
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </div>
              </Col>
            </Row>

            <h4 className="annexures">Annexure A</h4>

            <Form.Item
              label="Additional Comments"
              name="annexureAadditionalComments"
              rules={[
                {
                  required: true,
                  message: `Additional Comments ${t('isRequired')}`,
                },
              ]}
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="annexureAadditionalDocs"
              label="Upload your additional documents here"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              required={false}
              rules={[
                {
                  validator: async (rule, file) => {
                    if (file?.length > 0) {
                      if (
                        !isValidateFileType(file[0]?.type, DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT)
                      ) {
                        throw new Error(`${t('CMAForm:invalidFileFormat')}`);
                      } else if (file[0]?.size > maximumImageSize) {
                        // default size format of files would be in bytes -> 1MB = 1000000bytes
                        throw new Error(`${t('common:maxSizeVal')}`);
                      }
                    }
                  },
                },
              ]}
            >
              <Upload
                accept=".doc, .docx, .pdf, .png, .jpg"
                beforeUpload={(file: any) => {
                  return false;
                }}
                // className="design-upload-section"
                name="design"
                action="/upload.do"
                listType="picture"
                multiple={false}
                // maxCount={1}
              >
                <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                  Upload
                </Button>
              </Upload>
            </Form.Item>

            <h4 className="annexures">Annexure B</h4>

            <Form.Item
              label="Additional Comments"
              name="annexureBadditionalComments"
              rules={[
                {
                  required: true,
                  message: `Additional Comments ${t('isRequired')}`,
                },
              ]}
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="annexureBadditionalDocs"
              label="Upload your additional documents here"
              valuePropName="fileList"
              getValueFromEvent={normFile}
              required={false}
              rules={[
                {
                  validator: async (rule, file) => {
                    if (file?.length > 0) {
                      if (
                        !isValidateFileType(file[0]?.type, DocType.ENVIRONMENTAL_IMPACT_ASSESSMENT)
                      ) {
                        throw new Error(`${t('CMAForm:invalidFileFormat')}`);
                      } else if (file[0]?.size > maximumImageSize) {
                        // default size format of files would be in bytes -> 1MB = 1000000bytes
                        throw new Error(`${t('common:maxSizeVal')}`);
                      }
                    }
                  },
                },
              ]}
            >
              <Upload
                accept=".doc, .docx, .pdf, .png, .jpg"
                beforeUpload={(file: any) => {
                  return false;
                }}
                // className="design-upload-section"
                name="design"
                action="/upload.do"
                listType="picture"
                multiple={false}
                // maxCount={1}
              >
                <Button className="upload-doc" size="large" icon={<UploadOutlined />}>
                  Upload
                </Button>
              </Upload>
            </Form.Item>
          </div>
          {/* Signatures and annexures end */}

          <Row justify={'end'} className="step-actions-end">
            <Button type="primary" size={'large'} htmlType="submit">
              Submit
            </Button>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default ValidationAgreement;
