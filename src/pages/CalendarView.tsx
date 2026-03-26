import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Calendar, Tag, Space, Button, Modal } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ClockCircleOutlined, ThunderboltOutlined, DeleteOutlined, CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useSubjectStore } from '../stores/subjectStore';
import { usePointsStore } from '../stores/pointsStore';
import { AddHomeworkModal } from '../components/AddHomeworkModal';
import { CompleteHomeworkModal } from '../components/CompleteHomeworkModal';
import { initializeDatabase } from '../lib/db';
import type { Homework } from '../types';

const { Title, Text } = Typography;

export const CalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const { loadHomework, homework, deleteHomework, loading } = useHomeworkStore();
  const { loadSubjects, subjects } = useSubjectStore();
  const { loadPointsData, awardPoints } = usePointsStore();

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await Promise.all([loadHomework(), loadSubjects(), loadPointsData()]);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get homework counts by date for calendar badges
  const homeworkByDate = useMemo(() => {
    const map: Record<string, { total: number; pending: number; completed: number }> = {};
    homework.forEach((h) => {
      const dateKey = dayjs(h.dueDate).format('YYYY-MM-DD');
      if (!map[dateKey]) {
        map[dateKey] = { total: 0, pending: 0, completed: 0 };
      }
      map[dateKey].total++;
      if (h.completedAt) {
        map[dateKey].completed++;
      } else {
        map[dateKey].pending++;
      }
    });
    return map;
  }, [homework]);

  // Get homework for selected date
  const selectedDateHomework = useMemo(() => {
    const dateKey = selectedDate.format('YYYY-MM-DD');
    return homework.filter((h) => dayjs(h.dueDate).format('YYYY-MM-DD') === dateKey);
  }, [homework, selectedDate]);

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || '未知科目';
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || '#f0f0f0';
  };

  const handleStartTask = (h: Homework) => {
    setSelectedHomework(h);
    setCompleteModalOpen(true);
  };

  const handleComplete = async (actualMinutes: number) => {
    if (!selectedHomework) return;
    await useHomeworkStore.getState().completeHomework(selectedHomework.id, actualMinutes);
    await awardPoints(selectedHomework, actualMinutes);
    setCompleteModalOpen(false);
    setSelectedHomework(null);
  };

  const handleDelete = (h: Homework) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${h.title}" 吗?`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteHomework(h.id),
    });
  };

  const cellRender = (value: Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD');
    const data = homeworkByDate[dateKey];
    if (!data) return null;

    return (
      <div style={{ padding: '2px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.pending > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--color-error)',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
              {data.pending}待完成
            </span>
          </div>
        )}
        {data.completed > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--color-success)',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
              {data.completed}已完成
            </span>
          </div>
        )}
      </div>
    );
  };

  const formatDateLabel = () => {
    const today = dayjs();
    if (selectedDate.isSame(today, 'day')) return '今天';
    if (selectedDate.isSame(today.add(1, 'day'), 'day')) return '明天';
    if (selectedDate.isSame(today.subtract(1, 'day'), 'day')) return '昨天';
    return selectedDate.format('M月D日 dddd');
  };

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
          日历
        </Title>
        <Text style={{ color: 'var(--color-on-surface-variant)' }}>
          查看和管理作业日程
        </Text>
      </div>

      {/* Calendar and Detail - Asymmetrical Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 24, gap: 24 }}>
        {/* Calendar Card */}
        <div
          style={{
            flex: 1,
            borderRadius: 24,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
            padding: 24,
            overflow: 'auto',
          }}
        >
          <Calendar
            fullscreen={false}
            value={selectedDate}
            onSelect={setSelectedDate}
            cellRender={(current, info) => {
              if (info.type === 'date') {
                return cellRender(current);
              }
              return info.originNode;
            }}
          />
        </div>

        {/* Selected Date Detail Card */}
        <div
          style={{
            width: 380,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 24,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          {/* Detail Header */}
          <div
            style={{
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--color-surface-container-low)',
            }}
          >
            <Title
              level={5}
              style={{
                margin: 0,
                fontWeight: 600,
                color: 'var(--color-on-surface)',
              }}
            >
              {formatDateLabel()}
            </Title>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setAddModalOpen(true)}
              style={{ borderRadius: 9999 }}
            >
              添加
            </Button>
          </div>

          {/* Detail Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
            {selectedDateHomework.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 24px',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
                <Text style={{ color: 'var(--color-on-surface-variant)' }}>
                  当天没有作业
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedDateHomework.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: item.completedAt
                        ? 'var(--color-surface-container)'
                        : 'var(--color-surface-container-low)',
                      opacity: item.completedAt ? 0.7 : 1,
                    }}
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
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(item)}
                          style={{ borderRadius: 9999 }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddHomeworkModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        initialDueDate={selectedDate.toDate()}
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
