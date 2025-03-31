import React, { useEffect, useState } from 'react';
import './projectForms.scss';
import { FileDoneOutlined } from '@ant-design/icons';
import { Row, Col, Button } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../../Config/uiRoutingConfig';
import { formPermissions } from '../../../Utils/documentsPermissionSl';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { ProjectProposalStage } from '../../../Definitions/Enums/programmeStage.enum';
import { DocType } from '../../../Definitions/Enums/document.type';
import { saveAs } from 'file-saver';
import { DocumentEnum } from '../../../Definitions/Enums/document.enum';

interface IPermissionsState {
  mode: FormMode;
  userCompanyRole?: CompanyRole;
  documentRefId?: string;
}

interface IProjectDetails {
  projectProposalStage: any;
  noObjectLetterUrl: string | undefined;
  documents?: any;
}

const ProjectDocuments = (props: IProjectDetails) => {
  const { projectProposalStage, noObjectLetterUrl, documents } = props;

  const { id } = useParams();

  const [pddPermissions, setPDDPermissions] = useState<IPermissionsState>({
    mode: FormMode.DISABLED,
  });
  const [validationReportPermissions, setValidationReportPermissions] = useState<IPermissionsState>(
    { mode: FormMode.DISABLED }
  );

  const navigate = useNavigate();

  const { userInfoState } = useUserContext();

  const navigateToPDD = (permissionsState: IPermissionsState) => {
    navigate(ROUTES.PDD_FORM(id), { state: permissionsState });
  };

  const navigateToValidationReport = (permissionsState: IPermissionsState) => {
    navigate(ROUTES.VALIDATION_REPORT(id), { state: permissionsState });
  };

  const navigateToInfView = () => {
    console.log('----------inf_view_route____', id, ROUTES.INF_VIEW(id as string));
    if (id) {
      navigate(ROUTES.INF_VIEW(id), {
        state: { mode: FormMode.VIEW, documentId: documents[DocumentEnum.INF as string]?.refId },
      });
    }
  };

  console.log('---------documents---------', documents[DocumentEnum.INF as string]?.refId);

  useEffect(() => {
    const tempPddPermissions = formPermissions(
      userInfoState,
      DocType.PDD,
      projectProposalStage,
      documents
    );
    setPDDPermissions(tempPddPermissions);
    const tempValidationReportPermissions = formPermissions(
      userInfoState,
      DocType.VALIDATION_REPORT,
      projectProposalStage,
      documents
    );
    setValidationReportPermissions(tempValidationReportPermissions);

    console.log(
      '---------permissions----------',
      tempPddPermissions,
      tempValidationReportPermissions
    );
  }, []);

  const downloadNoObjectionLetter = () => {
    if (noObjectLetterUrl) {
      saveAs(noObjectLetterUrl, `No_Objection_Letter_${id}.pdf`);
    }
  };

  return (
    <div className="projectDocuments">
      <div className="info-view">
        <div className="title">
          <span className="title-icon">
            <FileDoneOutlined />
          </span>
          <span className="title-text">Project Documents</span>
        </div>
      </div>

      <Row className="document-info-row-first">
        <Col md={18} className="documentTitle-col">
          Initial Notification Form
        </Col>
        <Col md={6} className="documentAction-col">
          <Button className="document-action-btn" onClick={navigateToInfView}>
            View
          </Button>
        </Col>
      </Row>

      <Row className="document-info-row">
        <Col md={18} className="documentTitle-col">
          No Objection Letter
        </Col>
        <Col md={6} className="documentAction-col">
          <Button
            className="document-action-btn"
            disabled={
              projectProposalStage === ProjectProposalStage.PENDING ||
              projectProposalStage === ProjectProposalStage.REJECTED
            }
            onClick={downloadNoObjectionLetter}
          >
            Download
          </Button>
        </Col>
      </Row>

      <Row className="document-info-row">
        <Col md={18} className="documentTitle-col">
          Project Design Document
        </Col>
        <Col md={6} className="documentAction-col">
          <Button
            className="document-action-btn"
            onClick={() => navigateToPDD(pddPermissions)}
            disabled={pddPermissions.mode === FormMode.DISABLED}
          >
            {pddPermissions.mode === FormMode.CREATE
              ? 'CREATE'
              : pddPermissions.mode === FormMode.VERIFY
              ? 'VERIFY'
              : pddPermissions.mode === FormMode.EDIT
              ? 'EDIT'
              : 'VIEW'}
          </Button>
        </Col>
      </Row>
      <Row className="document-info-row">
        <Col md={18} className="documentTitle-col">
          Validation Report
        </Col>
        <Col md={6} className="documentAction-col">
          <Button
            className="document-action-btn"
            onClick={() => navigateToValidationReport(validationReportPermissions)}
            disabled={validationReportPermissions.mode === FormMode.DISABLED}
          >
            {validationReportPermissions.mode === FormMode.CREATE
              ? 'CREATE'
              : validationReportPermissions.mode === FormMode.VERIFY
              ? 'VERIFY'
              : validationReportPermissions.mode === FormMode.EDIT
              ? 'EDIT'
              : 'VIEW'}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectDocuments;
