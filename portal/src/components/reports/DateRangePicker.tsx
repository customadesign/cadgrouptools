'use client';

import { DatePicker, Select, Space, Switch } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  value?: [Dayjs, Dayjs];
  onChange?: (dates: [Dayjs, Dayjs], compareToPrevious: boolean) => void;
  showComparison?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const quickSelections = [
  {
    label: 'This Month',
    value: 'this_month',
    getRange: () => [dayjs().startOf('month'), dayjs().endOf('month')] as [Dayjs, Dayjs],
  },
  {
    label: 'Last Month',
    value: 'last_month',
    getRange: () => [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ] as [Dayjs, Dayjs],
  },
  {
    label: 'This Quarter',
    value: 'this_quarter',
    getRange: () => [dayjs().startOf('quarter'), dayjs().endOf('quarter')] as [Dayjs, Dayjs],
  },
  {
    label: 'Last Quarter',
    value: 'last_quarter',
    getRange: () => [
      dayjs().subtract(1, 'quarter').startOf('quarter'),
      dayjs().subtract(1, 'quarter').endOf('quarter'),
    ] as [Dayjs, Dayjs],
  },
  {
    label: 'Year to Date',
    value: 'ytd',
    getRange: () => [dayjs().startOf('year'), dayjs()] as [Dayjs, Dayjs],
  },
  {
    label: 'Last Year',
    value: 'last_year',
    getRange: () => [
      dayjs().subtract(1, 'year').startOf('year'),
      dayjs().subtract(1, 'year').endOf('year'),
    ] as [Dayjs, Dayjs],
  },
  {
    label: 'Custom',
    value: 'custom',
    getRange: () => [dayjs().startOf('month'), dayjs().endOf('month')] as [Dayjs, Dayjs],
  },
];

export default function DateRangePicker({
  value,
  onChange,
  showComparison = true,
  style,
  className,
}: DateRangePickerProps) {
  const [selectedQuickOption, setSelectedQuickOption] = useState<string>('this_month');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(
    value || quickSelections[0].getRange()
  );
  const [compareToPrevious, setCompareToPrevious] = useState(false);

  const handleQuickSelect = (optionValue: string) => {
    setSelectedQuickOption(optionValue);
    const selection = quickSelections.find(s => s.value === optionValue);
    if (selection && optionValue !== 'custom') {
      const range = selection.getRange();
      setDateRange(range);
      if (onChange) {
        onChange(range, compareToPrevious);
      }
    }
  };

  const handleDateChange = (dates: any) => {
    if (dates && dates.length === 2) {
      const range: [Dayjs, Dayjs] = [dates[0], dates[1]];
      setDateRange(range);
      setSelectedQuickOption('custom');
      if (onChange) {
        onChange(range, compareToPrevious);
      }
    }
  };

  const handleComparisonToggle = (checked: boolean) => {
    setCompareToPrevious(checked);
    if (onChange) {
      onChange(dateRange, checked);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%', ...style }} className={className}>
      <Space wrap>
        <Select
          value={selectedQuickOption}
          onChange={handleQuickSelect}
          style={{ width: 150 }}
        >
          {quickSelections.map(option => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>

        <RangePicker
          value={dateRange}
          onChange={handleDateChange}
          format="YYYY-MM-DD"
        />

        {showComparison && (
          <Space>
            <span>Compare to previous period:</span>
            <Switch
              checked={compareToPrevious}
              onChange={handleComparisonToggle}
            />
          </Space>
        )}
      </Space>
    </Space>
  );
}

