import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { BaseDocumentDto } from "../dto/base.document.dto";
import { User } from "../entities/user.entity";
import { DocumentEntity } from "../entities/document.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { HelperService } from "../util/helpers.service";
import { UpdateProjectProposalStageDto } from "../dto/updateProjectProposalStage.dto";
import { ProjectEntity } from "../entities/projects.entity";
import { TxType } from "../enum/txtype.enum";
import { DocumentStatus } from "../enum/document.status";

@Injectable()
export class DocumentManagementService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private readonly helperService: HelperService
  ) {}
  async addDocument(addDocumentDto: BaseDocumentDto, user: User) {
    const project = await this.programmeLedgerService.getProjectById(
      addDocumentDto.projectRefId
    );
    const newDoc = new DocumentEntity();
    newDoc.content = JSON.stringify(addDocumentDto.data);
    newDoc.programmeId = project.refId;
    newDoc.companyId = project.companyId;
    newDoc.userId = user.id;
    newDoc.type = addDocumentDto.documentType;
    const lastVersion = await this.getLastDocumentVersion(
      addDocumentDto.documentType,
      project.refId
    );
    newDoc.version = lastVersion + 1;
    newDoc.status = DocumentStatus.PENDING;
    newDoc.createdTime = new Date().getTime();
    newDoc.updatedTime = newDoc.createdTime;

    let updateProjectProposalStage: UpdateProjectProposalStageDto;
    switch (addDocumentDto.documentType) {
      case DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT:
        if (user.companyId != project.companyId) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.notAuthorised",
              []
            ),
            HttpStatus.UNAUTHORIZED
          );
        }
        if (
          ![
            ProjectProposalStage.APPROVED,
            ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER,
            ProjectProposalStage.PDD_REJECTED_BY_DNA,
          ].includes(project.projectProposalStage)
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.programmeIsNotInSuitableStageToProceed",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        updateProjectProposalStage = {
          programmeId: addDocumentDto.projectRefId,
          txType: TxType.CREATE_PDD,
        };
        break;
    }
    await this.documentRepository.insert(newDoc);
    const response = await this.updateProposalStage(
      updateProjectProposalStage,
      user
    );
  }

  public async getLastDocumentVersion(
    docType: DocumentTypeEnum,
    programmeId: string
  ): Promise<number> {
    const documents = await this.documentRepository.find({
      where: {
        programmeId: programmeId,
        type: docType,
      },
      order: {
        version: "DESC",
      },
    });

    if (documents.length > 0) {
      return documents[0].version;
    } else {
      return 0;
    }
  }

  async updateProposalStage(
    updateProposalStageDto: UpdateProjectProposalStageDto,
    user: User
  ): Promise<ProjectEntity> {
    const refId = updateProposalStageDto.programmeId;
    const txType = updateProposalStageDto.txType;
    const data = updateProposalStageDto.data;

    //updating proposal stage in programme
    const updatedProject =
      await this.programmeLedgerService.updateProjectProposalStage(
        refId,
        txType,
        data
      );

    return updatedProject;
  }
}
