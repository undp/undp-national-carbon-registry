import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataListResponseDto } from "src/dto/data.list.response";
import { QueryDto } from "src/dto/query.dto";
import { CreditAuditLog } from "src/entities/credit.audit.log.entity";
import { Programme } from "src/entities/programme.entity";
import { User } from "src/entities/user.entity";
import { HelperService } from "src/util/helpers.service";
import { Repository } from "typeorm";

@Injectable()
export class NationalAccountingService {

	constructor(
		@InjectRepository(CreditAuditLog) private creditAuditLogRepo: Repository<CreditAuditLog>,
		private helperService: HelperService,
	) { }

	async getTotalStats() {
		const result = await this.creditAuditLogRepo
			.createQueryBuilder('log')
			.select('log.type', 'type')
			.addSelect('SUM(log.credits)', 'sumCredits')
			.groupBy('log.type')
			.getRawMany();

		const formattedResult = result.reduce((acc, item) => {
			acc[item.type] = item.sumCredits;
			return acc;
		}, {});

		return formattedResult;
	}

	async getTransactionRecords(
		query: QueryDto,
		abilityCondition: string
	) {
		// Query for data
		let dataQueryBuilder = this.creditAuditLogRepo
			.createQueryBuilder('log')
			.select('log.type', 'type')
			.addSelect('log.credits', 'credits')
			.addSelect('log.country', 'country')
			.addSelect('log.createdTime', 'createdTime')
			.addSelect('programme.programmeId', 'programmeId')
			.addSelect('programme.title', 'programmeTitle')
			.addSelect('user.name', 'user')
			.leftJoin('programme', 'programme', 'programme.programmeId = log.programmeId')
			.leftJoin('user', 'user', 'user.id = log.createdBy')
			.where(
				this.helperService.generateWhereSQL(
					query,
					this.helperService.parseMongoQueryToSQLWithTable(
						'log',
						abilityCondition,
					),
				),
			)
			.orderBy(
				query?.sort?.key ? `"log"."${query?.sort?.key}"` : `"log"."id"`,
				query?.sort?.order ? query?.sort?.order : "DESC"
			);

		if (query.size && query.page) {
			dataQueryBuilder.offset(query.size * query.page - query.size)
				.limit(query.size);
		}

		const data = await dataQueryBuilder.getRawMany();

		// Query for count
		let countQueryBuilder = this.creditAuditLogRepo
			.createQueryBuilder('log')
			.leftJoin('programme', 'programme', 'programme.programmeId = log.programmeId')
			.leftJoin('user', 'user', 'user.id = log.createdBy')
			.where(
				this.helperService.generateWhereSQL(
					query,
					this.helperService.parseMongoQueryToSQLWithTable(
						'log',
						abilityCondition,
					),
				),
			);

		const total = await countQueryBuilder.getCount();

		// return resp;
		return new DataListResponseDto(
			data,
			total
		);
	}

	async getRetiresByCountry(query: QueryDto, abilityCondition: string) {
		let dataQueryBuilder = this.creditAuditLogRepo
			.createQueryBuilder('log')
			.select('log.country', 'country')
			.addSelect('SUM(log.credits)', 'totalCredits')
			.where('log.country IS NOT NULL');

		// Dynamically adding additional conditions if any
		if (abilityCondition) {
			dataQueryBuilder = dataQueryBuilder.andWhere(
				this.helperService.parseMongoQueryToSQLWithTable(
					'log',
					abilityCondition,
				)
			);
		}

		// Clone the query builder for counting distinct countries
    const countQueryBuilder = dataQueryBuilder.clone();

		dataQueryBuilder = dataQueryBuilder
			.groupBy('log.country')
			.orderBy(
				query?.sort?.key ? `"log"."${query?.sort?.key}"` : `"log"."country"`,
				query?.sort?.order ? query?.sort?.order : "DESC"
			);

		// Apply pagination if required
		if (query.size && query.page) {
			dataQueryBuilder = dataQueryBuilder
				.offset(query.size * query.page - query.size)
				.limit(query.size);
		}

		const data = await dataQueryBuilder.getRawMany();

		
		// Execute the count query
    const totalCountries = await countQueryBuilder
        .select('COUNT(DISTINCT log.country)', 'count')
        .getRawOne();

		const formattedResult = data.reduce((acc, item) => {
			acc[item.country] = item.totalCredits;
			return acc;
		}, {});

		return new DataListResponseDto(
			data,
			totalCountries?.count
		);
	}
}