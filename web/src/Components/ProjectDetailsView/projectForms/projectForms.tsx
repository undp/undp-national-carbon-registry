import { Button, Col, Row, Skeleton, Tooltip, message } from 'antd';
import { FC, useEffect, useRef, useState } from 'react';
import './projectForms.scss';
import { RcFile } from 'antd/lib/upload';
import moment from 'moment';
import { RejectDocumentationConfirmationModel } from '../../Models/rejectDocumenConfirmationModel';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { DocType, DocumentTypeEnum } from '../../../Definitions/Enums/document.type';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { DocumentStatus } from '../../../Definitions/Enums/document.status';
import {
  formCreatePermission,
  formDownloadPermission,
  formEditPermission,
  formViewPermission,
} from '../../../Utils/documentsPermissionSl';
import { useNavigate } from 'react-router-dom';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { ProgrammeSlU } from '../../../Definitions/Definitions/programme.definitions';
import { ROUTES } from '../../../Config/uiRoutingConfig';

export interface ProjectFormProps {
  data: any;
  projectFormsTitle: any;
  validationFormsTitle: any;
  cmaFormsTitle: any;
  icon: any;
  projectProposalIcon: any;
  cmaIcon: any;
  validationIcon: any;
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
    projectFormsTitle,
    validationFormsTitle,
    cmaFormsTitle,
    projectProposalIcon,
    cmaIcon,
    validationIcon,
    programmeId,
    getDocumentDetails,
    getProgrammeById,
    translator,
    projectProposalStage,
    programmeDetails,
  } = props;

  const t = translator.t;
  const { userInfoState } = useUserContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [openRejectDocConfirmationModal, setOpenRejectDocConfirmationModal] = useState(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [rejectDocData, setRejectDocData] = useState<any>({});
  const navigate = useNavigate();

  const navigateToCostQuotationView = () => {
    navigate(ROUTES.COST_QUOTATION_VIEW(programmeId), {
      state: { isView: true },
    });
  };

  const navigateToCostQuotationCreate = () => {
    navigate(ROUTES.COST_QUOTATION_VIEW(programmeId));
  };

  const navigateToProposalView = () => {
    navigate(ROUTES.PROJECT_PROPOSAL_VIEW(programmeId), {
      state: { isView: true },
    });
  };
  const navigateToProposalCreate = () => {
    navigate(ROUTES.PROJECT_PROPOSAL_VIEW(programmeId));
  };

  const navigateToSiteVisitCheckListView = () => {
    navigate(ROUTES.SITE_VISIT_REPORT_BY_PROGRAMME_ID(programmeId), {
      state: { isView: true },
    });
  };

  useEffect(() => {
    getProgrammeById();
  }, [projectProposalStage]);

  // const getBase64 = (file: RcFile): Promise<string> =>
  //   new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => resolve(reader.result as string);
  //     reader.onerror = (error) => reject(error);
  //   });

  const docAction = async (id: any, status: DocumentStatus) => {
    setLoading(true);
    try {
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
    navigate(ROUTES.CMA_FORM(programmeId));
  };

  const navigateToCMAView = () => {
    navigate(ROUTES.CMA_FORM(programmeId), {
      state: { isView: true },
    });
  };
  const navigateToCMAEdit = () => {
    navigate(ROUTES.CMA_FORM(programmeId), {
      state: { isEdit: true },
    });
  };

  function navigateToValidationAgreementCreate(): void {
    navigate(ROUTES.VALIDATION_AGREEMENT(programmeId));
  }

  function navigateToValidationAgreementView(): void {
    navigate(ROUTES.VALIDATION_AGREEMENT(programmeId), {
      state: { isView: true },
    });
  }

  function navigateToValidationReportCreate(): void {
    navigate(ROUTES.VALIDATION_REPORT(programmeId), {
      state: {
        mode: FormMode.CREATE,
      },
    });
  }

  function navigateToValidationReportEdit(): void {
    navigate(ROUTES.VALIDATION_REPORT(programmeId), {
      state: {
        mode: FormMode.EDIT,
      },
    });
  }

  function navigateToValidationReportView(): void {
    navigate(ROUTES.VALIDATION_REPORT(programmeId), {
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
          <span className="title-icon">{projectProposalIcon}</span>
          <span className="title-text">{projectFormsTitle}</span>
        </div>
        <div>
          <Row className="field" key="Cost Quotation">
            <Col span={12} className="field-key">
              <div className="label-container">
                <div className="label">{t('projectDetailsView:costQuotationForm')}</div>
              </div>
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
        </div>
        <div className="title">
          <span className="title-icon">{cmaIcon}</span>
          <span className="title-text">{cmaFormsTitle}</span>
        </div>
        <div>
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
          <span className="title-icon">{validationIcon}</span>
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
