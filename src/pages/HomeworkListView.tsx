import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography,
  Tag,
  Space,
  Select,
  Button,
  Modal,
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
  PlusOutlined,
  FilterOutlined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div style={{
        padding: 48,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--color-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid var(--color-primary)',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
        <Text type="secondary">加载中...</Text>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
      {/* Header - Editorial Style */}
      <div
        style={{
          padding: '32px 32px 24px',
          background: 'var(--color-surface-container-lowest)',
          borderRadius: '0 0 24px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title
              level={2}
              style={{
                margin: 0,
                marginBottom: 8,
                fontWeight: 700,
                color: 'var(--color-on-surface)',
                letterSpacing: '-0.02em',
              }}
            >
              作业库
            </Title>
            <Text style={{ color: 'var(--color-on-surface-variant)' }}>
              共 {filteredHomework.length} 项作业
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
            style={{ borderRadius: 9999, fontWeight: 500 }}
          >
            添加作业
          </Button>
        </div>
      </div>

      {/* Filters - Floating Card */}
      <div style={{ padding: '16px 32px 0' }}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
            padding: 16,
            borderRadius: 20,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <FilterOutlined style={{ color: 'var(--color-on-surface-variant)', marginRight: 4 }} />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 130 }}
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
            style={{ width: 130 }}
            options={[
              { value: 'all', label: '全部科目' },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 130 }}
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
            <Button
              icon={<CalendarOutlined />}
              style={{ borderRadius: 9999 }}
            >
              {dateRange && dateRange[0] && dateRange[1]
                ? `${dateRange[0].format('M/D')} - ${dateRange[1].format('M/D')}`
                : '日期范围'}
            </Button>
          </Popover>

          {hasActiveFilters && (
            <Button onClick={clearFilters} style={{ borderRadius: 9999 }}>
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {/* List - No borders, tonal separation */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 32px 32px' }}>
        {filteredHomework.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 32px',
              borderRadius: 24,
              background: 'var(--color-surface-container)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <Text
              style={{
                display: 'block',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--color-on-surface)',
                marginBottom: 8,
              }}
            >
              {hasActiveFilters ? '没有符合条件的作业' : '暂无作业'}
            </Text>
            <Text style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}>
              {hasActiveFilters ? '尝试调整筛选条件' : '点击"添加作业"开始'}
            </Text>
          </div>
        ) : (
          groupedHomework.map(({ date, items }) => (
            <div key={date} style={{ marginTop: 16 }}>
              <Text
                style={{
                  display: 'block',
                  marginBottom: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  color: dayjs(date).isBefore(dayjs(), 'day')
                    ? 'var(--color-error)'
                    : 'var(--color-on-surface-variant)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {formatDateLabel(date)}
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: 'var(--color-surface-container-lowest)',
                      boxShadow: 'var(--shadow-sm)',
                      opacity: item.completedAt ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    className="task-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Status Indicator */}
                      {item.completedAt ? (
                        <CheckOutlined
                          style={{
                            color: 'var(--color-success)',
                            marginTop: 4,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: item.priority === 'high'
                              ? 'var(--color-error)'
                              : 'var(--color-outline-variant)',
                            marginTop: 6,
                            flexShrink: 0,
                          }}
                        />
                      )}

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text
                            delete={!!item.completedAt}
                            style={{
                              fontWeight: 500,
                              color: item.completedAt
                                ? 'var(--color-on-surface-variant)'
                                : 'var(--color-on-surface)',
                            }}
                          >
                            {item.title}
                          </Text>
                          <Tag
                            style={{
                              background: getSubjectColor(item.subjectId),
                              border: 'none',
                              borderRadius: 9999,
                              fontSize: 10,
                              padding: '1px 8px',
                            }}
                          >
                            {getSubjectName(item.subjectId)}
                          </Tag>
                          {item.priority === 'high' && !item.completedAt && (
                            <ThunderboltOutlined style={{ color: 'var(--color-error)', fontSize: 12 }} />
                          )}
                        </div>
                        <Space
                          separator={<Text type="secondary">·</Text>}
                          style={{ fontSize: 12 }}
                        >
                          <span style={{ color: 'var(--color-on-surface-variant)' }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            预估 {item.estimatedMinutes}分钟
                          </span>
                          {item.completedAt && item.actualMinutes && (
                            <span style={{ color: 'var(--color-on-surface-variant)' }}>
                              实际 {item.actualMinutes}分钟
                            </span>
                          )}
                        </Space>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {!item.completedAt && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleStartTask(item)}
                            style={{ borderRadius: 9999 }}
                          >
                            开始
                          </Button>
                        )}
                        {!item.completedAt && (
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditTask(item)}
                            style={{ borderRadius: 9999 }}
                          />
                        )}
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(item)}
                          style={{ borderRadius: 9999 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
