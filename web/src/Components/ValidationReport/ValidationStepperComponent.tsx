import { Steps, message } from "antd";
import { useEffect, useRef, useState } from "react";
import "./ValidationReport.scss";
// import './SLCFMonitoringReportComponent.scss';

import { useForm } from "antd/lib/form/Form";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";

import moment from "moment";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import ValidationMethodology from "./ValidationMethodology";
import ValidationOpinion from "./ValidationOpinion";
import ValidationReportAppendix from "./ValidationReportAppendix";

import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { API_PATHS } from "../../Config/apiConfig";
import { ROUTES } from "../../Config/uiRoutingConfig";
import BasicInformation from "./BasicInformation";
import ExecutiveSummary from "./ExecutiveSummary";
import InternalQualityControl from "./InternalQualityControl";
import GHGProjectDescription from "./GHGProjectDescription";
import MeansOfValidation from "./MeansOfValidation";
import ValidationFindings from "./ValidationFindings";
import { DocumentEnum } from "../../Definitions/Enums/document.enum";
import { Loading } from "../Loading/loading";
import {
  basicInformationMapDataToFields,
  executiveSummaryMapDataToFields,
  ghgProjectDescriptionMapDataToFields,
  internalQualityControlMapDataToFields,
  meansOfValidationMapDataToFields,
  validationFindingsMapDataToFields,
  validationMethodologyMapDataToFields,
  validationOpinionMapDataToFields,
  validationReportAppendixMapDataToFields,
} from "./viewDataMap";
import { mapBase64ToFields } from "../../Utils/mapBase64ToFields";
import { INF_SECTORAL_SCOPE } from "../AddNewProgramme/ProgrammeCreationComponent";
import { toMoment } from "../../Utils/convertTime";

export enum ProcessSteps {
  VR_PROJECT_DETAILS = "VR_PROJECT_DETAILS",
  VR_INTRODUCTION = "VR_INTRODUCTION",
  VR_GHG_PROJECT_DESCRIPTION = "VR_GHG_PROJECT_DESCRIPTION",
  VR_VALIDATION_METHODOLOGY = "VR_VALIDATION_METHODOLOGY",
  VR_VALIDATION_PROCESS = "VR_VALIDATION_PROCESS",
  VR_VALIDATION_OPINION = "VR_VALIDATION_OPINION",
  VR_REFERENCE = "VR_REFERENCE",
  VR_APPENDIX = "VR_APPENDIX",
}

const StepperComponent = (props: any) => {
  const { t, selectedVersion, handleDocumentStatus } = props;

  const [current, setCurrent] = useState(0);

  const navigate = useNavigate();
  const { id } = useParams();
  const { get, post } = useConnection();
  const navigationLocation = useLocation();
  const scrollSection = useRef({} as any);
  const { state } = useLocation();
  console.log("----------state-------------", state);
  const isEdit = true;
  const countryName = import.meta.env.VITE_APP_COUNTRY_NAME || "CountryX";
  const registryName = import.meta.env.VITE_APP_COUNTRY_NAME || "RegistryX";

  const [documentId, setDocumentId] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [disableFields, setDisableFields] = useState<boolean>(false);

  const handleLoading = (val: boolean) => {
    setLoading(val);
  };

  const [existingFormValues, setExistingFormValues] = useState({
    projectRefId: id,
    documentType: DocumentEnum.VALIDATION,
    name: "Validation",
    data: {},
  });

  const navigateToDetailsPage = () => {
    navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(String(id)));
  };

  const scrollToDiv = () => {
    if (scrollSection.current) {
      scrollSection.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const submitForm = async (appendixVals: any) => {
    setLoading(true);

    const tempValues = {
      ...existingFormValues,
      data: {
        ...existingFormValues.data,
        appendix: appendixVals,
      },
    };

    try {
      const res = await post(API_PATHS.ADD_DOCUMENT, tempValues);
      console.log("res", res);
      if (res?.statusText === "SUCCESS") {
        message.open({
          type: "success",
          content: "Validation report has been submitted successfully",
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
        });
        navigateToDetailsPage();
      }
    } catch (error: any) {
      console.log("----------error----------", error);
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

  const next = () => {
    if (
      current === 8 &&
      (state?.mode === FormMode.VIEW || state?.mode === FormMode.VERIFY)
    ) {
      navigateToDetailsPage();
      return;
    }
    setCurrent(current + 1);
    setTimeout(() => {
      scrollToDiv();
    }, 300);
  };

  const prev = () => {
    if (current === 0) {
      navigateToDetailsPage();
      return;
    }
    setCurrent(current - 1);
  };

  const [countries, setCountries] = useState<[]>([]);
  const [projectCategory, setProjectCategory] = useState<string>("");

  const [form1] = useForm();
  const [form2] = useForm();
  const [form3] = useForm();
  const [form4] = useForm();
  const [form5] = useForm();
  const [form6] = useForm();
  const [form7] = useForm();
  const [form8] = useForm();
  const [form9] = useForm();

  const fetchAndSetProgrammeData = async (programId: any) => {
    setLoading(true);

    let programmeData = null;
    let pddData = null;

    try {
      // Fetch Programme Data
      const programmeResponse = await post(API_PATHS.PROGRAMME_BY_ID, {
        programmeId: programId,
      });
      if (programmeResponse?.statusText === "SUCCESS") {
        programmeData = programmeResponse?.data;
        console.log(
          "-----------------Programme Data-----------------",
          programmeData
        );
      } else {
        console.log("Error: Programme API did not return SUCCESS status");
      }
    } catch (error) {
      console.log("Error fetching programme data:", error);
    }

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

    if (programmeData && pddData) {
      const docVersions =
        state?.documents?.[DocumentEnum.VALIDATION as any]?.version;
      const latestVersion = docVersions ? docVersions + 1 : 1;

      form1.setFieldsValue({
        titleOfTheProjectActivity: programmeData?.title,
        mandatarySectoralScopes:
          INF_SECTORAL_SCOPE[programmeData?.sectoralScope],
        projectDeveloper: programmeData?.projectParticipant,
        versionNumberPDD: pddData?.data?.projectDetails?.versionNumber,
        hostParty: pddData?.data?.projectDetails?.hostParty,
        versionNumberValidationReport: latestVersion,
        creditingPeriod:
          pddData?.data?.startDateCreditingPeriod
            ?.projectCreditingPeriodDuration,
        creditingPeriodStart: pddData?.data?.startDateCreditingPeriod
          ?.projectCreditingPeriodStartDate
          ? moment.unix(
              pddData?.data?.startDateCreditingPeriod
                ?.projectCreditingPeriodStartDate
            )
          : null,
        creditingPeriodEnd: pddData?.data?.startDateCreditingPeriod
          ?.projectCreditingPeriodEndDate
          ? moment.unix(
              pddData?.data?.startDateCreditingPeriod
                ?.projectCreditingPeriodEndDate
            )
          : null,
        locationOfProjectActivity: pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]?.locationOfProjectActivity,
        siteNo: pddData?.data?.projectActivity?.locationsOfProjectActivity?.[0]?.siteNo,
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
              optionalImages: mapBase64ToFields(location?.additionalDocuments),
            })),
      });

      const netGHGEmissionReductions =
        pddData?.data?.applicationOfMethodology?.netGHGEmissionReductions;
     
      form2.setFieldsValue({
        estimatedNetEmissionReductions:
          netGHGEmissionReductions.yearlyGHGEmissionReductions?.map(
            (emissionData: any) => ({
              vintage: toMoment(emissionData.vintage),
            })
          ),
        totalNumberOfCreditingYears: netGHGEmissionReductions?.totalNumberOfCredingYears,
        baselineEmissionReductions: 0,
        baselineEmissions:
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.map(
            (loc: any) => ({ location: loc.locationOfProjectActivity })
          ),
      });
      form5.setFieldsValue({
        onSiteInspection:
          pddData?.data?.projectActivity?.locationsOfProjectActivity?.map(
            (loc: any) => ({
              siteLocation: loc.locationOfProjectActivity,
            })
          ),
      });
    }

    setLoading(false);
  };

  // const setLatestVersion = () => {
  //   if (state?.mode === FormMode.CREATE || state?.mode === FormMode.EDIT) {
  //     form1.setFieldsValue({
  //       versionNumberValidationReport:
  //         state?.documents?.[DocumentEnum.VALIDATION as any]?.version ?? 0 + 1,
  //     });
  //   }
  // };

  const handleValuesUpdate = (val: any) => {
    console.log("---------values--------", val);
    setExistingFormValues((prevVal: any) => {
      const tempContent = {
        ...prevVal.data,
        ...val,
      };
      return { ...prevVal, data: tempContent };
    });
  };

  useEffect(() => {
    if (state?.mode === FormMode?.CREATE) {
      fetchAndSetProgrammeData(id);
    }
    //setLatestVersion();
  }, [id]);

  useEffect(() => {
    const getViewData = async () => {
      if (
        state?.mode === FormMode?.EDIT ||
        state?.mode === FormMode?.VERIFY ||
        state?.mode === FormMode?.VIEW
      ) {
        setLoading(true);
        let res;

        if (state?.mode === FormMode.VERIFY || state?.mode === FormMode.VIEW) {
          setDisableFields(true);
        }

        try {
          res = await post(API_PATHS.QUERY_DOCUMENT, {
            refId: state?.documentRefId,
            documentType: DocumentEnum.VALIDATION,
          });

          if (res?.statusText === "SUCCESS") {
            const data = res?.data;
            setDocumentId(data?.refId);
            console.log(
              "---------validation------------",
              data?.data,
              data?.data?.basicInformation
            );
            let basicInformation = basicInformationMapDataToFields(
              data.data?.basicInformation
            );
            const docVersions =
              state?.documents?.[DocumentEnum.VALIDATION as any]?.version;
            const latestVersion = docVersions ? docVersions + 1 : 1;
            if (state?.mode === FormMode.EDIT) {
              basicInformation = {
                ...basicInformation,
                versionNumberValidationReport: latestVersion,
              };
            }
            form1.setFieldsValue(basicInformation);

            const ghgProjectDescription = ghgProjectDescriptionMapDataToFields(
              data.data?.ghgProjectDescription
            );
            form2.setFieldsValue(ghgProjectDescription);

            const executiveSummary = executiveSummaryMapDataToFields(
              data.data?.executiveSummary
            );
            form3.setFieldsValue(executiveSummary);

            const validationMethdology = validationMethodologyMapDataToFields(
              data.data?.validationMethdology
            );
            form4.setFieldsValue(validationMethdology);

            const meansOfValidation = meansOfValidationMapDataToFields(
              data.data?.meansOfValidation
            );
            form5.setFieldsValue(meansOfValidation);

            const validationFindings = validationFindingsMapDataToFields(
              data.data?.validationFindings
            );
            form6.setFieldsValue(validationFindings);

            const internalQualityControl =
              internalQualityControlMapDataToFields(
                data.data?.internalQualityControl
              );
            form7.setFieldsValue(internalQualityControl);

            const validationOpinion = validationOpinionMapDataToFields(
              data.data?.validationOpinion
            );
            form8.setFieldsValue(validationOpinion);

            const appendix = validationReportAppendixMapDataToFields(
              data.data?.appendix
            );
            console.log("---------appendix-----------", appendix);
            form9.setFieldsValue(appendix);
          }
        } catch (error) {
          console.log("error", error);
        } finally {
          setLoading(false);
        }
      }
    };

    getViewData();
  }, [selectedVersion]);

  const steps = [
    {
      title: (
        <div
          ref={scrollSection}
          className="stepper-title-container project-detail-title"
        >
          <div className="title">{t("validationReport:form01Title")}</div>
        </div>
      ),
      description: (
        <BasicInformation
          next={next}
          prev={prev}
          form={form1}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_PROJECT_DETAILS]}
          formMode={state?.mode}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          {/* <div className="step-count">01</div> */}
          <div className="title">{t("validationReport:form02Title")}</div>
        </div>
      ),
      description: (
        <GHGProjectDescription
          next={next}
          prev={prev}
          form={form2}
          current={current}
          t={t}
          countries={countries}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_INTRODUCTION]}
          formMode={state?.mode}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">01</div>
          <div className="title">{t("validationReport:form03Title")}</div>
        </div>
      ),
      description: (
        <ExecutiveSummary
          next={next}
          prev={prev}
          form={form3}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_GHG_PROJECT_DESCRIPTION]}
          formMode={state?.mode}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">02</div>
          <div className="title">{t("validationReport:form04Title")}</div>
        </div>
      ),
      description: (
        <ValidationMethodology
          next={next}
          prev={prev}
          form={form4}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_METHODOLOGY]}
          formMode={state?.mode}
          disableFields={disableFields}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">03</div>
          <div className="title">{t("validationReport:form05Title")}</div>
        </div>
      ),
      description: (
        <MeansOfValidation
          next={next}
          prev={prev}
          form={form5}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_PROCESS]}
          projectCategory={projectCategory}
          disableFields={disableFields}
          formMode={state?.mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">04</div>
          <div className="title">{t("validationReport:form06Title")}</div>
        </div>
      ),
      description: (
        <ValidationFindings
          next={next}
          prev={prev}
          form={form6}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_PROCESS]}
          projectCategory={projectCategory}
          disableFields={disableFields}
          formMode={state?.mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">05</div>
          <div className="title">{t("validationReport:form07Title")}</div>
        </div>
      ),
      description: (
        <InternalQualityControl
          next={next}
          prev={prev}
          form={form7}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_REFERENCE]}
          formMode={state?.mode}
        />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">06</div>
          <div className="title">{t("validationReport:form08Title")}</div>
        </div>
      ),
      description: (
        <ValidationOpinion
          next={next}
          prev={prev}
          form={form8}
          current={current}
          t={t}
          handleValuesUpdate={handleValuesUpdate}
          disableFields={disableFields}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_VALIDATION_OPINION]}
          formMode={state?.mode}
        />
        // <ValidationReportAppendix
        //   next={next}
        //   prev={prev}
        //   form={form8}
        //   current={current}
        //   t={t}
        //   handleValuesUpdate={handleValuesUpdate}
        //   existingFormValues={existingFormValues.content[ProcessSteps.VR_APPENDIX]}
        //   formMode={state?.mode}
        // />
      ),
    },
    {
      title: (
        <div className="stepper-title-container">
          <div className="step-count">07</div>
          <div className="title">{t("validationReport:form09Title")}</div>
        </div>
      ),
      description: (
        <ValidationReportAppendix
          next={next}
          prev={prev}
          form={form9}
          current={current}
          documentId={documentId}
          t={t}
          handleValuesUpdate={submitForm}
          // existingFormValues={existingFormValues.content[ProcessSteps.VR_APPENDIX]}
          disableFields={disableFields}
          formMode={state?.mode}
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
