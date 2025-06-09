import { Module } from '@nestjs/common';
import { TrimPipe } from './trim-pipe.transform';
import { CreditCalculationPropertyValidator } from './credit.calculation.property.validator';

@Module({
  providers: [
    TrimPipe,
    CreditCalculationPropertyValidator
  ],
  exports: [
    TrimPipe,
    CreditCalculationPropertyValidator
  ]
})
export class ValidationModule {}
