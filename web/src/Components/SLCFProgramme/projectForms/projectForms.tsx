import { Button, Col, Row, Skeleton, Tooltip, message } from 'antd';
import React, { FC, useEffect, useRef, useState } from 'react';
import './projectForms.scss';
import {
  CheckCircleOutlined,
  DislikeOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  LikeOutlined,
  BookOutlined,
  EyeOutlined,
  EditOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload';
import moment from 'moment';
import { RejectDocumentationConfirmationModel } from '../../Models/rejectDocumenConfirmationModel';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import {
  ProgrammeStageUnified,
  ProjectProposalStage,
} from '../../../Definitions/Enums/programmeStage.enum';
import { DocType, DocumentTypeEnum } from '../../../Definitions/Enums/document.type';
import { Role } from '../../../Definitions/Enums/role.enum';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { DocumentStatus } from '../../../Definitions/Enums/document.status';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import {
  formCreatePermission,
  formDownloadPermission,
  formEditPermission,
  formViewPermission,
  isShowCreateButton,
  isShowEditButton,
  linkDocVisible,
} from '../../../Utils/documentsPermissionSl';
import { useNavigate } from 'react-router-dom';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { ProgrammeSlU } from '../../../Definitions/Definitions/programme.definitions';

export interface ProjectFormProps {
  data: any;
  projectFormsTitle: any;
  validationFormsTitle: any;
  icon: any;
  programmeId: any;
  programmeOwnerId: number;
  getDocumentDetails: any;
  getProgrammeById: any;
  ministryLevelPermission?: boolean;
  translator: any;
  projectProposalStage?: any;
  programmeDetails: ProgrammeSlU;
}

export const ProjectForms: FC<ProjectFormProps> = (props: ProjectFormProps) => {
  const {
    data,
    projectFormsTitle,
    validationFormsTitle,
    icon,
    programmeId,
    getDocumentDetails,
    getProgrammeById,
    translator,
    projectProposalStage,
    programmeDetails,
  } = props;

  const t = translator.t;
  const { userInfoState } = useUserContext();
  const { delete: del, post } = useConnection();
  const fileInputRef: any = useRef(null);
  const fileInputRefMeth: any = useRef(null);
  const fileInputRefImpactAssessment: any = useRef(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [designDocUrl, setDesignDocUrl] = useState<any>('');
  const [designDocDate, setDesignDocDate] = useState<any>('');
  const [designDocversion, setDesignDocversion] = useState<any>('');
  const [docData, setDocData] = useState<any[]>([]);
  const [openRejectDocConfirmationModal, setOpenRejectDocConfirmationModal] = useState(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [rejectDocData, setRejectDocData] = useState<any>({});
  const navigate = useNavigate();
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const navigateToCostQuotationView = () => {
    navigate(`/programmeManagementSLCF/addCostQuotation/${programmeId}`, {
      state: { isView: true },
    });
  };

  const navigateToCostQuotationCreate = () => {
    navigate(`/programmeManagementSLCF/addCostQuotation/${programmeId}`);
  };

  const navigateToProposalView = () => {
    navigate(`/programmeManagementSLCF/projectProposal/${programmeId}`, {
      state: { isView: true },
    });
  };
  const navigateToProposalCreate = () => {
    navigate(`/programmeManagementSLCF/projectProposal/${programmeId}`);
  };

  const navigateToSiteVisitCheckListView = () => {
    navigate(`/programmeManagementSLCF/siteVisitCheckList/${programmeId}`, {
      state: { isView: true },
    });
  };
  const navigateToSiteVisitCheckListCreate = () => {
    navigate(`/programmeManagementSLCF/siteVisitCheckList/${programmeId}`);
  };

  // useEffect(() => {
  //   setDocData(data);
  // }, [data]);

  useEffect(() => {
    getProgrammeById();
  }, [projectProposalStage]);

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const onUploadDocument = async (file: any, type: any) => {
    if (file.size > maximumImageSize) {
      message.open({
        type: 'error',
        content: `${t('common:maxSizeVal')}`,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      return;
    }

    setLoading(true);
    const logoBase64 = await getBase64(file as RcFile);
    try {
      if (isValidateFileType(file?.type, type)) {
        const response: any = await post('national/programme/addDocument', {
          type: type,
          data: logoBase64,
          programmeId: programmeId,
        });
        fileInputRefMeth.current = null;
        if (response?.data) {
          setDocData([...docData, response?.data]);
          message.open({
            type: 'success',
            content: `${t('projectDetailsView:isUploaded')}`,
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        }
      } else {
        message.open({
          type: 'error',
          content: `${t('projectDetailsView:invalidFileFormat')}`,
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      }
    } catch (error: any) {
      fileInputRefMeth.current = null;
      message.open({
        type: 'error',
        content: `${t('projectDetailsView:notUploaded')}`,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      getDocumentDetails();
      setLoading(false);
    }
  };

  const docAction = async (id: any, status: DocumentStatus) => {
    setLoading(true);
    try {
      const response: any = await post('national/programme/docAction', {
        id: id,
        status: status,
      });
      message.open({
        type: 'success',
        content:
          status === DocumentStatus.ACCEPTED
            ? `${t('projectDetailsView:docApproved')}`
            : `${t('projectDetailsView:docRejected')}`,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } catch (error: any) {
      message.open({
        type: 'error',
        content: error?.message,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setOpenRejectDocConfirmationModal(false);
      getDocumentDetails();
      getProgrammeById();
      setLoading(false);
    }
  };

  const handleOk = () => {
    docAction(rejectDocData?.id, DocumentStatus.REJECTED);
  };

  const handleCancel = () => {
    setOpenRejectDocConfirmationModal(false);
  };

  const navigateToCMACreate = () => {
    navigate(`/programmeManagementSLCF/cmaForm/${programmeId}`);
  };

  const navigateToCMAView = () => {
    navigate(`/programmeManagementSLCF/cmaForm/${programmeId}`, {
      state: { isView: true },
    });
  };
  const navigateToCMAEdit = () => {
    navigate(`/programmeManagementSLCF/cmaForm/${programmeId}`, {
      state: { isEdit: true },
    });
  };

  function navigateToValidationAgreementCreate(): void {
    navigate(`/programmeManagementSLCF/validationAgreement/${programmeId}`);
  }

  function navigateToValidationAgreementView(): void {
    navigate(`/programmeManagementSLCF/validationAgreement/${programmeId}`, {
      state: { isView: true },
    });
  }

  function navigateToValidationReportCreate(): void {
    navigate(`/programmeManagementSLCF/validationReport/${programmeId}`, {
      state: {
        mode: FormMode.CREATE,
      },
    });
  }

  function navigateToValidationReportEdit(): void {
    navigate(`/programmeManagementSLCF/validationReport/${programmeId}`, {
      state: {
        mode: FormMode.EDIT,
      },
    });
  }

  function navigateToValidationReportView(): void {
    navigate(`/programmeManagementSLCF/validationReport/${programmeId}`, {
      state: { mode: FormMode.VIEW },
    });
  }

  const downloadRegistrationCertificate = async (url: string) => {
    setLoading(true);
    try {
      if (url !== undefined && url !== '') {
        const response = await fetch(url); // Ensure the URL is fetched properly
        if (response.ok) {
          const blob = await response.blob(); // Create a blob from the response
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = downloadUrl;
          a.download = url.split('/').pop() || 'Registration_Certificate.pdf'; // Extract filename or provide default
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(downloadUrl); // Clean up the created object URL
        } else {
          message.open({
            type: 'error',
            content: response.statusText,
            duration: 3,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        }
      }
      setLoading(false);
    } catch (error: any) {
      console.log('Error in exporting transfers', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  return loading ? (
    <Skeleton />
  ) : (
    <>
      <div className="info-view">
        <div className="title">
          <span className="title-icon">{icon}</span>
          <span className="title-text">{projectFormsTitle}</span>
        </div>
        <div>
          <Row className="field" key="Cost Quotation">
            <Col span={12} className="field-key">
              <div className="label-container">
                <div className="label">{t('projectDetailsView:costQuotationForm')}</div>
              </div>
              {/* {designDocUrl !== '' && (
                <div className="time">
                  {moment(parseInt(designDocDate)).format('DD MMMM YYYY @ HH:mm')}
                  {' ~ ' + designDocversion}
                </div>
              )} */}
            </Col>
            <Col span={6} className="field-value">
              <>
                <Tooltip
                  arrowPointAtCenter
                  placement="top"
                  trigger="hover"
                  title={
                    !formViewPermission(
                      userInfoState,
                      DocType.COST_QUOTATION,
                      projectProposalStage
                    ) && t('projectDetailsView:orgNotAuthView')
                  }
                  overlayClassName="custom-tooltip"
                >
                  {/* <EyeOutlined
                    className="common-progress-icon"
                    style={
                      formViewPermission(
                        userInfoState,
                        DocType.COST_QUOTATION,
                        projectProposalStage
                      )
                        ? {
                            color: '#3F3A47',
                            cursor: 'pointer',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                        : {
                            color: '#cacaca',
                            cursor: 'default',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                    }
                    onClick={() =>
                      formViewPermission(
                        userInfoState,
                        DocType.COST_QUOTATION,
                        projectProposalStage
                      ) && navigateToCostQuotationView()
                    }
                  /> */}
                  <Button
                    type="default"
                    onClick={() => navigateToCostQuotationView()}
                    disabled={
                      !formViewPermission(
                        userInfoState,
                        DocType.COST_QUOTATION,
                        projectProposalStage
                      )
                    }
                    size="small"
                    className="btnProjectForms"
                  >
                    {t('projectDetailsView:btnView')}
                  </Button>
                </Tooltip>
              </>
            </Col>
            {formCreatePermission(userInfoState, DocType.COST_QUOTATION, projectProposalStage) && (
              <Col span={6} className="field-value">
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      !formCreatePermission(
                        userInfoState,
                        DocType.COST_QUOTATION,
                        projectProposalStage
                      ) && t('projectDetailsView:orgNotAuthCreate')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    {/* <PlusOutlined
                      className="common-progress-icon"
                      style={
                        formCreatePermission(
                          userInfoState,
                          DocType.COST_QUOTATION,
                          projectProposalStage
                        )
                          ? {
                              color: '#3F3A47',
                              cursor: 'pointer',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                          : {
                              color: '#cacaca',
                              cursor: 'default',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                      }
                      onClick={() =>
                        formCreatePermission(
                          userInfoState,
                          DocType.COST_QUOTATION,
                          projectProposalStage
                        ) && navigateToCostQuotationCreate()
                      }
                    /> */}
                    <Button
                      type="default"
                      onClick={() => navigateToCostQuotationCreate()}
                      disabled={
                        !formCreatePermission(
                          userInfoState,
                          DocType.COST_QUOTATION,
                          projectProposalStage
                        )
                      }
                      size="small"
                      className="btnProjectForms"
                    >
                      {t('projectDetailsView:btnAdd')}
                    </Button>
                  </Tooltip>
                </>
              </Col>
            )}
          </Row>
          <Row className="field" key="Proposal">
            <Col span={12} className="field-key">
              <div className="label-container">
                <div className="label">{t('projectDetailsView:proposalForm')}</div>
              </div>
              {/* {designDocUrl !== '' && (
                <div className="time">
                  {moment(parseInt(designDocDate)).format('DD MMMM YYYY @ HH:mm')}
                  {' ~ ' + designDocversion}
                </div>
              )} */}
            </Col>
            <Col span={6} className="field-value">
              <>
                <Tooltip
                  arrowPointAtCenter
                  placement="top"
                  trigger="hover"
                  title={
                    !formViewPermission(userInfoState, DocType.PROPOSAL, projectProposalStage) &&
                    t('projectDetailsView:orgNotAuthView')
                  }
                  overlayClassName="custom-tooltip"
                >
                  {/* <EyeOutlined
                    className="common-progress-icon"
                    style={
                      formViewPermission(userInfoState, DocType.PROPOSAL, projectProposalStage)
                        ? {
                            color: '#3F3A47',
                            cursor: 'pointer',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                        : {
                            color: '#cacaca',
                            cursor: 'default',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                    }
                    onClick={() =>
                      formViewPermission(userInfoState, DocType.PROPOSAL, projectProposalStage) &&
                      navigateToProposalView()
                    }
                  /> */}
                  <Button
                    type="default"
                    onClick={() => navigateToProposalView()}
                    disabled={
                      !formViewPermission(userInfoState, DocType.PROPOSAL, projectProposalStage)
                    }
                    size="small"
                    className="btnProjectForms"
                  >
                    {t('projectDetailsView:btnView')}
                  </Button>
                </Tooltip>
              </>
            </Col>
            {formCreatePermission(userInfoState, DocType.PROPOSAL, projectProposalStage) && (
              <Col span={6} className="field-value">
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      !formCreatePermission(
                        userInfoState,
                        DocType.PROPOSAL,
                        projectProposalStage
                      ) && t('projectDetailsView:orgNotAuthCreate')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    {/* <PlusOutlined
                      className="common-progress-icon"
                      style={
                        formCreatePermission(userInfoState, DocType.PROPOSAL, projectProposalStage)
                          ? {
                              color: '#3F3A47',
                              cursor: 'pointer',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                          : {
                              color: '#cacaca',
                              cursor: 'default',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                      }
                      onClick={() =>
                        formCreatePermission(
                          userInfoState,
                          DocType.PROPOSAL,
                          projectProposalStage
                        ) && navigateToProposalCreate()
                      }
                    /> */}
                    <Button
                      type="default"
                      onClick={() => navigateToProposalCreate()}
                      disabled={
                        !formCreatePermission(userInfoState, DocType.PROPOSAL, projectProposalStage)
                      }
                      size="small"
                      className="btnProjectForms"
                    >
                      {t('projectDetailsView:btnAdd')}
                    </Button>
                  </Tooltip>
                </>
              </Col>
            )}
          </Row>
          <Row className="field" key="Validation Agreement">
            <Col span={12} className="field-key">
              <div className="label-container">
                <div className="label">{t('projectDetailsView:validationAgreementForm')}</div>
              </div>
              {/* {designDocUrl !== '' && (
                <div className="time">
                  {moment(parseInt(designDocDate)).format('DD MMMM YYYY @ HH:mm')}
                  {' ~ ' + designDocversion}
                </div>
              )} */}
            </Col>
            <Col span={6} className="field-value">
              <>
                <Tooltip
                  arrowPointAtCenter
                  placement="top"
                  trigger="hover"
                  title={
                    !formViewPermission(
                      userInfoState,
                      DocType.VALIDATION_AGREEMENT,
                      projectProposalStage
                    ) && t('projectDetailsView:orgNotAuthView')
                  }
                  overlayClassName="custom-tooltip"
                >
                  {/* <EyeOutlined
                    className="common-progress-icon"
                    style={
                      formViewPermission(
                        userInfoState,
                        DocType.VALIDATION_AGREEMENT,
                        projectProposalStage
                      )
                        ? {
                            color: '#3F3A47',
                            cursor: 'pointer',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                        : {
                            color: '#cacaca',
                            cursor: 'default',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                    }
                    onClick={() =>
                      formViewPermission(
                        userInfoState,
                        DocType.VALIDATION_AGREEMENT,
                        projectProposalStage
                      ) && navigateToValidationAgreementView()
                    }
                  /> */}
                  <Button
                    type="default"
                    onClick={() => navigateToValidationAgreementView()}
                    disabled={
                      !formViewPermission(
                        userInfoState,
                        DocType.VALIDATION_AGREEMENT,
                        projectProposalStage
                      )
                    }
                    size="small"
                    className="btnProjectForms"
                  >
                    {t('projectDetailsView:btnView')}
                  </Button>
                </Tooltip>
              </>
            </Col>
            {formCreatePermission(
              userInfoState,
              DocType.VALIDATION_AGREEMENT,
              projectProposalStage
            ) && (
              <Col span={6} className="field-value">
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      !formCreatePermission(
                        userInfoState,
                        DocType.VALIDATION_AGREEMENT,
                        projectProposalStage
                      ) && t('projectDetailsView:orgNotAuthCreate')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    {/* <PlusOutlined
                      className="common-progress-icon"
                      style={
                        formCreatePermission(
                          userInfoState,
                          DocType.VALIDATION_AGREEMENT,
                          projectProposalStage
                        )
                          ? {
                              color: '#3F3A47',
                              cursor: 'pointer',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                          : {
                              color: '#cacaca',
                              cursor: 'default',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                      }
                      onClick={() =>
                        formCreatePermission(
                          userInfoState,
                          DocType.VALIDATION_AGREEMENT,
                          projectProposalStage
                        ) && navigateToValidationAgreementCreate()
                      }
                    /> */}
                    <Button
                      type="default"
                      onClick={() => navigateToValidationAgreementCreate()}
                      disabled={
                        !formCreatePermission(
                          userInfoState,
                          DocType.VALIDATION_AGREEMENT,
                          projectProposalStage
                        )
                      }
                      size="small"
                      className="btnProjectForms"
                    >
                      {t('projectDetailsView:btnAdd')}
                    </Button>
                  </Tooltip>
                </>
              </Col>
            )}
          </Row>
          <Row className="field" key="Carbon Management Assessment (CMA)">
            <Col span={12} className="field-key">
              <div className="label-container">
                <div className="label">{t('projectDetailsView:cmaForm')}</div>
              </div>
              {Object.hasOwn(programmeDetails.documents, DocumentTypeEnum.CMA) &&
                programmeDetails.documents[DocumentTypeEnum.CMA].createdTime &&
                programmeDetails.documents[DocumentTypeEnum.CMA].version && (
                  <div className="time">
                    {moment(
                      parseInt(programmeDetails.documents[DocumentTypeEnum.CMA].createdTime)
                    ).format('DD MMMM YYYY')}
                    {' ~ V' + programmeDetails.documents[DocumentTypeEnum.CMA].version}
                  </div>
                )}
            </Col>
            <Col span={6} className="field-value">
              <>
                <Tooltip
                  arrowPointAtCenter
                  placement="top"
                  trigger="hover"
                  title={
                    !formViewPermission(userInfoState, DocType.CMA, projectProposalStage) &&
                    t('projectDetailsView:orgNotAuthView')
                  }
                  overlayClassName="custom-tooltip"
                >
                  {/* <EyeOutlined
                    className="common-progress-icon"
                    style={
                      formViewPermission(userInfoState, DocType.CMA, projectProposalStage)
                        ? {
                            color: '#3F3A47',
                            cursor: 'pointer',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                        : {
                            color: '#cacaca',
                            cursor: 'default',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                    }
                    onClick={() =>
                      formViewPermission(userInfoState, DocType.CMA, projectProposalStage) &&
                      navigateToCMAView()
                    }
                  /> */}
                  <Button
                    type="default"
                    onClick={() => navigateToCMAView()}
                    disabled={!formViewPermission(userInfoState, DocType.CMA, projectProposalStage)}
                    size="small"
                    className="btnProjectForms"
                  >
                    {t('projectDetailsView:btnView')}
                  </Button>
                </Tooltip>
              </>
            </Col>
            {formCreatePermission(userInfoState, DocType.CMA, projectProposalStage) && (
              <Col span={6} className="field-value">
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      !formCreatePermission(userInfoState, DocType.CMA, projectProposalStage) &&
                      t('projectDetailsView:orgNotAuthCreate')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    {/* <PlusOutlined
                      className="common-progress-icon"
                      style={
                        formCreatePermission(userInfoState, DocType.CMA, projectProposalStage)
                          ? {
                              color: '#3F3A47',
                              cursor: 'pointer',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                          : {
                              color: '#cacaca',
                              cursor: 'default',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                      }
                      onClick={() =>
                        formCreatePermission(userInfoState, DocType.CMA, projectProposalStage) &&
                        navigateToCMACreate()
                      }
                    /> */}
                    <Button
                      type="default"
                      onClick={() => navigateToCMACreate()}
                      disabled={
                        !formCreatePermission(userInfoState, DocType.CMA, projectProposalStage)
                      }
                      size="small"
                      className="btnProjectForms"
                    >
                      {t('projectDetailsView:btnAdd')}
                    </Button>
                  </Tooltip>
                </>
              </Col>
            )}

            {formEditPermission(userInfoState, DocType.CMA, projectProposalStage) && (
              <Col span={6} className="field-value">
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      !formEditPermission(userInfoState, DocType.CMA, projectProposalStage) &&
                      t('projectDetailsView:orgNotAuthCreate')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    {/* <EditOutlined
                      className="common-progress-icon"
                      style={
                        formEditPermission(userInfoState, DocType.CMA, projectProposalStage)
                          ? {
                              color: '#3F3A47',
                              cursor: 'pointer',
                              margin: '0px 0px 1.5px 0px',
                            }
                          : {
                              color: '#cacaca',
                              cursor: 'default',
                              margin: '0px 0px 1.5px 0px',
                            }
                      }
                      onClick={() =>
                        formEditPermission(userInfoState, DocType.CMA, projectProposalStage) &&
                        navigateToCMAEdit()
                      }
                    /> */}
                    <Button
                      type="default"
                      onClick={() => navigateToCMAEdit()}
                      disabled={
                        !formEditPermission(userInfoState, DocType.CMA, projectProposalStage)
                      }
                      size="small"
                      className="btnProjectForms"
                    >
                      {t('projectDetailsView:btnEdit')}
                    </Button>
                  </Tooltip>
                </>
              </Col>
            )}
          </Row>
          <Row className="field" key="Site Visit Checklist">
            <Col span={12} className="field-key">
              <div className="label-container">
                <div className="label">{t('projectDetailsView:siteVisitChecklistForm')}</div>
              </div>
              {/* {designDocUrl !== '' && (
                <div className="time">
                  {moment(parseInt(designDocDate)).format('DD MMMM YYYY @ HH:mm')}
                  {' ~ ' + designDocversion}
                </div>
              )} */}
            </Col>
            <Col span={6} className="field-value">
              <>
                <Tooltip
                  arrowPointAtCenter
                  placement="top"
                  trigger="hover"
                  title={
                    !formViewPermission(
                      userInfoState,
                      DocType.SITE_VISIT_CHECKLIST,
                      projectProposalStage
                    ) && t('projectDetailsView:orgNotAuthView')
                  }
                  overlayClassName="custom-tooltip"
                >
                  {/* <EyeOutlined
                    className="common-progress-icon"
                    style={
                      formViewPermission(
                        userInfoState,
                        DocType.SITE_VISIT_CHECKLIST,
                        projectProposalStage
                      )
                        ? {
                            color: '#3F3A47',
                            cursor: 'pointer',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                        : {
                            color: '#cacaca',
                            cursor: 'default',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                    }
                    onClick={() =>
                      formViewPermission(
                        userInfoState,
                        DocType.SITE_VISIT_CHECKLIST,
                        projectProposalStage
                      ) && navigateToSiteVisitCheckListView()
                    }
                  /> */}
                  <Button
                    type="default"
                    onClick={() => navigateToSiteVisitCheckListView()}
                    disabled={
                      !formViewPermission(
                        userInfoState,
                        DocType.SITE_VISIT_CHECKLIST,
                        projectProposalStage
                      )
                    }
                    size="small"
                    className="btnProjectForms"
                  >
                    {t('projectDetailsView:btnView')}
                  </Button>
                </Tooltip>
              </>
            </Col>
          </Row>
        </div>
        <div className="title">
          <span className="title-icon">{icon}</span>
          <span className="title-text">{validationFormsTitle}</span>
        </div>
        <div>
          <Row className="field" key="Validation Report">
            <Col span={12} className="field-key">
              <div className="label-container">
                <div className="label">{t('projectDetailsView:validationReportForm')}</div>
              </div>
              {Object.hasOwn(programmeDetails.documents, DocumentTypeEnum.VALIDATION_REPORT) &&
                programmeDetails.documents[DocumentTypeEnum.VALIDATION_REPORT].createdTime &&
                programmeDetails.documents[DocumentTypeEnum.VALIDATION_REPORT].version && (
                  <div className="time">
                    {moment(
                      parseInt(
                        programmeDetails.documents[DocumentTypeEnum.VALIDATION_REPORT].createdTime
                      )
                    ).format('DD MMMM YYYY')}
                    {' ~ V' +
                      programmeDetails.documents[DocumentTypeEnum.VALIDATION_REPORT].version}
                  </div>
                )}
            </Col>
            <Col span={6} className="field-value">
              <>
                <Tooltip
                  arrowPointAtCenter
                  placement="top"
                  trigger="hover"
                  title={
                    !formViewPermission(
                      userInfoState,
                      DocType.VALIDATION_REPORT,
                      projectProposalStage
                    ) && t('projectDetailsView:orgNotAuthView')
                  }
                  overlayClassName="custom-tooltip"
                >
                  {/* <EyeOutlined
                    className="common-progress-icon"
                    style={
                      formViewPermission(
                        userInfoState,
                        DocType.VALIDATION_REPORT,
                        projectProposalStage
                      )
                        ? {
                            color: '#3F3A47',
                            cursor: 'pointer',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                        : {
                            color: '#cacaca',
                            cursor: 'default',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                    }
                    onClick={() =>
                      formViewPermission(
                        userInfoState,
                        DocType.VALIDATION_REPORT,
                        projectProposalStage
                      ) && navigateToValidationReportView()
                    }
                  /> */}
                  <Button
                    type="default"
                    onClick={() => navigateToValidationReportView()}
                    disabled={
                      !formViewPermission(
                        userInfoState,
                        DocType.VALIDATION_REPORT,
                        projectProposalStage
                      )
                    }
                    size="small"
                    className="btnProjectForms"
                  >
                    {t('projectDetailsView:btnView')}
                  </Button>
                </Tooltip>
              </>
            </Col>

            {formCreatePermission(
              userInfoState,
              DocType.VALIDATION_REPORT,
              projectProposalStage
            ) && (
              <Col span={6} className="field-value">
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      !formCreatePermission(
                        userInfoState,
                        DocType.VALIDATION_REPORT,
                        projectProposalStage
                      ) && t('projectDetailsView:orgNotAuthCreate')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    {/* <PlusOutlined
                      className="common-progress-icon"
                      style={
                        formCreatePermission(
                          userInfoState,
                          DocType.VALIDATION_REPORT,
                          projectProposalStage
                        )
                          ? {
                              color: '#3F3A47',
                              cursor: 'pointer',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                          : {
                              color: '#cacaca',
                              cursor: 'default',
                              margin: '0px 0px 1.5px 0px',
                              fontSize: '110%',
                            }
                      }
                      onClick={() =>
                        formCreatePermission(
                          userInfoState,
                          DocType.VALIDATION_REPORT,
                          projectProposalStage
                        ) && navigateToValidationReportCreate()
                      }
                    /> */}
                    <Button
                      type="default"
                      onClick={() => navigateToValidationReportCreate()}
                      disabled={
                        !formCreatePermission(
                          userInfoState,
                          DocType.VALIDATION_REPORT,
                          projectProposalStage
                        )
                      }
                      size="small"
                      className="btnProjectForms"
                    >
                      {t('projectDetailsView:btnAdd')}
                    </Button>
                  </Tooltip>
                </>
              </Col>
            )}

            {formEditPermission(userInfoState, DocType.VALIDATION_REPORT, projectProposalStage) && (
              <Col span={6} className="field-value">
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      !formEditPermission(
                        userInfoState,
                        DocType.VALIDATION_REPORT,
                        projectProposalStage
                      ) && t('projectDetailsView:orgNotAuthCreate')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    {/* <EditOutlined
                      className="common-progress-icon"
                      style={
                        formEditPermission(
                          userInfoState,
                          DocType.VALIDATION_REPORT,
                          projectProposalStage
                        )
                          ? {
                              color: '#3F3A47',
                              cursor: 'pointer',
                              margin: '0px 0px 1.5px 0px',
                            }
                          : {
                              color: '#cacaca',
                              cursor: 'default',
                              margin: '0px 0px 1.5px 0px',
                            }
                      }
                      onClick={() =>
                        formEditPermission(
                          userInfoState,
                          DocType.VALIDATION_REPORT,
                          projectProposalStage
                        ) && navigateToValidationReportEdit()
                      }
                    /> */}
                    <Button
                      type="default"
                      onClick={() => navigateToValidationReportEdit()}
                      disabled={
                        !formEditPermission(
                          userInfoState,
                          DocType.VALIDATION_REPORT,
                          projectProposalStage
                        )
                      }
                      size="small"
                      className="btnProjectForms"
                    >
                      {t('projectDetailsView:btnEdit')}
                    </Button>
                  </Tooltip>
                </>
              </Col>
            )}
          </Row>
          <Row className="field" key="Project Registration Certificate">
            <Col span={12} className="field-key">
              <div className="label-container">
                <div className="label">{t('projectDetailsView:registrationCertificate')}</div>
              </div>
              {/* {designDocUrl !== '' && (
                <div className="time">
                  {moment(parseInt(designDocDate)).format('DD MMMM YYYY @ HH:mm')}
                  {' ~ ' + designDocversion}
                </div>
              )} */}
            </Col>
            <Col span={6} className="field-value">
              <>
                <Tooltip
                  arrowPointAtCenter
                  placement="top"
                  trigger="hover"
                  title={
                    !formDownloadPermission(
                      userInfoState,
                      DocType.PROJECT_REGISTRATION_CERTIFICATE,
                      projectProposalStage
                    ) && t('projectDetailsView:orgNotAuthDownload')
                  }
                  overlayClassName="custom-tooltip"
                >
                  {/* <DownloadOutlined
                    className="common-progress-icon"
                    style={
                      formDownloadPermission(
                        userInfoState,
                        DocType.PROJECT_REGISTRATION_CERTIFICATE,
                        projectProposalStage
                      )
                        ? {
                            color: '#3F3A47',
                            cursor: 'pointer',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                        : {
                            color: '#cacaca',
                            cursor: 'default',
                            margin: '0px 0px 1.5px 0px',
                            fontSize: '110%',
                          }
                    }
                    onClick={() =>
                      formDownloadPermission(
                        userInfoState,
                        DocType.PROJECT_REGISTRATION_CERTIFICATE,
                        projectProposalStage
                      ) &&
                      downloadRegistrationCertificate(programmeDetails?.registrationCertificateUrl)
                    }
                  /> */}
                  <Button
                    type="default"
                    onClick={() =>
                      downloadRegistrationCertificate(programmeDetails?.registrationCertificateUrl)
                    }
                    disabled={
                      !formDownloadPermission(
                        userInfoState,
                        DocType.PROJECT_REGISTRATION_CERTIFICATE,
                        projectProposalStage
                      )
                    }
                    size="small"
                    className="btnProjectForms"
                  >
                    {t('projectDetailsView:btnDownload')}
                  </Button>
                </Tooltip>
              </>
            </Col>
          </Row>
        </div>
      </div>
      <RejectDocumentationConfirmationModel
        actionInfo={actionInfo}
        onActionConfirmed={handleOk}
        onActionCanceled={handleCancel}
        openModal={openRejectDocConfirmationModal}
        errorMsg={''}
        loading={loading}
        translator={translator}
      />
    </>
  );
};
