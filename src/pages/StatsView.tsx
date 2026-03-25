import React, { useEffect, useMemo } from 'react';
import { Typography, Progress, Tag } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  FireOutlined,
  BarChartOutlined,
  StarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useSubjectStore } from '../stores/subjectStore';
import { usePointsStore } from '../stores/pointsStore';
import { initializeDatabase } from '../lib/db';

const { Title, Text } = Typography;

export const StatsView: React.FC = () => {
  const { loadHomework, homework, loading } = useHomeworkStore();
  const { loadSubjects, subjects } = useSubjectStore();
  const { loadPointsData, totalPoints, streak, pointsLog } = usePointsStore();

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await Promise.all([loadHomework(), loadSubjects(), loadPointsData()]);
    };
    init();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = dayjs().startOf('week');
    const monthStart = dayjs().startOf('month');

    const allCompleted = homework.filter((h) => h.completedAt);
    const allPending = homework.filter((h) => !h.completedAt);

    // Time stats
    const totalEstimated = homework.reduce((sum, h) => sum + h.estimatedMinutes, 0);
    const totalActual = allCompleted.reduce((sum, h) => sum + (h.actualMinutes || 0), 0);

    // Completion rate
    const completionRate = homework.length > 0
      ? Math.round((allCompleted.length / homework.length) * 100)
      : 0;

    // This week stats
    const thisWeekHomework = homework.filter((h) => {
      const dueDate = dayjs(h.dueDate);
      return dueDate.isAfter(weekStart) && dueDate.isBefore(dayjs().endOf('week'));
    });
    const thisWeekCompleted = thisWeekHomework.filter((h) => h.completedAt);

    // This month stats
    const thisMonthHomework = homework.filter((h) => {
      const dueDate = dayjs(h.dueDate);
      return dueDate.isAfter(monthStart) && dueDate.isBefore(dayjs().endOf('month'));
    });
    const thisMonthCompleted = thisMonthHomework.filter((h) => h.completedAt);

    // Subject breakdown
    const subjectStats: Record<string, { total: number; completed: number; estimated: number; actual: number }> = {};
    homework.forEach((h) => {
      if (!subjectStats[h.subjectId]) {
        subjectStats[h.subjectId] = { total: 0, completed: 0, estimated: 0, actual: 0 };
      }
      subjectStats[h.subjectId].total++;
      subjectStats[h.subjectId].estimated += h.estimatedMinutes;
      if (h.completedAt) {
        subjectStats[h.subjectId].completed++;
        subjectStats[h.subjectId].actual += h.actualMinutes || 0;
      }
    });

    // Priority breakdown
    const priorityStats = {
      high: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      low: { total: 0, completed: 0 },
    };
    homework.forEach((h) => {
      priorityStats[h.priority].total++;
      if (h.completedAt) {
        priorityStats[h.priority].completed++;
      }
    });

    // Overdue count
    const overdue = allPending.filter((h) => new Date(h.dueDate) < now).length;

    // Accuracy (how close estimates are to actual)
    const accurateEstimates = allCompleted.filter(
      (h) => h.actualMinutes && Math.abs(h.estimatedMinutes - h.actualMinutes) < 10
    ).length;
    const estimateAccuracy = allCompleted.length > 0
      ? Math.round((accurateEstimates / allCompleted.length) * 100)
      : 0;

    return {
      total: homework.length,
      completed: allCompleted.length,
      pending: allPending.length,
      overdue,
      totalEstimated,
      totalActual,
      completionRate,
      thisWeek: {
        total: thisWeekHomework.length,
        completed: thisWeekCompleted.length,
      },
      thisMonth: {
        total: thisMonthHomework.length,
        completed: thisMonthCompleted.length,
      },
      subjectStats,
      priorityStats,
      estimateAccuracy,
    };
  }, [homework]);

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', overflow: 'auto' }}>
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
          统计
        </Title>
        <Text style={{ color: 'var(--color-on-surface-variant)' }}>
          学习数据和成就
        </Text>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Gamification Hero Card */}
        <div
          style={{
            padding: 32,
            borderRadius: 24,
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dim) 100%)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 32,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <TrophyOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.9)' }} />
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                  总积分
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                  {totalPoints}
                </div>
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <FireOutlined style={{ fontSize: 32, color: '#ff9f43' }} />
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                    连续天数
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#ff9f43', letterSpacing: '-0.02em' }}>
                    {streak}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Asymmetrical */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* Total Homework */}
          <div
            style={{
              padding: 20,
              borderRadius: 20,
              background: 'var(--color-surface-container-lowest)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <BarChartOutlined style={{ color: 'var(--color-secondary)', fontSize: 18 }} />
              <Text style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                总作业
              </Text>
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-on-surface)' }}>
              {stats.total}
            </div>
            <Text style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
              {stats.completed} 已完成
            </Text>
          </div>

          {/* Completion Rate */}
          <div
            style={{
              padding: 20,
              borderRadius: 20,
              background: 'var(--color-surface-container-lowest)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: 18 }} />
              <Text style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                完成率
              </Text>
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-on-surface)' }}>
              {stats.completionRate}%
            </div>
            <Progress
              percent={stats.completionRate}
              showInfo={false}
              strokeColor={{
                '0%': 'var(--color-error-container)',
                '100%': 'var(--color-success-container)',
              }[stats.completionRate]}
              style={{ marginTop: 8 }}
            />
          </div>

          {/* Time Stats */}
          <div
            style={{
              padding: 20,
              borderRadius: 20,
              background: 'var(--color-surface-container-lowest)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ClockCircleOutlined style={{ color: 'var(--color-tertiary)', fontSize: 18 }} />
              <Text style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>
                时间统计
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  {formatTime(stats.totalEstimated)}
                </div>
                <Text style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                  预估
                </Text>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  {formatTime(stats.totalActual)}
                </div>
                <Text style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                  实际
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <StarOutlined style={{ color: 'var(--color-primary)', fontSize: 18 }} />
            <Title level={5} style={{ margin: 0, fontWeight: 600, color: 'var(--color-on-surface)' }}>
              科目分布
            </Title>
          </div>

          {Object.keys(stats.subjectStats).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text style={{ color: 'var(--color-on-surface-variant)' }}>
                暂无数据
              </Text>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {Object.entries(stats.subjectStats).map(([subjectId, data]) => (
                <div
                  key={subjectId}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    background: 'var(--color-surface-container-low)',
                  }}
                >
                  <Tag
                    style={{
                      background: getSubjectColor(subjectId),
                      border: 'none',
                      borderRadius: 9999,
                      marginBottom: 12,
                    }}
                  >
                    {getSubjectName(subjectId)}
                  </Tag>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}>作业</Text>
                      <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-on-surface)' }}>
                        {data.completed}/{data.total}
                      </Text>
                    </div>
                    <Progress
                      percent={data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <ThunderboltOutlined style={{ color: 'var(--color-tertiary)', fontSize: 18 }} />
            <Title level={5} style={{ margin: 0, fontWeight: 600, color: 'var(--color-on-surface)' }}>
              优先级分布
            </Title>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            {Object.entries(stats.priorityStats).map(([priority, data]) => {
              const colors = {
                high: { bg: 'var(--color-error-container)', text: 'var(--color-error)', label: '高' },
                medium: { bg: 'var(--color-warning-container)', text: 'var(--color-warning)', label: '中' },
                low: { bg: 'var(--color-success-container)', text: 'var(--color-success)', label: '低' },
              };
              const colorSet = colors[priority as keyof typeof colors];

              return (
                <div
                  key={priority}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 16,
                    background: colorSet.bg,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: colorSet.text, fontWeight: 600, marginBottom: 4 }}>
                    {colorSet.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: colorSet.text }}>
                    {data.completed}/{data.total}
                  </div>
                  <div style={{ fontSize: 11, color: colorSet.text, opacity: 0.8 }}>
                    已完成
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Points Log */}
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <TrophyOutlined style={{ color: 'var(--color-primary)', fontSize: 18 }} />
            <Title level={5} style={{ margin: 0, fontWeight: 600, color: 'var(--color-on-surface)' }}>
              最近积分记录
            </Title>
          </div>

          {pointsLog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Text style={{ color: 'var(--color-on-surface-variant)' }}>
                暂无记录
              </Text>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pointsLog.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'var(--color-surface-container-low)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--color-primary-container)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrophyOutlined style={{ color: 'var(--color-primary)', fontSize: 14 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--color-on-surface)', fontSize: 13 }}>
                        {log.reason}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>
                        {dayjs(log.createdAt).format('M月D日 HH:mm')}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      fontSize: 16,
                    }}
                  >
                    +{log.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
