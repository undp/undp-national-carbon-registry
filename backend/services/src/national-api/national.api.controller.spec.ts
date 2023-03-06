import { Test, TestingModule } from '@nestjs/testing';
import { NationalAPIController } from './national.api.controller';
import { NationalAPIService } from './national.api.service';

describe('NationalAPIController', () => {
  let appController: NationalAPIController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NationalAPIController],
      providers: [NationalAPIService],
    }).compile();

    appController = app.get<NationalAPIController>(NationalAPIController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
