import { ApiProperty } from "@nestjs/swagger";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from "class-validator";

import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import { CadTrustResourceType } from "../enum/cadtrust.resource.type.enum";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";

/**
 * Roll-up of every `cadtrust_sync_record` row belonging to one project or one credit block,
 * for the UI's "is this synced to CAD Trust, and in what state" badge.
 */
export enum CadTrustSyncOverallStatus {
  /** No sync record exists yet. */
  NONE = "NONE",
  /** At least one record is STAGED/PENDING and none has FAILED. */
  IN_PROGRESS = "IN_PROGRESS",
  /** Every record is COMMITTED. */
  SYNCED = "SYNCED",
  /** At least one record is FAILED. */
  FAILED = "FAILED",
}

/** One `cadtrust_sync_record` row, flattened for the client. */
export interface CadTrustSyncRecordView {
  localEntityType: CadTrustLocalEntityType;
  cadTrustEntityType: CadTrustResourceType;
  localId: string;
  cadTrustId?: string;
  syncStatus: CadTrustSyncStatus;
  attemptCount: number;
  lastError?: string;
  lastAttemptTime?: number;
  updateTime: number;
  payload?: Record<string, unknown>;
}

/** Response of the project / credit "overview" endpoints. */
export interface CadTrustSyncOverviewDto {
  overallStatus: CadTrustSyncOverallStatus;
  records: CadTrustSyncRecordView[];
}

/** Per-id roll-up used by the batch "statuses" endpoints that gate the badge. */
export interface CadTrustSyncStatusSummary {
  hasRecords: boolean;
  overallStatus: CadTrustSyncOverallStatus;
}

const MAX_IDS = 500;

export class CadTrustProjectStatusRequestDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IDS)
  @IsString({ each: true })
  refIds: string[];
}

export class CadTrustCreditStatusRequestDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IDS)
  @IsString({ each: true })
  creditBlockIds: string[];
}
