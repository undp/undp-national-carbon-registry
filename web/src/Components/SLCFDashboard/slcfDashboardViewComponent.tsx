import React, { useEffect, useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Radio,
  Row,
  Skeleton,
  Tooltip,
  message,
  Dropdown,
  Space,
  MenuProps,
  Select,
} from 'antd';
import './dashboard.scss';
import { AppstoreOutlined, VerifiedOutlined } from '@ant-design/icons';
import moment from 'moment';
import {
  ClockHistory,
  BoxArrowInRight,
  ShieldX,
  ShieldExclamation,
  BoxArrowRight,
  ShieldCheck,
  Gem,
  InfoCircle,
  FileEarmarkCheck,
  CreditCard2Back,
  HandThumbsUp,
  BoxArrowLeft,
} from 'react-bootstrap-icons';
import {
  ChartSeriesItem,
  totalCertifiedCreditsSeriesInitialValues,
  totalCreditsSeriesInitialValues,
  getTotalProgrammesInitialValues,
  getTotalProgrammesSectorInitialValues,
} from './dashboardTypesInitialValues';
import {
  creditsByDateOptions,
  creditsByPurposeOptions,
  optionDonutPieA,
  // optionDonutPieB,
  retirementsByDateOptions,
  // totalCreditsCertifiedOptions,
  // totalCreditsOptions,
  totalProgrammesOptions,
  // totalProgrammesOptionsSub,
} from './slcfChartOptions';
import { ProgrammeRejectAndTransferComponent } from './programmeRejectAndTransferComponent';
import { SLCFPieChartsStatComponent } from './slcfPieChartStatComponent';
import { SLCFBarChartsStatComponent } from './slcfBarChartStatsComponent';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { SystemNames } from '../../Definitions/Enums/statsCards.type.enum';
import {
  MapSourceData,
  MapTypes,
  MarkerData,
} from '../../Definitions/Definitions/mapComponent.definitions';
import {
  getStageEnumVal,
  addRoundNumber,
  addCommSep,
  getCreditTypeName,
} from '../../Definitions/Definitions/programme.definitions';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import {
  CreditType,
  getProjectCategory,
  ProgrammeCategory,
  ProgrammeSLStageR,
  ProgrammeStageLegend,
  ProjectProposalStage,
  ProjectProposalStageMap,
} from '../../Definitions/Enums/programmeStage.enum';
// import { Sector, SlProjectCategory } from '../../Definitions/Enums/sector.enum';
import { LegendItem } from '../LegendItem/legendItem';
import { MapComponent } from '../Maps/mapComponent';
import { StasticCard } from '../StatisticsCard/statisticsCard';
import { SLStatisticsCard } from './SlStatisticsCard/slStatisticsCard';
import { CreditTypeSl } from '../../Definitions/Enums/creditTypeSl.enum';
import { SLCFDetailsBarChartsStatComponent } from './slcfDetailsBarChartStatsComponent';
const { RangePicker } = DatePicker;

export const SLCFDashboardComponent = (props: any) => {
  const { Chart, t, ButtonGroup, Link, isMultipleDashboardsVisible = false } = props;
  const { get, post, delete: del, statServerUrl } = useConnection();
  const { userInfoState } = useUserContext();
  const [loadingWithoutTimeRange, setLoadingWithoutTimeRange] = useState<boolean>(false);

  const [loadingCharts, setLoadingCharts] = useState<boolean>(false);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [pendingProjectsWithoutTimeRange, setPendingProjectsWithoutTimeRange] = useState<number>(0);
  const [pendingProjects, setPendingProjects] = useState<number>(0);
  const [rejectedProjects, setRejectedProjects] = useState<number>(0);
  const [authorisedProjects, setAuthorisedProjects] = useState<number>(0);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditBalanceWithoutTimeRange, setCreditBalanceWithoutTimeRange] = useState<number>(0);
  const [creditCertiedBalanceWithoutTimeRange, setCreditCertifiedBalanceWithoutTimeRange] =
    useState<number>(0);

  const [authCreditsByTypePieSeries, setAuthCreditsByTypePieSeries] = useState<number[]>([1, 1, 0]);
  const [creditsPieChartTotal, setCreditsPieChartTotal] = useState<any>(0);
  const [certifiedCreditsPieChartTotal, setCertifiedCreditsPieChartTotal] = useState<any>(0);

  const [startTime, setStartTime] = useState<number>(
    Date.parse(String(moment().subtract('13', 'days').startOf('day')))
  );
  const [endTime, setEndTime] = useState<number>(Date.parse(String(moment().endOf('day'))));
  const [categoryType, setCategoryType] = useState<string>('overall');

  // states for totalProgrammes chart
  const [totalProgrammesSeries, setTotalProgrammesSeries] = useState<ChartSeriesItem[]>(
    getTotalProgrammesInitialValues()
  );
  const [totalProgrammesOptionsLabels, setTotalProgrammesOptionsLabels] = useState<any[]>([]);

  // states for totalProgrammes sub sector chart
  const [totalProgrammesSectorSeries, setTotalProgrammesSectorSeries] = useState<ChartSeriesItem[]>(
    getTotalProgrammesSectorInitialValues()
  );
  const [totalProgrammesSectorOptionsLabels, setTotalProgrammesSectorOptionsLabels] = useState<
    any[]
  >([]);
  // states for totalCredits chart
  const [totalCreditsSeries, setTotalCreditsSeries] = useState<ChartSeriesItem[]>(
    totalCreditsSeriesInitialValues
  );
  const [totalCreditsOptionsLabels, setTotalCreditsOptionsLabels] = useState<any[]>([]);

  // states for totalCreditsCertified chart
  const [totalCertifiedCreditsSeries, setTotalCertifiedCreditsSeries] = useState<ChartSeriesItem[]>(
    totalCertifiedCreditsSeriesInitialValues
  );
  const [totalCertifiedCreditsOptionsLabels, setTotalCertifiedCreditsOptionsLabels] = useState<
    any[]
  >([]);

  // locations of programmes
  const [programmeLocations, setProgrammeLocations] = useState<any>();
  const [programmeTransferLocations, setProgrammeTransferLocations] = useState<any>();

  //certifier view states
  const [programmesCertifed, setProgrammesCertifed] = useState<number>(0);
  const [programmesUnCertifed, setProgrammesUnCertifed] = useState<number>(0);

  //programmeDeveloper
  const [transferRequestSent, setTransferRequestSent] = useState<number>(0);
  const [verificationRequestPending, setVerificationRequestPending] = useState<number>(0);
  const [transferRequestReceived, setTransferRequestReceived] = useState<number>(0);

  //last time updates
  const [lastUpdateProgrammesStatsEpoch, setLastUpdateProgrammesStatsEpoch] = useState<number>(0);
  const [lastUpdateProgrammesStats, setLastUpdateProgrammesStats] = useState<string>('0');

  const [lastUpdatePendingTransferSentEpoch, setLastUpdatePendingTransferSentEpoch] =
    useState<number>(0);
  const [lastUpdatePendingTransferSent, setLastUpdatePendingTransferSent] = useState<string>('0');

  const [lastUpdateCreditBalanceEpoch, setLastUpdateCreditBalanceEpoch] = useState<number>(0);
  const [lastUpdateCreditBalance, setLastUpdateCreditBalance] = useState<string>('0');

  const [lastUpdatePendingTransferReceivedEpoch, setLastUpdatePendingTransferReceivedEpoch] =
    useState<number>(0);
  const [lastUpdatePendingTransferReceived, setLastUpdatePendingTransferReceived] =
    useState<string>('0');

  const [lastUpdateProgrammesCertifiableEpoch, setLastUpdateProgrammesCertifiableEpoch] =
    useState<number>(0);
  const [lastUpdateProgrammesCertifiable, setLastUpdateProgrammesCertifiable] =
    useState<string>('0');

  const [lastUpdateCertifiedCreditsStatsEpoch, setLastUpdateCertifiedCreditsStatsEpoch] =
    useState<number>(0);
  const [lastUpdateCertifiedCreditsStats, setLastUpdateCertifiedCreditsStats] =
    useState<string>('0');

  const [lastUpdateProgrammesCertifiedEpoch, setLastUpdateProgrammesCertifiedEpoch] =
    useState<number>(0);
  const [lastUpdateProgrammesCertified, setLastUpdateProgrammesCertified] = useState<string>('0');

  const [lastUpdateProgrammesStatsCEpoch, setLastUpdateProgrammesStatsCEpoch] = useState<number>(0);
  const [lastUpdateProgrammesStatsC, setLastUpdateProgrammesStatsC] = useState<string>('0');

  const [lastUpdateProgrammesCreditsStatsEpoch, setLastUpdateProgrammesCreditsStatsEpoch] =
    useState<number>(0);
  const [lastUpdateProgrammesCreditsStats, setLastUpdateProgrammesCreditsStats] =
    useState<string>('0');

  const [lastUpdateProgrammesSectorStatsCEpoch, setLastUpdateProgrammesSectorStatsCEpoch] =
    useState<number>(0);
  const [lastUpdateProgrammesSectorStatsC, setLastUpdateProgrammesSectorStatsC] =
    useState<string>('0');
  const [lastUpdateTotalCreditsEpoch, setLastUpdateTotalCreditsEpoch] = useState<number>(0);
  const [lastUpdateTotalCredits, setLastUpdateTotalCredits] = useState<string>('0');

  const [lastUpdateTotalCreditsCertifiedEpoch, setLastUpdateTotalCreditsCertifiedEpoch] =
    useState<number>(0);
  const [lastUpdateTotalCreditsCertified, setLastUpdateTotalCreditsCertified] =
    useState<string>('0');

  const [lastUpdateTransferLocationsEpoch, setLastUpdateTransferLocationsEpoch] =
    useState<number>(0);
  const [lastUpdateTransferLocations, setLastUpdateTransferLocations] = useState<string>('0');

  const [transferLocationsMapSource, setTransferLocationsMapSource] = useState<MapSourceData>();
  const [txLocationMapData, setTxLocationMapData] = useState<any>();
  const [transferLocationsMapLayer, setTransferLocationsMapLayer] = useState<any>();

  const [programmeLocationsMapCenter, setProgrammeLocationsMapCenter] = useState<number[]>([]);
  const [programmeLocationsMapSource, setProgrammeLocationsMapSource] = useState<MapSourceData>();
  const [programmeLocationsMapLayer, setProgrammeLocationsMapLayer] = useState<any>();

  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState('-');
  const [selectedurl, setSelectedurl] = useState<string>('');

  //MARK: SL states
  const [totalProgrammesCount, setTotalProgrammesCount] = useState<number>(0);
  const [totalProgrammesCountLastUpdatedEpoch, setTotalProgrammesCountLastUpdatedEpoch] =
    useState<number>(0);
  const [totalProgrammesCountLastUpdated, setTotalProgrammesCountLastUpdated] =
    useState<string>('0');

  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [totalCreditsLastUpdatedEpoch, setTotalCreditsLastUpdatedEpoch] = useState<number>(0);
  const [totalCreditsLastUpdated, setTotalCreditsLastUpdated] = useState<string>('0');

  const [totalRetiredCreditsCount, setTotalRetiredCreditsCount] = useState<number>(0);
  const [totalRetiredCreditsLastUpdatedEpoch, setTotalRetiredCreditsLastUpdatedEpoch] =
    useState<number>(0);
  const [totalRetiredCreditsLastUpdated, setTotalRetiredCreditsLastUpdated] = useState<string>('0');

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPieChart, setLoadingPieChart] = useState<boolean>(false);

  const [programmeCategory, setProgrammeCategory] = useState<string>();
  const [creditType, setCreditType] = useState<string>();

  const [programmeByStatueData, setProgrammeByStatueData] = useState<any>();
  const [programmeByStatueLastUpdatedEpoch, setProgrammeByStatueLastUpdatedEpoch] =
    useState<number>(0);
  const [programmeByStatueLastUpdated, setProgrammeByStatueLastUpdated] = useState<string>('0');
  const [programmeByStatueSeries, setProgrammeByStatueSeries] = useState<ChartSeriesItem[]>([]);

  const [projectsByCategorySeries, setProjectsByCategorySeries] = useState<number[]>([1, 1, 0, 0]);
  const [projectsByCategoryLastUpdatedEpoch, setProjectsByCategoryLastUpdatedEpoch] =
    useState<number>(0);
  const [projectsByCategoryLastUpdated, setProjectsByCategoryLastUpdated] = useState<string>('0');

  const [retirementsByDateSeries, setRetirementsByDateSeries] = useState<ChartSeriesItem[]>([]);
  const [loadingRetirementsByDateCharts, setLoadingRetirementsByDateCharts] =
    useState<boolean>(false);

  const [creditsByStatusData, setCreditsByStatusData] = useState<any>();
  const [authCreditLastUpdatedEpoch, setAuthCreditLastUpdatedEpoch] = useState<number>(0);
  const [authCreditLastUpdated, setAuthCreditLastUpdated] = useState<string>('0');

  const [issuedCreditLastUpdatedEpoch, setIssuedCreditLastUpdatedEpoch] = useState<number>(0);
  const [issuedCreditLastUpdated, setIssuedCreditLastUpdated] = useState<string>('0');

  const [transferredCreditLastUpdatedEpoch, setTransferredCreditLastUpdatedEpoch] =
    useState<number>(0);
  const [transferredCreditLastUpdated, setTransferredCreditLastUpdated] = useState<string>('0');

  const [retiredCreditLastUpdatedEpoch, setRetiredCreditLastUpdatedEpoch] = useState<number>(0);
  const [retiredCreditLastUpdated, setRetiredCreditLastUpdated] = useState<string>('0');

  const [creditsByDateSeries, setCreditsByDateSeries] = useState<ChartSeriesItem[]>([]);
  const [loadingCreditsByDateCharts, setLoadingCreditsByDateCharts] = useState<boolean>(false);

  const [creditsByPurposeSeries, setCreditsByPurposeSeries] = useState<ChartSeriesItem[]>([]);
  const [loadingCreditsByPurposeCharts, setLoadingCreditsByPurposeCharts] =
    useState<boolean>(false);

  const [chartWidth, setChartWidth] = useState(window.innerWidth > 1600 ? '750px' : '600px');
  const [retirementsByDateChartWidth, setRetirementsByDateChartWidth] = useState(
    window.innerWidth > 1600 ? '850px' : '650px'
  );
  const [creditByChartWidth, setCreditByChartWidth] = useState(
    window.innerWidth > 1600 ? '650px' : '450px'
  );

  // const [programmeByCategoryData, setProgrammeByCategoryData] = useState<any>();
  const [programmeByCategoryPieSeries, setProgrammeByCategoryPieSeries] = useState<number[]>([
    1, 1, 0, 0,
  ]);

  //MARK: getTotalProgrammeCount
  const getTotalProgrammeCount = async () => {
    setLoadingWithoutTimeRange(true);
    try {
      const response: any = await post(
        'stats/programme/totalSLProjects',
        null,
        undefined,
        statServerUrl
      );
      if (response) {
        setTotalProgrammesCount(response?.data?.count);
        setTotalProgrammesCountLastUpdatedEpoch(
          response?.data?.latestUpdatedTime !== null
            ? parseInt(response?.data?.latestUpdatedTime)
            : 0
        );
        setTotalProgrammesCountLastUpdated(
          response?.data?.latestUpdatedTime !== null
            ? moment(parseInt(response?.data?.latestUpdatedTime)).fromNow()
            : '0'
        );
      }
    } catch (error: any) {
      console.log('Error in getting Total Programme Count', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingWithoutTimeRange(false);
    }
  };

  //MARK: getTotalIssuedCredits
  const getTotalIssuedCredits = async () => {
    setLoadingWithoutTimeRange(true);
    try {
      const response: any = await post(
        'stats/programme/totalIssuedCredits',
        null,
        undefined,
        statServerUrl
      );
      if (response) {
        setTotalCredits(response?.data?.totalCreditIssued);
        setTotalCreditsLastUpdatedEpoch(
          response?.data?.latestUpdatedTime !== null
            ? parseInt(response?.data?.latestUpdatedTime)
            : 0
        );
        setTotalCreditsLastUpdated(
          response?.data?.latestUpdatedTime !== null
            ? moment(parseInt(response?.data?.latestUpdatedTime)).fromNow()
            : '0'
        );
      }
    } catch (error: any) {
      console.log('Error in getting Total Issued Credits', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingWithoutTimeRange(false);
    }
  };

  //MARK: getTotalRetiredCredits
  const getTotalRetiredCredits = async () => {
    setLoadingWithoutTimeRange(true);
    try {
      const response: any = await post(
        'stats/programme/totalRetiredCredits',
        null,
        undefined,
        statServerUrl
      );
      if (response) {
        setTotalRetiredCreditsCount(
          response?.data?.totalCreditRetired + response?.data?.totalCreditTransferred
        );
        setTotalRetiredCreditsLastUpdatedEpoch(
          response?.data?.latestUpdatedTime !== null
            ? parseInt(response?.data?.latestUpdatedTime)
            : 0
        );
        setTotalRetiredCreditsLastUpdated(
          response?.data?.latestUpdatedTime !== null
            ? moment(parseInt(response?.data?.latestUpdatedTime)).fromNow()
            : '0'
        );
      }
    } catch (error: any) {
      console.log('Error in getting Total Retired Credits', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingWithoutTimeRange(false);
    }
  };

  const onChangeRange = async (dateMoment: any, dateString: any) => {
    try {
      if (!dateMoment) {
        setStartTime(0);
        setEndTime(0);
      }
      if (dateMoment !== null && dateMoment[1] !== null) {
        setStartTime(Date.parse(String(moment(dateMoment[0]?._d).startOf('day'))));
        setEndTime(Date.parse(String(moment(dateMoment[1]?._d).endOf('day'))));
      } else {
        setStartTime(0);
        setEndTime(0);
      }
    } catch (e: any) {
      setStartTime(0);
      setEndTime(0);
    }
  };

  const onCategoryChanged = (value: string) => {
    console.log('changed', value);
    setProgrammeCategory(value);
  };

  const onCreditTypeChanged = (value: string) => {
    console.log('changed', value);
    setCreditType(value);
  };

  const getFilters = () => {
    const andFilter = [];
    if (startTime !== 0 && endTime !== 0) {
      andFilter.push(
        {
          key: 'createdTime',
          operation: '>',
          value: startTime,
        },
        {
          key: 'createdTime',
          operation: '<=',
          value: endTime,
        }
      );
    }

    if (programmeCategory) {
      andFilter.push({
        key: 'projectCategory',
        operation: '=',
        value: programmeCategory,
      });
    }

    if (creditType) {
      andFilter.push({
        key: 'purposeOfCreditDevelopment',
        operation: '=',
        value: creditType,
      });
    }
    return andFilter;
  };

  //MARK: getProgrammeDataByStatus
  const getProgrammeDataByStatus = async () => {
    setLoadingCharts(true);
    try {
      const response: any = await post(
        'stats/programme/queryProgrammesByStatus',
        { filterAnd: getFilters() },
        undefined,
        statServerUrl
      );
      if (response) {
        setProgrammeByStatueData(response?.data);
        setProgrammeByStatueLastUpdatedEpoch(
          response?.data?.latestUpdatedTime !== null
            ? parseInt(response?.data?.latestUpdatedTime)
            : 0
        );
        setProgrammeByStatueLastUpdated(
          response?.data?.latestUpdatedTime !== null
            ? moment(parseInt(response?.data?.latestUpdatedTime)).fromNow()
            : '0'
        );

        if (response?.data?.proposalStageData) {
          const combinedStage = 'PROPOSAL_PENDING';
          const combinedStages = [
            ProjectProposalStage.SUBMITTED_COST_QUOTATION,
            ProjectProposalStage.SUBMITTED_PROPOSAL,
            ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT,
          ];

          const processedData = [
            ...response.data.proposalStageData.filter(
              (item: any) =>
                !combinedStages.includes(item.projectProposalStage as ProjectProposalStage)
            ),
            {
              projectProposalStage: combinedStage,
              count: combinedStages
                .map((stage) =>
                  parseInt(
                    response.data.proposalStageData.find(
                      (item: any) => item.projectProposalStage === stage
                    )?.count || '0',
                    10
                  )
                )
                .reduce((sum, count) => sum + count, 0)
                .toString(),
            },
          ];

          // Get the list of all stages, including `PROPOSAL_PENDING` inserted after `REJECTED_INF`
          const allStages: any = [
            ...Object.values(ProjectProposalStage).filter(
              (stage) => !combinedStages.includes(stage)
            ),
          ];
          const rejectedInfIndex = allStages.indexOf(ProjectProposalStage.REJECTED_INF);
          allStages.splice(rejectedInfIndex + 1, 0, combinedStage); // Insert after REJECTED_INF

          // Generate the result array
          const result = allStages.map((stage: any) => {
            const dataArray = allStages.map((_: any, index: any) => {
              const matchedItem = processedData.find((item) => item.projectProposalStage === stage);
              return index === allStages.indexOf(stage)
                ? matchedItem
                  ? parseInt(matchedItem.count, 10)
                  : 0
                : 0;
            });

            return {
              name: ProjectProposalStageMap[stage as keyof typeof ProjectProposalStageMap],
              data: dataArray,
            };
          });

          totalProgrammesOptions.xaxis.categories = allStages.map(
            (stage: keyof typeof ProjectProposalStageMap) => {
              return ProjectProposalStageMap[stage] || stage;
            }
          );
          setProgrammeByStatueSeries(result);
        }
      }
    } catch (error: any) {
      console.log('Error in getting Programme Data By Status', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingCharts(false);
    }
  };

  //MARK: getTotalAuthorisedProgrammes
  const getTotalAuthorisedProgrammes = () => {
    if (
      programmeByStatueData &&
      programmeByStatueData.proposalStageData &&
      programmeByStatueData.proposalStageData.length > 0
    ) {
      const authorised = programmeByStatueData.proposalStageData.find(
        (item: any) => item.projectProposalStage === 'AUTHORISED'
      );
      return authorised ? parseInt(authorised.count, 10) : 0;
    } else {
      return 0;
    }
  };

  // //MARK: getProgrammeStatusChartData
  // const getProgrammeStatusChartData = () => {
  //   if (programmeByStatueData?.proposalStageData) {
  //     const combinedStage = 'PROPOSAL_PENDING';
  //     const combinedStages = [
  //       ProjectProposalStage.SUBMITTED_COST_QUOTATION,
  //       ProjectProposalStage.SUBMITTED_PROPOSAL,
  //       ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT,
  //     ];

  //     const processedData = [
  //       ...programmeByStatueData.proposalStageData.filter(
  //         (item: any) => !combinedStages.includes(item.projectProposalStage as ProjectProposalStage)
  //       ),
  //       {
  //         projectProposalStage: combinedStage,
  //         count: combinedStages
  //           .map((stage) =>
  //             parseInt(
  //               programmeByStatueData.proposalStageData.find(
  //                 (item: any) => item.projectProposalStage === stage
  //               )?.count || '0',
  //               10
  //             )
  //           )
  //           .reduce((sum, count) => sum + count, 0)
  //           .toString(),
  //       },
  //     ];

  //     // Get the list of all stages, including `PROPOSAL_PENDING` inserted after `REJECTED_INF`
  //     const allStages: any = [
  //       ...Object.values(ProjectProposalStage).filter((stage) => !combinedStages.includes(stage)),
  //     ];
  //     const rejectedInfIndex = allStages.indexOf(ProjectProposalStage.REJECTED_INF);
  //     allStages.splice(rejectedInfIndex + 1, 0, combinedStage); // Insert after REJECTED_INF

  //     // Generate the result array
  //     const result = allStages.map((stage: any) => {
  //       const dataArray = allStages.map((_: any, index: any) => {
  //         const matchedItem = processedData.find((item) => item.projectProposalStage === stage);
  //         return index === allStages.indexOf(stage)
  //           ? matchedItem
  //             ? parseInt(matchedItem.count, 10)
  //             : 0
  //           : 0;
  //       });

  //       return {
  //         name: ProjectProposalStageMap[stage as keyof typeof ProjectProposalStageMap],
  //         data: dataArray,
  //       };
  //     });

  //     totalProgrammesOptions.xaxis.categories = allStages.map(
  //       (stage: keyof typeof ProjectProposalStageMap) => {
  //         return ProjectProposalStageMap[stage] || stage;
  //       }
  //     );
  //     return result;
  //   } else {
  //     return [];
  //   }
  // };

  //MARK: getProgrammeDataByCategory
  const getProgrammeDataByCategory = async () => {
    setLoadingPieChart(true);
    try {
      const response: any = await post(
        'stats/programme/queryProgrammesByCategory',
        { filterAnd: getFilters() },
        undefined,
        statServerUrl
      );
      if (response) {
        // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
        setProjectsByCategoryDonutValues(response?.data?.projectCategoryData);
        setProjectsByCategoryLastUpdatedEpoch(
          response?.data?.latestUpdatedTime !== null && response?.data?.latestUpdatedTime !== 0
            ? parseInt(response?.data?.latestUpdatedTime)
            : 0
        );
        setProjectsByCategoryLastUpdated(
          response?.data?.latestUpdatedTime !== null && response?.data?.latestUpdatedTime !== 0
            ? moment(parseInt(response?.data?.latestUpdatedTime)).fromNow()
            : '0'
        );
      }
    } catch (error: any) {
      console.log('Error in getting Programme By Category', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingPieChart(false);
    }
  };

  // useEffect(() => {
  //   console.log(
  //     'REFRESHED=====================',
  //     retirementsByDateSeries,
  //     retirementsByDateOptionsLabels
  //   );
  //   ApexCharts.exec('total-retirement-by-date', 'updateSeries', retirementsByDateSeries);
  //   // ApexCharts.exec('total-retirement-by-date', 'updateSeries', {
  //   //   data: totalProgrammesSectorSeries,
  //   // });
  //   ApexCharts.exec('total-retirement-by-date', 'updateOptions', {
  //     xaxis: {
  //       categories: retirementsByDateOptionsLabels,
  //     },
  //   });
  //   retirementsByDateOptions.xaxis.categories = retirementsByDateOptionsLabels;
  //   // retirementsByDateOptions.annotations.points = retirementsByDateAnnotations;
  // }, [retirementsByDateSeries, retirementsByDateOptionsLabels]);

  // //MARK: getRetirementByDateChartSeries
  // const getRetirementByDateChartSeries = (retirementsByDateData2: any) => {
  //   if (retirementsByDateData2) {
  //     // Extract unique dates for x axis labels
  //     const categories = [
  //       ...new Set(retirementsByDateData2?.map((item: any) => item.approvedDate)),
  //     ];

  //     // create bar chart series data arrays
  //     const creditTypes = ['TRACK_2', 'TRACK_1'];
  //     const series = creditTypes.map((creditTypeKey) => {
  //       return {
  //         name: creditTypeKey === 'TRACK_2' ? 'Retirements' : 'Transfers',
  //         data: categories.map((date) => {
  //           return retirementsByDateData2
  //             ?.filter(
  //               (item: any) => item.creditType === creditTypeKey && item.approvedDate === date
  //             )
  //             .reduce((sum: any, item: any) => sum + item.totalCreditAmount, 0);
  //         }),
  //       };
  //     });

  //     // Set total of stacked bars as annotations on top of each bar
  //     const totals = series?.[0].data.map((_: any, index: any) =>
  //       series?.reduce((sum: any, seriesArr: any) => sum + seriesArr.data[index], 0)
  //     );
  //     const totalAnnotations = totals.map((total: any, index: any) => ({
  //       x: retirementsByDateOptions.xaxis.categories[index],
  //       y: total,
  //       marker: {
  //         size: 0, // Remove the circle marker
  //       },
  //       label: {
  //         text: total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`,
  //         style: {
  //           fontSize: '12px',
  //           color: '#000',
  //           background: 'transparent',
  //           stroke: 'none !important',
  //           borderRadius: 0, // No rounded corners
  //           borderColor: 'transparent', // Remove the border
  //         },
  //       },
  //     }));

  //     // Format the dates
  //     const formattedCategories = categories.map((date: any) => moment(date).format('DD-MM-YYYY'));
  //     retirementsByDateOptions.xaxis.categories = formattedCategories;

  //     // Add totals as annotations
  //     // retirementsByDateOptions.annotations.points = totalAnnotations;

  //     setRetirementsByDateSeries(series);
  //     setRetirementsByDateOptionsLabels(formattedCategories);
  //     setRetirementsByDateAnnotations(totalAnnotations);
  //     // return series;
  //   } else {
  //     return [];
  //   }
  // };

  //MARK: getRetirementsDataByDate
  const getRetirementsDataByDate = async () => {
    setLoadingRetirementsByDateCharts(true);
    try {
      const response: any = await post(
        'stats/programme/queryRetirementsByDate',
        { filterAnd: getFilters() },
        undefined,
        statServerUrl
      );
      if (response) {
        // setRetirementsByDateData(response.data);
        const categories = [...new Set(response.data?.map((item: any) => item.approvedDate))];

        // create bar chart series data arrays
        const creditTypes = ['TRACK_2', 'TRACK_1'];
        const series = creditTypes.map((creditTypeKey) => {
          return {
            name: creditTypeKey === 'TRACK_2' ? 'Retirements' : 'Transfers',
            data: categories.map((date) => {
              return response.data
                ?.filter(
                  (item: any) => item.creditType === creditTypeKey && item.approvedDate === date
                )
                .reduce((sum: any, item: any) => sum + item.totalCreditAmount, 0);
            }),
          };
        });

        // // Set total of stacked bars as annotations on top of each bar
        // const totals = series?.[0].data.map((_: any, index: any) =>
        //   series?.reduce((sum: any, seriesArr: any) => sum + seriesArr.data[index], 0)
        // );
        // const totalAnnotations = totals.map((total: any, index: any) => ({
        //   x: retirementsByDateOptions.xaxis.categories[index],
        //   y: total,
        //   marker: {
        //     size: 0, // Remove the circle marker
        //   },
        //   label: {
        //     text: total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`,
        //     style: {
        //       fontSize: '12px',
        //       color: '#000',
        //       background: 'transparent',
        //       stroke: 'none !important',
        //       borderRadius: 0, // No rounded corners
        //       borderColor: 'transparent', // Remove the border
        //     },
        //   },
        // }));

        // Format the dates
        const formattedCategories = categories.map((date: any) =>
          moment(date).format('DD-MM-YYYY')
        );
        retirementsByDateOptions.xaxis.categories = formattedCategories;

        // Add totals as annotations
        // retirementsByDateOptions.annotations.points = totalAnnotations;

        setRetirementsByDateSeries(series);
        // setRetirementsByDateOptionsLabels(formattedCategories);
        // setRetirementsByDateAnnotations(totalAnnotations);
      }
    } catch (error: any) {
      console.log('Error in getting Retirements Data By Date', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingRetirementsByDateCharts(false);
    }
  };

  //MARK: getCreditsByStatusData
  const getCreditsByStatusData = async () => {
    setLoading(true);
    try {
      const response: any = await post(
        'stats/programme/queryCreditsByStatus',
        { filterAnd: getFilters() },
        undefined,
        statServerUrl
      );
      if (response) {
        setCreditsByStatusData(response.data);

        const authCredits = response.data?.latestAuthorisedCreditUpdatedTime;
        const issuedCredits = response.data?.latestIssuedCreditUpdatedTime;
        const transferredCredits = response.data?.latestTransferredCreditUpdatedTime;
        const retiredCredits = response.data?.latestRetiredCreditUpdatedTime;

        setAuthCreditLastUpdatedEpoch(
          authCredits && authCredits !== null && authCredits !== 0 ? parseInt(authCredits) : 0
        );
        setAuthCreditLastUpdated(
          authCredits !== null && authCredits !== 0 && authCredits
            ? moment(parseInt(authCredits)).fromNow()
            : '0'
        );

        setIssuedCreditLastUpdatedEpoch(
          issuedCredits && issuedCredits !== null && issuedCredits !== 0
            ? parseInt(issuedCredits)
            : 0
        );
        setIssuedCreditLastUpdated(
          issuedCredits !== null && issuedCredits !== 0 && issuedCredits
            ? moment(parseInt(issuedCredits)).fromNow()
            : '0'
        );

        setTransferredCreditLastUpdatedEpoch(
          transferredCredits && transferredCredits !== null && transferredCredits !== 0
            ? parseInt(transferredCredits)
            : 0
        );
        setTransferredCreditLastUpdated(
          transferredCredits !== null && transferredCredits !== 0 && transferredCredits
            ? moment(parseInt(transferredCredits)).fromNow()
            : '0'
        );

        setRetiredCreditLastUpdatedEpoch(
          retiredCredits && retiredCredits !== null && retiredCredits !== 0
            ? parseInt(retiredCredits)
            : 0
        );
        setRetiredCreditLastUpdated(
          retiredCredits !== null && retiredCredits !== 0 && retiredCredits
            ? moment(parseInt(retiredCredits)).fromNow()
            : '0'
        );
      }
    } catch (error: any) {
      console.log('Error in getting Credits By Status', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  //MARK: getCreditsByDateData
  const getCreditsByDateData = async () => {
    setLoadingCreditsByDateCharts(true);
    // setLoading(true);
    try {
      const response: any = await post(
        'stats/programme/queryCreditsByDate',
        { filterAnd: getFilters() },
        undefined,
        statServerUrl
      );
      if (response) {
        // setCreditsByDateData(response.data);
        // Extract unique dates for x axis labels
        const categories = [...new Set(response.data?.map((item: any) => item.log_date))];

        // Define the credit types and their corresponding series names
        const creditStatuses = [
          { key: 'total_credit_authorised', name: 'Authorised' },
          { key: 'total_credit_issued', name: 'Issued' },
          { key: 'total_credit_transferred', name: 'Transferred' },
          { key: 'total_credit_retired', name: 'Retired' },
        ];

        const series = creditStatuses.map((creditStatusObj) => {
          return {
            name: creditStatusObj.name, // Format stack names
            data: categories.map((date) => {
              // Find matching entry for this date
              const entry = response.data?.find((item: any) => item.log_date === date);
              return entry && entry[creditStatusObj.key]
                ? parseFloat(entry[creditStatusObj.key])
                : 0; // Use value or default to 0
            }),
          };
        });

        // Format the dates
        const formattedCategories = categories.map((date: any) =>
          moment(date).format('DD-MM-YYYY')
        );
        creditsByDateOptions.xaxis.categories = formattedCategories;

        // Set total of stacked bars as annotations on top of each bar
        const totals = series?.[0].data.map((_: any, index: any) =>
          series?.reduce((sum: any, seriesArr: any) => sum + seriesArr.data[index], 0)
        );
        const totalAnnotations = totals.map((total: any, index: any) => ({
          x: creditsByDateOptions.xaxis.categories[index],
          y: total,
          marker: {
            size: 0, // Remove the circle marker
          },
          label: {
            text: total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`,
            style: {
              fontSize: '12px',
              color: '#000',
              background: 'transparent',
              stroke: 'none !important',
              borderRadius: 0, // No rounded corners
              borderColor: 'transparent', // Remove the border
            },
          },
        }));

        // Add totals as annotations
        creditsByDateOptions.annotations.points = totalAnnotations;
        setCreditsByDateSeries(series);
        // setCreditsByDateOptionsLabels(formattedCategories);
      }
    } catch (error: any) {
      console.log('Error in getting Credits By Date', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      // setLoading(false);
      setLoadingCreditsByDateCharts(false);
    }
  };

  // //MARK: getRetirementByDateChartSeries
  // const getCreditsByDateChartSeries = () => {
  //   // Extract unique dates for x axis labels
  //   const categories = [...new Set(creditsByDateData?.map((item: any) => item.log_date))];

  //   // Define the credit types and their corresponding series names
  //   const creditStatuses = [
  //     { key: 'total_credit_authorised', name: 'Authorised' },
  //     { key: 'total_credit_issued', name: 'Issued' },
  //     { key: 'total_credit_transferred', name: 'Transferred' },
  //     { key: 'total_credit_retired', name: 'Retired' },
  //   ];

  //   const series = creditStatuses.map((creditStatusObj) => {
  //     return {
  //       name: creditStatusObj.name, // Format stack names
  //       data: categories.map((date) => {
  //         // Find matching entry for this date
  //         const entry = creditsByDateData.find((item: any) => item.log_date === date);
  //         return entry && entry[creditStatusObj.key] ? parseFloat(entry[creditStatusObj.key]) : 0; // Use value or default to 0
  //       }),
  //     };
  //   });

  //   // Format the dates
  //   const formattedCategories = categories.map((date: any) => moment(date).format('DD-MM-YYYY'));
  //   creditsByDateOptions.xaxis.categories = formattedCategories;

  //   // Set total of stacked bars as annotations on top of each bar
  //   const totals = series?.[0].data.map((_: any, index: any) =>
  //     series?.reduce((sum: any, seriesArr: any) => sum + seriesArr.data[index], 0)
  //   );
  //   const totalAnnotations = totals.map((total: any, index: any) => ({
  //     x: creditsByDateOptions.xaxis.categories[index],
  //     y: total,
  //     marker: {
  //       size: 0, // Remove the circle marker
  //     },
  //     label: {
  //       text: total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`,
  //       style: {
  //         fontSize: '12px',
  //         color: '#000',
  //         background: 'transparent',
  //         stroke: 'none !important',
  //         borderRadius: 0, // No rounded corners
  //         borderColor: 'transparent', // Remove the border
  //       },
  //     },
  //   }));

  //   // Add totals as annotations
  //   creditsByDateOptions.annotations.points = totalAnnotations;

  //   return series;
  // };

  //MARK: getCreditsByPurposeData
  const getCreditsByPurposeData = async () => {
    // setLoading(true);
    setLoadingCreditsByPurposeCharts(true);
    try {
      const response: any = await post(
        'stats/programme/queryCreditsByPurpose',
        { filterAnd: getFilters() },
        undefined,
        statServerUrl
      );
      if (response) {
        // setCreditsByPurposeData(response.data);
        const categories = [...new Set(response.data?.map((item: any) => item.logDate))];

        // Define the credit types and their corresponding series names
        const creditTypes = [
          { key: 'TRACK_1', name: 'SLCER+' },
          { key: 'TRACK_2', name: 'SLCER' },
        ];

        const series = creditTypes.map((creditTypeObj) => {
          return {
            name: creditTypeObj.name, // Format stack names
            data: categories.map((date) => {
              const total = response.data
                ?.filter(
                  (item: any) => item.logDate === date && item.creditType === creditTypeObj.key
                )
                ?.reduce(
                  (sum: number, item: any) => sum + parseFloat(item.totalCreditIssued || 0),
                  0
                );
              return total; // Return total or 0 if no match
            }),
          };
        });

        // Format the dates
        const formattedCategories = categories.map((date: any) =>
          moment(date).format('DD-MM-YYYY')
        );
        creditsByPurposeOptions.xaxis.categories = formattedCategories;

        // Set total of stacked bars as annotations on top of each bar
        const totals = series?.[0].data.map((_: any, index: any) =>
          series?.reduce((sum: any, seriesArr: any) => sum + seriesArr.data[index], 0)
        );
        const totalAnnotations = totals.map((total: any, index: any) => ({
          x: creditsByPurposeOptions.xaxis.categories[index],
          y: total,
          marker: {
            size: 0, // Remove the circle marker
          },
          label: {
            text: total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`,
            style: {
              fontSize: '12px',
              color: '#000',
              background: 'transparent',
              stroke: 'none !important',
              borderRadius: 0, // No rounded corners
              borderColor: 'transparent', // Remove the border
            },
          },
        }));

        // Add totals as annotations
        creditsByPurposeOptions.annotations.points = totalAnnotations;
        setCreditsByPurposeSeries(series);
        // setCreditsByPurposeOptionsLabels(formattedCategories);
      }
    } catch (error: any) {
      console.log('Error in getting Credits By Purpose', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      // setLoading(false);
      setLoadingCreditsByPurposeCharts(false);
    }
  };

  // //MARK: getCreditsByPurposeChartSeries
  // const getCreditsByPurposeChartSeries = () => {
  //   // Extract unique dates for x axis labels
  //   const categories = [...new Set(creditsByPurposeData?.map((item: any) => item.logDate))];

  //   // Define the credit types and their corresponding series names
  //   const creditTypes = [
  //     { key: 'TRACK_1', name: 'SLCER+' },
  //     { key: 'TRACK_2', name: 'SLCER' },
  //   ];

  //   const series = creditTypes.map((creditTypeObj) => {
  //     return {
  //       name: creditTypeObj.name, // Format stack names
  //       data: categories.map((date) => {
  //         const total = creditsByPurposeData
  //           ?.filter((item: any) => item.logDate === date && item.creditType === creditTypeObj.key)
  //           ?.reduce((sum: number, item: any) => sum + parseFloat(item.totalCreditIssued || 0), 0);
  //         return total; // Return total or 0 if no match
  //       }),
  //     };
  //   });

  //   // Format the dates
  //   const formattedCategories = categories.map((date: any) => moment(date).format('DD-MM-YYYY'));
  //   creditsByPurposeOptions.xaxis.categories = formattedCategories;

  //   // Set total of stacked bars as annotations on top of each bar
  //   const totals = series?.[0].data.map((_: any, index: any) =>
  //     series?.reduce((sum: any, seriesArr: any) => sum + seriesArr.data[index], 0)
  //   );
  //   const totalAnnotations = totals.map((total: any, index: any) => ({
  //     x: creditsByPurposeOptions.xaxis.categories[index],
  //     y: total,
  //     marker: {
  //       size: 0, // Remove the circle marker
  //     },
  //     label: {
  //       text: total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`,
  //       style: {
  //         fontSize: '12px',
  //         color: '#000',
  //         background: 'transparent',
  //         stroke: 'none !important',
  //         borderRadius: 0, // No rounded corners
  //         borderColor: 'transparent', // Remove the border
  //       },
  //     },
  //   }));

  //   // Add totals as annotations
  //   creditsByPurposeOptions.annotations.points = totalAnnotations;

  //   return series;
  // };

  //MARK: Update the chart width on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1600) {
        setChartWidth('750px');
        setRetirementsByDateChartWidth('850px');
        setCreditByChartWidth('700px');
      } else if (window.innerWidth > 1200) {
        setChartWidth('600px');
        setRetirementsByDateChartWidth('650px');
        setCreditByChartWidth('500px');
      } else {
        setChartWidth('600px');
        setRetirementsByDateChartWidth('650px');
        setCreditByChartWidth('500px');
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  //MARK: setProjectsByCategoryDonutValues
  const setProjectsByCategoryDonutValues = (programmeByCategoryData: any) => {
    const countsArray = Object.values(ProgrammeCategory).map((category) => {
      const matchingItem = programmeByCategoryData?.find(
        (item: any) => item.projectCategory === category
      );
      return matchingItem ? parseInt(matchingItem.count, 10) : 0; // Default to 0 if no match
    });

    const totalCount = programmeByCategoryData?.reduce(
      (sum: any, item: any) => sum + parseInt(item.count, 10),
      0
    );

    setCreditsPieChartTotal(String(addCommSep(totalCount)) !== 'NaN' ? addCommSep(totalCount) : 0);
    optionDonutPieA.plotOptions.pie.donut.labels.total.formatter = () =>
      '' + String(addCommSep(totalCount)) !== 'NaN' ? addCommSep(totalCount) : 0;
    setProjectsByCategorySeries(countsArray);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (
        totalProgrammesCountLastUpdatedEpoch !== 0 &&
        totalProgrammesCountLastUpdatedEpoch !== null
      ) {
        setTotalProgrammesCountLastUpdated(moment(totalProgrammesCountLastUpdatedEpoch).fromNow());
      }

      if (totalCreditsLastUpdatedEpoch !== 0 && totalCreditsLastUpdatedEpoch !== null) {
        setTotalCreditsLastUpdated(moment(totalCreditsLastUpdatedEpoch).fromNow());
      }

      if (
        totalRetiredCreditsLastUpdatedEpoch !== 0 &&
        totalRetiredCreditsLastUpdatedEpoch !== null
      ) {
        setTotalRetiredCreditsLastUpdated(moment(totalRetiredCreditsLastUpdatedEpoch).fromNow());
      }

      if (programmeByStatueLastUpdatedEpoch !== 0 && programmeByStatueLastUpdatedEpoch !== null) {
        setProgrammeByStatueLastUpdated(moment(programmeByStatueLastUpdatedEpoch).fromNow());
      }

      if (projectsByCategoryLastUpdatedEpoch !== 0 && projectsByCategoryLastUpdatedEpoch !== null) {
        setProjectsByCategoryLastUpdated(moment(projectsByCategoryLastUpdatedEpoch).fromNow());
      }

      if (authCreditLastUpdatedEpoch !== 0 && authCreditLastUpdatedEpoch !== null) {
        setAuthCreditLastUpdated(moment(authCreditLastUpdatedEpoch).fromNow());
      }

      if (issuedCreditLastUpdatedEpoch !== 0 && issuedCreditLastUpdatedEpoch !== null) {
        setIssuedCreditLastUpdated(moment(issuedCreditLastUpdatedEpoch).fromNow());
      }

      if (transferredCreditLastUpdatedEpoch !== 0 && transferredCreditLastUpdatedEpoch !== null) {
        setTransferredCreditLastUpdated(moment(transferredCreditLastUpdatedEpoch).fromNow());
      }

      if (retiredCreditLastUpdatedEpoch !== 0 && retiredCreditLastUpdatedEpoch !== null) {
        setRetiredCreditLastUpdated(moment(retiredCreditLastUpdatedEpoch).fromNow());
      }
    }, 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [
    totalProgrammesCountLastUpdated,
    totalProgrammesCountLastUpdatedEpoch,
    totalCreditsLastUpdatedEpoch,
    totalCreditsLastUpdated,
    totalRetiredCreditsLastUpdatedEpoch,
    totalRetiredCreditsLastUpdated,
    programmeByStatueLastUpdatedEpoch,
    programmeByStatueLastUpdated,
    projectsByCategoryLastUpdatedEpoch,
    projectsByCategoryLastUpdated,
    authCreditLastUpdatedEpoch,
    authCreditLastUpdated,
    issuedCreditLastUpdatedEpoch,
    issuedCreditLastUpdated,
    transferredCreditLastUpdatedEpoch,
    transferredCreditLastUpdated,
    retiredCreditLastUpdatedEpoch,
    retiredCreditLastUpdated,
  ]);

  useEffect(() => {
    getTotalProgrammeCount();
    getTotalIssuedCredits();
    getTotalRetiredCredits();
    getProgrammeDataByStatus();
    getProgrammeDataByCategory();
    getRetirementsDataByDate();
    getCreditsByStatusData();
    getCreditsByDateData();
    getCreditsByPurposeData();
  }, []);

  useEffect(() => {
    getProgrammeDataByStatus();
    getProgrammeDataByCategory();
    getRetirementsDataByDate();
    getCreditsByStatusData();
    getCreditsByDateData();
    getCreditsByPurposeData();
  }, [startTime, endTime, categoryType, programmeCategory, creditType]);

  const countS = ['all', ['>=', ['get', 'count'], 0]];
  const pending = ['all', ['==', ['get', 'stage'], 'awaitingAuthorization']];
  const authorised = ['all', ['==', ['get', 'stage'], 'authorised']];
  const rejected = ['all', ['==', ['get', 'stage'], 'rejected']];
  const news = ['all', ['==', ['get', 'stage'], 'approved']];

  const colors = ['#6ACDFF', '#FF8183', '#CDCDCD', '#B7A4FE'];

  const donutSegment = (start: any, end: any, r: any, r0: any, color: any) => {
    if (end - start === 1) end -= 0.00001;
    const a0 = 2 * Math.PI * (start - 0.25);
    const a1 = 2 * Math.PI * (end - 0.25);
    const x0 = Math.cos(a0),
      y0 = Math.sin(a0);
    const x1 = Math.cos(a1),
      y1 = Math.sin(a1);
    const largeArc = end - start > 0.5 ? 1 : 0;

    // draw an SVG path
    return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
      r + r * y0
    } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1} ${
      r + r0 * y1
    } A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${r + r0 * y0}" fill="${color}" />`;
  };

  //MARK: HTML PART
  return (
    <div className="slcf-dashboard-main-container">
      <div className="dashboard-inner-container">
        {isMultipleDashboardsVisible && (
          <div className="systemchange-container" style={{ marginLeft: `20px` }}>
            <ButtonGroup>
              <Button type="primary" className="slcf-primary">
                SLCF PROJECTS
              </Button>
              <Link to="/dashboard/cr">
                <Button className="slcf-default">ARTICLE 6.4 PROJECTS</Button>
              </Link>
            </ButtonGroup>
          </div>
        )}
        <div className="statistics-cards-container" style={{ marginTop: `50px` }}>
          <Row gutter={[40, 40]} className="statistics-card-row">
            <Col xxl={8} xl={8} md={12} className="statistics-card-col">
              <SLStatisticsCard
                value={totalProgrammesCount}
                title={'Total Projects'}
                updatedDate={
                  // eslint-disable-next-line eqeqeq
                  totalProgrammesCountLastUpdated != null ? totalProgrammesCountLastUpdated : '0'
                }
                icon={<AppstoreOutlined />}
                loading={loadingWithoutTimeRange}
                backgroundColorClass="background-purple"
                tooltip={t(
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTTotalProjectsDevSLCF'
                    : 'tTTotalProjectsSLCF'
                )}
                t={t}
              />
            </Col>
            <Col xxl={8} xl={8} md={12} className="statistic-card-col">
              <SLStatisticsCard
                value={totalCredits}
                title={'Total Credits'}
                updatedDate={
                  // eslint-disable-next-line eqeqeq
                  totalCreditsLastUpdated != null ? totalCreditsLastUpdated : '0'
                }
                icon={<CreditCard2Back />}
                loading={loadingWithoutTimeRange}
                backgroundColorClass="background-blue"
                tooltip={t(
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTTotalCreditsDevSLCF'
                    : 'tTTotalCreditsSLCF'
                )}
                t={t}
              />
            </Col>
            <Col xxl={8} xl={8} md={12} className="statistic-card-col">
              <SLStatisticsCard
                value={totalRetiredCreditsCount}
                title={'Total Retired Credits'}
                updatedDate={
                  // eslint-disable-next-line eqeqeq
                  totalRetiredCreditsLastUpdated != null ? totalRetiredCreditsLastUpdated : '0'
                }
                icon={<ClockHistory />}
                loading={loadingWithoutTimeRange}
                backgroundColorClass="background-green"
                tooltip={t(
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTTotalRetiredCreditsDevSLCF'
                    : 'tTTotalRetiredCreditsSLCF'
                )}
                t={t}
              />
            </Col>
          </Row>
        </div>
        <div className="filter-container">
          <div className="date-filter">
            <RangePicker
              ranges={{
                Today: [moment(), moment()],
                'Last 7 days': [moment().subtract('6', 'days'), moment()],
                'Last 14 days': [moment().subtract('13', 'days'), moment()],
              }}
              defaultValue={[moment().subtract('13', 'days'), moment()]}
              showTime
              allowClear={true}
              format="DD:MM:YYYY"
              onChange={onChangeRange}
            />
          </div>
          <div className="category-filter">
            <Select
              style={{ width: 270 }}
              placeholder="Product Category"
              options={Object.keys(ProgrammeCategory).map((key) => ({
                value: ProgrammeCategory[key as keyof typeof ProgrammeCategory],
                label: getProjectCategory[key],
              }))}
              onChange={onCategoryChanged}
              allowClear
            />
          </div>
          <div className="credit-type-filter">
            <Select
              style={{ width: 200 }}
              placeholder="Credit Type"
              options={Object.keys(CreditTypeSl).map((key) => ({
                value: CreditTypeSl[key as keyof typeof CreditTypeSl],
                label: getCreditTypeName(CreditTypeSl[key as keyof typeof CreditTypeSl]),
              }))}
              onChange={onCreditTypeChanged}
              allowClear
            />
          </div>
        </div>
        <div className="statistics-and-charts-container center">
          <Row gutter={[20, 20]} className="statistic-card-row">
            <Col xxl={8} xl={8} md={12} className="statistic-card-col">
              <ProgrammeRejectAndTransferComponent
                totalProgrammes={programmeByStatueData?.proposalStageData?.reduce(
                  (total: any, item: any) => total + parseInt(item.count, 10),
                  0
                )}
                pending={programmeByStatueData?.proposalStageData
                  ?.filter(
                    (item: any) =>
                      item.projectProposalStage !== 'REJECTED_PROPOSAL' &&
                      item.projectProposalStage !== 'REJECTED_INF' &&
                      item.projectProposalStage !== 'AUTHORISED'
                  )
                  .reduce((total: any, item: any) => total + parseInt(item.count, 10), 0)}
                rejected={programmeByStatueData?.proposalStageData
                  ?.filter(
                    (item: any) =>
                      item.projectProposalStage === 'REJECTED_PROPOSAL' ||
                      item.projectProposalStage === 'REJECTED_INF'
                  )
                  .reduce((total: any, item: any) => total + parseInt(item.count, 10), 0)}
                authorized={getTotalAuthorisedProgrammes()}
                updatedDate={
                  // eslint-disable-next-line eqeqeq
                  programmeByStatueData?.latestUpdatedTime != null &&
                  // eslint-disable-next-line eqeqeq
                  programmeByStatueData?.latestUpdatedTime != 0
                    ? programmeByStatueLastUpdated
                    : '0'
                }
                loading={loading}
                toolTipText={t(
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTProjectSummeryDevSLCF'
                    : 'tTProjectSummerySLCF'
                )}
                t={t}
              />
            </Col>
            <Col xxl={16} xl={16} md={12} className="statistic-card-col">
              <SLCFDetailsBarChartsStatComponent
                id="total-programmes"
                title={t('totalProgrammesByStatusSLCF')}
                options={totalProgrammesOptions}
                series={programmeByStatueSeries}
                lastUpdate={'0'} //TODO
                loading={loadingCharts}
                toolTipText={t(
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTTotalProjectDetailsDevSLCF'
                    : 'tTTotalProjectDetailsSLCF'
                )}
                Chart={Chart}
                height="400px"
                // width="600px"
                width={chartWidth}
              />
            </Col>
          </Row>
        </div>
        <div className="statistics-and-charts-container center">
          <Row gutter={[20, 20]} className="statistic-card-row">
            <Col xxl={9} xl={9} md={12} className="statistic-card-col pie">
              <SLCFPieChartsStatComponent
                id="credits"
                title={t('projectsByCategorySLCF')}
                options={optionDonutPieA}
                series={projectsByCategorySeries}
                lastUpdate={
                  // eslint-disable-next-line eqeqeq
                  projectsByCategoryLastUpdated != null &&
                  // eslint-disable-next-line eqeqeq
                  projectsByCategoryLastUpdated != '0'
                    ? projectsByCategoryLastUpdated
                    : '0'
                }
                loading={loadingPieChart}
                toolTipText={t(
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTProjectsByCategoryDevSLCF'
                    : 'tTProjectsByCategorySLCF'
                )}
                Chart={Chart}
              />
            </Col>
            <Col
              xxl={15}
              xl={15}
              md={12}
              className="statistic-card-col retirements-by-date-chart-col"
            >
              <SLCFBarChartsStatComponent
                id="total-retirement-by-date"
                title={t('retirementsByDateSLCF')}
                options={retirementsByDateOptions}
                series={retirementsByDateSeries}
                // series={getRetirementByDateChartSeries()}
                // lastUpdate={lastUpdateProgrammesSectorStatsC}
                lastUpdate={'0'}
                loading={loadingRetirementsByDateCharts}
                toolTipText={t(
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTRetirementsByDateDevSLCF'
                    : 'tTRetirementsByDateSLCF'
                )}
                Chart={Chart}
                height="400px"
                // width="650px"
                width={retirementsByDateChartWidth}
              />
            </Col>
          </Row>
        </div>
        <div className="statistics-and-charts-container center credits-by-status-container">
          <div className="credits-by-status-row">
            <div className="credits-by-status-top">
              <div className="credits-by-status-title">{t('creditsByStatusSLCF')}</div>
              <div className="info-container">
                <Tooltip
                  arrowPointAtCenter
                  placement="bottomRight"
                  trigger="hover"
                  title={'toolTipText'}
                >
                  <InfoCircle color="#000000" size={17} />
                </Tooltip>
              </div>
            </div>
            <Row gutter={[20, 20]} className="statistic-card-row">
              <Col xxl={6} xl={6} md={12} className="statistic-card-col">
                <SLStatisticsCard
                  value={
                    creditsByStatusData?.totalCreditAuthorised
                      ? creditsByStatusData?.totalCreditAuthorised
                      : 0
                  }
                  title={t('authorisedCreditsTotal')}
                  updatedDate={
                    authCreditLastUpdated !== null && authCreditLastUpdated !== '0'
                      ? authCreditLastUpdated
                      : '0'
                  }
                  icon={<HandThumbsUp />}
                  loading={loadingWithoutTimeRange}
                  backgroundColorClass="background-green"
                  tooltip={t(
                    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                      ? 'tTAuthorisedCreditsDevSLCF'
                      : 'tTAuthorisedCreditsSLCF'
                  )}
                  t={t}
                />
              </Col>
              <Col xxl={6} xl={6} md={12} className="statistic-card-col">
                <SLStatisticsCard
                  value={
                    creditsByStatusData?.totalCreditIssued
                      ? creditsByStatusData?.totalCreditIssued
                      : 0
                  }
                  title={t('issuedCreditsTotal')}
                  updatedDate={
                    issuedCreditLastUpdated !== null && issuedCreditLastUpdated !== '0'
                      ? issuedCreditLastUpdated
                      : '0'
                  }
                  icon={<FileEarmarkCheck />}
                  loading={loadingWithoutTimeRange}
                  backgroundColorClass="background-blue"
                  tooltip={t(
                    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                      ? 'tTIssuedCreditsDevSLCF'
                      : 'tTIssuedCreditsSLCF'
                  )}
                  t={t}
                />
              </Col>
              <Col xxl={6} xl={6} md={12} className="statistic-card-col">
                <SLStatisticsCard
                  value={
                    creditsByStatusData?.totalCreditTransferred
                      ? creditsByStatusData?.totalCreditTransferred
                      : 0
                  }
                  title={t('transferredCreditsTotal')}
                  updatedDate={
                    transferredCreditLastUpdated !== null && transferredCreditLastUpdated !== '0'
                      ? transferredCreditLastUpdated
                      : '0'
                  }
                  icon={<BoxArrowRight />}
                  loading={loadingWithoutTimeRange}
                  backgroundColorClass="background-purple"
                  tooltip={t(
                    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                      ? 'tTTransferredCreditsDevSLCF'
                      : 'tTTransferredCreditsSLCF'
                  )}
                  t={t}
                />
              </Col>
              <Col xxl={6} xl={6} md={12} className="statistic-card-col">
                <SLStatisticsCard
                  value={
                    creditsByStatusData?.totalCreditRetired
                      ? creditsByStatusData?.totalCreditRetired
                      : 0
                  }
                  title={t('retiredCreditsTotal')}
                  updatedDate={
                    retiredCreditLastUpdated !== null && retiredCreditLastUpdated !== '0'
                      ? retiredCreditLastUpdated
                      : '0'
                  }
                  icon={<ClockHistory />}
                  loading={loadingWithoutTimeRange}
                  backgroundColorClass="background-red"
                  tooltip={t(
                    userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                      ? 'tTRetiredCreditsDevSLCF'
                      : 'tTRetiredCreditsSLCF'
                  )}
                  t={t}
                />
              </Col>
            </Row>
          </div>
        </div>
        <div className="statistics-and-charts-container center">
          <Row gutter={[20, 20]} className="statistic-card-row">
            <Col xxl={12} xl={12} md={12} className="statistic-card-col credits-by-date-chart-col">
              <SLCFBarChartsStatComponent
                id="total-credits"
                title={t('totalCreditsByDateSLCF')}
                options={creditsByDateOptions}
                series={creditsByDateSeries}
                // lastUpdate={lastUpdateTotalCredits}
                lastUpdate={'0'}
                loading={loadingCreditsByDateCharts}
                toolTipText={t(
                  // userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  //   ? 'tTTotalCreditsGovernment'
                  //   :
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTTotalCreditsByDateDevSLCF'
                    : 'tTTotalCreditsByDateSLCF'
                )}
                Chart={Chart}
                height="400px"
                // width="550px"
                width={creditByChartWidth}
              />
            </Col>
            <Col
              xxl={12}
              xl={12}
              md={12}
              className="statistic-card-col credits-by-purpose-chart-col"
            >
              <SLCFBarChartsStatComponent
                id="total-credits-by-purpose"
                title={t('totalCreditsByPurposeSLCF')}
                options={creditsByPurposeOptions}
                series={creditsByPurposeSeries}
                lastUpdate={'0'}
                loading={loadingCreditsByPurposeCharts}
                toolTipText={t(
                  userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                    ? 'tTTotalCreditsByPurposeDevSLCF'
                    : 'tTTotalCreditsByPurposeSLCF'
                )}
                Chart={Chart}
                height="400px"
                // width="550px"
                width={creditByChartWidth}
              />
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};
