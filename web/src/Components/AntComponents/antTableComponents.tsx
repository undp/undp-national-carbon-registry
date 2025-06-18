import React from 'react';
import { Form, Input, Table } from 'antd';
import type { FormInstance } from 'antd/es/form';

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: string;
  name: string;
  age: string;
  address: string;
}

interface EditableRowProps {
  index: number;
}

export const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text';
  record: Item;
  index: number;
  children: React.ReactNode;
  onBlurHandler: any;
  t: any;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  onBlurHandler,
  t,
  ...restProps
}) => {
  return (
    <td {...restProps}>
      {editing && dataIndex === 'nationalPlanObjective' ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              validator: async (rule: any, value: any) => {
                const trimValue = typeof value === 'string' ? value.trim() : value;
                if (!trimValue) {
                  throw new Error(`${title} ${t('ndc:isRequired')}`);
                }
              },
            },
          ]}
        >
          <Input
            onBlur={() => onBlurHandler(record)}
            placeholder={t('ndc:nationalPlanObjectivePlaceHolder')}
          />
        </Form.Item>
      ) : editing && dataIndex === 'kpiUnit' ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              validator: async (rule: any, value: any) => {
                const trimValue = typeof value === 'string' ? value.trim() : value;
                if (!trimValue) {
                  throw new Error(`${title} ${t('ndc:isRequired')}`);
                }
              },
            },
          ]}
        >
          <Input onBlur={() => onBlurHandler(record)} placeholder={t('ndc:kpiUnitPlaceHolder')} />
        </Form.Item>
      ) : editing && dataIndex === 'kpi' ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              validator: async (rule: any, value: any) => {
                const trimValue = typeof value === 'string' ? value.trim() : value;
                if (trimValue) {
                  if (isNaN(+trimValue)) {
                    throw new Error(t('ndc:kpiInvalidFormat'));
                  } else if (+trimValue <= 0) {
                    throw new Error(t('ndc:kpiGreaterThanZero'));
                  } else if (trimValue.toString().length > 7) {
                    throw new Error(t('ndc:kpiMaxLength'));
                  }
                } else {
                  throw new Error(`${title} ${t('ndc:isRequired')}`);
                }
              },
            },
          ]}
        >
          <Input onBlur={() => onBlurHandler(record)} placeholder={t('ndc:kpiPlaceHolder')} />
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
  key: React.Key;
  name: string;
  age: string;
  address: string;
}

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;
