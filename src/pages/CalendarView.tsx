import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Calendar, Badge, List, Tag, Space, Empty, Button, Modal } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ClockCircleOutlined, ThunderboltOutlined, DeleteOutlined } from '@ant-design/icons';
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
      <div style={{ padding: '2px 4px' }}>
        {data.pending > 0 && (
          <Badge
            status="error"
            text={
              <span style={{ fontSize: 11 }}>
                {data.pending}待完成
              </span>
            }
          />
        )}
        {data.completed > 0 && (
          <div>
            <Badge
              status="success"
              text={
                <span style={{ fontSize: 11 }}>
                  {data.completed}已完成
                </span>
              }
            />
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
          日历
        </Title>
        <Text type="secondary">查看和管理作业日程</Text>
      </div>

      {/* Calendar and Detail */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Calendar */}
        <div style={{ flex: 1, padding: 16, borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
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

        {/* Selected Date Detail */}
        <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              {formatDateLabel()}
            </Title>
            <Button type="primary" size="small" onClick={() => setAddModalOpen(true)}>
              添加
            </Button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
            {selectedDateHomework.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="当天没有作业"
                style={{ marginTop: 60 }}
              />
            ) : (
              <List
                dataSource={selectedDateHomework}
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
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#52c41a', marginTop: 8 }} />
                        ) : (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: item.priority === 'high' ? '#ff4d4f' : '#d9d9d9',
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
