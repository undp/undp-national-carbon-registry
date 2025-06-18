import { ViewColumn, ViewEntity } from "typeorm";
import { DocumentStatus } from "../enum/document.status";
import { DocumentTypeEnum } from "../enum/document.type.enum";

@ViewEntity({
  expression: `
      SELECT 
        d."id" AS "refId",
        d."version",
        d."content" AS "data",
        d."type" AS "documentType",
        d."status" AS "state",
        d."createdTime" AS "createdDate",
        d."updatedTime" AS "updatedDate"
      FROM "document_entity" d
    `,
})
export class DocumentsViewEntity {
  @ViewColumn()
  refId: number;

  @ViewColumn()
  version: number;

  @ViewColumn()
  data: object;

  @ViewColumn()
  documentType: DocumentTypeEnum;

  @ViewColumn()
  state: DocumentStatus;

  @ViewColumn()
  createdDate: number;

  @ViewColumn()
  updatedDate: number;
}
