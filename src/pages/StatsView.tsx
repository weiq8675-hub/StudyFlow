import React, { useEffect, useMemo } from 'react';
import { Typography, Card, Row, Col, Progress, List, Tag, Empty, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  FireOutlined,
  BarChartOutlined,
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

  // Recent points log
  const recentPoints = pointsLog.slice(0, 10);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text type="secondary">加载中...</Text>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={4} style={{ margin: 0 }}>
          统计
        </Title>
        <Text type="secondary">学习数据和成就</Text>
      </div>

      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {/* Gamification Stats */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总积分"
                value={totalPoints}
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="连续天数"
                value={streak}
                prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
                suffix="天"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="完成率"
                value={stats.completionRate}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="预估准确率"
                value={stats.estimateAccuracy}
                prefix={<BarChartOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        {/* Time Stats */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="预估总时长"
                value={formatTime(stats.totalEstimated)}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="实际总时长"
                value={formatTime(stats.totalActual)}
                prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="过期作业"
                value={stats.overdue}
                prefix={<ThunderboltOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: stats.overdue > 0 ? '#ff4d4f' : undefined }}
              />
            </Card>
          </Col>
        </Row>

        {/* Completion Progress */}
        <Card title="完成进度" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">总体</Text>
                <Progress
                  type="circle"
                  percent={stats.completionRate}
                  format={() => `${stats.completed}/${stats.total}`}
                />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">本周</Text>
                <Progress
                  type="circle"
                  percent={stats.thisWeek.total > 0 ? Math.round((stats.thisWeek.completed / stats.thisWeek.total) * 100) : 0}
                  format={() => `${stats.thisWeek.completed}/${stats.thisWeek.total}`}
                  strokeColor="#52c41a"
                />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">本月</Text>
                <Progress
                  type="circle"
                  percent={stats.thisMonth.total > 0 ? Math.round((stats.thisMonth.completed / stats.thisMonth.total) * 100) : 0}
                  format={() => `${stats.thisMonth.completed}/${stats.thisMonth.total}`}
                  strokeColor="#1677ff"
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Subject Breakdown */}
        <Card title="科目分布" style={{ marginBottom: 24 }}>
          {Object.keys(stats.subjectStats).length === 0 ? (
            <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              dataSource={Object.entries(stats.subjectStats).sort(([, a], [, b]) => b.total - a.total)}
              renderItem={([subjectId, data]) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Tag
                        style={{
                          background: getSubjectColor(subjectId),
                          border: 'none',
                          padding: '4px 12px',
                        }}
                      >
                        {getSubjectName(subjectId)}
                      </Tag>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>完成 {data.completed}/{data.total}</span>
                        <span>
                          预估 {formatTime(data.estimated)} / 实际 {formatTime(data.actual)}
                        </span>
                      </div>
                    }
                    description={
                      <Progress
                        percent={data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}
                        size="small"
                        showInfo={false}
                      />
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* Priority Breakdown */}
        <Card title="优先级分布" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">高优先级</Text>
                <Progress
                  type="circle"
                  percent={stats.priorityStats.high.total > 0 ? Math.round((stats.priorityStats.high.completed / stats.priorityStats.high.total) * 100) : 0}
                  format={() => `${stats.priorityStats.high.completed}/${stats.priorityStats.high.total}`}
                  strokeColor="#ff4d4f"
                />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">中优先级</Text>
                <Progress
                  type="circle"
                  percent={stats.priorityStats.medium.total > 0 ? Math.round((stats.priorityStats.medium.completed / stats.priorityStats.medium.total) * 100) : 0}
                  format={() => `${stats.priorityStats.medium.completed}/${stats.priorityStats.medium.total}`}
                  strokeColor="#faad14"
                />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">低优先级</Text>
                <Progress
                  type="circle"
                  percent={stats.priorityStats.low.total > 0 ? Math.round((stats.priorityStats.low.completed / stats.priorityStats.low.total) * 100) : 0}
                  format={() => `${stats.priorityStats.low.completed}/${stats.priorityStats.low.total}`}
                  strokeColor="#52c41a"
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Recent Points Log */}
        <Card title="最近积分记录">
          {recentPoints.length === 0 ? (
            <Empty description="暂无记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              dataSource={recentPoints}
              renderItem={(log) => (
                <List.Item>
                  <List.Item.Meta
                    title={log.reason}
                    description={dayjs(log.createdAt).format('M月D日 HH:mm')}
                  />
                  <Text style={{ color: log.points > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                    {log.points > 0 ? '+' : ''}{log.points}
                  </Text>
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>
    </div>
  );
};
