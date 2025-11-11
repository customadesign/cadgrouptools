'use client';

import { Select, Tag } from 'antd';
import { useEffect, useState } from 'react';

const { Option } = Select;

interface Company {
  _id: string;
  name: string;
  status: string;
  currency: string;
}

interface CompanySelectorProps {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  showAllOption?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function CompanySelector({
  value,
  onChange,
  multiple = false,
  showAllOption = true,
  placeholder = 'Select company',
  style,
  className,
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/companies');
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (newValue: string | string[]) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      mode={multiple ? 'multiple' : undefined}
      placeholder={placeholder}
      loading={loading}
      style={{ width: '100%', ...style }}
      className={className}
      showSearch
      optionFilterProp="children"
      filterOption={(input, option) =>
        (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
      }
    >
      {showAllOption && !multiple && (
        <Option value="all">All Companies</Option>
      )}
      {companies.map((company) => (
        <Option key={company._id} value={company._id}>
          {company.name}
          {company.status === 'inactive' && (
            <Tag color="red" style={{ marginLeft: 8 }}>
              Inactive
            </Tag>
          )}
        </Option>
      ))}
    </Select>
  );
}


