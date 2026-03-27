import React, { useEffect, useState } from 'react';
import { Typography, Input, Button, Tag, Space, Modal, message } from 'antd';
import { PlusOutlined, ThunderboltOutlined, ClockCircleOutlined, CheckOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          今天
        </Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text
            type="secondary"
            style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}
          >
            {formatDate()}
          </Text>
          {todayHomework.length > 0 && (
            <Tag
              style={{
                background: 'var(--color-primary-container)',
                color: 'var(--color-primary)',
                border: 'none',
                borderRadius: 9999,
                padding: '2px 12px',
                fontWeight: 500,
              }}
            >
              {pendingHomework.length}项待完成
            </Tag>
          )}
        </div>
      </div>

      {/* Stats Cards - Asymmetrical Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          padding: '24px 32px',
        }}
      >
        {/* Estimated Time Card */}
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ClockCircleOutlined style={{ color: 'var(--color-secondary)', fontSize: 16 }} />
            <Text
              type="secondary"
              style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}
            >
              预估时间
            </Text>
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 24,
              color: 'var(--color-on-surface)',
              letterSpacing: '-0.02em',
            }}
          >
            {formatTime(totalEstimated)}
          </div>
        </div>

        {/* Completed Card */}
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckOutlined style={{ color: 'var(--color-success)', fontSize: 16 }} />
            <Text
              type="secondary"
              style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}
            >
              已完成
            </Text>
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 24,
              color: 'var(--color-on-surface)',
              letterSpacing: '-0.02em',
            }}
          >
            {formatTime(totalActual)}
          </div>
        </div>

        {/* Completion Rate Card */}
        <div
          style={{
            padding: 20,
            borderRadius: 20,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dim) 100%)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrophyOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }} />
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              完成率
            </Text>
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 24,
              color: 'var(--color-on-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {completionRate}%
          </div>
        </div>
      </div>

      {/* Quick Add - Floating Card */}
      <div style={{ padding: '0 32px 16px' }}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: 12,
            borderRadius: 20,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Input
            placeholder="快速添加作业..."
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            onPressEnter={handleQuickAdd}
            prefix={<PlusOutlined style={{ color: 'var(--color-on-surface-variant)' }} />}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            onClick={handleQuickAdd}
            style={{
              paddingInline: 24,
              fontWeight: 500,
            }}
          >
            添加
          </Button>
        </div>
      </div>

      {/* Task List - No borders, tonal separation */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 32px' }}>
        {pendingHomework.length === 0 && completedHomework.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 32px',
              borderRadius: 24,
              background: 'var(--color-surface-container)',
              marginTop: 16,
            }}
          >
            <div
              style={{
                fontSize: 48,
                marginBottom: 16,
              }}
            >
              🎉
            </div>
            <Text
              style={{
                display: 'block',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--color-on-surface)',
                marginBottom: 8,
              }}
            >
              今天没有作业!
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: 13, color: 'var(--color-on-surface-variant)' }}
            >
              点击上方输入框添加
            </Text>
          </div>
        ) : (
          <>
            {/* Pending Tasks */}
            {pendingHomework.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {pendingHomework.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 16,
                      marginBottom: index < pendingHomework.length - 1 ? 8 : 0,
                      borderRadius: 16,
                      background: 'var(--color-surface-container-lowest)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.2s ease',
                    }}
                    className="task-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {/* Priority Indicator */}
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

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text
                            style={{
                              fontWeight: 500,
                              color: 'var(--color-on-surface)',
                            }}
                          >
                            {item.title}
                          </Text>
                          <Tag
                            style={{
                              background: getSubjectColor(item.subjectId),
                              border: 'none',
                              borderRadius: 9999,
                              fontSize: 11,
                              padding: '2px 10px',
                              fontWeight: 500,
                            }}
                          >
                            {getSubjectName(item.subjectId)}
                          </Tag>
                          {item.priority === 'high' && (
                            <ThunderboltOutlined style={{ color: 'var(--color-error)', fontSize: 14 }} />
                          )}
                        </div>
                        <Space separator={<Text type="secondary">·</Text>}>
                          <span style={{ color: 'var(--color-on-surface-variant)', fontSize: 13 }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {item.estimatedMinutes}分钟
                          </span>
                        </Space>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleStartTask(item)}
                          style={{
                            borderRadius: 9999,
                            fontWeight: 500,
                          }}
                        >
                          开始
                        </Button>
                        <Button
                          type="text"
                          size="small"
                          danger
                          onClick={() => handleDelete(item)}
                          style={{ borderRadius: 9999 }}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Tasks */}
            {completedHomework.length > 0 && (
              <>
                <Text
                  style={{
                    display: 'block',
                    marginBottom: 12,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-on-surface-variant)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  已完成
                </Text>
                {completedHomework.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 16,
                      marginBottom: index < completedHomework.length - 1 ? 8 : 0,
                      borderRadius: 16,
                      background: 'var(--color-surface-container)',
                      opacity: 0.7,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <CheckOutlined
                        style={{
                          color: 'var(--color-success)',
                          marginTop: 4,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <Text
                          delete
                          style={{
                            color: 'var(--color-on-surface-variant)',
                          }}
                        >
                          {item.title}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Space
                            separator={<Text type="secondary">·</Text>}
                            style={{ fontSize: 12 }}
                          >
                            <span style={{ color: 'var(--color-on-surface-variant)' }}>
                              预估 {item.estimatedMinutes}分钟
                            </span>
                            <span style={{ color: 'var(--color-on-surface-variant)' }}>
                              实际 {item.actualMinutes}分钟
                            </span>
                          </Space>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Gamification Footer - Glass Effect */}
      <div
        style={{
          padding: '16px 32px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          borderTop: 'none',
          textAlign: 'center',
          borderRadius: '24px 24px 0 0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FireOutlined style={{ color: '#ff9f43', fontSize: 16 }} />
            <Text style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>
              {streak}天连续
            </Text>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--color-outline-variant)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrophyOutlined style={{ color: 'var(--color-primary)', fontSize: 16 }} />
            <Text style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>
              {totalPoints}积分
            </Text>
          </div>
        </div>
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
