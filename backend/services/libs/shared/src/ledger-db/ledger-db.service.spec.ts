import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { dom } from 'ion-js';
import configuration from '../configuration';
import { PgSqlLedgerService } from './pgsql-ledger.service';
import { QLDBLedgerService } from "./qldb-ledger.service";

describe('LedgerDbService', () => {
  let service: PgSqlLedgerService;

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
      ],
      providers: [QLDBLedgerService, Logger, PgSqlLedgerService],
    }).compile();

    service = module.get<PgSqlLedgerService>(PgSqlLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('insert record', async () => {
    return service.insertRecord({'test_name': 'name', 'val': 700}, 'test_table').then( data => {
    })
  })

  it('get record', async () => {
    return service.fetchRecords({'test_name': 'name'}, 'test_table').then( data => {
      expect(data.length).toEqual(1)
      expect(data[0]['val']).toEqual(700)
    })
  })

  it('get history', async () => {
    return service.fetchHistory({'test_name': 'name'}, 'test_table').then( data => {
      expect(data.length).toBeGreaterThan(1)
      expect(data[0]['data']['val']).toEqual(700)
    })
  })

  it('update record', async () => {
    const txVal = 9999
    return service.updateRecords({'val': txVal}, {'test_name': 'name2'}, 'test_table').then( data => {
      return service.fetchRecords({'test_name': 'name2'}, 'test_table').then( data2 => {
        expect(data2.length).toEqual(1)
        expect(data2[0]['val']).toEqual(txVal)
      })
    })
  })

  it('get update tx',async () => {
    const table = 'test_table';
    const getQueries = {};
    getQueries[table] = {
      'test_name': 'name3'
    };
    const r = await service.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        expect(results[table].length).toEqual(1);
        return [{
          test_table: {
            'val': 12345
          }
        }, {
          test_table: {
            'test_name': 'name3'
          }
        }, {}];
      },
    );
  })
});
