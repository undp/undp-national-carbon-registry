import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ProjectProposalComponent from '../../Components/ProjectProposal/ProjectProposalComponent';

const ProjectProposalPage = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation(['common', 'projectProposal']);
  return <ProjectProposalComponent translator={i18n} />;
};

export default ProjectProposalPage;
