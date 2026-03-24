import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography,
  List,
  Tag,
  Space,
  Select,
  Button,
  Modal,
  Empty,
  DatePicker,
  Popover,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useSubjectStore } from '../stores/subjectStore';
import { usePointsStore } from '../stores/pointsStore';
import { AddHomeworkModal } from '../components/AddHomeworkModal';
import { CompleteHomeworkModal } from '../components/CompleteHomeworkModal';
import { initializeDatabase } from '../lib/db';
import type { Homework, FilterStatus, SortBy, Priority } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const HomeworkListView: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const {
    loadHomework,
    homework,
    deleteHomework,
    loading,
  } = useHomeworkStore();

  const { loadSubjects, subjects } = useSubjectStore();
  const { loadPointsData, awardPoints } = usePointsStore();

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await Promise.all([
        loadHomework(),
        loadSubjects(),
        loadPointsData(),
      ]);
    };
    init();
  }, []);

  // Filtered and sorted homework
  const filteredHomework = useMemo(() => {
    let result = [...homework];

    // Status filter
    if (statusFilter === 'pending') {
      result = result.filter((h) => !h.completedAt);
    } else if (statusFilter === 'completed') {
      result = result.filter((h) => h.completedAt);
    } else if (statusFilter === 'overdue') {
      const now = new Date();
      result = result.filter((h) => !h.completedAt && new Date(h.dueDate) < now);
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      result = result.filter((h) => h.subjectId === subjectFilter);
    }

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day').toDate();
      const end = dateRange[1].endOf('day').toDate();
      result = result.filter((h) => {
        const dueDate = new Date(h.dueDate);
        return dueDate >= start && dueDate <= end;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === 'subject') {
        const aName = subjects.find((s) => s.id === a.subjectId)?.name || '';
        const bName = subjects.find((s) => s.id === b.subjectId)?.name || '';
        return aName.localeCompare(bName, 'zh-CN');
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [homework, statusFilter, subjectFilter, sortBy, dateRange, subjects]);

  // Group by date
  const groupedHomework = useMemo(() => {
    const groups: Record<string, Homework[]> = {};

    filteredHomework.forEach((h) => {
      const dateKey = dayjs(h.dueDate).format('YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(h);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({ date, items }));
  }, [filteredHomework]);

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || '未知科目';
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || '#f0f0f0';
  };

  const handleStartTask = (homework: Homework) => {
    setSelectedHomework(homework);
    setCompleteModalOpen(true);
  };

  const handleEditTask = (homework: Homework) => {
    setSelectedHomework(homework);
    setEditModalOpen(true);
  };

  const handleComplete = async (actualMinutes: number) => {
    if (!selectedHomework) return;

    await useHomeworkStore.getState().completeHomework(selectedHomework.id, actualMinutes);
    await awardPoints(selectedHomework, actualMinutes);

    setCompleteModalOpen(false);
    setSelectedHomework(null);
  };

  const handleDelete = (homework: Homework) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${homework.title}" 吗?`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteHomework(homework.id),
    });
  };

  const formatDateLabel = (dateStr: string) => {
    const date = dayjs(dateStr);
    const today = dayjs();
    const tomorrow = today.add(1, 'day');
    const yesterday = today.subtract(1, 'day');

    if (dateStr === today.format('YYYY-MM-DD')) {
      return '今天';
    } else if (dateStr === tomorrow.format('YYYY-MM-DD')) {
      return '明天';
    } else if (dateStr === yesterday.format('YYYY-MM-DD')) {
      return '昨天';
    } else if (date.isBefore(today, 'day')) {
      return `${date.format('M月D日')} (已过期)`;
    } else {
      return date.format('M月D日 dddd');
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSubjectFilter('all');
    setDateRange(null);
    setSortBy('dueDate');
  };

  const hasActiveFilters = statusFilter !== 'all' || subjectFilter !== 'all' || dateRange;

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text type="secondary">加载中...</Text>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={4} style={{ margin: 0 }}>
          作业库
        </Title>
        <Text type="secondary">共 {filteredHomework.length} 项作业</Text>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部状态' },
            { value: 'pending', label: '待完成' },
            { value: 'completed', label: '已完成' },
            { value: 'overdue', label: '已过期' },
          ]}
        />

        <Select
          value={subjectFilter}
          onChange={setSubjectFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部科目' },
            ...subjects.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />

        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 120 }}
          options={[
            { value: 'dueDate', label: '按截止日期' },
            { value: 'priority', label: '按优先级' },
            { value: 'subject', label: '按科目' },
            { value: 'createdAt', label: '按创建时间' },
          ]}
        />

        <Popover
          content={
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              presets={[
                {
                  label: '本周',
                  value: [dayjs().startOf('week'), dayjs().endOf('week')],
                },
                {
                  label: '本月',
                  value: [dayjs().startOf('month'), dayjs().endOf('month')],
                },
                {
                  label: '最近7天',
                  value: [dayjs().subtract(7, 'day'), dayjs()],
                },
                {
                  label: '最近30天',
                  value: [dayjs().subtract(30, 'day'), dayjs()],
                },
              ]}
            />
          }
          title="选择日期范围"
          trigger="click"
        >
          <Button icon={<CalendarOutlined />}>
            {dateRange && dateRange[0] && dateRange[1]
              ? `${dateRange[0].format('M/D')} - ${dateRange[1].format('M/D')}`
              : '日期范围'}
          </Button>
        </Popover>

        {hasActiveFilters && (
          <Button onClick={clearFilters}>清除筛选</Button>
        )}

        <Button type="primary" onClick={() => setAddModalOpen(true)} style={{ marginLeft: 'auto' }}>
          添加作业
        </Button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
        {filteredHomework.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {hasActiveFilters ? '没有符合条件的作业' : '暂无作业'}
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {hasActiveFilters ? '尝试调整筛选条件' : '点击"添加作业"开始'}
                </Text>
              </span>
            }
            style={{ marginTop: 80 }}
          />
        ) : (
          groupedHomework.map(({ date, items }) => (
            <div key={date} style={{ marginTop: 16 }}>
              <Text
                strong
                style={{
                  display: 'block',
                  marginBottom: 8,
                  color: dayjs(date).isBefore(dayjs(), 'day') ? '#ff4d4f' : undefined,
                }}
              >
                {formatDateLabel(date)}
              </Text>
              <List
                dataSource={items}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      borderBottom: '1px solid #f5f5f5',
                      opacity: item.completedAt ? 0.6 : 1,
                    }}
                    actions={[
                      !item.completedAt && (
                        <Button
                          key="start"
                          type="primary"
                          size="small"
                          onClick={() => handleStartTask(item)}
                        >
                          开始
                        </Button>
                      ),
                      !item.completedAt && (
                        <Button
                          key="edit"
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditTask(item)}
                        />
                      ),
                      <Button
                        key="delete"
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(item)}
                      />,
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={
                        item.completedAt ? (
                          <CheckOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                        ) : (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background:
                                item.priority === 'high' ? '#ff4d4f' : '#d9d9d9',
                              marginTop: 8,
                            }}
                          />
                        )
                      }
                      title={
                        <Space>
                          <Text delete={!!item.completedAt}>{item.title}</Text>
                          <Tag
                            style={{
                              background: getSubjectColor(item.subjectId),
                              border: 'none',
                              fontSize: 11,
                            }}
                          >
                            {getSubjectName(item.subjectId)}
                          </Tag>
                          {item.priority === 'high' && !item.completedAt && (
                            <ThunderboltOutlined style={{ color: '#ff4d4f' }} />
                          )}
                        </Space>
                      }
                      description={
                        <Space split={<Text type="secondary">·</Text>}>
                          <span>
                            <ClockCircleOutlined /> 预估 {item.estimatedMinutes}分钟
                          </span>
                          {item.completedAt && item.actualMinutes && (
                            <span>实际 {item.actualMinutes}分钟</span>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <AddHomeworkModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />

      <AddHomeworkModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedHomework(null);
        }}
        editHomework={selectedHomework || undefined}
      />

      <CompleteHomeworkModal
        open={completeModalOpen}
        homework={selectedHomework}
        onClose={() => {
          setCompleteModalOpen(false);
          setSelectedHomework(null);
        }}
        onComplete={handleComplete}
      />
    </div>
  );
};
