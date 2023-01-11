-- View: public.programme_query_entity

-- DROP VIEW public.programme_query_entity;

CREATE OR REPLACE VIEW public.programme_query_entity
 AS
 SELECT programme."programmeId",
    programme."serialNo",
    programme.title,
    programme."externalId",
    programme."sectoralScope",
    programme.sector,
    programme."countryCodeA2",
    programme."currentStage",
    programme."typeOfMitigation",
    programme."startTime",
    programme."endTime",
    programme."creditEst",
    programme."creditChange",
    programme."creditIssued",
    programme."creditBalance",
    programme."creditTransferred",
    programme."constantVersion",
    programme."proponentTaxVatId",
    programme."companyId",
    programme."proponentPercentage",
    programme."creditOwnerPercentage",
    programme."certifierId",
    programme."creditUnit",
    programme."programmeProperties",
    programme."agricultureProperties",
    programme."solarProperties",
    programme."txTime",
    programme."createdTime",
    programme."txRef",
    programme."txType",
    json_agg(DISTINCT company.*) AS company,
    json_agg(DISTINCT cert.*) AS certifier
   FROM programme programme
     LEFT JOIN company cert ON cert."companyId" = ANY (programme."certifierId")
     LEFT JOIN company company ON company."companyId" = ANY (programme."companyId")
  GROUP BY programme."programmeId";

ALTER TABLE public.programme_query_entity
    OWNER TO root;


-- View: public.programme_transfer_view_entity

-- DROP VIEW public.programme_transfer_view_entity;

CREATE OR REPLACE VIEW public.programme_transfer_view_entity
 AS
 SELECT programme_transfer."requestId",
    programme_transfer."programmeId",
    programme_transfer."requesterId",
    programme_transfer."requesterCompanyId",
    programme_transfer."creditAmount",
    programme_transfer.comment,
    programme_transfer."txTime",
    programme_transfer."companyId",
    programme_transfer.status,
    json_agg(requester.*) AS requester,
    prog."creditBalance" AS "creditBalance",
    prog.title AS "programmeTitle",
    prog.sector AS "programmeSector",
    json_agg(DISTINCT certifier.*) AS certifier,
    json_agg(DISTINCT sender.*) AS sender
   FROM programme_transfer programme_transfer
     LEFT JOIN programme prog ON prog."programmeId"::text = programme_transfer."programmeId"::text
     LEFT JOIN company requester ON requester."companyId" = programme_transfer."requesterCompanyId"
     LEFT JOIN company sender ON sender."companyId" = ANY (programme_transfer."companyId")
     LEFT JOIN company certifier ON certifier."companyId" = ANY (prog."certifierId")
  GROUP BY programme_transfer."requestId", requester."companyId", prog."programmeId";

ALTER TABLE public.programme_transfer_view_entity
    OWNER TO root;

