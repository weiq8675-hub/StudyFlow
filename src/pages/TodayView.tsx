import React, { useEffect, useState } from 'react';
import { Typography, Input, Button, List, Tag, Space, Modal, message, Empty } from 'antd';
import { PlusOutlined, ThunderboltOutlined, ClockCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useSubjectStore } from '../stores/subjectStore';
import { usePointsStore } from '../stores/pointsStore';
import { initializeDatabase } from '../lib/db';
import { AddHomeworkModal } from '../components/AddHomeworkModal';
import { CompleteHomeworkModal } from '../components/CompleteHomeworkModal';
import type { Homework } from '../types';

const { Title, Text } = Typography;

export const TodayView: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const {
    loadHomework,
    getTodayHomework,
    deleteHomework,
    loading,
  } = useHomeworkStore();

  const { loadSubjects, subjects } = useSubjectStore();
  const { totalPoints, streak, loadPointsData, awardPoints } = usePointsStore();

  const todayHomework = getTodayHomework();
  const pendingHomework = todayHomework.filter((h) => !h.completedAt);
  const completedHomework = todayHomework.filter((h) => h.completedAt);

  // Calculate stats
  const totalEstimated = pendingHomework.reduce((sum, h) => sum + h.estimatedMinutes, 0);
  const totalActual = completedHomework.reduce((sum, h) => sum + (h.actualMinutes || 0), 0);
  const completionRate = todayHomework.length > 0
    ? Math.round((completedHomework.length / todayHomework.length) * 100)
    : 0;

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

  const handleQuickAdd = () => {
    if (quickAddTitle.trim()) {
      setAddModalOpen(true);
    }
  };

  const handleStartTask = (homework: Homework) => {
    setSelectedHomework(homework);
    setCompleteModalOpen(true);
  };

  const handleComplete = async (actualMinutes: number) => {
    if (!selectedHomework) return;

    await useHomeworkStore.getState().completeHomework(selectedHomework.id, actualMinutes);
    const pointsAwarded = await awardPoints(selectedHomework, actualMinutes);

    message.success(`完成! +${pointsAwarded} 积分`);
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

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || '未知科目';
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || '#f0f0f0';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = () => {
    const now = new Date();
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 · ${days[now.getDay()]}`;
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
        <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
          今天
        </Title>
        <Text type="secondary">{formatDate()}</Text>
        {todayHomework.length > 0 && (
          <Text type="secondary" style={{ marginLeft: 8 }}>
            · {pendingHomework.length}项待完成
          </Text>
        )}
      </div>

      {/* Stats Bar */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
        }}
      >
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            预估时间
          </Text>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {formatTime(totalEstimated)}
          </div>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            已完成
          </Text>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {formatTime(totalActual)}
          </div>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            完成率
          </Text>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{completionRate}%</div>
        </div>
      </div>

      {/* Quick Add */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="快速添加作业..."
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            onPressEnter={handleQuickAdd}
            prefix={<PlusOutlined style={{ color: '#999' }} />}
          />
          <Button type="primary" onClick={handleQuickAdd}>
            添加
          </Button>
        </Space.Compact>
      </div>

      {/* Task List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px' }}>
        {pendingHomework.length === 0 && completedHomework.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                今天没有作业! 🎉
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  点击上方输入框添加
                </Text>
              </span>
            }
            style={{ marginTop: 80 }}
          />
        ) : (
          <>
            {/* Pending Tasks */}
            {pendingHomework.length > 0 && (
              <List
                dataSource={pendingHomework}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="start"
                        type="primary"
                        size="small"
                        onClick={() => handleStartTask(item)}
                      >
                        开始
                      </Button>,
                      <Button
                        key="delete"
                        type="text"
                        danger
                        size="small"
                        onClick={() => handleDelete(item)}
                      >
                        删除
                      </Button>,
                    ]}
                    style={{ borderBottom: '1px solid #f5f5f5' }}
                  >
                    <List.Item.Meta
                      avatar={
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
                      }
                      title={
                        <Space>
                          <Text>{item.title}</Text>
                          <Tag
                            style={{
                              background: getSubjectColor(item.subjectId),
                              border: 'none',
                              fontSize: 11,
                            }}
                          >
                            {getSubjectName(item.subjectId)}
                          </Tag>
                          {item.priority === 'high' && (
                            <ThunderboltOutlined style={{ color: '#ff4d4f' }} />
                          )}
                        </Space>
                      }
                      description={
                        <Space split={<Text type="secondary">·</Text>}>
                          <span>
                            <ClockCircleOutlined /> {item.estimatedMinutes}分钟
                          </span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}

            {/* Completed Tasks */}
            {completedHomework.length > 0 && (
              <>
                <Text
                  type="secondary"
                  style={{ display: 'block', marginTop: 24, marginBottom: 8 }}
                >
                  已完成
                </Text>
                <List
                  dataSource={completedHomework}
                  renderItem={(item) => (
                    <List.Item
                      style={{
                        borderBottom: '1px solid #f5f5f5',
                        opacity: 0.6,
                      }}
                    >
                      <List.Item.Meta
                        avatar={<CheckOutlined style={{ color: '#52c41a' }} />}
                        title={
                          <Text delete={true}>{item.title}</Text>
                        }
                        description={
                          <Space split={<Text type="secondary">·</Text>}>
                            <span>预估 {item.estimatedMinutes}分钟</span>
                            <span>实际 {item.actualMinutes}分钟</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Gamification Footer */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
          textAlign: 'center',
        }}
      >
        <Text type="secondary">
          🔥 {streak}天连续 · {totalPoints}积分
        </Text>
      </div>

      {/* Modals */}
      <AddHomeworkModal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setQuickAddTitle('');
        }}
        initialTitle={quickAddTitle}
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
