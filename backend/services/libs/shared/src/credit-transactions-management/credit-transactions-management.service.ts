import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { Company } from "../entities/company.entity";
import { CreditTransferDto } from "../dto/credit.transfer.dto";
import { CompanyRole } from "../enum/company.role.enum";
import { HelperService } from "../util/helpers.service";
import { CompanyService } from "../company/company.service";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { InjectRepository } from "@nestjs/typeorm";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { EntityManager, In, Repository, SelectQueryBuilder } from "typeorm";
import { TxType } from "../enum/txtype.enum";
import { plainToClass } from "class-transformer";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import {
  CreditTransactionData,
  ItmoAuthorizationData,
  ResolvedRetireRequestFields,
  RetirementUseData,
} from "../dto/credit.transaction.data.types";
import { AuthorizationPurpose } from "../enum/authorization.purpose.enum";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { AuthorizedEntityStatus } from "../enum/authorized.entity.status.enum";
import { CreditRetireRequestDto } from "../dto/credit.retire.request.dto";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { CreditRetireActionDto } from "../dto/credit.retire.action.dto";
import { CreditItmoAuthRequestDto } from "../dto/credit.itmo.auth.request.dto";
import { CreditItmoAuthActionDto } from "../dto/credit.itmo.auth.action.dto";
import { CreditBlockItmoAuthorizationsViewEntity } from "../view-entities/credit.block.itmo.authorizations.view.entity";
import { RetirementACtionEnum } from "../enum/retirement.action.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { CreditBlockBalancesViewEntity } from "../view-entities/credit.block.balances.view.entity";
import { FilterEntry } from "../dto/filter.entry";
import { ProjectEntity } from "../entities/projects.entity";
import { CreditBlockTransfersViewEntity } from "../view-entities/credit.block.transfers.view.entity";
import { CreditBlockRetirementsViewEntity } from "../view-entities/credit.block.retirements.view.entity";
import { CreditBlockExplorerViewEntity } from "../view-entities/credit.block.explorer.view.entity";
import { CreditBlockIssuancesViewEntity } from "../view-entities/credit.block.issuances.view.entity";
import { CreditBlockOrgBalancesViewEntity } from "../view-entities/credit.block.org.balances.view.entity";
import { CreditBlockProjectBalancesViewEntity } from "../view-entities/credit.block.project.balances.view.entity";
import { CreditBlockProjectHolderBalancesViewEntity } from "../view-entities/credit.block.project.holder.balances.view.entity";
import { CreditBlockOrgTransactionsViewEntity } from "../view-entities/credit.block.org.transactions.view.entity";
import { OrgCreditBlocksRequestDto } from "../dto/org.credit.blocks.request.dto";
import { DocumentManagementService } from "../document-management/document-management.service";
import { ProjectAuditLogType } from "../enum/project.audit.log.type.enum";
import { DataResponseDto } from "../dto/data.response.dto";
import { DataResponseMessageDto } from "../dto/data.response.message";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { AefV2WriteService } from "../aef-v2-registry/aef-v2-write.service";
import { Role } from "../casl/role.enum";
import { CompanyState } from "../enum/company.state.enum";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";
import { SerialNumberManagementService } from "../serial-number-management/serial-number-management.service";
import { CreditBlockHistoryRequestDto } from "../dto/credit.block.history.request.dto";

/**
 * One block's parsed ledger version, as seen by the credit-block
 * history-tree reconstruction (see CreditTransactionsManagementService.
 * getCreditBlockHistoryTree). `range` is derived from `serialNumber`,
 * which every block carries; `itmoSerial`/`itmoAuthorizationRecord` are
 * only present once a block has been ITMO-authorized (see
 * ProgrammeLedgerService.getItmoSerial), and are then inherited by every
 * later version of that block and by any block split off it. Each
 * version's own `itmoSerial` always covers exactly that version's
 * `range`, so it is safe to surface per node.
 */
interface CreditBlockLedgerVersion {
  creditBlockId: string;
  range: { start: number; end: number };
  txType: TxType;
  txTime: number;
  ownerCompanyId: number;
  previousOwnerCompanyId?: number;
  creditAmount: number;
  vintage: string;
  itmoSerial?: string;
  itmoAuthorizationRecord?: string;
}

/**
 * The structured description of a single action a credit-block history
 * node/child represents (who did what, when, to how many credits). For
 * RETIRE, companyId/companyName deliberately identify the company that
 * *performed* the retirement (the block's previousOwnerCompanyId) rather
 * than the resulting owner (always 0 - retired credits have no owner),
 * so a retire action isn't shown as belonging to no one. ITMO_AUTH is the
 * one action that never moves credits between companies - the block stays
 * with its owner and only changes character (MO -> ITMO) - so its
 * companyId/companyName are simply that unchanged owner.
 *
 * isItmo/itmoSerial are set on *every* action, not just ITMO_AUTH:
 * ITMO-ness is an attribute of the credits rather than of the action, so
 * a later RETIRE/TRANSFER/RETAIN of authorized credits still carries it.
 */
interface CreditBlockHistoryActionInfo {
  companyId: number | null;
  companyName: string | null;
  /** Raw epoch ms — formatted client-side in the viewer's own local
   * timezone, rather than baked into a string on the server (which would
   * bake in the server's timezone instead, e.g. UTC when deployed). */
  timestamp: number;
  amount: number;
  action: "ISSUE" | "RETAIN" | "TRANSFER" | "RETIRE" | "ITMO_AUTH";
  /** Whether these credits were ITMO-authorized as at this action. */
  isItmo?: boolean;
  /** Dec 6/CMA.4 Annex I para 5 identifier, covering exactly this node's
   * range (each ledger version carries its own, kept in sync by splits). */
  itmoSerial?: string | null;
  /** ITMO_AUTH only - the purpose the credits were authorized for. */
  authorizationPurpose?: string | null;
  /** RETIRE only - which Article 6 use the retirement was made for. */
  retireSubType?: string | null;
}

interface CreditBlockHistoryNode {
  range: string;
  info?: CreditBlockHistoryActionInfo;
  children: CreditBlockHistoryChildNode[];
}

interface CreditBlockHistoryChildNode {
  range: string;
  info: CreditBlockHistoryActionInfo;
}

@Injectable()
export class CreditTransactionsManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly companyService: CompanyService,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    @InjectRepository(CreditBlocksEntity)
    private creditBlocksEntityRepository: Repository<CreditBlocksEntity>,
    private readonly counterService: CounterService,
    @InjectRepository(CreditTransactionsEntity)
    private creditTransactionsEntityRepository: Repository<CreditTransactionsEntity>,
    private readonly documentManagementService: DocumentManagementService,
    @InjectRepository(CreditBlockBalancesViewEntity)
    private creditBlockBalancesViewEntityRepository: Repository<CreditBlockBalancesViewEntity>,
    @InjectRepository(CreditBlockTransfersViewEntity)
    private creditBlockTransfersViewEntityRepository: Repository<CreditBlockTransfersViewEntity>,
    @InjectRepository(CreditBlockRetirementsViewEntity)
    private creditBlockRetirementsViewEntityRepository: Repository<CreditBlockRetirementsViewEntity>,
    @InjectRepository(CreditBlockItmoAuthorizationsViewEntity)
    private creditBlockItmoAuthorizationsViewEntityRepository: Repository<CreditBlockItmoAuthorizationsViewEntity>,
    @InjectRepository(CreditBlockExplorerViewEntity)
    private creditBlockExplorerViewEntityRepository: Repository<CreditBlockExplorerViewEntity>,
    @InjectRepository(CreditBlockIssuancesViewEntity)
    private creditBlockIssuancesViewEntityRepository: Repository<CreditBlockIssuancesViewEntity>,
    @InjectRepository(CreditBlockOrgBalancesViewEntity)
    private creditBlockOrgBalancesViewEntityRepository: Repository<CreditBlockOrgBalancesViewEntity>,
    @InjectRepository(CreditBlockProjectBalancesViewEntity)
    private creditBlockProjectBalancesViewEntityRepository: Repository<CreditBlockProjectBalancesViewEntity>,
    @InjectRepository(CreditBlockProjectHolderBalancesViewEntity)
    private creditBlockProjectHolderBalancesViewEntityRepository: Repository<CreditBlockProjectHolderBalancesViewEntity>,
    @InjectRepository(CreditBlockOrgTransactionsViewEntity)
    private creditBlockOrgTransactionsViewEntityRepository: Repository<CreditBlockOrgTransactionsViewEntity>,
    // ITMO authorization requests must reference an Active cooperative
    // approach; ITMO retirements resolve their destination country /
    // authorized entity from the same cooperative approach.
    @InjectRepository(CooperativeApproach)
    private cooperativeApproachRepo: Repository<CooperativeApproach>,
    @InjectRepository(CaAuthorizedEntity)
    private caAuthorizedEntityRepo: Repository<CaAuthorizedEntity>,
    private readonly serialNumberManagementService: SerialNumberManagementService,
    private readonly aefV2WriteService: AefV2WriteService
  ) {}

  public async transferCredits(
    creditTransferDto: CreditTransferDto,
    user: User
  ) {
    try {
      if (
        user.companyRole != CompanyRole.PROJECT_DEVELOPER ||
        user.role != Role.Admin
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.noTransferPermission",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const companyId = user.companyId;
      const company = await this.companyService.findByCompanyId(companyId);
      if (!company) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const recieverCompany = await this.companyService.findByCompanyId(
        creditTransferDto.receiverOrgId
      );
      if (!recieverCompany) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noRecieverCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (recieverCompany.companyRole != CompanyRole.PROJECT_DEVELOPER) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.recieverNotProjectParticipant",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (recieverCompany.state != CompanyState.ACTIVE) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.recieverNotAcitiveProjectParticipant",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      // Sender and receiver must differ; otherwise the ledger silently
      // flips ownerCompanyId to itself and emits a spurious AEF row.
      if (Number(companyId) === Number(creditTransferDto.receiverOrgId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.selfTransferRejected",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const creditBlock = await this.creditBlocksEntityRepository.findOne({
        where: { creditBlockId: creditTransferDto.blockId },
      });
      if (!creditBlock) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditBlock.ownerCompanyId != companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockDoesNotOwnBySender",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        creditBlock.creditAmount - creditBlock.reservedCreditAmount <
        creditTransferDto.amount
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.notEnoughCreditAmount",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      // Transfers are only for mitigation-outcome (MO) blocks. An
      // ITMO-authorized block (itmoAuthorizationRecord set) leaves the
      // domestic-transfer flow entirely.
      if (creditBlock.itmoAuthorizationRecord) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.transferOnlyForMo",
            [creditBlock.creditBlockId]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      await this.programmeLedgerService.transferCredits(
        creditTransferDto,
        creditBlock.projectRefId,
        user
      );
      await this.documentManagementService.logProjectStage(
        creditBlock.projectRefId,
        ProjectAuditLogType.CREDIT_TRANSFERED,
        user.id,
        undefined,
        {
          amount: creditTransferDto.amount,
          toCompanyId: creditTransferDto.receiverOrgId,
          fromCompanyId: creditBlock.ownerCompanyId,
        }
      );
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "creditTransaction.creditsTransferred",
          []
        ),
        {
          amount: creditTransferDto.amount,
          toCompanyId: creditTransferDto.receiverOrgId,
          fromCompanyId: creditBlock.ownerCompanyId,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async createRetireRequest(
    creditRetireRequestDto: CreditRetireRequestDto,
    user: User
  ) {
    try {
      if (
        user.companyRole != CompanyRole.PROJECT_DEVELOPER ||
        user.role != Role.Admin
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.noRetirePermission",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const companyId = user.companyId;
      const company = await this.companyService.findByCompanyId(companyId);
      if (!company) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const creditBlock = await this.creditBlocksEntityRepository.findOne({
        where: { creditBlockId: creditRetireRequestDto.blockId },
      });
      if (!creditBlock) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditBlock.ownerCompanyId != companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockDoesNotOwnBySender",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        creditBlock.creditAmount - creditBlock.reservedCreditAmount <
        creditRetireRequestDto.amount
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.notEnoughCreditAmount",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      const { resolvedCountry, resolvedEntityName, resolvedCooperativeApproachId } =
        await this.resolveRetirementUseFields(creditBlock, creditRetireRequestDto);

      const newRetireId = await this.counterService.incrementCount(
        CounterType.CREDIT_TRANSACTIONS,
        0
      );
      const enrichedDto: CreditRetireRequestDto & ResolvedRetireRequestFields =
        {
          ...creditRetireRequestDto,
          resolvedCountry,
          resolvedEntityName,
          resolvedCooperativeApproachId,
        };
      await this.programmeLedgerService.addRetireRequest(
        newRetireId,
        enrichedDto,
        user
      );

      await this.documentManagementService.logProjectStage(
        creditBlock.projectRefId,
        ProjectAuditLogType.RETIRE_REQUESTED,
        user.id,
        undefined,
        {
          amount: creditRetireRequestDto.amount,
          remarks: creditRetireRequestDto.remarks,
          subType: creditRetireRequestDto.subType,
          fromCompanyId: companyId,
        }
      );
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "creditTransaction.retirementReqCreated",
          []
        ),
        {
          id: newRetireId,
          amount: creditRetireRequestDto.amount,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Validates and resolves the MO/ITMO-specific fields of a retirement
   * request before it is written to the ledger:
   *  - MO blocks may never retire with subType
   *    FIRST_TRANSFER_TOWARDS_NDC or FIRST_TRANSFER_FOR_OIMP — those
   *    are inherently international, and require the block to be
   *    ITMO-authorized first.
   *  - ITMO blocks may never retire with subType USE_TOWARDS_NDC —
   *    that subType is domestic-only; an ITMO retires for one of the
   *    two FIRST_TRANSFER_* subtypes instead, gated by the block's
   *    ITMO authorization purpose: FIRST_TRANSFER_TOWARDS_NDC requires
   *    purpose NDC; FIRST_TRANSFER_FOR_OIMP requires purpose OIMP or
   *    OTHER. VOLUNTARY_CANCELLATION / OMGE_CANCELLATION are always
   *    allowed regardless of purpose, for both MO and ITMO.
   *  - For an ITMO first-transfer retirement, resolves the destination
   *    country from a pool of candidate parties on the block's
   *    ITMO-authorized cooperative approach — a single candidate is
   *    stamped automatically, several require the caller to name one.
   *    FIRST_TRANSFER_TOWARDS_NDC's pool is the CA's participating
   *    parties minus the host (guaranteed non-empty — ITMO
   *    authorization already rejects host-only CAs for NDC purpose,
   *    see createItmoAuthRequest); an empty pool here is defensive
   *    only. FIRST_TRANSFER_FOR_OIMP's pool is the CA's full
   *    participating-parties list *including* the host — OIMP never
   *    requires crossing a border, so the host is always a valid
   *    acquiring "country" alongside any real counterparties.
   *    FIRST_TRANSFER_FOR_OIMP additionally requires naming one of the
   *    CA's Active authorized entities incorporated in the resolved
   *    country.
   */
  private async resolveRetirementUseFields(
    creditBlock: CreditBlocksEntity,
    dto: CreditRetireRequestDto
  ): Promise<{
    resolvedCountry?: string;
    resolvedEntityName?: string;
    resolvedCooperativeApproachId?: string;
  }> {
    const isItmo = !!creditBlock.itmoAuthorizationRecord;
    const subType = dto.subType;

    const isFirstTransferSubType =
      subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC ||
      subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP;

    if (!isItmo && isFirstTransferSubType) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.subTypeNotAllowedForMo",
          [subType]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (isItmo && subType === CreditTransactionSubTypesEnum.USE_TOWARDS_NDC) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.subTypeNotAllowedForItmo",
          [subType]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!isItmo || !isFirstTransferSubType) {
      // MO use-towards-NDC is domestic (no counterparty); voluntary and
      // OMGE cancellations never cross the border either way.
      return {};
    }

    const authRecord = await this.creditTransactionsEntityRepository.findOne({
      where: { id: creditBlock.itmoAuthorizationRecord },
    });
    const authData = (authRecord?.data ?? {}) as ItmoAuthorizationData;
    const purpose = authData.authorizationPurpose ?? AuthorizationPurpose.NDC;

    if (
      subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC &&
      purpose !== AuthorizationPurpose.NDC
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.subTypeNotAllowedForPurpose",
          [subType, purpose]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (
      subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP &&
      purpose === AuthorizationPurpose.NDC
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.subTypeNotAllowedForPurpose",
          [subType, purpose]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!authData.cooperativeApproachId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.itmoAuthCaNotFound",
          [""]
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const ca = await this.cooperativeApproachRepo.findOne({
      where: { cooperativeApproachId: authData.cooperativeApproachId },
    });
    if (!ca) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.itmoAuthCaNotFound",
          [authData.cooperativeApproachId]
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const counterparties = (ca.participatingParties || []).filter(
      (p) => p !== ca.hostParty
    );
    // OIMP never requires a foreign counterparty — the host itself is
    // always a valid acquiring "country" for OIMP, alongside any real
    // counterparties. NDC's pool stays counterparties-only, since a
    // domestic NDC use is USE_TOWARDS_NDC (MO-only), not a first
    // transfer.
    const countryPool =
      subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP
        ? ca.participatingParties || []
        : counterparties;

    let resolvedCountry: string;
    if (countryPool.length === 0) {
      // Only reachable for NDC in practice (OIMP's pool always
      // includes the host, so it's never empty) — kept defensive in
      // case a CA's participatingParties is ever malformed.
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.retireCaHasNoCounterparty",
          [ca.cooperativeApproachId]
        ),
        HttpStatus.BAD_REQUEST
      );
    } else if (countryPool.length === 1) {
      resolvedCountry = countryPool[0];
    } else {
      if (!dto.country) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.retireCountryRequired",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (!countryPool.includes(dto.country)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.retireCountryInvalid",
            [dto.country]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      resolvedCountry = dto.country;
    }

    let resolvedEntityName: string | undefined;
    if (subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP) {
      if (!dto.authorizedEntityId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.authorizedEntityRequired",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const entity = await this.caAuthorizedEntityRepo.findOne({
        where: {
          id: dto.authorizedEntityId,
          cooperativeApproachId: ca.cooperativeApproachId,
          status: AuthorizedEntityStatus.ACTIVE,
          // Must be incorporated in the resolved acquiring country —
          // an OIMP entity from a different counterparty isn't valid
          // for this particular transfer.
          countryOfIncorporation: resolvedCountry,
        },
      });
      if (!entity) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.authorizedEntityInvalid",
            [dto.authorizedEntityId]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      resolvedEntityName = entity.entityName;
    }

    return {
      resolvedCountry,
      resolvedEntityName,
      resolvedCooperativeApproachId: ca.cooperativeApproachId,
    };
  }

  public async creditRetirementAction(
    retirementAction: CreditRetireActionDto,
    user: User
  ) {
    try {
      const creditRetireRequest =
        await this.creditTransactionsEntityRepository.findOne({
          where: { id: retirementAction.transactionId },
        });
      if (!creditRetireRequest) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.creditRetirementRequestNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditRetireRequest.status != CreditTransactionStatusEnum.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.creditRetirementRequestNotPending",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const projectCompany = await this.companyService.findByCompanyId(
        creditRetireRequest.senderId
      );
      if (projectCompany.state == CompanyState.SUSPENDED) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.companyInDeactivatedState",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      if (
        retirementAction.action == RetirementACtionEnum.ACCEPT ||
        retirementAction.action == RetirementACtionEnum.REJECT
      ) {
        if (
          user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
          ![Role.Admin, Role.Root].includes(user.role)
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "creditTransaction.noRetireActionPermission",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      } else if (retirementAction.action == RetirementACtionEnum.CANCEL) {
        if (
          user.companyRole != CompanyRole.PROJECT_DEVELOPER ||
          user.role != Role.Admin
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.notAuthorizedProjectParticipant",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        if (user.companyId != creditRetireRequest.senderId) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.notOwnRetirementRequest",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      }
      await this.programmeLedgerService.retirementRequestAction(
        creditRetireRequest,
        retirementAction,
        user
      );

      const auditLogTypes: Record<RetirementACtionEnum, ProjectAuditLogType> = {
        [RetirementACtionEnum.ACCEPT]: ProjectAuditLogType.RETIRE_APPROVED,
        [RetirementACtionEnum.REJECT]: ProjectAuditLogType.RETIRE_REJECTED,
        [RetirementACtionEnum.CANCEL]: ProjectAuditLogType.RETIRE_CANCELLED,
      };

      const logType = auditLogTypes[retirementAction.action];

      await this.documentManagementService.logProjectStage(
        creditRetireRequest.projectRefId,
        logType,
        user.id,
        undefined,
        {
          amount: creditRetireRequest.amount,
          remarks: retirementAction.remarks,
          subType: creditRetireRequest.subType,
          fromCompanyId: creditRetireRequest.senderId,
        }
      );
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "creditTransaction.creditRetirementReqAction",
          [retirementAction.action.toLowerCase()]
        ),
        {
          amount: creditRetireRequest.amount,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async createItmoAuthRequest(
    itmoAuthRequestDto: CreditItmoAuthRequestDto,
    user: User
  ) {
    try {
      // Initiated by an Admin of the organization that owns the block.
      if (
        user.companyRole != CompanyRole.PROJECT_DEVELOPER ||
        user.role != Role.Admin
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.noItmoAuthPermission",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const companyId = user.companyId;
      const company = await this.companyService.findByCompanyId(companyId);
      if (!company) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const creditBlock = await this.creditBlocksEntityRepository.findOne({
        where: { creditBlockId: itmoAuthRequestDto.blockId },
      });
      if (!creditBlock) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditBlock.ownerCompanyId != companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockDoesNotOwnBySender",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      // Only MO (not yet ITMO-authorized) blocks can be authorized.
      if (creditBlock.itmoAuthorizationRecord) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.blockAlreadyItmoAuthorized",
            [creditBlock.creditBlockId]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      // ITMO authorization must happen under an Active cooperative
      // approach.
      const cooperativeApproach =
        await this.cooperativeApproachRepo.findOneBy({
          cooperativeApproachId: itmoAuthRequestDto.cooperativeApproachId,
        });
      if (!cooperativeApproach) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.itmoAuthCaNotFound",
            [itmoAuthRequestDto.cooperativeApproachId]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        cooperativeApproach.status !== CooperativeApproachStatus.ACTIVE
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.itmoAuthCaNotActive",
            [
              itmoAuthRequestDto.cooperativeApproachId,
              cooperativeApproach.status,
            ]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      // A cooperative approach with no counterparty besides the host
      // has nowhere for an NDC first transfer to go — it can only be
      // used to authorize ITMOs for OIMP/Other purposes. authorizationPurpose
      // is mandatory on the DTO (class-validator rejects a missing value
      // before this method runs), so no NDC fallback is needed here anymore.
      const authorizationPurpose = itmoAuthRequestDto.authorizationPurpose;
      const hasCounterparty = cooperativeApproach.participatingParties.some(
        (p) => p !== cooperativeApproach.hostParty
      );
      if (authorizationPurpose === AuthorizationPurpose.NDC && !hasCounterparty) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.itmoAuthNdcRequiresCounterparty",
            [itmoAuthRequestDto.cooperativeApproachId]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        itmoAuthRequestDto.authorizedTimeframeStartYear !== undefined &&
        itmoAuthRequestDto.authorizedTimeframeEndYear !== undefined &&
        itmoAuthRequestDto.authorizedTimeframeStartYear >
          itmoAuthRequestDto.authorizedTimeframeEndYear
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.itmoAuthTimeframeInverted",
            [
              itmoAuthRequestDto.authorizedTimeframeStartYear.toString(),
              itmoAuthRequestDto.authorizedTimeframeEndYear.toString(),
            ]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        creditBlock.creditAmount - creditBlock.reservedCreditAmount <
        itmoAuthRequestDto.amount
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.notEnoughCreditAmount",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const newAuthId = await this.counterService.incrementCount(
        CounterType.CREDIT_TRANSACTIONS,
        0
      );
      await this.programmeLedgerService.addItmoAuthRequest(
        newAuthId,
        itmoAuthRequestDto,
        user
      );

      await this.documentManagementService.logProjectStage(
        creditBlock.projectRefId,
        ProjectAuditLogType.ITMO_AUTH_REQUESTED,
        user.id,
        undefined,
        {
          amount: itmoAuthRequestDto.amount,
          remarks: itmoAuthRequestDto.remarks,
          cooperativeApproachId: itmoAuthRequestDto.cooperativeApproachId,
          authorizationPurpose: itmoAuthRequestDto.authorizationPurpose,
          fromCompanyId: companyId,
        }
      );
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "creditTransaction.itmoAuthReqCreated",
          []
        ),
        {
          id: newAuthId,
          amount: itmoAuthRequestDto.amount,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async itmoAuthorizationAction(
    itmoAuthAction: CreditItmoAuthActionDto,
    user: User
  ) {
    try {
      const itmoAuthRequest =
        await this.creditTransactionsEntityRepository.findOne({
          where: { id: itmoAuthAction.transactionId },
        });
      if (
        !itmoAuthRequest ||
        itmoAuthRequest.type != CreditTransactionTypesEnum.ITMO_AUTHORIZED
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.itmoAuthRequestNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (itmoAuthRequest.status != CreditTransactionStatusEnum.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.itmoAuthRequestNotPending",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const requestingCompany = await this.companyService.findByCompanyId(
        itmoAuthRequest.senderId
      );
      if (requestingCompany.state == CompanyState.SUSPENDED) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.companyInDeactivatedState",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      if (
        itmoAuthAction.action == RetirementACtionEnum.ACCEPT ||
        itmoAuthAction.action == RetirementACtionEnum.REJECT
      ) {
        // Government (DNA) Admin/Root approves or rejects.
        if (
          user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
          ![Role.Admin, Role.Root].includes(user.role)
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "creditTransaction.noItmoAuthActionPermission",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      } else if (itmoAuthAction.action == RetirementACtionEnum.CANCEL) {
        if (
          user.companyRole != CompanyRole.PROJECT_DEVELOPER ||
          user.role != Role.Admin
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.notAuthorizedProjectParticipant",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        if (user.companyId != itmoAuthRequest.senderId) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "creditTransaction.notOwnItmoAuthRequest",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      }
      // itmoSerial (SerialNumberManagementService.getItmoSerial) is
      // only assigned on approval, and needs the block's ITMO-authorized
      // cooperative approach's real caReferenceNumber — resolve it here
      // (domain-level lookup) rather than in the ledger service.
      let caReferenceNumber: string | undefined;
      if (itmoAuthAction.action == RetirementACtionEnum.ACCEPT) {
        const authData = (itmoAuthRequest.data ?? {}) as ItmoAuthorizationData;
        const ca = await this.cooperativeApproachRepo.findOneBy({
          cooperativeApproachId: authData.cooperativeApproachId,
        });
        if (!ca?.caReferenceNumber) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "creditTransaction.itmoAuthCaMissingReference",
              [authData.cooperativeApproachId ?? ""]
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        caReferenceNumber = ca.caReferenceNumber;
      }
      await this.programmeLedgerService.itmoAuthRequestAction(
        itmoAuthRequest,
        itmoAuthAction,
        user,
        caReferenceNumber
      );

      const auditLogTypes: Record<RetirementACtionEnum, ProjectAuditLogType> = {
        [RetirementACtionEnum.ACCEPT]: ProjectAuditLogType.ITMO_AUTH_APPROVED,
        [RetirementACtionEnum.REJECT]: ProjectAuditLogType.ITMO_AUTH_REJECTED,
        [RetirementACtionEnum.CANCEL]: ProjectAuditLogType.ITMO_AUTH_CANCELLED,
      };

      await this.documentManagementService.logProjectStage(
        itmoAuthRequest.projectRefId,
        auditLogTypes[itmoAuthAction.action],
        user.id,
        undefined,
        {
          amount: itmoAuthRequest.amount,
          remarks: itmoAuthAction.remarks,
          fromCompanyId: itmoAuthRequest.senderId,
        }
      );
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "creditTransaction.itmoAuthReqAction",
          [itmoAuthAction.action.toLowerCase()]
        ),
        {
          amount: itmoAuthRequest.amount,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async handleTransactionRecords(
    creditBlock: CreditBlocksEntity,
    em: EntityManager,
    previousCreditBlock?: CreditBlocksEntity
  ) {
    if (creditBlock.txType == TxType.ISSUE) {
      const id = await this.counterService.incrementCount(
        CounterType.CREDIT_TRANSACTIONS,
        0
      );
      const newIssueRecord = plainToClass(CreditTransactionsEntity, {
        id: id,
        senderId: creditBlock.previousOwnerCompanyId,
        recieverId: creditBlock.ownerCompanyId,
        type: CreditTransactionTypesEnum.ISSUED,
        status: CreditTransactionStatusEnum.COMPLETED,
        creditBlockId: creditBlock.creditBlockId,
        serialNumber: creditBlock.serialNumber,
        amount: creditBlock.creditAmount,
        projectRefId: creditBlock.projectRefId,
        toAccountType: creditBlock.accountType,
      });
      await em.save(CreditTransactionsEntity, newIssueRecord);
    } else if (creditBlock.txType == TxType.TRANSFER) {
      const id = await this.counterService.incrementCount(
        CounterType.CREDIT_TRANSACTIONS,
        0
      );
      const newTranferRecord = plainToClass(CreditTransactionsEntity, {
        id: id,
        senderId: creditBlock.previousOwnerCompanyId,
        recieverId: creditBlock.ownerCompanyId,
        type: CreditTransactionTypesEnum.TRANSFERED,
        status: CreditTransactionStatusEnum.COMPLETED,
        creditBlockId: creditBlock.creditBlockId,
        serialNumber: creditBlock.serialNumber,
        amount: creditBlock.creditAmount,
        projectRefId: creditBlock.projectRefId,
        fromAccountType: previousCreditBlock?.accountType,
        toAccountType: creditBlock.accountType,
      });
      await em.save(CreditTransactionsEntity, newTranferRecord);
    } else if (creditBlock.txType == TxType.RETIRE_REQ) {
      const newRetireReq =
        creditBlock.transactionRecords[
          creditBlock.transactionRecords.length - 1
        ];
      const txData: CreditRetireRequestDto & ResolvedRetireRequestFields =
        creditBlock.txData;
      const newTranferRecord = plainToClass(CreditTransactionsEntity, {
        id: newRetireReq.id,
        senderId: creditBlock.ownerCompanyId,
        recieverId: 0,
        type: CreditTransactionTypesEnum.RETIRED,
        subType: txData.subType,
        status: CreditTransactionStatusEnum.PENDING,
        creditBlockId: creditBlock.creditBlockId,
        serialNumber: creditBlock.serialNumber,
        amount: txData.amount,
        projectRefId: creditBlock.projectRefId,
        data: this.buildRetirementData(txData),
      });
      await em.save(CreditTransactionsEntity, newTranferRecord);
    } else if (creditBlock.txType == TxType.RETIRE) {
      const txData: CreditRetireActionDto = creditBlock.txData;
      const transactionRecordIndex = creditBlock.transactionRecords.findIndex(
        (e) => e.id == txData.transactionId
      );
      const retireRequestRecord =
        creditBlock.transactionRecords[transactionRecordIndex];
      let updatedTranferRecord: CreditTransactionsEntity;
      if (retireRequestRecord.status == CreditTransactionStatusEnum.COMPLETED) {
        // First transfer occurs at the moment ITMO credits leave the
        // country — i.e. approval of an ITMO block's
        // First-Transfer-Towards-NDC or First-Transfer-For-OIMP
        // retirement. MO blocks (incl. domestic Use-Towards-NDC) and
        // voluntary/OMGE cancellations never cross the border.
        const retireTransaction =
          await this.creditTransactionsEntityRepository.findOne({
            where: { id: txData.transactionId },
          });
        const isFirstTransfer =
          !!creditBlock.itmoAuthorizationRecord &&
          (retireTransaction?.subType ===
            CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC ||
            retireTransaction?.subType ===
              CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP);
        updatedTranferRecord = plainToClass(CreditTransactionsEntity, {
          status: retireRequestRecord.status,
          creditBlockId: creditBlock.creditBlockId,
          serialNumber: creditBlock.serialNumber,
          isFirstTransfer,
        });
      } else {
        updatedTranferRecord = plainToClass(CreditTransactionsEntity, {
          status: retireRequestRecord.status,
        });
      }
      await em.update(
        CreditTransactionsEntity,
        { id: txData.transactionId },
        updatedTranferRecord
      );
    } else if (creditBlock.txType == TxType.ITMO_AUTH_REQ) {
      const newAuthReq =
        creditBlock.transactionRecords[
          creditBlock.transactionRecords.length - 1
        ];
      const txData: CreditItmoAuthRequestDto = creditBlock.txData;
      const newAuthRecord = plainToClass(CreditTransactionsEntity, {
        id: newAuthReq.id,
        senderId: creditBlock.ownerCompanyId,
        recieverId: creditBlock.ownerCompanyId,
        type: CreditTransactionTypesEnum.ITMO_AUTHORIZED,
        status: CreditTransactionStatusEnum.PENDING,
        creditBlockId: creditBlock.creditBlockId,
        serialNumber: creditBlock.serialNumber,
        amount: txData.amount,
        projectRefId: creditBlock.projectRefId,
        data: {
          cooperativeApproachId: txData.cooperativeApproachId,
          authorizationPurpose: txData.authorizationPurpose,
          authorizedTimeframeStartYear: txData.authorizedTimeframeStartYear,
          authorizedTimeframeEndYear: txData.authorizedTimeframeEndYear,
          remarks: txData.remarks,
        },
      });
      await em.save(CreditTransactionsEntity, newAuthRecord);
    } else if (creditBlock.txType == TxType.ITMO_AUTH) {
      const txData: CreditItmoAuthActionDto = creditBlock.txData;
      const transactionRecordIndex = creditBlock.transactionRecords.findIndex(
        (e) => e.id == txData.transactionId
      );
      const authRequestRecord =
        creditBlock.transactionRecords[transactionRecordIndex];
      let updatedAuthRecord: CreditTransactionsEntity;
      if (authRequestRecord.status == CreditTransactionStatusEnum.COMPLETED) {
        // On approval the completed record points at the block that
        // now carries the authorization (the child block on a partial
        // authorization split).
        updatedAuthRecord = plainToClass(CreditTransactionsEntity, {
          status: authRequestRecord.status,
          creditBlockId: creditBlock.creditBlockId,
          serialNumber: creditBlock.serialNumber,
        });
      } else {
        updatedAuthRecord = plainToClass(CreditTransactionsEntity, {
          status: authRequestRecord.status,
        });
      }
      await em.update(
        CreditTransactionsEntity,
        { id: txData.transactionId },
        updatedAuthRecord
      );
    }
    // AEF V2 (@app/aef-v2) writes here. V1 (AefReportManagementService) has
    // been retired — see the AEF V1 removal for where its trigger used to be.
    // Runs in this same transaction/EntityManager so a V2 write and its
    // ledger row commit or roll back together.
    await this.aefV2WriteService.recordCreditBlockEvent(creditBlock, em, previousCreditBlock);
  }

  // Type+subType-specific payload for a RETIRED transaction record; see
  // credit.transaction.data.types.ts. country/authorizedEntityId/
  // entityName are only ever populated for ITMO
  // First-Transfer-Towards-NDC / First-Transfer-For-OIMP retirements,
  // resolved server-side in resolveRetirementUseFields and merged onto
  // txData before it was persisted to the ledger.
  private buildRetirementData(
    txData: CreditRetireRequestDto & ResolvedRetireRequestFields
  ): CreditTransactionData {
    if (
      txData.subType ===
        CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC ||
      txData.subType === CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP
    ) {
      const data: RetirementUseData = { remarks: txData.remarks };
      if (txData.resolvedCountry) {
        data.country = txData.resolvedCountry;
      }
      if (txData.resolvedEntityName) {
        data.authorizedEntityId = txData.authorizedEntityId;
        data.entityName = txData.resolvedEntityName;
      }
      if (txData.resolvedCooperativeApproachId) {
        data.cooperativeApproachId = txData.resolvedCooperativeApproachId;
      }
      return data;
    }
    return { remarks: txData.remarks };
  }

  public async queryCreditBalances(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      const onlyOwn: FilterEntry = {
        key: "receiverId",
        value: user.companyId,
        operation: "=",
      };
      query.filterAnd
        ? query.filterAnd.push(onlyOwn)
        : (query.filterAnd = [onlyOwn]);
    } else if (user.companyRole == CompanyRole.INDEPENDENT_CERTIFIER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.unauthorized",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const qb = this.creditBlockBalancesViewEntityRepository
      .createQueryBuilder("creditBlock")
      .where(this.helperService.generateWhereSQL(query, abilityCondition));
    const nulls =
      query?.sort?.nullFirst !== undefined
        ? query?.sort?.nullFirst === true
          ? "NULLS FIRST"
          : "NULLS LAST"
        : undefined;
    if (query?.sort?.key === "serialNumber") {
      // Same fix as queryExplorer/queryIssuances: "serialNumber" is a single
      // formatted string
      // (CA0NNN-NG-XX-{projectId}-{blockStart}-{blockEnd}-{vintage}), so a
      // plain text ORDER BY sorts it lexicographically. Sort by its numeric
      // project ID and block start instead.
      qb.orderBy(this.serialProjectIdNumericExpr(), query.sort.order, nulls)
        .addOrderBy(this.serialRangeStartExpr(), query.sort.order, nulls);
    } else {
      qb.orderBy(query?.sort?.key && `"${query?.sort?.key}"`, query?.sort?.order, nulls);
    }
    if (query?.sort?.key) {
      // Stable tiebreaker - the balance list is paged (and infinite-scrolled
      // by the By Project detail table), so ties on a non-unique sort key
      // must not let OFFSET/LIMIT repeat or drop blocks between pages.
      qb.addOrderBy(`"creditBlock"."id"`, query?.sort?.order);
    }
    const resp = await qb
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  /**
   * Credits -> Balance -> By Organization (DNA only): one row per
   * organization, aggregating the balance and reserved amount of every
   * non-retired block it owns, via CreditBlockOrgBalancesViewEntity.
   * updatedTime is the most recent block update within that
   * organization's owned blocks. Ignores the page's account-type filter
   * by design - totals always cover all account types.
   */
  public async queryBalanceByOrganization(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    query.page = query.page || 1;
    query.size = query.size || 10;
    if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.unauthorized",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const qb = this.creditBlockOrgBalancesViewEntityRepository
      .createQueryBuilder("orgBalance")
      .where(this.helperService.generateWhereSQL(query, abilityCondition));
    this.applyBalanceAggregateOrder(qb, query, "orgBalance", "organizationId");
    const resp = await qb
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  /**
   * Credits -> Balance -> By Project: one row per project, aggregating
   * the balance and reserved amount of every non-retired block within
   * it. projectOwner* always identifies the project's developer company
   * (project_entity.companyId), not the current credit holder(s). DNA
   * sees totals across every holding organization
   * (CreditBlockProjectBalancesViewEntity); Project Developers are
   * scoped to blocks their own company holds
   * (CreditBlockProjectHolderBalancesViewEntity, filtered to
   * holderId = own companyId - a pre-aggregation scope baked into the
   * view's grain, so totals only ever reflect their own credits).
   * updatedTime is the most recent block update within that project's
   * (scoped) blocks. Ignores the page's account-type filter by design -
   * totals always cover all account types. The inner per-block
   * breakdown for a project is fed by the existing
   * queryBalance/queryCreditBalances endpoint filtered by projectId.
   */
  public async queryBalanceByProject(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    query.page = query.page || 1;
    query.size = query.size || 10;
    if (user.companyRole == CompanyRole.INDEPENDENT_CERTIFIER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.unauthorized",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      const onlyOwn: FilterEntry = {
        key: "holderId",
        value: user.companyId,
        operation: "=",
      };
      query.filterAnd
        ? query.filterAnd.push(onlyOwn)
        : (query.filterAnd = [onlyOwn]);
      const holderQb = this.creditBlockProjectHolderBalancesViewEntityRepository
        .createQueryBuilder("projectBalance")
        .where(this.helperService.generateWhereSQL(query, abilityCondition));
      this.applyBalanceAggregateOrder(
        holderQb,
        query,
        "projectBalance",
        "projectId"
      );
      const resp = await holderQb
        .skip(query.size * query.page - query.size)
        .take(query.size)
        .getManyAndCount();
      return new DataListResponseDto(
        resp.length > 0 ? resp[0] : undefined,
        resp.length > 1 ? resp[1] : undefined
      );
    }

    const qb = this.creditBlockProjectBalancesViewEntityRepository
      .createQueryBuilder("projectBalance")
      .where(this.helperService.generateWhereSQL(query, abilityCondition));
    this.applyBalanceAggregateOrder(qb, query, "projectBalance", "projectId");
    const resp = await qb
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  /**
   * ORDER BY for the three aggregate balance views (By Project for DNA and
   * for a Project Developer, and By Organization) - they share the same
   * creditBalance / reservedCredits / itmo* column names.
   * "MO" figures are the non-ITMO remainder of those totals and have no
   * column of their own - the frontend derives them as
   * creditBalance - itmoBalance - so those two sort keys are mapped to the
   * same expression here rather than quoted as plain columns.
   * tiebreakerColumn (the view's grain: projectId / organizationId) is
   * appended as a stable tiebreaker: without it, ties on an aggregate
   * (many rows with a 0 balance) let OFFSET/LIMIT repeat or drop rows
   * between pages.
   */
  private applyBalanceAggregateOrder(
    qb: SelectQueryBuilder<any>,
    query: QueryDto,
    alias: string,
    tiebreakerColumn: string
  ): SelectQueryBuilder<any> {
    const nulls =
      query?.sort?.nullFirst !== undefined
        ? query?.sort?.nullFirst === true
          ? "NULLS FIRST"
          : "NULLS LAST"
        : undefined;
    const key = query?.sort?.key;
    const moExpressions = {
      moBalance: `("${alias}"."creditBalance" - "${alias}"."itmoBalance")`,
      moReserved: `("${alias}"."reservedCredits" - "${alias}"."itmoReservedCredits")`,
    };
    qb.orderBy(
      key && (moExpressions[key] ?? `"${key}"`),
      query?.sort?.order,
      nulls
    );
    if (key) {
      qb.addOrderBy(`"${alias}"."${tiebreakerColumn}"`, query?.sort?.order);
    }
    return qb;
  }

  public async queryBalanceProjectNames(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    query.page = query.page || 1;
    query.size = query.size || 10;
    if (user.companyRole == CompanyRole.INDEPENDENT_CERTIFIER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.unauthorized",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const scopeFilters: FilterEntry[] = [
      { key: "ownerCompanyId", operation: "!=", value: 0 },
    ];
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      scopeFilters.push({
        key: "ownerCompanyId",
        operation: "=",
        value: user.companyId,
      });
    }
    query.filterAnd
      ? query.filterAnd.push(...scopeFilters)
      : (query.filterAnd = scopeFilters);

    const resp = await this.creditBlocksEntityRepository
      .createQueryBuilder("cb")
      .innerJoin(ProjectEntity, "p", 'cb."projectRefId" = p."refId"')
      .select('p."title"', "projectName")
      .addSelect(
        `string_agg(DISTINCT cb."projectRefId", ',' ORDER BY cb."projectRefId")`,
        "projectIds"
      )
      .groupBy('p."title"')
      .where(this.helperService.generateWhereSQL(query, abilityCondition))
      .orderBy(query?.sort?.key && `"${query?.sort?.key}"`, query?.sort?.order)
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getRawMany();
    return new DataListResponseDto(resp, undefined);
  }

  public async queryTransfers(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      const ownTransfers: FilterEntry[] = [
        { key: "senderId", value: user.companyId, operation: "=" },
        { key: "recieverId", value: user.companyId, operation: "=" },
      ];
      query.filterOr
        ? query.filterOr.push(...ownTransfers)
        : (query.filterOr = ownTransfers);
    } else if (user.companyRole == CompanyRole.INDEPENDENT_CERTIFIER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.unauthorized",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const resp = await this.creditBlockTransfersViewEntityRepository
      .createQueryBuilder("creditTx")
      .where(this.helperService.generateWhereSQL(query, abilityCondition))
      .orderBy(
        query?.sort?.key === "id"
          ? this.idNumericExpr("creditTx")
          : query?.sort?.key && `"${query?.sort?.key}"`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  public async queryRetirements(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      const onlyOwn: FilterEntry = {
        key: "senderId",
        value: user.companyId,
        operation: "=",
      };
      query.filterAnd
        ? query.filterAnd.push(onlyOwn)
        : (query.filterAnd = [onlyOwn]);
    } else if (user.companyRole == CompanyRole.INDEPENDENT_CERTIFIER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.unauthorized",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const resp = await this.creditBlockRetirementsViewEntityRepository
      .createQueryBuilder("creditTx")
      .where(this.helperService.generateWhereSQL(query, abilityCondition))
      .orderBy(
        query?.sort?.key && query.sort.key == "status"
          ? `"${query.sort.key}"::text`
          : `"${query.sort.key}"`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  public async queryItmoAuthorizations(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      const onlyOwn: FilterEntry = {
        key: "senderId",
        value: user.companyId,
        operation: "=",
      };
      query.filterAnd
        ? query.filterAnd.push(onlyOwn)
        : (query.filterAnd = [onlyOwn]);
    } else if (user.companyRole == CompanyRole.INDEPENDENT_CERTIFIER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.unauthorized",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const resp = await this.creditBlockItmoAuthorizationsViewEntityRepository
      .createQueryBuilder("creditTx")
      .where(this.helperService.generateWhereSQL(query, abilityCondition))
      .orderBy(
        query?.sort?.key && query.sort.key == "status"
          ? `"${query.sort.key}"::text`
          : `"${query.sort.key}"`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    const rows = resp.length > 0 ? resp[0] : [];
    const total = resp.length > 1 ? resp[1] : undefined;
    if (!rows || rows.length === 0) {
      return new DataListResponseDto(rows, total);
    }
    const enrichedRows = await this.enrichItmoAuthorizationRows(rows);
    return new DataListResponseDto(enrichedRows, total);
  }

  /**
   * ITMO Authorizations enrichment: attach the human CA reference number
   * and the ITMO serial actually assigned to this specific authorization
   * action.
   *
   * itmoSerial is deliberately NOT sourced from a join to
   * credit_blocks_entity — that block row keeps getting re-split by
   * later, unrelated retirements/transfers, so a live join drifts away
   * from what this authorization actually generated. ct.serialNumber,
   * by contrast, is stamped once on approval (re-pointed at the child
   * block on a partial-authorization split — see
   * handleTransactionRecords' TxType.ITMO_AUTH branch) and never
   * touched again, so it's always the exact narrow range this action
   * covers. Every non-CA input getItmoSerial needs (projectId,
   * blockStart, blockEnd, vintage) is a pure function of that frozen
   * serial string — the same derivation programmeLedgerService uses at
   * approval time (see itmoAuthRequestAction, both the whole-block and
   * partial-split branches) — so recomputing it here reproduces the
   * real value exactly, permanently, with no risk of drift.
   */
  private async enrichItmoAuthorizationRows(
    rows: CreditBlockItmoAuthorizationsViewEntity[]
  ): Promise<
    Array<
      Omit<CreditBlockItmoAuthorizationsViewEntity, "serialNumber"> & {
        caReferenceNumber: string | null;
        itmoSerial: string | null;
      }
    >
  > {
    const cooperativeApproachIds = Array.from(
      new Set(
        rows
          .map((row) => row.cooperativeApproachId)
          .filter((id): id is string => !!id)
      )
    );
    const cooperativeApproaches = cooperativeApproachIds.length
      ? await this.cooperativeApproachRepo.find({
          where: { cooperativeApproachId: In(cooperativeApproachIds) },
        })
      : [];
    const caByid = new Map(
      cooperativeApproaches.map((ca) => [ca.cooperativeApproachId, ca])
    );

    return rows.map((row) => {
      const ca = row.cooperativeApproachId
        ? caByid.get(row.cooperativeApproachId)
        : undefined;
      const caReferenceNumber = ca?.caReferenceNumber ?? null;
      const itmoSerial =
        row.status === CreditTransactionStatusEnum.COMPLETED &&
        caReferenceNumber
          ? this.serialNumberManagementService.getItmoSerial(
              caReferenceNumber,
              this.serialNumberManagementService.getProjectIdFromSerial(
                row.serialNumber
              ),
              this.serialNumberManagementService.getBlockRange(
                row.serialNumber
              ).start,
              this.serialNumberManagementService.getBlockRange(
                row.serialNumber
              ).end,
              this.serialNumberManagementService.getVintage(row.serialNumber)
            )
          : null;
      // serialNumber is dropped from the response: it is the internal,
      // placeholder-prefixed registry serial (CA0NNN-...) that itmoSerial
      // supersedes for this table, and no client consumes it. It stays on
      // the view because the derivation above needs it.
      const { serialNumber, ...rest } = row;
      return { ...rest, caReferenceNumber, itmoSerial };
    });
  }

  public async queryIssuances(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    const page = query.page || 1;
    const size = query.size || 10;
    query.page = page;
    query.size = size;
    // DNA and Independent Certifiers see every issuance; Project Developers
    // are scoped to their own org.
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      const onlyOwn: FilterEntry = {
        key: "organizationId",
        value: user.companyId,
        operation: "=",
      };
      query.filterAnd
        ? query.filterAnd.push(onlyOwn)
        : (query.filterAnd = [onlyOwn]);
    }
    // queryIssuances has no real vintage column - the Issuance page's
    // vintage filter is sent as a "vintageRange" pseudo-entry
    // (generateWhereSQL has no special handling for it) and translated
    // into a predicate against the serial's trailing segment instead, the
    // same pattern queryExplorer uses for "serialColumns".
    const vintagePredicate = this.extractVintageRangePredicate(query);
    const baseWhere = this.helperService.generateWhereSQL(
      query,
      abilityCondition
    );
    const qb = this.creditBlockIssuancesViewEntityRepository.createQueryBuilder(
      "creditTx"
    );
    if (baseWhere) {
      qb.where(baseWhere);
      if (vintagePredicate) {
        qb.andWhere(vintagePredicate.sql, vintagePredicate.params);
      }
    } else if (vintagePredicate) {
      qb.where(vintagePredicate.sql, vintagePredicate.params);
    }
    const nulls =
      query?.sort?.nullFirst !== undefined
        ? query?.sort?.nullFirst === true
          ? "NULLS FIRST"
          : "NULLS LAST"
        : undefined;
    if (query?.sort?.key === "serialNumber") {
      // Same fix as queryExplorer: "serialNumber" is a single formatted
      // string (CA0NNN-NG-XX-{projectId}-{blockStart}-{blockEnd}-{vintage}),
      // so a plain text ORDER BY sorts it lexicographically. Sort by its
      // numeric project ID and block start instead.
      qb.orderBy(
        this.serialProjectIdNumericExpr("creditTx"),
        query.sort.order,
        nulls
      ).addOrderBy(
        this.serialRangeStartExpr("creditTx"),
        query.sort.order,
        nulls
      );
    } else {
      qb.orderBy(
        query?.sort?.key && `"${query?.sort?.key}"`,
        query?.sort?.order,
        nulls
      );
    }
    const resp = await qb
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  // All credit interactions (issued / received / transferred / retired) for a
  // single organization, one paginated list keyed on the org's perspective.
  // DNA and Independent Certifiers may query any organization; a Project
  // Developer is scoped to their own company regardless of the organizationId
  // sent (mirrors queryIssuances' own-org injection).
  public async queryOrgCreditBlocks(
    query: OrgCreditBlocksRequestDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    const page = query.page || 1;
    const size = query.size || 10;
    query.page = page;
    query.size = size;

    let organizationId = query.organizationId;
    if (user.companyRole == CompanyRole.PROJECT_DEVELOPER) {
      organizationId = user.companyId;
    }

    const orgFilter: FilterEntry = {
      key: "organizationId",
      value: organizationId,
      operation: "=",
    };
    query.filterAnd
      ? query.filterAnd.push(orgFilter)
      : (query.filterAnd = [orgFilter]);

    const qb = this.creditBlockOrgTransactionsViewEntityRepository
      .createQueryBuilder("orgTx")
      .where(this.helperService.generateWhereSQL(query, abilityCondition));
    const order = query?.sort?.order ?? "DESC";
    const nulls =
      query?.sort?.nullFirst !== undefined
        ? query?.sort?.nullFirst === true
          ? "NULLS FIRST"
          : "NULLS LAST"
        : undefined;
    if (query?.sort?.key === "serialNumber") {
      // Same fix as queryExplorer/queryIssuances: "serialNumber" is a
      // single formatted string
      // (CA0NNN-NG-XX-{projectId}-{blockStart}-{blockEnd}-{vintage}), so a
      // plain text ORDER BY sorts it lexicographically. Sort by its
      // numeric project ID and block start instead.
      qb.orderBy(
        this.serialProjectIdNumericExpr("orgTx"),
        order,
        nulls
      ).addOrderBy(this.serialRangeStartExpr("orgTx"), order, nulls);
    } else {
      qb.orderBy(
        query?.sort?.key ? `"${query?.sort?.key}"` : `"updatedDate"`,
        order,
        nulls
      );
    }
    const resp = await qb
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    const rows = resp.length > 0 ? resp[0] : [];
    const total = resp.length > 1 ? resp[1] : undefined;
    const enrichedRows = await this.enrichOrgTransactionRowsWithItmoSerial(
      rows
    );
    return new DataListResponseDto(enrichedRows, total);
  }

  /**
   * Org transactions enrichment: attach the ITMO serial for rows whose
   * units are ITMOs (itmoAuthorizationRecord set by the view's join to
   * credit_blocks_entity).
   *
   * As in enrichItmoAuthorizationRows, the serial is deliberately NOT
   * joined from credit_blocks_entity - that block row keeps getting
   * re-split by later retirements/transfers, so a live join drifts away
   * from the range the row's own action actually covered (an
   * authorization of 2417-3916 whose block has since narrowed to
   * 2417-2906 would render the wrong serial). The view's serialNumber
   * comes from the transaction, which is stamped once on completion -
   * re-pointed at the resulting child block on a partial split - and
   * never touched again, so recomputing from it reproduces the real
   * value exactly. getItmoSerial's only non-serial input is the
   * cooperative approach's reference number, reached from the block's
   * authorization record.
   */
  private async enrichOrgTransactionRowsWithItmoSerial(
    rows: CreditBlockOrgTransactionsViewEntity[]
  ): Promise<
    Array<CreditBlockOrgTransactionsViewEntity & { itmoSerial: string | null }>
  > {
    const authorizationRecordIds = Array.from(
      new Set(
        rows
          .map((row) => row.itmoAuthorizationRecord)
          .filter((id): id is string => !!id)
      )
    );
    // The common all-MO page short-circuits without touching the DB again.
    if (authorizationRecordIds.length === 0) {
      return rows.map((row) => ({ ...row, itmoSerial: null }));
    }

    const authorizations = await this.creditTransactionsEntityRepository.find({
      where: { id: In(authorizationRecordIds) },
    });
    const caIdByAuthId = new Map<string, string>();
    for (const authorization of authorizations) {
      const caId = (authorization.data as ItmoAuthorizationData)
        ?.cooperativeApproachId;
      if (caId) {
        caIdByAuthId.set(authorization.id, caId);
      }
    }
    const cooperativeApproachIds = Array.from(
      new Set(Array.from(caIdByAuthId.values()))
    );
    const cooperativeApproaches = cooperativeApproachIds.length
      ? await this.cooperativeApproachRepo.find({
          where: { cooperativeApproachId: In(cooperativeApproachIds) },
        })
      : [];
    const caReferenceById = new Map(
      cooperativeApproaches.map((ca) => [
        ca.cooperativeApproachId,
        ca.caReferenceNumber,
      ])
    );

    return rows.map((row) => {
      const caId = row.itmoAuthorizationRecord
        ? caIdByAuthId.get(row.itmoAuthorizationRecord)
        : undefined;
      const caReferenceNumber = caId ? caReferenceById.get(caId) : undefined;
      if (!caReferenceNumber) {
        // MO row, or an authorization whose CA reference can't be
        // resolved - degrade to null rather than a half-built serial.
        return { ...row, itmoSerial: null };
      }
      const range = this.serialNumberManagementService.getBlockRange(
        row.serialNumber
      );
      return {
        ...row,
        itmoSerial: this.serialNumberManagementService.getItmoSerial(
          caReferenceNumber,
          this.serialNumberManagementService.getProjectIdFromSerial(
            row.serialNumber
          ),
          range.start,
          range.end,
          this.serialNumberManagementService.getVintage(row.serialNumber)
        ),
      };
    });
  }

  public async queryExplorer(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    const page = query.page || 1;
    const size = query.size || 10;
    query.page = page;
    query.size = size;
    // Credits -> Explorer is a DNA-only, registry-wide browse of every
    // credit block (including retired ones). Unlike queryCreditBalances /
    // queryTransfers / queryRetirements, no other company role gets a
    // scoped view here.
    if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.unauthorized",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    // The Explorer search box is sent as a single filterAnd entry keyed
    // "serialColumns" whose operation is meaningless (generateWhereSQL
    // would turn it into invalid SQL) - pull it out and translate it into
    // its own predicate before the generic filter machinery runs.
    const serialPredicate = this.extractSerialSearchPredicate(query);
    const baseWhere = this.helperService.generateWhereSQL(
      query,
      abilityCondition
    );
    const qb =
      this.creditBlockExplorerViewEntityRepository.createQueryBuilder(
        "creditBlock"
      );
    if (baseWhere) {
      qb.where(baseWhere);
      if (serialPredicate) {
        qb.andWhere(serialPredicate.sql, serialPredicate.params);
      }
    } else if (serialPredicate) {
      qb.where(serialPredicate.sql, serialPredicate.params);
    }
    const nulls =
      query?.sort?.nullFirst !== undefined
        ? query?.sort?.nullFirst === true
          ? "NULLS FIRST"
          : "NULLS LAST"
        : undefined;
    if (query?.sort?.key === "serialNumber") {
      // "serialNumber" is a single formatted string
      // (CA0NNN-NG-XX-{projectId}-{blockStart}-{blockEnd}-{vintage}), so a
      // plain text ORDER BY sorts it lexicographically (e.g. "26" ends up
      // after "252"). Sort by its numeric segments instead, in the same
      // left-to-right order they appear in the visible serial number.
      qb.orderBy(this.serialProjectIdNumericExpr(), query.sort.order, nulls)
        .addOrderBy(this.serialRangeStartExpr(), query.sort.order, nulls);
    } else {
      qb.orderBy(
        query?.sort?.key && `"${query?.sort?.key}"`,
        query?.sort?.order,
        nulls
      );
    }
    const resp = await qb
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    const rows = resp.length > 0 ? resp[0] : [];
    const total = resp.length > 1 ? resp[1] : undefined;
    if (!rows || rows.length === 0) {
      return new DataListResponseDto(rows, total);
    }
    const enrichedRows =
      await this.enrichExplorerRowsWithFirstTransferCountry(rows);
    return new DataListResponseDto(enrichedRows, total);
  }

  /**
   * Explorer enrichment: attach each row's first-transfer acquiring
   * country (Article 6's "first transfer" is a defined term - an ITMO
   * crossing to another Party - not a domestic org-to-org transfer).
   *
   * `CreditTransactionsEntity.isFirstTransfer` is stamped true on exactly
   * the completed RETIRE row that performed this (see
   * `handleTransactionRecords`'s TxType.RETIRE branch), for ITMO blocks
   * retired under FIRST_TRANSFER_TOWARDS_NDC / FIRST_TRANSFER_FOR_OIMP,
   * and that same row's `data` (RetirementUseData) already carries the
   * resolved acquiring Party as an alpha-2 code - so this is a single
   * indexed lookup keyed by creditBlockId, not a lineage walk. A
   * first-transferred block is terminal (ownerCompanyId 0) and can only
   * be retired once, so creditBlockId alone is an exact match: no range/
   * vintage containment logic needed, unlike the history-tree
   * reconstruction (getCreditBlockHistoryTree) which has to walk splits
   * because non-terminal blocks keep narrowing.
   */
  private async enrichExplorerRowsWithFirstTransferCountry(
    rows: CreditBlockExplorerViewEntity[]
  ): Promise<Array<CreditBlockExplorerViewEntity & { firstTransfer: string | null }>> {
    const blockIds = rows.map((r) => r.id);
    const firstTransferTransactions =
      await this.creditTransactionsEntityRepository.find({
        where: { creditBlockId: In(blockIds), isFirstTransfer: true },
      });
    const countryByBlockId = new Map<string, string>();
    for (const tx of firstTransferTransactions) {
      const country = (tx.data as RetirementUseData)?.country;
      if (country) {
        countryByBlockId.set(tx.creditBlockId, country);
      }
    }
    return rows.map((row) => ({
      ...row,
      firstTransfer: countryByBlockId.get(row.id) ?? null,
    }));
  }

  // ---------------------------------------------------------------------
  // Credit block history tree - the Explorer drill-down
  //
  // Reconstructs a credit block's full lineage - from initial issuance,
  // through every partial transfer/retirement that split it, down to its
  // current leaves - as a flat list of nodes the UI graph renders. See
  // explorer-serial-search-examples.md's sibling doc-comment style: a
  // block serial range shrinks every time part of it is transferred or
  // retired, taking the amount off the TOP of the range
  // (SerialNumberManagementService.splitCreditBlockSerialNumber). The
  // retained/low portion keeps its original creditBlockId (its range
  // start never changes); the transferred/retired high portion becomes a
  // brand-new block with a new creditBlockId. The operational DB only
  // keeps each block's *current* row, so intermediate ranges are gone by
  // the time a block has been split more than once - the reconstruction
  // therefore reads every version from the append-only ledger instead
  // (ProgrammeLedgerService.getCreditBlockLedgerHistory).
  // ---------------------------------------------------------------------

  // Unlike queryExplorer, open to any authenticated user - it's also the
  // drill-down for the Issuance page (DNA/PD/IC), not just Explorer (DNA-only).
  public async getCreditBlockHistoryTree(
    creditBlockHistoryRequestDto: CreditBlockHistoryRequestDto
  ): Promise<DataResponseDto> {
    const queriedBlock = await this.creditBlocksEntityRepository.findOne({
      where: { creditBlockId: creditBlockHistoryRequestDto.blockId },
    });
    if (!queriedBlock) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.creditBlockNotExists",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const ledgerVersions =
      await this.programmeLedgerService.getCreditBlockLedgerHistory(
        queriedBlock.projectRefId
      );
    const groups = this.groupCreditBlockLedgerVersions(ledgerVersions);

    const queriedRange = this.serialNumberManagementService.getBlockRange(
      queriedBlock.serialNumber
    );
    const rootVersions = this.findCreditBlockHistoryRoot(
      groups,
      queriedRange,
      queriedBlock.vintage
    );
    if (!rootVersions) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditTransaction.creditBlockNotExists",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const ownerCompanyIds = new Set<number>();
    // Both extra lookups below hang off fields that only ITMO/retired
    // blocks carry, so they stay empty (and skip their query) for a
    // lineage that never involved either.
    const authorizationRecordIds = new Set<string>();
    const retiredBlockIds = new Set<string>();
    for (const versions of groups.values()) {
      for (const v of versions) {
        if (v.ownerCompanyId) {
          ownerCompanyIds.add(v.ownerCompanyId);
        }
        // A RETIRE action attributes to the retiring company
        // (previousOwnerCompanyId), not the resulting owner (always 0) -
        // make sure its name is resolved too.
        if (v.previousOwnerCompanyId) {
          ownerCompanyIds.add(v.previousOwnerCompanyId);
        }
        if (v.txType === TxType.ITMO_AUTH && v.itmoAuthorizationRecord) {
          authorizationRecordIds.add(v.itmoAuthorizationRecord);
        }
        if (v.ownerCompanyId === 0) {
          retiredBlockIds.add(v.creditBlockId);
        }
      }
    }
    const [ownerNames, authorizationPurposes, retireSubTypes] =
      await Promise.all([
        this.resolveCompanyNames(ownerCompanyIds),
        this.resolveItmoAuthorizationPurposes(authorizationRecordIds),
        this.resolveRetireSubTypes(retiredBlockIds),
      ]);

    const history = this.buildCreditBlockHistoryTree(
      groups,
      rootVersions,
      ownerNames,
      authorizationPurposes,
      retireSubTypes
    );
    return new DataResponseDto(HttpStatus.OK, { history });
  }

  private groupCreditBlockLedgerVersions(
    ledgerVersions: CreditBlocksEntity[]
  ): Map<string, CreditBlockLedgerVersion[]> {
    const groups = new Map<string, CreditBlockLedgerVersion[]>();
    for (const version of ledgerVersions || []) {
      const range = this.serialNumberManagementService.getBlockRange(
        version.serialNumber
      );
      if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) {
        // Legacy/malformed serial - can't place it in the range-based
        // tree, so it's excluded rather than throwing.
        continue;
      }
      const parsed: CreditBlockLedgerVersion = {
        creditBlockId: version.creditBlockId,
        range,
        txType: version.txType,
        txTime: Number(version.txTime),
        ownerCompanyId: Number(version.ownerCompanyId),
        previousOwnerCompanyId:
          version.previousOwnerCompanyId != null
            ? Number(version.previousOwnerCompanyId)
            : undefined,
        creditAmount: version.creditAmount,
        vintage: version.vintage,
        itmoSerial: version.itmoSerial,
        itmoAuthorizationRecord: version.itmoAuthorizationRecord,
      };
      if (!groups.has(parsed.creditBlockId)) {
        groups.set(parsed.creditBlockId, []);
      }
      groups.get(parsed.creditBlockId).push(parsed);
    }
    return groups;
  }

  /**
   * The root of the tree is the ISSUE version whose range contains the
   * queried block's current range within the same vintage - regardless
   * of how many splits deep the queried block is, since issuance batches
   * within a project/vintage are contiguous and non-overlapping.
   */
  private findCreditBlockHistoryRoot(
    groups: Map<string, CreditBlockLedgerVersion[]>,
    queriedRange: { start: number; end: number },
    vintage: string
  ): CreditBlockLedgerVersion[] | undefined {
    for (const versions of groups.values()) {
      const first = versions[0];
      if (
        first.txType === TxType.ISSUE &&
        first.previousOwnerCompanyId == null &&
        first.vintage === vintage &&
        first.range.start <= queriedRange.start &&
        first.range.end >= queriedRange.end
      ) {
        return versions;
      }
    }
    return undefined;
  }

  private async resolveCompanies(
    companyIds: Set<number>
  ): Promise<Map<number, Company>> {
    const companies = new Map<number, Company>();
    await Promise.all(
      Array.from(companyIds).map(async (id) => {
        const company = await this.companyService.findByCompanyId(id);
        if (company) {
          companies.set(id, company);
        }
      })
    );
    return companies;
  }

  private async resolveCompanyNames(
    companyIds: Set<number>
  ): Promise<Map<number, string>> {
    const companies = await this.resolveCompanies(companyIds);
    const names = new Map<number, string>();
    for (const [id, company] of companies) {
      names.set(id, company.name);
    }
    return names;
  }

  /**
   * The authorization purpose behind each ITMO_AUTH action, keyed by the
   * block's itmoAuthorizationRecord - which is the id of the
   * ITMO_AUTHORIZED CreditTransactionsEntity that authorized it. The
   * purpose lives on that transaction's `data`, not on the block, so it
   * has to be looked up; batched here rather than per node.
   */
  private async resolveItmoAuthorizationPurposes(
    authorizationRecordIds: Set<string>
  ): Promise<Map<string, string>> {
    const purposes = new Map<string, string>();
    if (authorizationRecordIds.size === 0) {
      return purposes;
    }
    const transactions = await this.creditTransactionsEntityRepository.find({
      where: { id: In(Array.from(authorizationRecordIds)) },
    });
    for (const transaction of transactions) {
      const purpose = (transaction.data as any)?.authorizationPurpose;
      if (purpose) {
        purposes.set(transaction.id, purpose);
      }
    }
    return purposes;
  }

  /**
   * The retirement subType (which Article 6 use the credits were retired
   * for) of each retired block, keyed by creditBlockId. On completion the
   * retiring transaction is re-pointed at the block that actually ended up
   * retired - the newly split-off child for a partial retirement, or the
   * block itself for a whole-block one - and a block can only be retired
   * once, so creditBlockId is a unique key here.
   */
  private async resolveRetireSubTypes(
    retiredBlockIds: Set<string>
  ): Promise<Map<string, string>> {
    const subTypes = new Map<string, string>();
    if (retiredBlockIds.size === 0) {
      return subTypes;
    }
    const transactions = await this.creditTransactionsEntityRepository.find({
      where: {
        creditBlockId: In(Array.from(retiredBlockIds)),
        type: CreditTransactionTypesEnum.RETIRED,
        status: CreditTransactionStatusEnum.COMPLETED,
      },
    });
    for (const transaction of transactions) {
      if (transaction.subType) {
        subTypes.set(transaction.creditBlockId, transaction.subType);
      }
    }
    return subTypes;
  }

  private formatCreditBlockRange(range: {
    start: number;
    end: number;
  }): string {
    return `${range.start}-${range.end}`;
  }

  /**
   * The structured action info for a version that took ownership of
   * `range` - shared between a split's "high" child (a brand-new block
   * created by the split) and a whole-block transition (same block, no
   * split, ownership just moved). `ownerCompanyId === 0` is the
   * authoritative "this is a retirement" signal - unlike txType, which a
   * rejected/cancelled retire request also sets to RETIRE without
   * anything actually retiring (see ProgrammeLedgerService.
   * retirementRequestAction's REJECT/CANCEL branch), so it can't be used
   * alone to tell a real retirement apart from a rejected one. For a
   * RETIRE, companyId/companyName identify the *retiring* company
   * (previousOwnerCompanyId) rather than the resulting owner (always 0).
   *
   * ITMO_AUTH sits between the two: it is the only action that leaves
   * ownership untouched (the block just becomes an ITMO), so it would
   * otherwise fall through to TRANSFER and read as a transfer to the
   * company that already owned it. Checking it *after* the retirement
   * test keeps that invariant intact - an ITMO block later retires with
   * ownerCompanyId 0, and that is a RETIRE, not an authorization.
   */
  private buildCreditBlockActionInfo(
    range: { start: number; end: number },
    version: CreditBlockLedgerVersion,
    ownerName: (companyId?: number) => string,
    authorizationPurposes: Map<string, string>,
    retireSubTypes: Map<string, string>
  ): CreditBlockHistoryActionInfo {
    const amount = range.end - range.start + 1;
    const timestamp = version.txTime;
    const itmo = this.buildCreditBlockItmoInfo(version);
    if (version.ownerCompanyId === 0) {
      const retiringCompanyId = version.previousOwnerCompanyId ?? null;
      return {
        companyId: retiringCompanyId,
        companyName: retiringCompanyId ? ownerName(retiringCompanyId) : null,
        timestamp,
        amount,
        action: "RETIRE",
        ...itmo,
        retireSubType: retireSubTypes.get(version.creditBlockId) ?? null,
      };
    }
    if (version.txType === TxType.ITMO_AUTH) {
      return {
        companyId: version.ownerCompanyId,
        companyName: ownerName(version.ownerCompanyId),
        timestamp,
        amount,
        action: "ITMO_AUTH",
        ...itmo,
        authorizationPurpose: version.itmoAuthorizationRecord
          ? authorizationPurposes.get(version.itmoAuthorizationRecord) ?? null
          : null,
      };
    }
    return {
      companyId: version.ownerCompanyId,
      companyName: ownerName(version.ownerCompanyId),
      timestamp,
      amount,
      action: "TRANSFER",
      ...itmo,
    };
  }

  /**
   * The MO/ITMO character of one ledger version, shared by every action
   * (a retirement or transfer of authorized credits is still ITMO). The
   * itmoSerial is taken from the version itself rather than from the
   * block's current row, which keeps narrowing as the block is re-split -
   * each version's own serial covers exactly that version's range.
   */
  private buildCreditBlockItmoInfo(
    version: CreditBlockLedgerVersion
  ): Pick<CreditBlockHistoryActionInfo, "isItmo" | "itmoSerial"> {
    return {
      isItmo: version.itmoAuthorizationRecord != null,
      itmoSerial: version.itmoSerial ?? null,
    };
  }

  /**
   * Depth-first, ancestor-before-descendant reconstruction. For a given
   * block's own version history, every consecutive pair of versions is
   * one of:
   *  - a split (same start, smaller end): the retained "low" portion
   *    continues within the same creditBlockId group; the "high" portion
   *    sheared off the top becomes a brand-new block, looked up by its
   *    own group's first version matching (start, txTime, vintage).
   *  - a whole-block transition (same range, ownerCompanyId changed): the
   *    entire remaining balance was transferred or retired in one action,
   *    so the block keeps its creditBlockId and range - no new group to
   *    recurse into, just a single-child node recording the new owner.
   *  - neither (e.g. a pending retire request, or one that was rejected/
   *    cancelled - reservedCreditAmount/transactionRecords/txType may
   *    change but ownerCompanyId doesn't): no node, silently skipped.
   * Per the sample payload ordering, a group's own chain of splits and
   * transitions is listed in full, in chronological order, before
   * descending into any child branch created by a split along the way.
   */
  private buildCreditBlockHistoryTree(
    groups: Map<string, CreditBlockLedgerVersion[]>,
    rootVersions: CreditBlockLedgerVersion[],
    ownerNames: Map<number, string>,
    authorizationPurposes: Map<string, string>,
    retireSubTypes: Map<string, string>
  ): CreditBlockHistoryNode[] {
    const history: CreditBlockHistoryNode[] = [];

    // Index every non-issuance group by the (vintage, start, txTime) of
    // its first version, i.e. the split event that created it as a "high"
    // child - so a shrink can look up the sibling it produced. Every group
    // is split-produced *except* an issuance root (no previousOwnerCompanyId
    // and txType ISSUE) - checking previousOwnerCompanyId alone used to
    // miss ITMO-authorization splits, whose child inherits the parent's
    // previousOwnerCompanyId (null for a never-transferred parent) since
    // authorization doesn't change ownership. That silently orphaned the
    // child's entire subtree - see credit-block-history-tree-examples.md.
    const childIndex = new Map<string, CreditBlockLedgerVersion[]>();
    for (const versions of groups.values()) {
      const first = versions[0];
      const isIssuanceRoot =
        first.txType === TxType.ISSUE && first.previousOwnerCompanyId == null;
      if (!isIssuanceRoot) {
        childIndex.set(
          `${first.vintage}#${first.range.start}#${first.txTime}`,
          versions
        );
      }
    }

    const ownerName = (companyId?: number): string =>
      companyId ? ownerNames.get(companyId) ?? `Company ${companyId}` : "";
    const buildInfo = (
      range: { start: number; end: number },
      version: CreditBlockLedgerVersion
    ) =>
      this.buildCreditBlockActionInfo(
        range,
        version,
        ownerName,
        authorizationPurposes,
        retireSubTypes
      );

    const rootFirst = rootVersions[0];
    history.push({
      range: this.formatCreditBlockRange(rootFirst.range),
      info: {
        companyId: rootFirst.ownerCompanyId,
        companyName: ownerName(rootFirst.ownerCompanyId),
        timestamp: rootFirst.txTime,
        amount: rootFirst.creditAmount,
        action: "ISSUE",
        ...this.buildCreditBlockItmoInfo(rootFirst),
      },
      children: [],
    });

    const visit = (versions: CreditBlockLedgerVersion[]) => {
      const pendingChildBranches: CreditBlockLedgerVersion[][] = [];
      for (let i = 0; i + 1 < versions.length; i++) {
        const before = versions[i];
        const after = versions[i + 1];
        const isSplit =
          after.range.start === before.range.start &&
          after.range.end < before.range.end;

        if (isSplit) {
          const lowRange = after.range;
          const highRange = {
            start: after.range.end + 1,
            end: before.range.end,
          };
          const highVersions = childIndex.get(
            `${after.vintage}#${highRange.start}#${after.txTime}`
          );

          const lowChild: CreditBlockHistoryChildNode = {
            range: this.formatCreditBlockRange(lowRange),
            info: {
              companyId: after.ownerCompanyId,
              companyName: ownerName(after.ownerCompanyId),
              timestamp: after.txTime,
              amount: lowRange.end - lowRange.start + 1,
              action: "RETAIN",
              ...this.buildCreditBlockItmoInfo(after),
            },
          };
          let highChild: CreditBlockHistoryChildNode;
          if (highVersions) {
            const highFirst = highVersions[0];
            highChild = {
              range: this.formatCreditBlockRange(highRange),
              info: buildInfo(highRange, highFirst),
            };
            pendingChildBranches.push(highVersions);
          } else {
            // No matching child group in the ledger for this shrink - keep
            // the tree structurally valid rather than throwing. `after`
            // is the best available data for what happened here, since
            // there's no separate highFirst version to draw from.
            highChild = {
              range: this.formatCreditBlockRange(highRange),
              info: buildInfo(highRange, after),
            };
          }

          history.push({
            range: this.formatCreditBlockRange(before.range),
            children: [lowChild, highChild],
          });
          continue;
        }

        // Whole-block transition: the entire remaining balance was
        // transferred or retired in one action, so the block kept its
        // creditBlockId and range - no new group to recurse into, just a
        // single-child node recording the new owner.
        const isWholeBlockTransition =
          after.range.start === before.range.start &&
          after.range.end === before.range.end &&
          after.ownerCompanyId !== before.ownerCompanyId;
        // Whole-block ITMO authorization: same range, ownership unchanged,
        // so it can't be told apart from a no-op via ownerCompanyId - the
        // itmoAuthorizationRecord going from unset to set is the only
        // signal a real authorization actually happened here (txType alone
        // isn't enough: a rejected/cancelled request also writes
        // ITMO_AUTH, see ProgrammeLedgerService.itmoAuthRequestAction's
        // REJECT/CANCEL branch).
        const isWholeBlockItmoAuth =
          after.range.start === before.range.start &&
          after.range.end === before.range.end &&
          before.itmoAuthorizationRecord == null &&
          after.itmoAuthorizationRecord != null;
        // Anything else with an unchanged range (a pending retire/ITMO-auth
        // request, or one that was rejected/cancelled) leaves both
        // ownerCompanyId and itmoAuthorizationRecord untouched and is
        // silently skipped here.
        if (!isWholeBlockTransition && !isWholeBlockItmoAuth) {
          continue;
        }

        const transitionChild: CreditBlockHistoryChildNode = {
          range: this.formatCreditBlockRange(after.range),
          info: buildInfo(after.range, after),
        };
        history.push({
          range: this.formatCreditBlockRange(after.range),
          children: [transitionChild],
        });
      }
      for (const branch of pendingChildBranches) {
        visit(branch);
      }
    };

    visit(rootVersions);
    return history;
  }

  // ---------------------------------------------------------------------
  // Explorer serial-number search
  //
  // A block serial is 7 "-"-separated parts (see
  // serial-number-management.service.ts): creditId-country-
  // firstTransferParty-projectId-rangeStart-rangeEnd-vintage, e.g.
  // "CA0NNN-NG-XX-32-3001-4000-2023". The Explorer search box lets a user
  // type any fragment of that - a full serial, a full/partial unit range,
  // or a bare unit number - and expects it resolved against the numeric
  // components (range/vintage/projectId) rather than a literal substring
  // match, since the numbers shift position depending on how much of the
  // serial was typed.
  // ---------------------------------------------------------------------

  /**
   * Strip the "serialColumns" filterAnd entry (if present) out of the
   * query in place - generateWhereSQL has no special handling for it and
   * would otherwise emit malformed SQL - and translate its value into a
   * standalone predicate for the caller to AND in separately.
   */
  private extractSerialSearchPredicate(
    query: QueryDto
  ): { sql: string; params: Record<string, any> } | null {
    if (!query.filterAnd || query.filterAnd.length === 0) {
      return null;
    }
    const serialEntries = query.filterAnd.filter(
      (e) => e.key === "serialColumns"
    );
    query.filterAnd = query.filterAnd.filter(
      (e) => e.key !== "serialColumns"
    );
    const searchValue = serialEntries
      .map((e) => e.value)
      .find((v) => v !== undefined && v !== null && String(v).trim() !== "");
    if (searchValue === undefined) {
      return null;
    }
    return this.buildSerialSearchPredicate(String(searchValue));
  }

  /**
   * Strip the "vintageRange" filterAnd entry (if present) out of the query
   * in place and translate its {from, to} value into a standalone
   * predicate against the issuance row's serial number - queryIssuances
   * has no real vintage column, so this matches positionally against the
   * serial's trailing (7th) "-"-separated segment instead, the same
   * split_part() convention the Explorer's serial search uses for vintage.
   */
  private extractVintageRangePredicate(
    query: QueryDto
  ): { sql: string; params: Record<string, any> } | null {
    if (!query.filterAnd || query.filterAnd.length === 0) {
      return null;
    }
    const entry = query.filterAnd.find((e) => e.key === "vintageRange");
    query.filterAnd = query.filterAnd.filter((e) => e.key !== "vintageRange");
    const from = Number(entry?.value?.from);
    const to = Number(entry?.value?.to);
    if (!entry || !Number.isFinite(from) || !Number.isFinite(to)) {
      return null;
    }
    const vintageExpr = `split_part("creditTx"."serialNumber", '-', 7)`;
    return {
      sql: `${vintageExpr} ~ '^[0-9]+$' AND ${vintageExpr}::int BETWEEN :vintageFrom AND :vintageTo`,
      params: {
        vintageFrom: Math.min(from, to),
        vintageTo: Math.max(from, to),
      },
    };
  }

  /**
   * Translate one search-box value into a parameterized SQL predicate
   * against the "creditBlock" alias. There are two interpretations,
   * depending on the shape of the "-"-separated parts:
   *
   *  - "prefix" shape - one or more leading text parts immediately
   *    followed by one or more numeric parts, and no text part after a
   *    number (e.g. a serial typed from its start, "CA0NNN-NG-XX-32-3001",
   *    including a full 7-part serial). Delegates to
   *    `buildSerialPrefixPredicate`, which maps every part onto its fixed
   *    serial section left-to-right (creditId, country,
   *    firstTransferParty, projectId, rangeStart, rangeEnd, vintage)
   *    instead of interpreting the numbers positionally from the right.
   *  - anything else (numbers only, text only, or a text part following a
   *    number) - the original "fragment" shape, handled inline below:
   *     - non-numeric parts are ILIKE'd against the full serial string.
   *     - numeric parts are interpreted positionally from the right:
   *       1 number -> the unit the block's range must contain;
   *       2 numbers -> the range's [lo, hi] boundaries, taken in the order
   *         given (first number is lo, second is hi) - NOT reordered by
   *         magnitude, so an inverted pair (lo > hi) is treated as an
   *         invalid range and matches nothing;
   *       3+ numbers -> the same positional range (the two before the
   *         last) plus the last number ILIKE-matched against the vintage
   *         component;
   *       4+ numbers -> additionally the number before those three
   *         ILIKE-matched against the projectId component;
   *       any further leftover numbers are ILIKE-matched only against the
   *       serial's "creditId-country-firstTransferParty" head, since
   *       that's the only part of the serial without a defined numeric
   *       slot.
   * Range containment/overlap uses split_part() with a numeric guard so a
   * legacy/malformed serial (non-numeric range parts) is excluded rather
   * than throwing on cast.
   */
  private buildSerialSearchPredicate(
    value: string
  ): { sql: string; params: Record<string, any> } | null {
    const parts = value
      .trim()
      .split("-")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length === 0) {
      return null;
    }
    const numericParts: number[] = [];
    const textParts: string[] = [];
    for (const part of parts) {
      if (/^\d+$/.test(part)) {
        numericParts.push(Number(part));
      } else {
        textParts.push(part);
      }
    }

    if (this.isSerialPrefixShape(parts)) {
      return this.buildSerialPrefixPredicate(textParts, numericParts);
    }

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    textParts.forEach((text, idx) => {
      const paramKey = `serialTxt${idx}`;
      params[paramKey] = `%${text}%`;
      conditions.push(`"creditBlock"."serialNumber" ILIKE :${paramKey}`);
    });

    const n = numericParts.length;
    if (n === 1) {
      conditions.push(
        this.serialRangeConditionSQL(numericParts[0], numericParts[0], params)
      );
    } else if (n === 2) {
      conditions.push(
        this.serialRangeConditionSQL(numericParts[0], numericParts[1], params)
      );
    } else if (n >= 3) {
      conditions.push(
        this.serialRangeConditionSQL(
          numericParts[n - 3],
          numericParts[n - 2],
          params
        )
      );

      params.serialVint = `%${numericParts[n - 1]}%`;
      conditions.push(`${this.serialVintageExpr()} ILIKE :serialVint`);

      const consumed = n >= 4 ? 4 : 3;
      if (n >= 4) {
        params.serialPid = `%${numericParts[n - 4]}%`;
        conditions.push(`${this.serialProjectIdExpr()} ILIKE :serialPid`);
      }
      // Any numeric parts beyond the 4 known components (projectId,
      // rangeStart, rangeEnd, vintage) don't map to a known numeric slot.
      // The only remaining part of the serial is the
      // creditId-country-firstTransferParty head, so match against that
      // only - not the whole serial (which would also re-match the
      // range/vintage/projectId digits already accounted for above).
      numericParts.slice(0, n - consumed).forEach((num, idx) => {
        const paramKey = `serialNum${idx}`;
        params[paramKey] = `%${num}%`;
        conditions.push(`${this.serialPrefixExpr()} ILIKE :${paramKey}`);
      });
    }

    if (conditions.length === 0) {
      return null;
    }
    return { sql: `(${conditions.join(" AND ")})`, params };
  }

  /**
   * True when `parts` is shaped as one or more leading non-numeric parts
   * immediately followed by one or more numeric parts, with no non-numeric
   * part appearing after a numeric one - e.g. a serial (or any prefix of
   * one) typed from its start, "CA0NNN-NG-XX-32-3001". This is the trigger
   * for the left-anchored "prefix" interpretation in
   * `buildSerialPrefixPredicate`; anything else (numbers only, text only,
   * or a text part following a number) keeps the original right-anchored
   * "fragment" interpretation.
   */
  private isSerialPrefixShape(parts: string[]): boolean {
    let sawNumber = false;
    let sawText = false;
    for (const part of parts) {
      if (/^\d+$/.test(part)) {
        sawNumber = true;
      } else {
        sawText = true;
        if (sawNumber) {
          return false;
        }
      }
    }
    return sawText && sawNumber;
  }

  /**
   * Build the predicate for the "prefix" shape (see `isSerialPrefixShape`):
   * every part is mapped onto its fixed serial section, left-to-right -
   * textParts fill creditId/country/firstTransferParty, numericParts fill
   * projectId/rangeStart/rangeEnd/vintage:
   *  - 1 number -> projectId only (exact match).
   *  - 2 numbers -> projectId (exact) + the block's range must contain the
   *    2nd number (a rangeStart with no rangeEnd typed yet).
   *  - 3 numbers -> projectId (exact) + range overlap [2nd, 3rd] (no
   *    vintage typed yet).
   *  - 4 numbers -> projectId (exact) + range overlap [2nd, 3rd] + vintage
   *    (exact).
   *  - any further leftover numbers, or a 4th+ text part, don't map to a
   *    known section, so they're ILIKE-matched against the whole serial
   *    string instead of being dropped.
   * projectId/vintage use exact string equality (not ILIKE) against their
   * split_part() position - no numeric cast, so a legacy/malformed serial
   * is excluded rather than throwing. Range overlap reuses
   * `serialRangeConditionSQL`, which already guards non-numeric range
   * parts and treats an inverted pair as unsatisfiable.
   */
  private buildSerialPrefixPredicate(
    textParts: string[],
    numericParts: number[]
  ): { sql: string; params: Record<string, any> } | null {
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    const textExprs = [
      this.serialCreditIdExpr(),
      this.serialCountryExpr(),
      this.serialFtpExpr(),
    ];
    textParts.forEach((text, idx) => {
      const paramKey = `serialPfxTxt${idx}`;
      params[paramKey] = `%${text}%`;
      const expr = textExprs[idx] ?? `"creditBlock"."serialNumber"`;
      conditions.push(`${expr} ILIKE :${paramKey}`);
    });

    const n = numericParts.length;
    if (n >= 1) {
      params.serialPfxPid = String(numericParts[0]);
      conditions.push(`${this.serialProjectIdExpr()} = :serialPfxPid`);
    }
    if (n === 2) {
      conditions.push(
        this.serialRangeConditionSQL(numericParts[1], numericParts[1], params)
      );
    } else if (n >= 3) {
      conditions.push(
        this.serialRangeConditionSQL(
          numericParts[1],
          numericParts[2],
          params
        )
      );
    }
    if (n >= 4) {
      params.serialPfxVint = String(numericParts[3]);
      conditions.push(`${this.serialVintageExpr()} = :serialPfxVint`);
    }
    // Leftover numbers beyond the 4 known slots (projectId, rangeStart,
    // rangeEnd, vintage) don't map to a defined section.
    numericParts.slice(4).forEach((num, idx) => {
      const paramKey = `serialPfxNum${idx}`;
      params[paramKey] = `%${num}%`;
      conditions.push(`"creditBlock"."serialNumber" ILIKE :${paramKey}`);
    });

    if (conditions.length === 0) {
      return null;
    }
    return { sql: `(${conditions.join(" AND ")})`, params };
  }

  /**
   * credit_transactions_entity.id is a PrimaryColumn typed as `string`, but
   * its values are unpadded CounterService-generated integers ("1", "2",
   * ..., "10", ...), not a naturally sortable text ID - a plain text
   * ORDER BY puts "10" before "2". Cast it for numeric sort instead.
   */
  private idNumericExpr(alias: string): string {
    return `CASE WHEN "${alias}"."id" ~ '^[0-9]+$' THEN "${alias}"."id"::bigint END`;
  }

  /**
   * Build the range predicate for a positional [lo, hi] pair, registering
   * whatever params it needs into the shared `params` map. An inverted
   * pair (lo > hi) is not a valid range - per business rule, it must
   * match nothing - so it short-circuits to a literal FALSE instead of
   * silently reordering into [hi, lo].
   */
  private serialRangeConditionSQL(
    lo: number,
    hi: number,
    params: Record<string, any>
  ): string {
    if (lo > hi) {
      return "FALSE";
    }
    params.serialLo = lo;
    params.serialHi = hi;
    return `(${this.serialRangeStartExpr()} <= :serialHi AND ${this.serialRangeEndExpr()} >= :serialLo)`;
  }

  private serialRangeStartExpr(alias: string = "creditBlock"): string {
    return `CASE WHEN split_part("${alias}"."serialNumber", '-', 5) ~ '^[0-9]+$' THEN split_part("${alias}"."serialNumber", '-', 5)::int END`;
  }

  private serialRangeEndExpr(): string {
    return `CASE WHEN split_part("creditBlock"."serialNumber", '-', 6) ~ '^[0-9]+$' THEN split_part("creditBlock"."serialNumber", '-', 6)::int END`;
  }

  private serialVintageExpr(): string {
    return `split_part("creditBlock"."serialNumber", '-', 7)`;
  }

  private serialProjectIdExpr(): string {
    return `split_part("creditBlock"."serialNumber", '-', 4)`;
  }

  private serialProjectIdNumericExpr(alias: string = "creditBlock"): string {
    return `CASE WHEN split_part("${alias}"."serialNumber", '-', 4) ~ '^[0-9]+$' THEN split_part("${alias}"."serialNumber", '-', 4)::int END`;
  }

  private serialCreditIdExpr(): string {
    return `split_part("creditBlock"."serialNumber", '-', 1)`;
  }

  private serialCountryExpr(): string {
    return `split_part("creditBlock"."serialNumber", '-', 2)`;
  }

  private serialFtpExpr(): string {
    return `split_part("creditBlock"."serialNumber", '-', 3)`;
  }

  private serialPrefixExpr(): string {
    return `(split_part("creditBlock"."serialNumber", '-', 1) || '-' || split_part("creditBlock"."serialNumber", '-', 2) || '-' || split_part("creditBlock"."serialNumber", '-', 3))`;
  }
}
