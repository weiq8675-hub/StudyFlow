import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  List,
  Button,
  Modal,
  Input,
  ColorPicker,
  message,
  Popconfirm,
  Divider,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClearOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';
import { db } from '../lib/db';
import { useSubjectStore } from '../stores/subjectStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHomeworkStore } from '../stores/homeworkStore';
import { usePointsStore } from '../stores/pointsStore';
import { initializeDatabase } from '../lib/db';
import type { Subject } from '../types';

const { Title, Text, Paragraph } = Typography;

export const SettingsView: React.FC = () => {
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectColor, setSubjectColor] = useState<string>('#e6f4ff');

  const { subjects, loadSubjects, addSubject, updateSubject, deleteSubject } = useSubjectStore();
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { homework, loadHomework } = useHomeworkStore();
  const { loadPointsData } = usePointsStore();

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await Promise.all([loadSubjects(), loadSettings(), loadHomework(), loadPointsData()]);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSubject = () => {
    setEditingSubject(null);
    setSubjectName('');
    setSubjectColor('#e6f4ff');
    setSubjectModalOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setSubjectColor(subject.color);
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectName.trim()) {
      message.error('请输入科目名称');
      return;
    }

    if (editingSubject) {
      await updateSubject(editingSubject.id, {
        name: subjectName.trim(),
        color: subjectColor,
      });
      message.success('科目已更新');
    } else {
      await addSubject(subjectName.trim(), subjectColor);
      message.success('科目已添加');
    }

    setSubjectModalOpen(false);
  };

  const handleDeleteSubject = async (subject: Subject) => {
    const hasHomework = homework.some((h) => h.subjectId === subject.id);
    if (hasHomework) {
      message.error('该科目下有作业，无法删除');
      return;
    }
    await deleteSubject(subject.id);
    message.success('科目已删除');
  };

  const handleColorChange = (color: Color) => {
    setSubjectColor(color.toHexString());
  };

  const handleClearData = async () => {
    try {
      await db.homework.clear();
      await db.pointsLog.clear();
      await loadHomework();
      await loadPointsData();
      message.success('数据已清空');
    } catch {
      message.error('清空失败');
    }
  };

  const handleExportData = async () => {
    try {
      const data = {
        homework: await db.homework.toArray(),
        subjects: await db.subjects.toArray(),
        pointsLog: await db.pointsLog.toArray(),
        settings: await db.settings.toArray(),
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      message.success('数据已导出');
    } catch {
      message.error('导出失败');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.homework) {
          await db.homework.clear();
          await db.homework.bulkAdd(
            data.homework.map((h: { dueDate: string; completedAt?: string; createdAt: string; updatedAt: string }) => ({
              ...h,
              dueDate: new Date(h.dueDate),
              completedAt: h.completedAt ? new Date(h.completedAt) : undefined,
              createdAt: new Date(h.createdAt),
              updatedAt: new Date(h.updatedAt),
            }))
          );
        }

        if (data.subjects) {
          await db.subjects.clear();
          await db.subjects.bulkAdd(
            data.subjects.map((s: { createdAt: string }) => ({
              ...s,
              createdAt: new Date(s.createdAt),
            }))
          );
        }

        if (data.pointsLog) {
          await db.pointsLog.clear();
          await db.pointsLog.bulkAdd(
            data.pointsLog.map((p: { createdAt: string }) => ({
              ...p,
              createdAt: new Date(p.createdAt),
            }))
          );
        }

        await Promise.all([loadHomework(), loadSubjects(), loadPointsData()]);
        message.success('数据已导入');
      } catch {
        message.error('导入失败，请检查文件格式');
      }
    };
    input.click();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={4} style={{ margin: 0 }}>
          设置
        </Title>
        <Text type="secondary">管理科目和应用设置</Text>
      </div>

      <div style={{ flex: 1, padding: 24, overflow: 'auto', maxWidth: 800 }}>
        {/* Subject Management */}
        <Card
          title="科目管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSubject}>
              添加科目
            </Button>
          }
          style={{ marginBottom: 24 }}
        >
          <List
            dataSource={subjects}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="edit"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEditSubject(item)}
                  />,
                  <Popconfirm
                    key="delete"
                    title="确定删除此科目?"
                    onConfirm={() => handleDeleteSubject(item)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: item.color,
                        border: '1px solid #d9d9d9',
                      }}
                    />
                  }
                  title={item.name}
                />
              </List.Item>
            )}
          />
        </Card>

        {/* Preferences */}
        <Card title="偏好设置" style={{ marginBottom: 24 }}>
          <List>
            <List.Item>
              <List.Item.Meta
                title="语言"
                description="界面显示语言"
              />
              <Select
                value={settings?.language || 'zh-CN'}
                onChange={(value) => updateSettings({ language: value })}
                style={{ width: 120 }}
                options={[
                  { value: 'zh-CN', label: '简体中文' },
                  { value: 'en-US', label: 'English' },
                ]}
              />
            </List.Item>
            <List.Item>
              <List.Item.Meta
                title="主题"
                description="界面主题颜色"
              />
              <Select
                value={settings?.theme || 'light'}
                onChange={(value) => updateSettings({ theme: value })}
                style={{ width: 120 }}
                options={[
                  { value: 'light', label: '浅色' },
                  { value: 'dark', label: '深色' },
                ]}
              />
            </List.Item>
          </List>
        </Card>

        {/* Data Management */}
        <Card title="数据管理" style={{ marginBottom: 24 }}>
          <List>
            <List.Item
              actions={[
                <Button key="export" icon={<ExportOutlined />} onClick={handleExportData}>
                  导出
                </Button>,
              ]}
            >
              <List.Item.Meta
                title="导出数据"
                description="将所有数据导出为JSON文件备份"
              />
            </List.Item>
            <List.Item
              actions={[
                <Button key="import" icon={<ImportOutlined />} onClick={handleImportData}>
                  导入
                </Button>,
              ]}
            >
              <List.Item.Meta
                title="导入数据"
                description="从JSON文件恢复数据"
              />
            </List.Item>
            <List.Item
              actions={[
                <Popconfirm
                  key="clear"
                  title="确定清空所有作业和积分数据?"
                  description="此操作不可恢复"
                  onConfirm={handleClearData}
                >
                  <Button danger icon={<ClearOutlined />}>
                    清空
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title="清空数据"
                description="清空所有作业和积分记录（科目不会被删除）"
              />
            </List.Item>
          </List>
        </Card>

        {/* About */}
        <Card title="关于">
          <Paragraph>
            <Text strong>StudyFlow</Text> - 学生作业管理应用
          </Paragraph>
          <Paragraph type="secondary">
            版本 1.0.0
          </Paragraph>
          <Divider style={{ margin: '12px 0' }} />
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            数据存储在浏览器本地，不会上传到服务器。
            建议定期导出数据备份。
          </Paragraph>
        </Card>
      </div>

      {/* Subject Modal */}
      <Modal
        title={editingSubject ? '编辑科目' : '添加科目'}
        open={subjectModalOpen}
        onOk={handleSaveSubject}
        onCancel={() => setSubjectModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>科目名称</Text>
          <Input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="输入科目名称"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text>颜色</Text>
          <div style={{ marginTop: 8 }}>
            <ColorPicker value={subjectColor} onChange={handleColorChange} showText />
          </div>
        </div>
      </Modal>
    </div>
  );
};
