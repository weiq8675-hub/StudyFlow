import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Segmented, Spin } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { usePointsStore } from '../stores/pointsStore';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

type FilterKey = '全部' | '作业' | '奖励' | '连续';

function categorizeLog(reason: string): FilterKey[] {
  const categories: FilterKey[] = [];
  if (reason.startsWith('完成作业')) categories.push('作业');
  if (reason.includes('按时') || reason.includes('预估')) categories.push('奖励');
  if (reason.includes('连续')) categories.push('连续');
  return categories.length > 0 ? categories : ['作业'];
}

interface DateGroup {
  label: string;
  logs: { id: string; reason: string; points: number; time: string }[];
}

function groupLogsByDate(
  logs: { id: string; reason: string; points: number; createdAt: Date }[]
): DateGroup[] {
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  const groups: Record<string, DateGroup> = {};

  for (const log of logs) {
    const d = dayjs(log.createdAt);
    let label: string;
    if (d.isSame(today, 'day')) {
      label = '今天';
    } else if (d.isSame(yesterday, 'day')) {
      label = '昨天';
    } else {
      label = d.format('M月D日');
    }

    if (!groups[label]) {
      groups[label] = { label, logs: [] };
    }
    groups[label].logs.push({
      id: log.id,
      reason: log.reason,
      points: log.points,
      time: d.format('HH:mm'),
    });
  }

  return Object.values(groups);
}

const RULES = [
  { emoji: '📐', text: '数学作业 30分钟 × 高优先级3 = 90基础积分' },
  { emoji: '⏰', text: '在截止日期前完成 = +10分' },
  { emoji: '🎯', text: '预估时间和实际相差<10分钟 = +5分' },
  { emoji: '🔥', text: '连续学习天数 × 5分 (上限50分)' },
];

export const PointsView: React.FC = () => {
  const navigate = useNavigate();
  const { totalPoints, streak, pointsLog, loadPointsData } = usePointsStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('全部');
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    (async () => {
      await loadPointsData();
      setLoading(false);
    })();
  }, [loadPointsData]);

  const filteredLogs = useMemo(() => {
    if (filter === '全部') return pointsLog;
    return pointsLog.filter((log) => categorizeLog(log.reason).includes(filter));
  }, [pointsLog, filter]);

  const dateGroups = useMemo(() => groupLogsByDate(filteredLogs), [filteredLogs]);

  const streakBonus = Math.min(streak * 5, 50);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700, color: 'var(--color-on-surface)' }}>
          积分中心
        </Title>
        <Text style={{ color: 'var(--color-on-surface-variant)', fontSize: 13 }}>
          学习奖励与积分明细
        </Text>
      </div>

      {/* Status Anchor */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: 24,
          background: 'var(--color-surface-container-lowest)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <TrophyOutlined style={{ fontSize: 20, color: 'var(--color-primary)', marginBottom: 4 }} />
            <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginBottom: 2 }}>
              总积分
            </div>
            <div style={{ fontWeight: 700, fontSize: 28, color: 'var(--color-primary)' }}>
              {totalPoints.toLocaleString()}
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--color-outline-variant)', margin: '4px 0' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <FireOutlined style={{ fontSize: 20, color: '#ff9f43', marginBottom: 4 }} />
            <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginBottom: 2 }}>
              连续
            </div>
            <div style={{ fontWeight: 700, fontSize: 28, color: '#ff9f43' }}>
              {streak}天
            </div>
          </div>
          {streak > 0 && (
            <>
              <div style={{ width: 1, background: 'var(--color-outline-variant)', margin: '4px 0' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <ThunderboltOutlined style={{ fontSize: 20, color: 'var(--color-tertiary)', marginBottom: 4 }} />
                <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginBottom: 2 }}>
                  加成
                </div>
                <div style={{ fontWeight: 700, fontSize: 28, color: 'var(--color-tertiary)' }}>
                  ×{streak}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-on-surface-variant)' }}>
                  上限{streakBonus}分
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: 16 }}>
        <Segmented
          options={['全部', '作业', '奖励', '连续']}
          value={filter}
          onChange={(v) => setFilter(v as FilterKey)}
          block
        />
      </div>

      {/* Transaction Ledger */}
      {dateGroups.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            borderRadius: 24,
            background: 'var(--color-surface-container-lowest)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {pointsLog.length === 0 ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <Title level={5} style={{ color: 'var(--color-on-surface)', marginBottom: 8 }}>
                还没有积分记录
              </Title>
              <Text style={{ color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: 20 }}>
                完成第一次作业来获取积分吧
              </Text>
              <button
                onClick={() => navigate('/today')}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dim) 100%)',
                  color: 'var(--color-on-primary)',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '10px 24px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                开始学习
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <Text style={{ color: 'var(--color-on-surface-variant)' }}>
                没有符合条件的记录
              </Text>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {dateGroups.map((group) => (
            <div key={group.label}>
              {/* Date Header */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-on-surface-variant)',
                  marginBottom: 8,
                  paddingLeft: 4,
                }}
              >
                {group.label}
              </div>
              {/* Rows */}
              <div
                style={{
                  borderRadius: 20,
                  background: 'var(--color-surface-container-lowest)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                {group.logs.map((log, idx) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 20px',
                      background: idx % 2 === 1 ? 'var(--color-surface-container-low)' : 'transparent',
                      borderBottom:
                        idx < group.logs.length - 1
                          ? '1px solid var(--color-surface-container)'
                          : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500,
                          color: 'var(--color-on-surface)',
                          fontSize: 13,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.reason}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                        {log.time}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: log.points >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                        marginLeft: 16,
                        flexShrink: 0,
                      }}
                    >
                      {log.points >= 0 ? `+${log.points}` : log.points}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible Rules */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setRulesOpen(!rulesOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-primary)',
            fontWeight: 500,
            fontSize: 14,
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {rulesOpen ? '▲' : '▼'} 查看积分规则
        </button>

        {rulesOpen && (
          <div
            style={{
              marginTop: 12,
              padding: '20px 24px',
              borderRadius: 24,
              background: 'var(--color-surface-container)',
            }}
          >
            {RULES.map((rule) => (
              <div
                key={rule.emoji}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: '1px solid var(--color-outline-variant)',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{rule.emoji}</span>
                <Text style={{ color: 'var(--color-on-surface)', fontSize: 13, lineHeight: 1.6 }}>
                  {rule.text}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
