import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class PostalCode {
    @PrimaryColumn()
    key: string;

    @Column()
    countryAlpha2: string;
    @Column()
    postalCode: string;

    @Column()
    cityName: string;

    @Column()
    districtName: string;

    @Column()
    lang: string;

    @Column({
        type: 'jsonb',
        array: false,
        nullable: true,
    })
    geoCoordinates: any;
}
