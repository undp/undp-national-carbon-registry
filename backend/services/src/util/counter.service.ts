import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counter } from '../entities/counter.entity';
import { CounterType } from './counter.type.enum';

@Injectable()
export class CounterService {

    constructor(@InjectRepository(Counter) private counterRepo: Repository<Counter>) {
    }

    padLeft(number: number, length: number, character: string = '0'): string {
        let result = String(number);
        for (let i = result.length; i < length; ++i) {
          result = character + result;
        }
        return result;
      };

    async incrementCount(type: CounterType, length: number, increment: number = 1): Promise<string> {
        // const resp = await this.counterRepo.increment({ id: type }, "counter", increment)
        // if (resp.affected <= 0) {
        //     throw Error("Unexpected behavior on counter increase")
        // }

        const resp = await this.counterRepo
        .createQueryBuilder()
        .update()
        .whereInIds(type)
        .set({ counter: () => `counter + ${increment}` })
        .returning("counter")
        .execute().catch( e => {
        });
        if (resp && resp['raw'] && resp['raw'].length > 0) {
            return this.padLeft(resp['raw'][0]['counter'], length);
        } else {
            return await this.counterRepo.findOneBy({
                id: type,
            }).then(async o => {
                if (o) {
                    throw Error('Internal error on unique id generation')
                } else {
                    await this.counterRepo.save({ id: type, counter: 1 })
                    return this.padLeft(1, length);
                }
            });
        }
    }

    async getCount(type: CounterType): Promise<number> {
        return await this.counterRepo.findOneBy({
            id: type,
        }).then(async o => {
            if (o) {
                return o.counter;
            } else {
                await this.counterRepo.save({ id: type, counter: 0 })
                return 0;
            }
            
        });
        
    }
}
