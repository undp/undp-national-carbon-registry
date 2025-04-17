export const getActionsReportColumns = (t: any) => [
  {
    title: t("reporting:recordId"),
    dataIndex: "recordId",
    key: "recordId",
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
            dataIndex: "underlyingUnitBlockStartId",
            key: "underlyingUnitBlockStartId",
          },
          {
            title: t("reporting:underlyingUnitLastBlockId"),
            dataIndex: "underlyingUnitLastBlockId",
            key: "underlyingUnitLastBlockId",
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
            dataIndex: "quantity",
            key: "quantity",
          },
          {
            title: t("reporting:quantity2"),
            dataIndex: "quantity",
            key: "quantity",
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
            dataIndex: "firstTransferParty",
            key: "firstTransferParty",
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
          },
          {
            title: t("reporting:activityType"),
            dataIndex: "activityType",
            key: "activityType",
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
        dataIndex: "dateOfAuthorization",
        key: "dateOfAuthorization",
      },
      {
        title: t("reporting:authorizationId"),
        dataIndex: "authorizationId",
        key: "authorizationId",
      },
      {
        title: t("reporting:authorizationPurposes"),
        dataIndex: "authorizationPurposes",
        key: "authorizationPurposes",
      },
      {
        title: t("reporting:oimpAuthorized"),
        dataIndex: "oimpAuthorized",
        key: "oimpAuthorized",
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
            dataIndex: "actionDate",
            key: "actionDate",
          },
          {
            title: t("reporting:actionType"),
            dataIndex: "actionType",
            key: "actionType",
          },
          {
            title: t("reporting:transferParty"),
            dataIndex: "transferParty",
            key: "transferParty",
          },
          {
            title: t("reporting:aquiringParty"),
            dataIndex: "aquiringParty",
            key: "aquiringParty",
          },
          {
            title: t("reporting:purposesForCancellation"),
            dataIndex: "purposesForCancellation",
            key: "purposesForCancellation",
          },
          {
            title: t("reporting:usingParticipating"),
            dataIndex: "usingParticipating",
            key: "usingParticipating",
          },
        ],
      },
    ],
  },
  {
    title: t("reporting:firstTransfer"),
    dataIndex: "firstTransfer",
    key: "firstTransfer",
  },
];

export const getHoldingsReportColumns = (t: any) => [
  {
    title: t("reporting:recordId"),
    dataIndex: "recordId",
    key: "recordId",
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
            dataIndex: "underlyingUnitBlockStartId",
            key: "underlyingUnitBlockStartId",
          },
          {
            title: t("reporting:underlyingUnitLastBlockId"),
            dataIndex: "underlyingUnitLastBlockId",
            key: "underlyingUnitLastBlockId",
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
            dataIndex: "quantity",
            key: "quantity",
          },
          {
            title: t("reporting:quantity2"),
            dataIndex: "quantity",
            key: "quantity",
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
            dataIndex: "firstTransferParty",
            key: "firstTransferParty",
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
          },
          {
            title: t("reporting:activityType"),
            dataIndex: "activityType",
            key: "activityType",
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
        dataIndex: "dateOfAuthorization",
        key: "dateOfAuthorization",
      },
      {
        title: t("reporting:authorizationId"),
        dataIndex: "authorizationId",
        key: "authorizationId",
      },
      {
        title: t("reporting:authorizationPurposes"),
        dataIndex: "authorizationPurposes",
        key: "authorizationPurposes",
      },
      {
        title: t("reporting:oimpAuthorized"),
        dataIndex: "oimpAuthorized",
        key: "oimpAuthorized",
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
    dataIndex: "firstTransfer",
    key: "firstTransfer",
  },
];
