/**
 * Optional TypeORM adapter.
 *
 * This directory is the only part of the library that depends on `typeorm` and
 * `@nestjs/*`. It is imported by subpath (`@app/aef-v2/typeorm`) rather than
 * re-exported from the package barrel, so a consumer that only wants the
 * contract never pulls those in.
 */
export * from './entities';
export * from './transformers';
export * from './aef-typeorm.store';
export * from './aef-v2.module';
