import { BankOutlined, UserOutlined } from '@ant-design/icons';
import { Col, Card, Skeleton, Row } from 'antd';
import React from 'react';

import './companyDetailsComponent.scss';
import { addCommSep } from '../../../Definitions/Definitions/programme.definitions';
import { CarbonSystemType } from '../../../Definitions/Enums/carbonSystemType.enum';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { GovDepartment } from '../../../Definitions/Enums/govDep.enum';
import { SectoralScope } from '../../../Definitions/Enums/sectoralScope.enum';
import CompanyRoleIcon from '../../IconComponents/CompanyRoleIcon/companyRoleIcon';

export const CompanyDetailsComponent = (props: any) => {
  const { t, companyDetails, userDetails, isLoading, regionField, systemType } = props;

  const getEnumKeysFromValues = (values: string[]): string[] => {
    const enumKeys: string[] = [];
    for (const key in SectoralScope) {
      if (values.includes(SectoralScope[key as keyof typeof SectoralScope])) {
        enumKeys.push(key);
      }
    }

    return enumKeys;
  };

  return (
    <Card className="card-container">
      <div className="info-view">
        <div className="title">
          <span className="title-icon">
            <BankOutlined />
          </span>
          <span className="title-text">{t('companyDetails:organisationDetailsHeading')}</span>
        </div>
        <Skeleton loading={isLoading} active>
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:name')}
            </Col>
            <Col span={12} className="field-value">
              {companyDetails.name ? companyDetails.name : '-'}
            </Col>
          </Row>
          {(companyDetails?.companyRole === CompanyRole.GOVERNMENT ||
            companyDetails?.companyRole === CompanyRole.MINISTRY) && (
            <>
              <Row className="field">
                <Col span={12} className="field-key">
                  {t('companyDetails:ministry')}
                </Col>
                <Col span={12} className="field-value">
                  {companyDetails.ministry ? companyDetails.ministry : '-'}
                </Col>
              </Row>
              <Row className="field">
                <Col span={12} className="field-key">
                  {t('companyDetails:govDep')}
                </Col>
                <Col span={12} className="field-value">
                  {companyDetails?.govDep
                    ? Object.keys(GovDepartment)[
                        Object.values(GovDepartment).indexOf(
                          companyDetails?.govDep as GovDepartment
                        )
                      ]
                    : '-'}
                </Col>
              </Row>
            </>
          )}
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:taxId')}
            </Col>
            <Col span={12} className="field-value nextline-overflow">
              {companyDetails.taxId && companyDetails?.companyRole !== CompanyRole.GOVERNMENT
                ? companyDetails.taxId
                : '-'}
            </Col>
          </Row>
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:paymentId')}
            </Col>
            <Col span={12} className="field-value nextline-overflow">
              {companyDetails.paymentId ? companyDetails.paymentId : '-'}
            </Col>
          </Row>
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:companyRole')}
            </Col>
            <Col span={12} className="field-value">
              <CompanyRoleIcon role={companyDetails.companyRole} />
            </Col>
          </Row>
          {companyDetails?.companyRole === CompanyRole.MINISTRY && (
            <>
              <Row className="field">
                <Col span={12} className="field-key">
                  {t('companyDetails:ministerName')}
                </Col>
                <Col span={12} className="field-value">
                  {companyDetails.nameOfMinister ? companyDetails.nameOfMinister : '-'}
                </Col>
              </Row>
              <Row className="field">
                <Col span={12} className="field-key">
                  {t('companyDetails:sectoralScope')}
                </Col>
                <Col span={12} className="field-value">
                  {companyDetails.sectoralScope
                    ? getEnumKeysFromValues(companyDetails.sectoralScope).join(', ')
                    : '-'}
                </Col>
              </Row>
            </>
          )}
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:email')}
            </Col>
            <Col span={12} className="field-value nextline-overflow">
              {companyDetails.email ? companyDetails.email : '-'}
            </Col>
          </Row>
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:phoneNo')}
            </Col>
            <Col span={12} className="field-value">
              {companyDetails.phoneNo ? companyDetails.phoneNo : '-'}
            </Col>
          </Row>
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:website')}
            </Col>
            <Col span={12} className="field-value ellipsis-overflow">
              {companyDetails.website ? (
                <a target={'blank'} href={companyDetails.website}>
                  {companyDetails.website}
                </a>
              ) : (
                '-'
              )}
            </Col>
          </Row>
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:address')}
            </Col>
            <Col span={12} className="field-value">
              {companyDetails.address ? companyDetails.address : '-'}
            </Col>
          </Row>
          {regionField && (
            <Row className="field">
              <Col span={12} className="field-key">
                {t('companyDetails:region')}
              </Col>
              <Col span={12} className="field-value">
                {companyDetails.regions ? companyDetails.regions.join(', ') : '-'}
              </Col>
            </Row>
          )}
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:programmeCount')}
            </Col>
            <Col span={12} className="field-value">
              {companyDetails.programmeCount ? companyDetails.programmeCount : '-'}
            </Col>
          </Row>
          <Row className="field">
            <Col span={12} className="field-key">
              {t('companyDetails:creditBalance')}
            </Col>
            <Col span={12} className="field-value">
              {companyDetails.creditBalance ? addCommSep(companyDetails.creditBalance) : '-'}
            </Col>
          </Row>
          {parseInt(companyDetails.state) === 0 ? (
            <Row className="field">
              <Col span={12} className="field-key">
                {t('companyDetails:remarks')}
              </Col>
              <Col span={12} className="field-value">
                {companyDetails.remarks ? companyDetails.remarks : '-'}
              </Col>
            </Row>
          ) : (
            ''
          )}
          {companyDetails?.companyRole === CompanyRole.GOVERNMENT &&
            systemType !== CarbonSystemType.MRV && (
              <>
                <Row className="field">
                  <Col span={12} className="field-key">
                    {t('companyDetails:omgePercentage')}
                  </Col>
                  <Col span={12} className="field-value">
                    {companyDetails.omgePercentage ? companyDetails.omgePercentage : '-'}
                  </Col>
                </Row>
              </>
            )}
          {companyDetails?.companyRole === CompanyRole.GOVERNMENT && (
            <>
              <Row className="field">
                <Col span={12} className="field-key">
                  {t('companyDetails:nationalSopValue')}
                </Col>
                <Col span={12} className="field-value">
                  {companyDetails.nationalSopValue ? companyDetails.nationalSopValue : '-'}
                </Col>
              </Row>
            </>
          )}
        </Skeleton>
      </div>
    </Card>
  );
};
