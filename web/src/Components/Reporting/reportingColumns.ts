import { toMoment } from "../../Utils/convertTime";
import { INF_SECTOR, INF_SECTORAL_SCOPE } from "../AddNewProgramme/ProgrammeCreationComponent";

export const getActionsReportColumns = (t: any) => [
  {
    title: t("reporting:recordId"),
    dataIndex: "artical6RecordId",
    key: "artical6RecordId",
    // width: 200,
  },
  {
    title: t("reporting:cooperativeApproach"),
    dataIndex: "cooperativeApproach",
    key: "cooperativeApproach",
    // width: 200,
  },
  {
    title: t("reporting:itmo"),
    children: [
      {
        title: t("reporting:uniqueIdentifier"),
        children: [
          {
            title: t("reporting:firstUniqueIdentifier"),
            dataIndex: "firstUniqueIdentifier",
            key: "firstUniqueIdentifier",
          },
          {
            title: t("reporting:lastUniqueIdentifier"),
            dataIndex: "lastUniqueIdentifier",
            key: "lastUniqueIdentifier",
          },
          {
            title: t("reporting:underlyingUnitBlockStartId"),
            dataIndex: "creditBlockStartId",
            key: "creditBlockStartId",
          },
          {
            title: t("reporting:underlyingUnitLastBlockId"),
            dataIndex: "creditBlockEndId",
            key: "creditBlockEndId",
          },
        ],
      },
      {
        title: t("reporting:metricAndQuantity"),
        children: [
          {
            title: t("reporting:metric"),
            dataIndex: "metric",
            key: "metric",
          },
          {
            title: t("reporting:quantity"),
            dataIndex: "quantityInMetric",
            key: "quantityInMetric",
          },
          {
            title: t("reporting:quantity2"),
            dataIndex: "creditAmount",
            key: "creditAmount",
          },
          {
            title: t("reporting:conversionFactor"),
            dataIndex: "conversionFactor",
            key: "conversionFactor",
          },
        ],
      },
      {
        title: t("reporting:itmoDetails"),
        children: [
          {
            title: t("reporting:firstTransferParty"),
            dataIndex: "firstTransferingParty",
            key: "firstTransferingParty",
          },
          {
            title: t("reporting:vintage"),
            dataIndex: "vintage",
            key: "vintage",
          },
          {
            title: t("reporting:sector"),
            dataIndex: "sector",
            key: "sector",
            render: (item: any) => {
              return INF_SECTOR[item];
            },
          },
          {
            title: t("reporting:activityType"),
            dataIndex: "sectoralScope",
            key: "sectoralScope",
            render: (item: any) => {
              return INF_SECTORAL_SCOPE[item];
            },
          },
        ],
      },
    ],
  },
  {
    title: t("reporting:authorization"),
    children: [
      {
        title: t("reporting:dateOfAuthorization"),
        dataIndex: "projectAuthorizationTime",
        key: "projectAuthorizationTime",
        render: (item: any) => {
          return toMoment(Number(item)).format("DD-MM-YY");
        },
        //
      },

      {
        title: t("reporting:authorizationId"),
        dataIndex: "authorizationId",
        key: "authorizationId",
      },

      {
        title: t("reporting:authorizationPurposes"),
        dataIndex: "purposeForAuthorization",
        key: "purposeForAuthorization",
      },
      {
        title: t("reporting:oimpAuthorized"),
        dataIndex: "OIMP",
        key: "OIMP",
      },
    ],
  },
  {
    title: t("reporting:firstTransferDefinition"),
    dataIndex: "firstTransferDefinition",
    key: "firstTransferDefinition",
    // width: 200,
  },
  {
    title: t("reporting:actions"),
    children: [
      {
        title: t("reporting:actionDetails"),
        dataIndex: "actionDetails",
        key: "actionDetails",
        children: [
          {
            title: t("reporting:actionDate"),
            dataIndex: "actionTime",
            key: "actionTime",
            render: (item: any) => {
              return toMoment(Number(item)).format("DD-MM-YY");
            },
            //
          },
          {
            title: t("reporting:actionType"),
            dataIndex: "actionType",
            key: "actionType",
          },
          {
            title: t("reporting:transferParty"),
            dataIndex: "transferingParty",
            key: "transferingParty",
          },
          {
            title: t("reporting:aquiringParty"),
            dataIndex: "aquiringParty",
            key: "aquiringParty",
          },
          {
            title: t("reporting:purposesForCancellation"),
            dataIndex: "purposeForCancellation",
            key: "purposeForCancellation",
          },
          {
            title: t("reporting:usingParticipating"),
            dataIndex: "actionBy",
            key: "actionBy", //
          },
        ],
      },
    ],
  },
  {
    title: t("reporting:firstTransfer"),
    dataIndex: "firstTransferingParty",
    key: "firstTransferingParty",
  },
];

export const getHoldingsReportColumns = (t: any) => [
  {
    title: t("reporting:recordId"),
    dataIndex: "artical6RecordId",
    key: "artical6RecordId",
    // width: 200,
  },

  {
    title: t("reporting:cooperativeApproach"),
    dataIndex: "cooperativeApproach",
    key: "cooperativeApproach",
    // width: 200,
  },

  {
    title: t("reporting:itmo"),
    children: [
      {
        title: t("reporting:uniqueIdentifier"),
        children: [
          {
            title: t("reporting:firstUniqueIdentifier"),
            dataIndex: "firstUniqueIdentifier",
            key: "firstUniqueIdentifier",
          },
          {
            title: t("reporting:lastUniqueIdentifier"),
            dataIndex: "lastUniqueIdentifier",
            key: "lastUniqueIdentifier",
          },
          {
            title: t("reporting:underlyingUnitBlockStartId"),
            dataIndex: "creditBlockStartId",
            key: "creditBlockStartId",
          },

          {
            title: t("reporting:underlyingUnitLastBlockId"),
            dataIndex: "creditBlockEndId",
            key: "creditBlockEndId",
          },
        ],
      },

      {
        title: t("reporting:metricAndQuantity"),
        children: [
          {
            title: t("reporting:metric"),
            dataIndex: "metric",
            key: "metric",
          },
          {
            title: t("reporting:quantity"),
            dataIndex: "quantityInMetric",
            key: "quantityInMetric",
          },
          {
            title: t("reporting:quantity2"),
            dataIndex: "creditAmount",
            key: "creditAmount",
          },
          {
            title: t("reporting:conversionFactor"),
            dataIndex: "conversionFactor",
            key: "conversionFactor",
          },
        ],
      },
      {
        title: t("reporting:itmoDetails"),
        children: [
          {
            title: t("reporting:firstTransferParty"),
            dataIndex: "firstTransferingParty",
            key: "firstTransferingParty",
          },
          {
            title: t("reporting:vintage"),
            dataIndex: "vintage",
            key: "vintage",
          },
          {
            title: t("reporting:sector"),
            dataIndex: "sector",
            key: "sector",
            render: (item: any) => {
              return INF_SECTOR[item];
            },
          },
          {
            title: t("reporting:activityType"),
            dataIndex: "sectoralScope",
            key: "sectoralScope",
            render: (item: any) => {
              return INF_SECTORAL_SCOPE[item];
            },
          },
        ],
      },
    ],
  },
  {
    title: t("reporting:authorization"),
    children: [
      {
        title: t("reporting:dateOfAuthorization"),
        dataIndex: "projectAuthorizationTime",
        key: "projectAuthorizationTime",
        render: (item: any) => {
          return toMoment(Number(item)).format("DD-MM-YY");
        },
      },
      {
        title: t("reporting:authorizationId"),
        dataIndex: "authorizationId",
        key: "authorizationId",
      },
      {
        title: t("reporting:authorizationPurposes"),
        dataIndex: "purposeForAuthorization",
        key: "purposeForAuthorization",
      },
      {
        title: t("reporting:oimpAuthorized"),
        dataIndex: "OIMP",
        key: "OIMP",
      },
    ],
  },
  {
    title: t("reporting:firstTransferDefinition"),
    dataIndex: "firstTransferDefinition",
    key: "firstTransferDefinition",
    // width: 200,
  },
  {
    title: t("reporting:firstTransfer"),
    dataIndex: "firstTransferingParty",
    key: "firstTransferingParty",
  },
];
