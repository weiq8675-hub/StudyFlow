import React, { useEffect, useState, useRef } from 'react';
import { Modal, Form, InputNumber, Button, Typography, Space, Tag, Divider } from 'antd';
import { ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useSubjectStore } from '../stores/subjectStore';
import type { Homework } from '../types';

const { Text } = Typography;

interface CompleteHomeworkModalProps {
  open: boolean;
  homework: Homework | null;
  onClose: () => void;
  onComplete: (actualMinutes: number) => void;
}

export const CompleteHomeworkModal: React.FC<CompleteHomeworkModalProps> = ({
  open,
  homework,
  onClose,
  onComplete,
}) => {
  const [actualMinutes, setActualMinutes] = useState(30);
  const { subjects, loadSubjects } = useSubjectStore();
  const prevHomeworkIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync actualMinutes when homework changes (not on every render)
  useEffect(() => {
    if (homework && homework.id !== prevHomeworkIdRef.current) {
      setActualMinutes(homework.estimatedMinutes);
      prevHomeworkIdRef.current = homework.id;
    }
  }, [homework]);

  if (!homework) return null;

  const subject = subjects.find((s) => s.id === homework.subjectId);

  const handleComplete = () => {
    onComplete(actualMinutes);
  };

  const getPointsEstimate = () => {
    const baseMultiplier = { high: 3, medium: 2, low: 1 }[homework.priority];
    const basePoints = homework.estimatedMinutes * baseMultiplier;
    const accuracyBonus = Math.abs(homework.estimatedMinutes - actualMinutes) < 10 ? 5 : 0;
    return basePoints + 10 + accuracyBonus; // +10 for on-time
  };

  return (
    <Modal
      title="完成作业"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="complete" type="primary" onClick={handleComplete}>
          确认完成
        </Button>,
      ]}
      destroyOnHidden
    >
      <div style={{ marginTop: 16 }}>
        {/* Homework Summary */}
        <div
          style={{
            padding: 16,
            background: 'var(--color-surface-container)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 16,
          }}
        >
          <Text strong style={{ fontSize: 16 }}>
            {homework.title}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Tag
                style={{
                  background: subject?.color || '#f0f0f0',
                  border: 'none',
                }}
              >
                {subject?.name || '未知科目'}
              </Tag>
              <Text type="secondary">
                <ClockCircleOutlined /> 预估 {homework.estimatedMinutes} 分钟
              </Text>
            </Space>
          </div>
        </div>

        {/* Actual Time Input */}
        <Form.Item label="实际用时 (分钟)" style={{ marginBottom: 16 }}>
          <InputNumber
            value={actualMinutes}
            onChange={(v) => setActualMinutes(v || homework.estimatedMinutes)}
            min={1}
            max={480}
            step={5}
            style={{ width: '100%' }}
            autoFocus
          />
        </Form.Item>

        {/* Time Comparison */}
        <Divider style={{ margin: '16px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Space size="large">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                预估
              </Text>
              <div style={{ fontSize: 18, fontWeight: 500 }}>
                {homework.estimatedMinutes}分钟
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                实际
              </Text>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color:
                    actualMinutes <= homework.estimatedMinutes
                      ? 'var(--color-success)'
                      : 'var(--color-error)',
                }}
              >
                {actualMinutes}分钟
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                差异
              </Text>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color:
                    Math.abs(actualMinutes - homework.estimatedMinutes) < 10
                      ? 'var(--color-success)'
                      : 'var(--color-warning)',
                }}
              >
                {actualMinutes > homework.estimatedMinutes ? '+' : ''}
                {actualMinutes - homework.estimatedMinutes}分钟
              </div>
            </div>
          </Space>
        </div>

        {/* Points Preview */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: 'var(--color-secondary-container)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
          }}
        >
          <TrophyOutlined style={{ color: 'var(--color-secondary)', marginRight: 8 }} />
          <Text>预计获得 </Text>
          <Text strong style={{ color: 'var(--color-secondary)' }}>
            +{getPointsEstimate()} 积分
          </Text>
        </div>
      </div>
    </Modal>
  );
};
