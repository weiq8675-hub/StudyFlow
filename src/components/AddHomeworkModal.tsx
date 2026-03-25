import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Button, message } from 'antd';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useSubjectStore } from '../stores/subjectStore';
import type { Priority, HomeworkFormData } from '../types';
import dayjs from 'dayjs';

interface AddHomeworkModalProps {
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialDueDate?: Date;
  editHomework?: {
    id: string;
    title: string;
    subjectId: string;
    priority: Priority;
    estimatedMinutes: number;
    dueDate: Date;
  };
}

export const AddHomeworkModal: React.FC<AddHomeworkModalProps> = ({
  open,
  onClose,
  initialTitle = '',
  initialDueDate,
  editHomework,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { addHomework, updateHomework } = useHomeworkStore();
  const { subjects, loadSubjects } = useSubjectStore();

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (open) {
      if (editHomework) {
        form.setFieldsValue({
          title: editHomework.title,
          subjectId: editHomework.subjectId,
          priority: editHomework.priority,
          estimatedMinutes: editHomework.estimatedMinutes,
          dueDate: dayjs(editHomework.dueDate),
        });
      } else {
        form.setFieldsValue({
          title: initialTitle,
          subjectId: undefined,
          priority: 'medium',
          estimatedMinutes: 30,
          dueDate: initialDueDate ? dayjs(initialDueDate) : dayjs(),
        });
      }
    }
  }, [open, initialTitle, initialDueDate, editHomework, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData: HomeworkFormData = {
        ...values,
        dueDate: values.dueDate.toDate(),
      };

      if (editHomework) {
        await updateHomework(editHomework.id, formData);
        message.success('作业已更新');
      } else {
        await addHomework(formData);
        message.success('作业已添加');
      }

      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editHomework ? '编辑作业' : '添加作业'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {editHomework ? '保存' : '添加'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="作业标题"
          rules={[{ required: true, message: '请输入作业标题' }]}
        >
          <Input placeholder="例如: 数学练习册 P45-46" />
        </Form.Item>

        <Form.Item
          name="subjectId"
          label="科目"
          rules={[{ required: true, message: '请选择科目' }]}
        >
          <Select placeholder="选择科目">
            {subjects.map((subject) => (
              <Select.Option key={subject.id} value={subject.id}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: subject.color,
                    marginRight: 8,
                  }}
                />
                {subject.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="priority" label="优先级" initialValue="medium">
          <Select>
            <Select.Option value="high">
              <span style={{ color: '#ff4d4f' }}>⚡ 高</span>
            </Select.Option>
            <Select.Option value="medium">中</Select.Option>
            <Select.Option value="low">低</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="estimatedMinutes"
          label="预估时间 (分钟)"
          initialValue={30}
          rules={[{ required: true, message: '请输入预估时间' }]}
        >
          <InputNumber min={5} max={480} step={5} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="截止日期"
          rules={[{ required: true, message: '请选择截止日期' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            placeholder="选择日期"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
