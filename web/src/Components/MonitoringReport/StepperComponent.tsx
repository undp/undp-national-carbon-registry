import { useEffect, useRef, useState } from "react";
import { Steps, message } from "antd";
import { BasicInformationStep } from "./BasicInformation";
import "./MonitoringReport.scss";
import { ProjectActivityStep } from "./ProjectActivityStep";
import { ImplementationOfProjectActivityStep } from "./ImplementationOfProjectActivity";
import { DescriptionOfMSStep } from "./DescriptionOfMonitoringSystemStep";
import { DataAndParametersStep } from "./DataAndParametersStep";
import { CalcEmissionReductionStep } from "./CalcOfEmissionReductionStep";
import { AnnexureStep } from "./AppendixStep";
import { useForm } from "antd/lib/form/Form";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import moment from "moment";
import { DocumentTypeEnum } from "../../Definitions/Enums/document.type.enum";
import { DocumentEnum } from "../../Definitions/Enums/document.enum";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import {
  extractFilePropertiesFromLink,
  fileUploadValueExtract,
} from "../../Utils/utilityHelper";
import { SlcfFormActionModel } from "../Models/SlcfFormActionModel";
import { PopupInfo } from "../../Definitions/Definitions/ndcDetails.definitions";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { API_PATHS } from "../../Config/apiConfig";
import { ROUTES } from "../../Config/uiRoutingConfig";
import { DocType } from "../../Definitions/Enums/document.type";
import ProjectDetails from "../PDD/BasicInformation";
import { CustomStepsProps } from "./StepProps";
import { Loading } from "../Loading/loading";
import {
  AnnexureMapDataToFields,
  basicInformationMapDataToFields,
  calcEmissionReductionMapDataToFields,
  dataAndParametersMapDataToFields,
  descriptionOfMMapDataToFields,
  implementationOfProjectAcitivityMapDataToFields,
  projectActivityMapDataToFields,
} from "./viewDataMap";
import { mapBase64ToFields } from "../../Utils/mapBase64ToFields";
import { INF_SECTORAL_SCOPE } from "../AddNewProgramme/ProgrammeCreationComponent";
import { safeClone } from "../../Utils/deepCopy";

const StepperComponent = (props: CustomStepsProps) => {
  const navigate = useNavigate();
  const { translator, t } = props;
  const [current, setCurrent] = useState(0);
  const [reportId, setReportId] = useState(0);
  const [status, setStatus] = useState(null);
  const { get, post } = useConnection();
  const { id, verificationRequestId } = useParams();
  const [projectCategory, setProjectCategory] = useState<string>("");
  const [popupInfo, setPopupInfo] = useState<PopupInfo>();
  const [slcfActionModalVisible, setSlcfActioModalVisible] =
    useState<boolean>(false);
  const [versions, setVersions] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number>();
  const [documentStatus, setDocumentStatus] = useState("");
  const [documentId, setDocumentId] = useState<string>();

  const [maxNetGHGReduction, setMaxNetGHGReduction] = useState<number>();

  const [basicInformationForm] = useForm();
  const [projectActivityForm] = useForm();
  const [implementationStatusForm] = useForm();
  const [descriptionOfMonitoringForm] = useForm();
  const [dataAndParametersForm] = useForm();
  const [qualificationForm] = useForm();
  const [annexuresForm] = useForm();

  const { state } = useLocation();
  console.log("----state-----------", state);

  const [loading, setLoading] = useState<boolean>(
    state?.mode === FormMode.VIEW ||
      state?.mode === FormMode.EDIT ||
      state?.mode === FormMode?.VERIFY
  );

  const handleLoading = (val: boolean) => {
    setLoading(val);
  };

  const scrollSection = useRef({} as any);

  const [disableFields, setDisableFields] = useState<boolean>(false);

  const [values, setValues] = useState({
    projectRefId: id,
    name: "monitoringReport",
    companyId: undefined,
    documentType: DocumentEnum.MONITORING,
    data: {},
  });

  const scrollToDiv = () => {
    if (scrollSection.current) {
      scrollSection.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const navigateToDetailsPage = () => {
    navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(String(id)));
  };

  const next = () => {
    setCurrent(current + 1);
    scrollToDiv();
  };

  const prev = () => {
    setCurrent(current - 1);
    scrollToDiv();
  };

  const fetchAndSetData = async (programId: any) => {
    setLoading(true);

    let programmeData = null;
    //let orgData = null;
    let pddData = null;
    let validationData = null;

    console.log("-------state mon---------", state);
    try {
      //fetch programme data
      const programmeResponse = await post(API_PATHS.PROGRAMME_BY_ID, {
        programmeId: programId,
      });
      if (programmeResponse?.statusText === "SUCCESS") {
        programmeData = programmeResponse?.data;
        console.log(
          "-------programme data Monitoring-----------",
          programmeData
        );
      } else {
        console.log("Error: Programme API did not return SUCCESS status");
      }
    } catch (error) {
      console.log("Error fetching programme data:", error);
    }

    // try {
    //   const orgDetailsResponse = await get(API_PATHS.USER_PROFILE_DETAILS);
    //   console.log('---------org details------------', orgDetailsResponse);
    //   if (orgDetailsResponse?.statusText === 'SUCCESS') {
    //     orgData = orgDetailsResponse?.data?.Organisation;
    //   } else {
    //     console.log('Error: Org API fetch failed');
    //   }
    // } catch (error) {
    //   console.log('Error fetching Org details', error);
    // }

    try {
      // Fetch PDD Data
      const pddResponse = await post(API_PATHS.QUERY_DOCUMENT, {
        refId: state?.documents?.PDD?.refId,
        documentType: DocumentEnum.PDD,
      });
      console.log(
        "-----------------PDD Response-----------------",
        pddResponse
      );
      if (pddResponse?.statusText === "SUCCESS") {
        pddData = pddResponse?.data;
      } else {
        console.log("Error: PDD API did not return SUCCESS status");
      }
    } catch (error) {
      console.log("Error fetching PDD data:", error);
    }

    try {
      //fetch validation data
      const validationResponse = await post(API_PATHS.QUERY_DOCUMENT, {
        refId: state?.documents?.VALIDATION?.refId,
        documentType: DocumentEnum.VALIDATION,
      });
      if (validationResponse?.statusText === "SUCCESS") {
        validationData = validationResponse?.data?.data;
        console.log(
          "---------validation data monitoring----------",
          validationData
        );
      }
    } catch (error) {
      console.log("Error fetching data from validation report", error);
    }
    
    if (programmeData && pddData && validationData) {
      const tempNetGHGEmisisionReduction =
        validationData?.ghgProjectDescription?.totalNetEmissionReductions;

      console.log(
        "-----------tempNetGHG---------",
        tempNetGHGEmisisionReduction
      );
      setMaxNetGHGReduction(Number(tempNetGHGEmisisionReduction));

      const docVersions =
        state?.documents?.[DocumentEnum.MONITORING as any]?.version;
      const latestVersion = docVersions ? docVersions + 1 : 1;
      basicInformationForm.setFieldsValue({
        bi_sectoralScope: INF_SECTORAL_SCOPE[programmeData?.sectoralScope] || 'N/A',
        bi_projectTitle:
          validationData?.basicInformation?.titleOfTheProjectActivity,
        bi_applicablePDDVersionNo:
          validationData?.basicInformation?.versionNumberPDD,
        bi_projectDeveloper: programmeData?.projectParticipant,
        bi_hostParty: validationData?.basicInformation?.hostParty,
        bi_appliedMethodologies:
          validationData?.basicInformation?.appliedMethodologies,
        bi_unfccRefNo: validationData?.basicInformation?.unfccRefNo,
        bi_versionNoOfMR: latestVersion,
      });
      projectActivityForm.setFieldsValue({
        projectParticipants:
          pddData?.data?.projectActivity?.projectParticipants,
        pa_creditingPeriodType:
          pddData?.data?.startDateCreditingPeriod?.creditingPeriodType,
        locationOfProjectActivity:
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]
            ?.locationOfProjectActivity,
        siteNo:
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]
            ?.siteNo,
        province:
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]
            ?.province,
        district:
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]
            ?.district,
        city: pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]
          ?.city,
        community:
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]
            ?.community,
        geographicalLocationCoordinates:
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]
            ?.geographicalLocationCoordinates,
        optionalImages: mapBase64ToFields(
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]
            ?.additionalDocuments
        ),
        extraLocations:
          pddData?.data?.projectActivity?.locationsOfProjectActivity
            ?.slice(1)
            ?.map((location: any) => ({
              ...location,
              uploadImages: mapBase64ToFields(location?.additionalDocuments),
            })),
      });
    }
    setLoading(false);
  };

  // const setLatestVersion = () => {
  //   if (state?.mode === FormMode.CREATE || state?.mode === FormMode.EDIT) {
  //     basicInformationForm.setFieldsValue({
  //       bi_versionNoOfMR: state?.documents?.[DocumentEnum.MONITORING as any]?.version ?? 0 + 1,
  //     });
  //   }
  // };

  useEffect(() => {
    const getViewData = async () => {
      if (
        state?.mode === FormMode.EDIT ||
        state?.mode === FormMode.VERIFY ||
        state?.mode === FormMode.VIEW
      ) {
        setLoading(true);

        let res;

        if (state?.mode === FormMode.VIEW || state?.mode === FormMode.VERIFY) {
          console.log(
            "--------state?.mode 2---------",
            state?.mode,
            state?.mode === FormMode.VERIFY
          );
          setDisableFields(true);
        }

        try {
          res = await post(API_PATHS.QUERY_DOCUMENT, {
            refId: state?.documentRefId,
            documentType: DocumentEnum.MONITORING,
          });

          console.log("--------mon res---------", res);
          if (res?.statusText === "SUCCESS") {
            const data = res?.data;
            setDocumentId(data?.refId);

            console.log(
              "--------mon res 2---------",
              data,
              data.data.basicInformation
            );

            let basicInformation = basicInformationMapDataToFields(
              data.data.projectDetails
            );
            console.log(
              "-----------state getview monitoring-----------",
              state
            );
            const docVersions =
              state?.documents?.[DocumentEnum.MONITORING as any]?.version;
            const latestVersion = docVersions ? docVersions + 1 : 1;
            console.log("------------latest version-----------", latestVersion);
            if (state?.mode === FormMode.EDIT) {
              basicInformation = {
                ...basicInformation,
                bi_versionNoOfMR: latestVersion,
              };
            }
            basicInformationForm.setFieldsValue(basicInformation);

            const projectActivity = projectActivityMapDataToFields(
              data.data.projectActivityDetails
            );
            projectActivityForm.setFieldsValue(projectActivity);

            const implementationOfProjectActivityDetails =
              implementationOfProjectAcitivityMapDataToFields(
                data.data.implementationOfProjectActivityDetails
              );
            implementationStatusForm.setFieldsValue(
              implementationOfProjectActivityDetails
            );

            const descriptionOfMonitoringReport = descriptionOfMMapDataToFields(
              data.data.descriptionOfMonitoringReport
            );
            descriptionOfMonitoringForm.setFieldsValue(
              descriptionOfMonitoringReport
            );

            const dataAndParameterDetails = dataAndParametersMapDataToFields(
              data.data.dataAndParameterDetails
            );
            dataAndParametersForm.setFieldsValue(dataAndParameterDetails);

            const calcEmissionReductions = calcEmissionReductionMapDataToFields(
              data.data.calcEmissionReductions
            );
            qualificationForm.setFieldsValue(calcEmissionReductions);

            const appendix = AnnexureMapDataToFields(data.data.appendix);
            annexuresForm.setFieldsValue(appendix);
          }
        } catch (error: any) {
          console.log("-------error--------", error);
        } finally {
          setLoading(false);
        }
      }
    };

    getViewData();
  }, []);

  const submitForm = async (appendixVals: any) => {
    try {
      console.log("----form vals-----", appendixVals);
      setLoading(true);
      const tempValues = {
        ...safeClone(values),
        data: {
          ...safeClone(values.data),
          appendix: appendixVals,
        },
      };

      const res = await post(API_PATHS.ADD_DOCUMENT, tempValues);
      if (res?.statusText === "SUCCESS") {
        message.open({
          type: "success",
          content:
            state?.mode === FormMode.EDIT
              ? "Monitoring Report has been edited successfully"
              : "Monitoring Report has been submitted successfully",
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
        });
        navigateToDetailsPage();
      }
    } catch (error: any) {
      message.open({
        type: "error",
        content: "Something went wrong",
        duration: 4,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValuesUpdate = (val: any) => {
    console.log('----------temp vals stepper-------------', val);
    setValues((prevVal: any) => {
      const tempContent = {
        ...prevVal.data,
        ...val,
      };
      return { ...prevVal, data: tempContent };
    });
  };

  console.log("----------state disableFields-------------", disableFields);

  useEffect(() => {
    if (state?.mode === FormMode?.CREATE) {
      fetchAndSetData(id);
      //setLatestVersion();
    }
    projectActivityForm.setFieldValue("projectParticipants", [
      { partiesInvolved: "", projectParticipants: [{ participant: "" }] },
    ]);
  }, []);

  const steps = [
    {
      title: (
        <div ref={scrollSection} className="stepper-title-container">
          <div className="title">{t("monitoringReport:title01")}</div>
        </div>
      ),
      description: (
        <BasicInformationStep
          translator={translator}
          t={t}
          current={current}
          form={basicInformationForm}
          formMode={state?.mode}
          disableFields={disableFields}
          next={next}
          prev={navigateToDetailsPage}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t("monitoringReport:title02")}</div>
        </div>
      ),
      description: (
        <ProjectActivityStep
          translator={translator}
          t={t}
          current={current}
          form={projectActivityForm}
          formMode={state?.mode}
          disableFields={disableFields}
          next={next}
          prev={prev}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">02</div>
          <div className="title">{t("monitoringReport:title03")}</div>
        </div>
      ),
      description: (
        <ImplementationOfProjectActivityStep
          translator={translator}
          t={t}
          current={current}
          form={implementationStatusForm}
          formMode={state?.mode}
          disableFields={disableFields}
          next={next}
          prev={prev}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t("monitoringReport:title04")}</div>
        </div>
      ),
      description: (
        <DescriptionOfMSStep
          translator={translator}
          t={t}
          current={current}
          form={descriptionOfMonitoringForm}
          formMode={state?.mode}
          disableFields={disableFields}
          next={next}
          prev={prev}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t("monitoringReport:title05")}</div>
        </div>
      ),
      description: (
        <DataAndParametersStep
          translator={translator}
          t={t}
          current={current}
          form={dataAndParametersForm}
          formMode={state?.mode}
          disableFields={disableFields}
          next={next}
          prev={prev}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t("monitoringReport:title06")}</div>
        </div>
      ),
      description: (
        <CalcEmissionReductionStep
          translator={translator}
          t={t}
          current={current}
          form={qualificationForm}
          formMode={state?.mode}
          disableFields={disableFields}
          next={next}
          prev={prev}
          // projectCategory={projectCategory}
          handleValuesUpdate={handleValuesUpdate}
          maxNetGHGReduction={maxNetGHGReduction}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t("monitoringReport:title07")}</div>
        </div>
      ),
      description: (
        <AnnexureStep
          t={t}
          current={current}
          translator={translator}
          form={annexuresForm}
          formMode={state?.mode}
          disableFields={disableFields}
          prev={prev}
          next={navigateToDetailsPage}
          handleValuesUpdate={submitForm}
          documentId={documentId}
          handleLoading={handleLoading}
          // approve={() => {
          //   showModalOnAction({
          //     actionBtnText: t('monitoringReport:btnApprove'),
          //     icon: <CheckCircleOutlined />,
          //     title: t('monitoringReport:approveMonitoringModalTitle'),
          //     okAction: () => {
          //       approveOrReject(true);
          //     },
          //     remarkRequired: false,
          //     type: 'primary',
          //   });
          // }}
          // reject={() => {
          //   showModalOnAction({
          //     actionBtnText: t('monitoringReport:btnReject'),
          //     icon: <CloseCircleOutlined />,
          //     title: t('monitoringReport:rejectMonitoringModalTitle'),
          //     okAction: (remark: string) => {
          //       approveOrReject(false, remark);
          //     },
          //     remarkRequired: true,
          //     type: 'danger',
          //   });
          // }}
          //submitForm={submitForm}
          // onFinish={onFinish}
        />
      ),
    },
  ];

  if (loading) {
    return <Loading />;
  }
  return (
    <>
      <Steps
        progressDot
        direction="vertical"
        current={current}
        items={steps.map((step) => ({
          title: step.title,
          description: step.description,
        }))}
      />
      {/* {popupInfo && (
        <SlcfFormActionModel
          onCancel={() => {
            setSlcfActioModalVisible(false);
          }}
          actionBtnText={popupInfo!.actionBtnText}
          onFinish={popupInfo!.okAction}
          subText={''}
          openModal={slcfActionModalVisible}
          icon={popupInfo!.icon}
          title={popupInfo!.title}
          type={popupInfo!.type}
          remarkRequired={popupInfo!.remarkRequired}
          t={t}
        />
      )} */}
    </>
  );
};

export default StepperComponent;
