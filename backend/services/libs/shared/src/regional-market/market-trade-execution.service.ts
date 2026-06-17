import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, Optional } from "@nestjs/common";
import { Repository } from "typeorm";
import { MarketTradeExecutionEntity } from "../entities/market.trade.execution.entity";

const SETTLED_MARKET_TRADE_STATUSES = ["SETTLED_OFFLINE"];

export interface CreateMarketTradeExecutionDto {
  creditTransactionId?: string;
  creditBlockId?: string;
  sellerCompanyId: number;
  buyerCompanyId: number;
  projectRefId: string;
  serialNumber?: string;
  amount: number;
  unitPrice: number;
  totalPrice?: number;
  currency?: string;
  tradeTime?: Date;
  settlementStatus?: string;
}

@Injectable()
export class MarketTradeExecutionService {
  constructor(
    @Optional()
    @InjectRepository(MarketTradeExecutionEntity)
    private readonly marketTradeExecutionRepository?: Repository<MarketTradeExecutionEntity>
  ) {}

  async createFromTransfer(dto: CreateMarketTradeExecutionDto) {
    const repository = this.getRepository();
    const entity = repository.create({
      ...dto,
      totalPrice: dto.totalPrice ?? dto.amount * dto.unitPrice,
      currency: dto.currency ?? "CNY",
      tradeTime: dto.tradeTime ?? new Date(),
      settlementStatus: dto.settlementStatus ?? "SETTLED_OFFLINE",
    });

    return repository.save(entity);
  }

  async queryTrades(options: { take?: number | null } = {}) {
    const repository = this.getRepository();
    const query: Parameters<typeof repository.find>[0] = {
      order: { tradeTime: "DESC" },
      where: { settlementStatus: SETTLED_MARKET_TRADE_STATUSES[0] },
    };

    if (options.take !== null) {
      query.take = options.take ?? 20;
    }

    return repository.find(query);
  }

  async getTradeSummary() {
    const repository = this.getRepository();
    const raw = await repository
      .createQueryBuilder("trade")
      .select("COUNT(trade.id)", "count")
      .addSelect("COALESCE(SUM(trade.amount), 0)", "amount")
      .addSelect("COALESCE(SUM(trade.totalPrice), 0)", "value")
      .addSelect(
        "COALESCE(SUM(trade.totalPrice) / NULLIF(SUM(trade.amount), 0), 0)",
        "averagePrice"
      )
      .where("trade.settlementStatus IN (:...settlementStatuses)", {
        settlementStatuses: SETTLED_MARKET_TRADE_STATUSES,
      })
      .getRawOne();

    return {
      tradeCount: Number(raw?.count ?? 0),
      totalAmount: Number(raw?.amount ?? 0),
      totalValue: Number(raw?.value ?? 0),
      averagePrice: Number(raw?.averagePrice ?? 0),
    };
  }

  private getRepository(): Repository<MarketTradeExecutionEntity> {
    if (!this.marketTradeExecutionRepository) {
      throw new Error("MarketTradeExecution repository is not available");
    }
    return this.marketTradeExecutionRepository;
  }
}
