import { Test, TestingModule } from '@nestjs/testing';
import { CadtApiService } from './cadt.api.service';
import { SectoralScope } from '@undp/serial-number-gen';
import { Sector } from '../enum/sector.enum';
import { ProgrammeStage } from '../enum/programme-status.enum';
import { TxType } from '../enum/txtype.enum';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../configuration';
import { Logger } from '@nestjs/common';
import { CompanyService } from '../company/company.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from '../entities/programme.entity';
import { Company } from '../entities/company.entity';
import { CompanyModule } from '../company/company.module';
import { TypeOrmConfigService } from '../typeorm.config.service';
import { UserModule } from '../user/user.module';
import { CaslModule } from '../casl/casl.module';
import { UtilModule } from '../util/util.module';
import { ProgrammeTransfer } from '../entities/programme.transfer';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { EmailHelperModule } from '../email-helper/email-helper.module';
import { FileHandlerModule } from '../file-handler/filehandler.module';
import { LocationModule } from '../location/location.module';
import { AsyncOperationsModule } from '../async-operations/async-operations.module';
import { GHGs } from '../enum/ghgs.enum';
import { RetireType } from '../enum/retire.type.enum';
import { TransferStatus } from '../enum/transform.status.enum';

describe('CadtApiService', () => {
  let service: CadtApiService;

  jest.useRealTimers();
  jest.setTimeout(30000);

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`]
        }),
        CompanyModule,
        TypeOrmModule.forFeature([Company, ProgrammeTransfer, Programme]),
        TypeOrmModule.forRootAsync({
          useClass: TypeOrmConfigService,
          imports: undefined
        }),
        UserModule,
        CaslModule,
        CompanyModule,
        UtilModule,
        ProgrammeLedgerModule,
        EmailHelperModule,
        FileHandlerModule,
        LocationModule,
        AsyncOperationsModule
      ],
      providers: [ConfigService, Logger, CompanyService, CadtApiService],
    }).compile();

    service = module.get<CadtApiService>(CadtApiService);
  });

  let program = {
        programmeId: '456',
        serialNo: '	NA-ITMO-15-123-2023-0-1001-1400',
        title: 'UNDP_Credit_Transfer',
        externalId: 'UNDP_Credit_Transfer',
        sectoralScope: SectoralScope.EnergyIndustry,
        sector: Sector.Energy,
        countryCodeA2: 'NA',
        currentStage: ProgrammeStage.AWAITING_AUTHORIZATION,
        startTime: new Date().getTime(),
        endTime: new Date().getTime() + 20000000000,
        creditEst: 400,
        emissionReductionExpected: 0,
        emissionReductionAchieved: 0,
        creditChange: 0,
        creditIssued: 0,
        creditBalance: 0,
        creditRetired: [],
        creditFrozen: [],
        creditTransferred: [],
        constantVersion: '',
        proponentTaxVatId: [],
        companyId: [3, 5],
        proponentPercentage: [40, 60],
        creditOwnerPercentage: [40, 60],
        certifierId: [],
        revokedCertifierId: [],
        creditUnit: 'ITMO',
        programmeProperties: {
          geographicalLocation: ["Abia", "Lagos"],
          greenHouseGasses: [GHGs.CO2, GHGs.CH4]
        },
        txTime: 0,
        createdTime: 0,
        authTime: 0,
        creditUpdateTime: 0,
        statusUpdateTime: 0,
        certifiedTime: 0,
        txRef: '',
        txType: TxType.CREATE,
        geographicalLocationCordintes: undefined,
        cadtId: '',
        environmentalAssessmentRegistrationNo: '',
        createdAt: undefined,
        updatedAt: undefined,
        blockBounds: {}
      };

    // it('should be issue credit', async () => {
    //   program.currentStage = ProgrammeStage.AUTHORISED;
    //   program.cadtId = '1294466d-ea52-43e1-a4bf-96ce2719975b';
    //   program.blockBounds = {
    //     '3': [
    //       {
    //         unitBlockStart: '1001',
    //         unitBlockEnd: '1040',
    //         unitId: 'c39f3500-cf33-4c6b-a11a-9e7d5383c96f',
    //         amount: 40
    //       },
    //       {
    //         unitBlockStart: '1041',
    //         unitBlockEnd: '1060',
    //         unitId: 'bffaee9e-334a-4ceb-a693-b1c7c84602fd',
    //         amount: 20
    //       }
    //     ],
    //     '5': [
    //       {
    //         unitBlockStart: '1161',
    //         unitBlockEnd: '1220',
    //         unitId: 'd01364bf-72c1-4a15-8682-bff6d33e256d',
    //         amount: 60
    //       },
    //       {
    //         unitBlockStart: '1221',
    //         unitBlockEnd: '1250',
    //         unitId: 'd87c6682-a7a2-4bf1-b001-320b54aeaf9b',
    //         amount: 30
    //       }
    //     ]
    //   }
    //   await service.issueCredit(program, 50)
    // })


    // it('should be transfer credit', async () => {
    //   program.currentStage = ProgrammeStage.AUTHORISED;
    //   program.cadtId = '1294466d-ea52-43e1-a4bf-96ce2719975b';
    //   program.blockBounds = {
    //     '3': [
    //       {
    //         unitBlockStart: '1001',
    //         unitBlockEnd: '1040',
    //         unitId: 'c39f3500-cf33-4c6b-a11a-9e7d5383c96f',
    //         amount: 40
    //       },
    //       {
    //         unitBlockStart: '1041',
    //         unitBlockEnd: '1060',
    //         unitId: 'bffaee9e-334a-4ceb-a693-b1c7c84602fd',
    //         amount: 20
    //       }
    //     ],
    //     '5': [
    //       {
    //         unitBlockStart: '1161',
    //         unitBlockEnd: '1220',
    //         unitId: 'd01364bf-72c1-4a15-8682-bff6d33e256d',
    //         amount: 60
    //       },
    //       {
    //         unitBlockStart: '1221',
    //         unitBlockEnd: '1250',
    //         unitId: 'd87c6682-a7a2-4bf1-b001-320b54aeaf9b',
    //         amount: 30
    //       }
    //     ]
    //   }
    //   await service.transferCredit(program, {
    //     requestId: 0,
    //     programmeId: '',
    //     initiator: 0,
    //     initiatorCompanyId: 0,
    //     toCompanyId: 1,
    //     toAccount: '',
    //     toCompanyMeta: undefined,
    //     retirementType: RetireType.CROSS_BORDER,
    //     fromCompanyId: 3,
    //     creditAmount: 15,
    //     comment: '',
    //     txRef: '',
    //     txTime: 0,
    //     createdTime: 0,
    //     authTime: 0,
    //     status: TransferStatus.APPROVED,
    //     isRetirement: false
    //   })
    // })

  // it('create programme', async () => {
  //   // program.currentStage = ProgrammeStage.AUTHORISED;
  //   // program.cadtId = '45c7573a-3e11-4559-91dc-1c84c70ac0d2';
  //   await service.createProgramme(program)

  // })

  // it('should be update status', async () => {
  //   program.currentStage = ProgrammeStage.AUTHORISED;
  //   program.cadtId = 'b0e14d01-d646-44f9-a1b7-4b9c18385420';
  //   await service.updateProgramme(program)
  // })
});
