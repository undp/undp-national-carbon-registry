import { ViewColumn, ViewEntity } from "typeorm";
import { ActivityStateEnum } from "../enum/activity.state.enum";
import { DocumentTypeEnum } from "../enum/document.type.enum";

@ViewEntity({
  expression: `
    SELECT 
      a."refId",
      a."projectRefId",
      a."state" AS "stage",
      a."updatedTime" AS "activityLastUpdatedDate",
      jsonb_object_agg(
        d."type", 
        jsonb_build_object(
          'createdDate', d."createdTime",
          'documentType', d."type",
          'refId', d."id",
          'version', d."version"
        )
      ) FILTER (WHERE d."id" IS NOT NULL) AS "documents"
    FROM "activity_entity" a
    LEFT JOIN LATERAL (
      SELECT d1.*
      FROM "document_entity" d1
      WHERE d1."activityId" = a."id"
      AND d1."type" IN ('MONITORING', 'VERIFICATION')
      ORDER BY d1."version" DESC
      LIMIT 1
    ) d ON true
    GROUP BY a."refId",a."projectRefId", a."updatedTime", a."state"
  `,
})
export class ActivityViewEntity {
  @ViewColumn()
  refId: string;

  @ViewColumn()
  projectRefId: string;

  @ViewColumn()
  stage: ActivityStateEnum;

  @ViewColumn()
  activityLastUpdatedDate: number;

  @ViewColumn()
  documents: {
    MONITORING?: {
      createdDate: number;
      documentType: DocumentTypeEnum;
      refId: string;
      version: number;
    };
    VERIFICATION?: {
      createdDate: number;
      documentType: DocumentTypeEnum;
      refId: string;
      version: number;
    };
  };
}
