import { Module } from '@nestjs/common';
import { AmoCrmService } from './amo-crm.service';
import { AmoCrmController } from './amo-crm.controller';

@Module({
  controllers: [AmoCrmController],
  providers: [AmoCrmService],
  exports: [AmoCrmService],
})
export class AmoCrmModule {}
