import { Col, Form, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { SdgGoals as SdgGoalsEnum } from '../../Definitions/Enums/sdgGoals.enum';

const sdgGoalMap: any = {};

const SdgGoals = (props: any) => {
  const { onFormSubmit, sdgGoalsViewData, viewOnly, sdgGoalImages } = props;
  const {
    goal1,
    goal2,
    goal3,
    goal4,
    goal5,
    goal6,
    goal7,
    goal8,
    goal9,
    goal10,
    goal11,
    goal12,
    goal13,
    goal14,
    goal15,
    goal16,
    goal17,
    goal1Selected,
    goal2Selected,
    goal3Selected,
    goal4Selected,
    goal5Selected,
    goal6Selected,
    goal7Selected,
    goal8Selected,
    goal9Selected,
    goal10Selected,
    goal11Selected,
    goal12Selected,
    goal13Selected,
    goal14Selected,
    goal15Selected,
    goal16Selected,
    goal17Selected,
  } = sdgGoalImages;
  const [formOne] = Form.useForm();
  const [sdgGoals, setSdgGoals] = useState<any[]>([
    {
      name: SdgGoalsEnum.noPoverty,
      image: goal1,
      selected: false,
      activeImage: goal1Selected,
    },
    {
      name: SdgGoalsEnum.zeroHunger,
      image: goal2,
      selected: false,
      activeImage: goal2Selected,
    },
    {
      name: SdgGoalsEnum.gdHealth,
      image: goal3,
      selected: false,
      activeImage: goal3Selected,
    },
    {
      name: SdgGoalsEnum.qualityEducation,
      image: goal4,
      selected: false,
      activeImage: goal4Selected,
    },
    {
      name: SdgGoalsEnum.genderEq,
      image: goal5,
      selected: false,
      activeImage: goal5Selected,
    },
    {
      name: SdgGoalsEnum.cleanWatr,
      image: goal6,
      selected: false,
      activeImage: goal6Selected,
    },
    {
      name: SdgGoalsEnum.affEnergy,
      image: goal7,
      selected: false,
      activeImage: goal7Selected,
    },
    {
      name: SdgGoalsEnum.decentWork,
      image: goal8,
      selected: false,
      activeImage: goal8Selected,
    },
    {
      name: SdgGoalsEnum.industry,
      image: goal9,
      selected: false,
      activeImage: goal9Selected,
    },
    {
      name: SdgGoalsEnum.reducedInEq,
      image: goal10,
      selected: false,
      activeImage: goal10Selected,
    },
    {
      name: SdgGoalsEnum.sustainableCities,
      image: goal11,
      selected: false,
      activeImage: goal11Selected,
    },
    {
      name: SdgGoalsEnum.responsibleConsumption,
      image: goal12,
      selected: false,
      activeImage: goal12Selected,
    },
    {
      name: SdgGoalsEnum.climateAction,
      image: goal13,
      selected: false,
      activeImage: goal13Selected,
    },
    {
      name: SdgGoalsEnum.lifeBelowWater,
      image: goal14,
      selected: false,
      activeImage: goal14Selected,
    },
    {
      name: SdgGoalsEnum.lifeOnLand,
      image: goal15,
      selected: false,
      activeImage: goal15Selected,
    },
    {
      name: SdgGoalsEnum.peace,
      image: goal16,
      selected: false,
      activeImage: goal16Selected,
    },
    {
      name: SdgGoalsEnum.partnership,
      image: goal17,
      selected: false,
      activeImage: goal17Selected,
    },
  ]);

  const handleImageSelect = (imageId: any) => {
    const g = sdgGoalMap[imageId];
    if (!g) {
      return;
    }
    g.selected = !g.selected;

    const u = [...sdgGoals];
    setSdgGoals(u);
  };

  useEffect(() => {
    for (const g of sdgGoals) {
      sdgGoalMap[g.name] = g;
    }
  }, []);

  useEffect(() => {
    if (sdgGoalsViewData) {
      for (const g of sdgGoalsViewData) {
        const sdg = sdgGoalMap[g as SdgGoalsEnum];
        if (sdg) {
          sdg.selected = true;
        }
      }
    } else {
      for (const g of sdgGoals) {
        g.selected = false;
      }
    }
    const updatedSdgGoals = Object.values(sdgGoalMap);
    setSdgGoals(updatedSdgGoals);
  }, [sdgGoalsViewData]);

  useEffect(() => {
    const saveData: any[] = [];
    for (const g of sdgGoals) {
      if (g.selected) {
        saveData.push(g.name.toString());
      }
    }
    onFormSubmit(saveData);
  }, [sdgGoals]);

  return (
    <div className="co-benifits-tab-item">
      <Form name="sdg-goals-details" className="benifits-details-sdg-goals" form={formOne}>
        <Row gutter={[5, 16]} className="row">
          {sdgGoals?.map((sdgGoal: any) => (
            <Col sm={12} md={12} lg={4} xl={4} className="col">
              <div
                className={sdgGoalsViewData ? 'img-container-data' : 'img-container'}
                style={{ cursor: 'pointer' }}
              >
                <Form.Item name="images">
                  {!sdgGoal.selected && (
                    <img
                      src={sdgGoal?.image}
                      alt={`Image ${sdgGoal?.name}`}
                      onClick={() => !viewOnly && handleImageSelect(sdgGoal?.name)}
                    />
                  )}
                  {sdgGoal.selected && (
                    <img
                      src={sdgGoal?.activeImage}
                      alt={`Image ${sdgGoal?.name}`}
                      onClick={() => !viewOnly && handleImageSelect(sdgGoal?.name)}
                    />
                  )}
                </Form.Item>
              </div>
            </Col>
          ))}
        </Row>
      </Form>
    </div>
  );
};

export default SdgGoals;
