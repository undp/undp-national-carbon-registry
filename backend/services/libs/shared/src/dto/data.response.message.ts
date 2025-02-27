export class DataResponseMessageDto {
  constructor(
    public statusCode: number,
    public message: string,
    public data: any
  ) {}
}
