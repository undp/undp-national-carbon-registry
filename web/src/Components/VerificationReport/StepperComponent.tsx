import React, { useEffect, useState } from "react";
import { Steps, message } from "antd";
import { BasicInformationStep } from "./BasicInformationStep";
import "./VerificationReport.scss";
import { GHGProjectDescriptionStep } from "./GHGProjectDescription";
import { ExecutiveSummaryStep } from "./ExecutiveSummaryStep";
import { VerificationTeamStep } from "./VerificationTeamStep";
import { ApplicationOfMaterialityStep } from "./ApplicationOfMaterialityStep";
import { MeansOfVerificationStep } from "./MeansOfVerificationStep";
import { VerificationFindingStep } from "./VerificationFindingStep";
import { InternalQualityControlStep } from "./InternalQualityControlStep";
import { VerificationOpinionStep } from "./VerificationOpinionStep";
import { CertificationStep } from "./CertificationStatementStep";
import { AppendixStep } from "./AppendixStep";
import { useForm } from "antd/lib/form/Form";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { PopupInfo } from "../../Definitions/Definitions/ndcDetails.definitions";
import { API_PATHS } from "../../Config/apiConfig";
import { ROUTES } from "../../Config/uiRoutingConfig";
import { VerificationStepProps } from "./StepProps";
import { DocumentEnum } from "../../Definitions/Enums/document.enum";
// import { basicInformationMapDataToFields } from '../ValidationReport/viewDataMap';
import {
  appendixMapDataToFields,
  applicationOfMaterialityMapDataToFields,
  basicInformationMapDataToView,
  certificaitonMapDataToFields,
  executiveSummaryMapDataToFields,
  ghgProjectDescriptionMapDataToFields,
  internalQualityControlMapDataToFields,
  meansOfVerificationMapDataToFields,
  verificationFindingsMapDataToFields,
  verificationOpinionMapDataToFields,
  verificationTeamsMapDataToFields,
} from "./viewDataMap";
import { Loading } from "../Loading/loading";
import { INF_SECTORAL_SCOPE } from "../AddNewProgramme/ProgrammeCreationComponent";
import { toMoment } from "../../Utils/convertTime";
import { safeClone } from "../../Utils/deepCopy";
import { defaultTimeout } from "../../Definitions/Constants/defaultTimeout";

const StepperComponent = (props: VerificationStepProps) => {
  const { translator, t } = props;
  const navigationLocation = useLocation();
  // const { mode, docId } = navigationLocation.state || {};
  const navigate = useNavigate();
  const [reportId, setReportId] = useState(0);
  const [status, setStatus] = useState(null);
  const [current, setCurrent] = useState(0);
  const [verifiedScer, setVerifiedScer] = useState(0);
  const { get, post } = useConnection();
  const { id, verificationRequestId } = useParams();

  const { state } = useLocation();

  console.log(
    "---------------------verification state--------------------",
    state
  );

  const [popupInfo, setPopupInfo] = useState<PopupInfo>();
  const [slcfActionModalVisible, setSlcfActioModalVisible] =
    useState<boolean>(false);

  // const countryName = import.meta.env.VITE_APP_COUNTRY_NAME || 'CountryX';
  // const registryName = import.meta.env.VITE_APP_REGISTRY_NAME || 'RegistryX';
  const [basicInformationForm] = useForm();
  const [ghgProjectDescriptionForm] = useForm();
  const [executiveSummaryForm] = useForm();
  const [verficationTeamForm] = useForm();
  const [applicationOfMeterialityForm] = useForm();
  const [meansOfVerificationForm] = useForm();
  const [verificationFindingForm] = useForm();
  const [internalQualityControlForm] = useForm();
  const [verificationOpinionForm] = useForm();
  const [certificationStatementForm] = useForm();
  const [appendixForm] = useForm();

  const [maxNetGHGReduction, setMaxNetGHGReduction] = useState<number>();

  const [values, setValues] = useState({
    projectRefId: id,
    name: "verification",
    companyId: undefined,
    documentType: DocumentEnum.VERIFICATION,
    data: {},
  });

  const [loading, setLoading] = useState<boolean>(
    state?.mode === FormMode.VIEW ||
      state?.mode === FormMode.EDIT ||
      state?.mode === FormMode?.VERIFY
  );

  const handleLoading = (val: boolean) => {
    setLoading(val);
  };

  const [disableFields, setDisableFields] = useState<boolean>(false);

  const navigateToDetailsPage = () => {
    navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(String(id)));
  };

  const fetchAndSetData = async (programId: any) => {
    setLoading(true);

    let programmeData = null;
    let pddData = null;
    let validationData = null;
    let monitoringData = null;

    //fetch programme data
    try {
      const programmeResponse = await post(API_PATHS.PROGRAMME_BY_ID, {
        programmeId: programId,
      });
      if (programmeResponse?.statusText === "SUCCESS") {
        programmeData = programmeResponse?.data;
      }
      console.log("---------------programmeData--------------", programmeData);
    } catch (error) {
      console.log("Error fetching programme data", error);
    }

    //fetch PDD data
    try {
      const pddResponse = await post(API_PATHS.QUERY_DOCUMENT, {
        refId: state?.documents?.PDD?.refId,
        documentType: DocumentEnum.PDD,
      });
      if (pddResponse?.statusText === "SUCCESS") {
        pddData = pddResponse?.data?.data;
      }
      console.log("-----------pddData--------------", pddData);
    } catch (error) {
      console.log("Error fetching PDD data", error);
    }

    //fetch validation data
    try {
      const validationResponse = await post(API_PATHS.QUERY_DOCUMENT, {
        refId: state?.documents?.VALIDATION?.refId,
        documentType: DocumentEnum.VALIDATION,
      });
      if (validationResponse?.statusText === "SUCCESS") {
        validationData = validationResponse?.data?.data;
      }
      console.log("-----------validationData--------------", validationData);
    } catch (error) {
      console.log("Error fetching validation data", error);
    }

    //fetch monitoring data
    try {
      const monitoringResponse = await post(API_PATHS.QUERY_DOCUMENT, {
        refId: state?.documents?.MONITORING?.refId,
        documentType: DocumentEnum.MONITORING,
      });
      if (monitoringResponse?.statusText === "SUCCESS") {
        monitoringData = monitoringResponse?.data?.data;
      }
    } catch (error) {
      console.log("Error fetching monitoring data", error);
    }

    const creditingPeriodStartDate = moment.unix(
      monitoringData?.projectActivityDetails?.pa_projectCreditingPeriod
    );
    const creditingPeriodEndDate = moment.unix(
      monitoringData?.projectActivityDetails?.pa_projectCreditingPeriodEndDate
    );
    console.log("creditingPeriodStartDate", creditingPeriodStartDate);
    console.log("creditingPeriodEndDate", creditingPeriodEndDate);
    const creditingPeriodDuration = moment.duration(
      creditingPeriodEndDate.diff(creditingPeriodStartDate)
    );
    const durationString = `${creditingPeriodDuration.years()} years, ${creditingPeriodDuration.months()} months and ${creditingPeriodDuration.days()} days`;
    console.log("durationString", durationString);

    const netEmReductions =
      monitoringData?.calcEmissionReductions?.netGHGEmissionReductions;
    const emReduction = netEmReductions?.yearlyGHGEmissionReductions;

    if (programmeData && pddData && validationData && monitoringData) {
      const tempNetGHGEmisisionReduction =
        Number(programmeData?.creditEst) -
        (Number(programmeData?.creditBalance) +
          Number(programmeData?.creditRetired) +
          Number(programmeData?.creditTransferred));

      console.log(
        "-----------temp netGHG---------",
        tempNetGHGEmisisionReduction
      );

      setMaxNetGHGReduction(Number(tempNetGHGEmisisionReduction));

      const docVersions =
        state?.documents?.[DocumentEnum.VERIFICATION as any]?.version;
      console.log("------------docVersions-----------", docVersions);
      console.log("--------state---------", state);
      const latestVersion = docVersions ? docVersions + 1 : 1;
      basicInformationForm.setFieldsValue({
        b_projectDeveloper: programmeData?.projectParticipant,
        b_hostParty: pddData?.projectDetails?.hostParty,
        b_mandatorySectoralScopes: pddData?.projectDetails?.sectoralScope,
        b_appliedMethodologies: pddData?.projectDetails?.appliedMethodologies,
        b_estimatedGHGEmissionReduction:
          pddData?.projectDetails
            ?.estimatedAvgGHGEmissionReductionBasicInformation,
        b_projectTitle:
          validationData?.basicInformation?.titleOfTheProjectActivity,
        b_unfccRefNo: validationData?.basicInformation?.unfccRefNo,
        b_scaleOfProject: validationData?.basicInformation?.projectScale,
        b_conditionalSectoralScopes:
          validationData?.basicInformation?.conditionalSectoralScopes,
        b_monitoringPeriodNo:
          monitoringData?.projectDetails?.bi_monitoringPeriodNo,
        b_monitoringPeriodDuration: monitoringData?.projectDetails?.bi_duration,
        b_versionNoOfMonitoringReport:
          monitoringData?.projectDetails?.bi_versionNoOfMR,
        b_creditingPeriod: durationString,
        b_versionNoOfVerificationReport: latestVersion,
      });

      ghgProjectDescriptionForm.setFieldsValue({
        estimatedNetEmissionReductions: emReduction.map((item: any) => {
          return {
            ...item,
            vintage: item?.vintage ? toMoment(item?.vintage) : undefined,
          };
        }),
        totalBaselineEmissionReductions: Number(
          netEmReductions?.totalBaselineEmissionReductions
        ),
        totalProjectEmissionReductions: Number(
          netEmReductions?.totalProjectEmissionReductions
        ),
        totalLeakageEmissionReductions: Number(
          netEmReductions?.totalLeakageEmissionReductions
        ),
        totalNetEmissionReductions: Number(
          netEmReductions?.totalNetEmissionReductions
        ),
        totalNumberOfCreditingYears: Number(
          netEmReductions?.totalNumberOfCreditingYears
        ),
        avgBaselineEmissionReductions: Number(
          netEmReductions?.avgBaselineEmissionReductions
        ),
        avgProjectEmissionReductions: Number(
          netEmReductions?.avgProjectEmissionReductions
        ),
        avgLeakageEmissionReductions: Number(
          netEmReductions?.avgLeakageEmissionReductions
        ),
        avgNetEmissionReductions: Number(
          netEmReductions?.avgNetEmissionReductions
        ),
      });

      console.log(
        "----------pdd-data loc-----------------",
        pddData?.projectActivity?.locationsOfProjectActivity
      );
      meansOfVerificationForm.setFieldsValue({
        onSiteInspection:
          pddData?.projectActivity?.locationsOfProjectActivity?.map(
            (loc: any) => ({
              siteLocation: loc.locationOfProjectActivity,
            })
          ),
        interviewees: [{ lastName: "" }],
      });

      verficationTeamForm.setFieldsValue({
        verificationTeamMembers: [{ role: "" }],
        technicalReviews: [{ role: "" }],
      });
      setLoading(false);
    }
  };
  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const submitForm = async (appendixVals: any) => {
    setLoading(true);
    try {
      console.log(
        "---------------activityRefId-------------",
        state?.activityId
      );

      const tempValues = {
        ...safeClone(values),
        activityRefId: state?.activityId,
        data: {
          ...safeClone(values.data),
          appendix: appendixVals,
        },
      };

      // const tempValues = {
      //   values,
      //   activityRefId: state?.activityId,
      //   data: {
      //     ...values.data,
      //     appendix: appendixVals,
      //   },
      // };
      const res = await post(API_PATHS.ADD_DOCUMENT, tempValues);
      console.log(res);
      if (res?.statusText === "SUCCESS") {
        message.open({
          type: "success",
          content: "Verification report has been submitted successfully",
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
        });

        setTimeout(() => {
          navigateToDetailsPage();
          setLoading(false);
        }, defaultTimeout);
      }
    } catch (error: any) {
      console.log("---------verification report submit---------", error);
      if (error.status === 400) {
        message.open({
          type: "error",
          content: error.message,
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
        });
      } else {
        message.open({
          type: "error",
          content: "Something went wrong",
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
        });
      }
      setLoading(false);
    }
  };

  const handleValuesUpdate = (val: any) => {
    console.log("----------temp vals stepper-------------", val);

    setValues((prevVal: any) => {
      const tempContent = {
        ...prevVal.data,
        ...val,
      };
      return { ...prevVal, data: tempContent };
    });
  };

  useEffect(() => {
    console.log("-------state?.mode-----------", state);
    if (state?.mode === FormMode.CREATE) {
      fetchAndSetData(id);
    }
  }, []);

  const [documentId, setDocumentId] = useState<string>();

  const safeNumber = (value: any) => Number(value) || 0;

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
            documentType: DocumentEnum.VERIFICATION,
          });

          console.log("--------ver res---------", res);
          if (res?.statusText === "SUCCESS") {
            const data = res?.data;
            setDocumentId(data?.refId);

            console.log(
              "--------ver res 2---------",
              data,
              data.data.basicInformation
            );

            let basicInformation = basicInformationMapDataToView(
              data.data.basicInformation
            );
            const docVersions =
              state?.documents?.[DocumentEnum.VERIFICATION as any]?.version;
            const latestVersion = docVersions ? docVersions + 1 : 1;
            console.log("------------latest version-----------", latestVersion);
            if (state?.mode === FormMode.EDIT) {
              basicInformation = {
                ...basicInformation,
                b_versionNoOfVerificationReport: latestVersion,
              };
            }
            basicInformationForm.setFieldsValue(basicInformation);

            const ghgProjectDescription = ghgProjectDescriptionMapDataToFields(
              data.data.ghgProjectDescription
            );
            ghgProjectDescriptionForm.setFieldsValue(ghgProjectDescription);

            const executiveSummary = executiveSummaryMapDataToFields(
              data.data.executiveSummary
            );
            executiveSummaryForm.setFieldsValue(executiveSummary);

            //
            const verificationTeam = verificationTeamsMapDataToFields(
              data.data.verificationTeam
            );
            verficationTeamForm.setFieldsValue(verificationTeam);

            const applicationOfMateriality =
              applicationOfMaterialityMapDataToFields(
                data.data.applicationOfMateriality
              );
            applicationOfMeterialityForm.setFieldsValue(
              applicationOfMateriality
            );

            const meansOfVerification = meansOfVerificationMapDataToFields(
              data.data.meansOfVerification
            );
            meansOfVerificationForm.setFieldsValue(meansOfVerification);

            const verificationFindings = verificationFindingsMapDataToFields(
              data.data.verificationFindings
            );
            verificationFindingForm.setFieldsValue(verificationFindings);

            const internalQualityControl =
              internalQualityControlMapDataToFields(
                data.data.internalQualityControl
              );
            internalQualityControlForm.setFieldsValue(internalQualityControl);

            const verificationOpinion = verificationOpinionMapDataToFields(
              data.data.verificationOpinion
            );
            verificationOpinionForm.setFieldsValue(verificationOpinion);

            const certificationStatement = certificaitonMapDataToFields(
              data.data.certificationStatement
            );
            certificationStatementForm.setFieldsValue(certificationStatement);

            const appendix = appendixMapDataToFields(data.data.appendix);
            appendixForm.setFieldsValue(appendix);
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


  const steps = [
    {
      title: (
        <div className="stepper-title-container">
          <div className="title">{t("verificationReport:title01")}</div>
        </div>
      ),
      description: (
        <BasicInformationStep
          translator={translator}
          t={t}
          current={current}
          form={basicInformationForm}
          formMode={state?.mode}
          next={next}
          prev={navigateToDetailsPage}
          disableFields={disableFields}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="title">{t("verificationReport:title02")}</div>
        </div>
      ),
      description: (
        <GHGProjectDescriptionStep
          translator={translator}
          t={t}
          current={current}
          form={ghgProjectDescriptionForm}
          formMode={state?.mode}
          next={next}
          prev={prev}
          disableFields={disableFields}
          // countries={countries}
          maxNetGHGReduction={maxNetGHGReduction}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t("verificationReport:title03")}</div>
        </div>
      ),
      description: (
        <ExecutiveSummaryStep
          t={t}
          translator={translator}
          current={current}
          form={executiveSummaryForm}
          formMode={state?.mode}
          next={next}
          prev={prev}
          disableFields={disableFields}
          // countries={countries}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">02</div>
          <div className="title">{t("verificationReport:title04")}</div>
        </div>
      ),
      description: (
        <VerificationTeamStep
          translator={translator}
          t={t}
          current={current}
          form={verficationTeamForm}
          formMode={state?.mode}
          next={next}
          disableFields={disableFields}
          prev={prev}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t("verificationReport:title05")}</div>
        </div>
      ),
      description: (
        <ApplicationOfMaterialityStep
          translator={translator}
          t={t}
          current={current}
          form={applicationOfMeterialityForm}
          formMode={state?.mode}
          next={next}
          prev={prev}
          disableFields={disableFields}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t("verificationReport:title06")}</div>
        </div>
      ),
      description: (
        <MeansOfVerificationStep
          translator={translator}
          t={t}
          current={current}
          form={meansOfVerificationForm}
          formMode={state?.mode}
          next={next}
          prev={prev}
          disableFields={disableFields}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t("verificationReport:title07")}</div>
        </div>
      ),
      description: (
        <VerificationFindingStep
          t={t}
          translator={translator}
          current={current}
          form={verificationFindingForm}
          formMode={state?.mode}
          next={next}
          prev={prev}
          disableFields={disableFields}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t("verificationReport:title08")}</div>
        </div>
      ),
      description: (
        <InternalQualityControlStep
          t={t}
          translator={translator}
          current={current}
          form={internalQualityControlForm}
          formMode={state?.mode}
          next={next}
          prev={prev}
          disableFields={disableFields}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">07</div>
          <div className="title">{t("verificationReport:title09")}</div>
        </div>
      ),
      description: (
        <VerificationOpinionStep
          t={t}
          translator={translator}
          current={current}
          form={verificationOpinionForm}
          formMode={state?.mode}
          next={next}
          prev={prev}
          disableFields={disableFields}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">08</div>
          <div className="title">{t("verificationReport:title10")}</div>
        </div>
      ),
      description: (
        <CertificationStep
          translator={translator}
          t={t}
          current={current}
          form={certificationStatementForm}
          formMode={state?.mode}
          next={next}
          prev={prev}
          disableFields={disableFields}
          handleValuesUpdate={handleValuesUpdate}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">09</div>
          <div className="title">{t("verificationReport:title11")}</div>
        </div>
      ),
      description: (
        <AppendixStep
          translator={translator}
          t={t}
          current={current}
          form={appendixForm}
          formMode={state?.mode}
          prev={prev}
          next={navigateToDetailsPage}
          disableFields={disableFields}
          handleValuesUpdate={submitForm}
          documentId={documentId}
          handleLoading={handleLoading}
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
    </>
  );
};

export default StepperComponent;
