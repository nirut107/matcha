import { Test, TestingModule } from '@nestjs/testing';
import { DatesController } from './dates.controller';

describe('DatesController', () => {
  let controller: DatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatesController],
    }).compile();

    controller = module.get<DatesController>(DatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
