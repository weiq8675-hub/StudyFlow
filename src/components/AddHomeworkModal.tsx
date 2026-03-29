import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Button, message } from 'antd';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useSubjectStore } from '../stores/subjectStore';
import type { Priority } from '../types';
import { isWorkday } from '../lib/slotAssignment';
import dayjs from 'dayjs';

export interface AddHomeworkModalProps {
  open: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialDueDate?: Date;
  initialHour?: number;
  editHomework?: {
    id: string;
    title: string;
    subjectId: string;
    priority: Priority;
    estimatedMinutes: number;
    dueDate: Date;
    scheduledHour?: number;
  };
}

export const AddHomeworkModal: React.FC<AddHomeworkModalProps> = ({
  open,
  onClose,
  initialTitle = '',
  initialDueDate,
  initialHour,
  editHomework,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hourResetNote, setHourResetNote] = useState<string | null>(null);

  const { addHomework, updateHomework, homework } = useHomeworkStore();
  const { subjects, loadSubjects } = useSubjectStore();

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          scheduledHour: editHomework.scheduledHour,
        });
      } else {
        form.setFieldsValue({
          title: initialTitle,
          subjectId: undefined,
          priority: 'medium',
          estimatedMinutes: 30,
          dueDate: initialDueDate ? dayjs(initialDueDate) : dayjs(),
          scheduledHour: initialHour,
        });
      }
      setHourResetNote(null);
    }
  }, [open, initialTitle, initialDueDate, initialHour, editHomework, form]);

  const dueDateValue = Form.useWatch('dueDate', form);

  const hourOptions = (() => {
    const date = dueDateValue || dayjs();
    const workday = isWorkday(date);
    const startHour = workday ? 19 : 8;
    const endHour = 23;

    const options: { value: number; label: string; disabled?: boolean }[] = [];
    for (let h = startHour; h <= endHour; h++) {
      options.push({ value: h, label: `${h}:00` });
    }

    // Conflict prevention: find occupied hours for this date
    if (dueDateValue) {
      const dateStr = dueDateValue.format('YYYY-MM-DD');
      const occupiedHours = new Map<number, string>();
      for (const hw of homework) {
        if (
          hw.scheduledHour !== undefined &&
          dayjs(hw.dueDate).format('YYYY-MM-DD') === dateStr &&
          hw.id !== editHomework?.id
        ) {
          occupiedHours.set(hw.scheduledHour, hw.title);
        }
      }
      for (const opt of options) {
        const occupant = occupiedHours.get(opt.value);
        if (occupant) {
          opt.disabled = true;
          opt.label = `${opt.value}:00 (已被「${occupant}」占用)`;
        }
      }
    }

    return options;
  })();

  const handleDueDateChange = () => {
    const currentHour = form.getFieldValue('scheduledHour');
    if (currentHour === undefined || currentHour === null) return;

    const date = form.getFieldValue('dueDate');
    if (!date) return;

    const workday = isWorkday(date);
    const startHour = workday ? 19 : 8;

    // Smart reset: only reset if the current hour is not available on the new date
    if (currentHour < startHour || currentHour > 23) {
      const newHour = startHour;
      form.setFieldsValue({ scheduledHour: newHour });
      if (workday) {
        setHourResetNote(`工作日无${currentHour}:00时段，已调整为${newHour}:00`);
      } else {
        setHourResetNote(`已调整为${newHour}:00`);
      }
    } else {
      setHourResetNote(null);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = {
        title: values.title,
        subjectId: values.subjectId,
        priority: values.priority,
        estimatedMinutes: values.estimatedMinutes,
        dueDate: values.dueDate.toDate(),
        scheduledHour: values.scheduledHour,
      };

      if (editHomework) {
        await updateHomework(editHomework.id, formData);
        message.success('作业已更新');
      } else {
        await addHomework(formData);
        message.success('作业已添加');
      }

      form.resetFields();
      setHourResetNote(null);
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
      destroyOnHidden
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
            onChange={handleDueDateChange}
          />
        </Form.Item>

        <Form.Item name="scheduledHour" label="计划开始时间">
          <Select
            placeholder="选择时间（可选）"
            allowClear
            options={hourOptions}
          />
        </Form.Item>

        {hourResetNote && (
          <div style={{
            fontSize: 12,
            color: 'var(--color-warning)',
            marginTop: -8,
            marginBottom: 16,
          }}>
            {hourResetNote}
          </div>
        )}
      </Form>
    </Modal>
  );
};
