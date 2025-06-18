export class ChartStatsResponseDto {
    stats: any;
    lastUpdate: number;
  
    constructor(stats: any) {
      this.stats = stats;
      this.lastUpdate = Math.round(Date.now() / 1000);
    }
  }
  