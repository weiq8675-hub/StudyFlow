import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Typography, Button, Tag, Popover, message } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useHomeworkStore } from '../stores/homeworkStore';
import { useSubjectStore } from '../stores/subjectStore';
import { usePointsStore } from '../stores/pointsStore';
import { AddHomeworkModal } from '../components/AddHomeworkModal';
import { CompleteHomeworkModal } from '../components/CompleteHomeworkModal';
import { initializeDatabase } from '../lib/db';
import {
  isWorkday,
  getActiveHours,
  getHourSpan,
  buildWeekSchedule,
  daySummary,
  ALL_HOURS,
} from '../lib/slotAssignment';
import type { Homework } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

const { Title, Text } = Typography;

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function getStartOfWeek(date: Dayjs): Dayjs {
  // Monday-based week start
  const d = date.day();
  return date.subtract(d === 0 ? 6 : d - 1, 'day').startOf('day');
}


export const CalendarView: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<Dayjs>(getStartOfWeek(dayjs()));
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [detailDay, setDetailDay] = useState<Dayjs | null>(null);
  const [mobileDay, setMobileDay] = useState<Dayjs>(dayjs());
  const [initialHour, setInitialHour] = useState<number | undefined>();
  const [initialDueDate, setInitialDueDate] = useState<Date | undefined>();
  const [editHomework, setEditHomework] = useState<AddHomeworkModalProps['editHomework']>();
  const pulseRef = useRef<string | null>(null);

  const isMobile = useIsMobile();

  const { loadHomework, homework, deleteHomework, updateHomework, loading } = useHomeworkStore();
  const { loadSubjects, subjects } = useSubjectStore();
  const { loadPointsData, awardPoints } = usePointsStore();

  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await Promise.all([loadHomework(), loadSubjects(), loadPointsData()]);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekSchedule = useMemo(
    () => buildWeekSchedule(selectedWeek, homework),
    [selectedWeek, homework],
  );

  const weekDays = useMemo(() => {
    const days: Dayjs[] = [];
    for (let i = 0; i < 7; i++) days.push(selectedWeek.add(i, 'day'));
    return days;
  }, [selectedWeek]);

  const today = dayjs();
  const todayStr = today.format('YYYY-MM-DD');

  const getSubjectName = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.name || '未知科目';

  const getSubjectColor = (subjectId: string) =>
    subjects.find((s) => s.id === subjectId)?.color || '#f0f0f0';

  const getTaskStatusColor = (hw: Homework): 'green' | 'red' | 'gray' | 'overdue' => {
    if (hw.completedAt && hw.actualMinutes !== undefined) {
      return hw.actualMinutes <= hw.estimatedMinutes + 10 ? 'green' : 'red';
    }
    const dueDate = new Date(hw.dueDate);
    dueDate.setHours(23, 59, 59, 999);
    if (!hw.completedAt && dueDate < new Date()) return 'overdue';
    return 'gray';
  };

  const statusBorderColor = (status: string) => {
    switch (status) {
      case 'green': return 'var(--color-success)';
      case 'red': return 'var(--color-error)';
      case 'overdue': return 'var(--color-warning)';
      default: return 'var(--color-outline-variant)';
    }
  };

  const handleSlotClick = (day: Dayjs, hour: number) => {
    setInitialDueDate(day.toDate());
    setInitialHour(hour);
    setEditHomework(undefined);
    setAddModalOpen(true);
  };

  const handleUnscheduledClick = (hw: Homework) => {
    setEditHomework({
      id: hw.id,
      title: hw.title,
      subjectId: hw.subjectId,
      priority: hw.priority,
      estimatedMinutes: hw.estimatedMinutes,
      dueDate: hw.dueDate,
      scheduledHour: hw.scheduledHour,
    });
    setInitialDueDate(undefined);
    setInitialHour(undefined);
    setAddModalOpen(true);
  };

  const handleTaskClick = (hw: Homework) => {
    if (!hw.completedAt) {
      setSelectedHomework(hw);
      setCompleteModalOpen(true);
    }
  };

  const handleUnschedule = async (hw: Homework) => {
    await updateHomework(hw.id, { scheduledHour: undefined });
    message.success('已取消安排');
    setDetailDay(null);
  };

  const handleComplete = async (actualMinutes: number) => {
    if (!selectedHomework) return;
    await useHomeworkStore.getState().completeHomework(selectedHomework.id, actualMinutes);
    await awardPoints(selectedHomework, actualMinutes);
    setCompleteModalOpen(false);
    setSelectedHomework(null);
  };

  const handleDelete = async (hw: Homework) => {
    await deleteHomework(hw.id);
    message.success('已删除');
    setDetailDay(null);
  };

  const handlePrevWeek = () => setSelectedWeek((w) => w.subtract(7, 'day'));
  const handleNextWeek = () => setSelectedWeek((w) => w.add(7, 'day'));
  const handleThisWeek = () => {
    setSelectedWeek(getStartOfWeek(dayjs()));
    setMobileDay(dayjs());
  };

  const weekLabel = `${selectedWeek.format('M月D日')} - ${selectedWeek.add(6, 'day').format('M月D日')}`;

  // ─── Loading state ────────────────────────────────────
  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
        <div style={{ padding: '32px 32px 24px', background: 'var(--color-surface-container-lowest)', borderRadius: '0 0 24px 24px' }}>
          <div style={{ height: 32, width: 160, background: 'var(--color-surface-container)', borderRadius: 8, marginBottom: 8 }} />
          <div style={{ height: 16, width: 100, background: 'var(--color-surface-container)', borderRadius: 4 }} />
        </div>
        <div style={{ flex: 1, padding: 24, display: 'flex', gap: 8 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: 40, background: 'var(--color-surface-container)', borderRadius: 8 }} />
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} style={{ height: 44, background: 'var(--color-surface-container)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${(i * 5 + j) * 50}ms` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Empty state (zero tasks for week) ────────────────
  const totalWeekTasks = homework.filter((h) => {
    const d = dayjs(h.dueDate);
    return d.isAfter(selectedWeek.subtract(1, 'day')) && d.isBefore(selectedWeek.add(7, 'day'));
  }).length;

  if (totalWeekTasks === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
        <div style={{ padding: '32px 32px 24px', background: 'var(--color-surface-container-lowest)', borderRadius: '0 0 24px 24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, marginBottom: 8, fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.02em' }}>
                本周学习计划
              </Title>
              <Text style={{ color: 'var(--color-on-surface-variant)' }}>{weekLabel}</Text>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handlePrevWeek} icon={<LeftOutlined />} style={{ borderRadius: 9999 }} />
              <Button onClick={handleThisWeek} style={{ borderRadius: 9999 }}>本周</Button>
              <Button onClick={handleNextWeek} icon={<RightOutlined />} style={{ borderRadius: 9999 }} />
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <Text style={{ display: 'block', fontSize: 18, fontWeight: 500, color: 'var(--color-on-surface)', marginBottom: 8 }}>
              这周还没有安排作业
            </Text>
            <Text style={{ display: 'block', color: 'var(--color-on-surface-variant)', marginBottom: 24 }}>
              点击下方按钮添加作业并安排时间
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setInitialDueDate(undefined); setInitialHour(undefined); setEditHomework(undefined); setAddModalOpen(true); }}
              style={{ borderRadius: 9999, fontWeight: 500 }}
            >
              添加作业
            </Button>
          </div>
        </div>
        <AddHomeworkModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          initialDueDate={initialDueDate}
          initialHour={initialHour}
          editHomework={editHomework}
        />
      </div>
    );
  }

  // ─── Mobile single-day view ───────────────────────────
  if (isMobile) {
    const activeHours = getActiveHours(mobileDay);
    const dateStr = mobileDay.format('YYYY-MM-DD');
    const dayHw = homework.filter((h) => dayjs(h.dueDate).format('YYYY-MM-DD') === dateStr);
    const scheduled = dayHw.filter((h) => h.scheduledHour !== undefined);
    const unscheduled = dayHw.filter((h) => h.scheduledHour === undefined);

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 16px', background: 'var(--color-surface-container-lowest)', borderRadius: '0 0 20px 20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: 'var(--color-on-surface)' }}>
              本周学习计划
            </Title>
            <Button size="small" onClick={handleThisWeek} style={{ borderRadius: 9999 }}>本周</Button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Button size="small" onClick={handlePrevWeek} icon={<LeftOutlined />} style={{ borderRadius: 9999 }} />
            <Text style={{ fontWeight: 500, color: 'var(--color-on-surface)', minWidth: 100, textAlign: 'center' }}>{weekLabel}</Text>
            <Button size="small" onClick={handleNextWeek} icon={<RightOutlined />} style={{ borderRadius: 9999 }} />
          </div>
          {/* Day picker strip */}
          <div style={{ display: 'flex', gap: 4 }}>
            {weekDays.map((d, i) => {
              const isToday = d.format('YYYY-MM-DD') === todayStr;
              const isSelected = d.format('YYYY-MM-DD') === mobileDay.format('YYYY-MM-DD');
              return (
                <button
                  key={i}
                  onClick={() => setMobileDay(d)}
                  style={{
                    flex: 1,
                    padding: '6px 2px',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--color-primary)'
                      : isToday
                        ? 'var(--color-primary-container)'
                        : 'var(--color-surface-container)',
                    color: isSelected
                      ? 'var(--color-on-primary)'
                      : isToday
                        ? 'var(--color-primary)'
                        : 'var(--color-on-surface-variant)',
                    fontWeight: isSelected || isToday ? 600 : 400,
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span>{DAY_NAMES[i]}</span>
                  <span style={{ fontSize: 11 }}>{d.format('D')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Unscheduled strip */}
        {unscheduled.length > 0 && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {unscheduled.map((hw) => (
                <button
                  key={hw.id}
                  onClick={() => handleUnscheduledClick(hw)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9999,
                    border: `1px solid ${getSubjectColor(hw.subjectId)}`,
                    background: `${getSubjectColor(hw.subjectId)}20`,
                    color: 'var(--color-on-surface)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <UnorderedListOutlined style={{ fontSize: 10 }} />
                  {hw.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Time slots */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ALL_HOURS.map((hour) => {
              const isActive = activeHours.includes(hour);
              const hwAtHour = scheduled.find((h) => h.scheduledHour === hour);
              const isWorkdayToday = isWorkday(mobileDay);

              if (!isActive && isWorkdayToday) {
                // Ghosted hour
                if (hour === 8) {
                  return (
                    <div key={hour} style={{ padding: '4px 8px', textAlign: 'center' }}>
                      <Text style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', opacity: 0.5 }}>在校时间</Text>
                    </div>
                  );
                }
                return null;
              }

              return (
                <div key={hour} style={{ display: 'flex', gap: 8, minHeight: 44, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', width: 36, flexShrink: 0 }}>
                    {hour}:00
                  </Text>
                  {hwAtHour ? (
                    <TaskCell
                      hw={hwAtHour}
                      subjectName={getSubjectName(hwAtHour.subjectId)}
                      subjectColor={getSubjectColor(hwAtHour.subjectId)}
                      statusColor={statusBorderColor(getTaskStatusColor(hwAtHour))}
                      onClick={() => handleTaskClick(hwAtHour)}
                    />
                  ) : isActive ? (
                    <button
                      className="time-slot-empty"
                      style={{ flex: 1 }}
                      onClick={() => handleSlotClick(mobileDay, hour)}
                    />
                  ) : (
                    <div className="time-slot-ghosted" style={{ flex: 1 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modals */}
        <AddHomeworkModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          initialDueDate={initialDueDate}
          initialHour={initialHour}
          editHomework={editHomework}
        />
        <CompleteHomeworkModal
          open={completeModalOpen}
          homework={selectedHomework}
          onClose={() => { setCompleteModalOpen(false); setSelectedHomework(null); }}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  // ─── Desktop week grid view ───────────────────────────
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
      {/* Header */}
      <div style={{ padding: '24px 24px 16px', background: 'var(--color-surface-container-lowest)', borderRadius: '0 0 24px 24px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: 4, fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.02em' }}>
              本周学习计划
            </Title>
            <Text style={{ color: 'var(--color-on-surface-variant)' }}>{weekLabel}</Text>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={handlePrevWeek} icon={<LeftOutlined />} style={{ borderRadius: 9999 }} />
            <Button onClick={handleThisWeek} style={{ borderRadius: 9999, fontWeight: 500 }}>本周</Button>
            <Button onClick={handleNextWeek} icon={<RightOutlined />} style={{ borderRadius: 9999 }} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setInitialDueDate(undefined); setInitialHour(undefined); setEditHomework(undefined); setAddModalOpen(true); }}
              style={{ borderRadius: 9999, fontWeight: 500 }}
            >
              添加作业
            </Button>
          </div>
        </div>
      </div>

      {/* Unscheduled strip */}
      {weekSchedule.unscheduled.length > 0 && (
        <div style={{ padding: '12px 24px 0' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
            <Text style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', fontWeight: 500, flexShrink: 0 }}>
              未安排:
            </Text>
            {weekSchedule.unscheduled.map((hw) => (
              <button
                key={hw.id}
                onClick={() => handleUnscheduledClick(hw)}
                style={{
                  padding: '4px 14px',
                  borderRadius: 9999,
                  border: `1px solid ${getSubjectColor(hw.subjectId)}`,
                  background: `${getSubjectColor(hw.subjectId)}20`,
                  color: 'var(--color-on-surface)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <UnorderedListOutlined style={{ fontSize: 10 }} />
                {hw.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Week Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(7, 1fr)`, gap: '0 4px', minWidth: 700 }}>
          {/* Column headers */}
          <div /> {/* spacer for time labels */}
          {weekDays.map((d, i) => {
            const isToday = d.format('YYYY-MM-DD') === todayStr;
            const summary = daySummary(weekSchedule.days[i], homework.filter((h) => dayjs(h.dueDate).format('YYYY-MM-DD') === d.format('YYYY-MM-DD')));
            return (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  paddingBottom: 8,
                  cursor: 'pointer',
                }}
                onClick={() => setDetailDay(d)}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-on-surface-variant)' }}>
                  {DAY_NAMES[i]}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: isToday ? 'var(--color-primary)' : 'var(--color-on-surface)',
                }}>
                  {d.format('D')}
                </div>
                {isToday && (
                  <div style={{ height: 3, borderRadius: 2, background: 'var(--color-primary)', marginTop: 4 }} />
                )}
                {summary.total > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', marginTop: 2 }}>
                    {summary.completed}/{summary.total} | {summary.plannedMinutes}min
                  </div>
                )}
              </div>
            );
          })}

          {/* Time rows */}
          {ALL_HOURS.map((hour) => (
            <React.Fragment key={hour}>
              {/* Time label */}
              <div style={{
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 8,
                fontSize: 11,
                color: 'var(--color-on-surface-variant)',
              }}>
                {hour}:00
              </div>

              {/* Day cells */}
              {weekDays.map((d, dayIndex) => {
                const daySchedule = weekSchedule.days[dayIndex];
                const isWorkdayDay = daySchedule.isWorkday;
                const isActive = daySchedule.activeHours.includes(hour);
                const hw = daySchedule.slots[hour];

                // Check if this is a continuation slot (part of multi-hour task above)
                let continuationOf: Homework | null = null;
                if (!hw) {
                  for (let prev = hour - 1; prev >= Math.max(8, hour - 4); prev--) {
                    const prevHw = daySchedule.slots[prev];
                    if (prevHw) {
                      const span = getHourSpan(prevHw.estimatedMinutes);
                      if (hour < prev + span) {
                        continuationOf = prevHw;
                      }
                      break;
                    }
                  }
                }

                if (!isActive && isWorkdayDay) {
                  // Ghosted workday hour
                  if (hour === 8) {
                    return (
                      <div key={dayIndex} className="time-slot-ghosted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 9, color: 'var(--color-on-surface-variant)', opacity: 0.5 }}>在校</Text>
                      </div>
                    );
                  }
                  return <div key={dayIndex} className="time-slot-ghosted" />;
                }

                if (hw) {
                  const status = getTaskStatusColor(hw);
                  return (
                    <div
                      key={dayIndex}
                      className={`time-slot-task time-slot-task--${status} ${pulseRef.current === hw.id ? 'time-slot-pulse' : ''}`}
                      style={{ background: `${getSubjectColor(hw.subjectId)}20` }}
                      onClick={() => handleTaskClick(hw)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: getSubjectColor(hw.subjectId),
                        }} />
                        <span style={{
                          fontSize: 12, fontWeight: 500, color: 'var(--color-on-surface)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {hw.title}
                        </span>
                      </div>
                      {hw.completedAt && hw.actualMinutes !== undefined && (
                        <span style={{ fontSize: 10, color: 'var(--color-on-surface-variant)' }}>
                          {hw.actualMinutes}/{hw.estimatedMinutes}min
                        </span>
                      )}
                    </div>
                  );
                }

                if (continuationOf) {
                  return (
                    <div
                      key={dayIndex}
                      className="time-slot-continuation"
                      style={{ borderLeft: `3px solid ${statusBorderColor(getTaskStatusColor(continuationOf))}` }}
                      onClick={() => handleTaskClick(continuationOf!)}
                    />
                  );
                }

                // Empty active slot
                return (
                  <button
                    key={dayIndex}
                    className="time-slot-empty"
                    onClick={() => handleSlotClick(d, hour)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* DailyDetail popup */}
      {detailDay && (
        <DailyDetailPopup
          day={detailDay}
          homework={homework.filter((h) => dayjs(h.dueDate).format('YYYY-MM-DD') === detailDay.format('YYYY-MM-DD'))}
          subjects={subjects}
          onTaskClick={handleTaskClick}
          onUnschedule={handleUnschedule}
          onDelete={handleDelete}
          onClose={() => setDetailDay(null)}
          getSubjectName={getSubjectName}
          getSubjectColor={getSubjectColor}
          getTaskStatusColor={getTaskStatusColor}
          statusBorderColor={statusBorderColor}
        />
      )}

      {/* Modals */}
      <AddHomeworkModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        initialDueDate={initialDueDate}
        initialHour={initialHour}
        editHomework={editHomework}
      />

      <CompleteHomeworkModal
        open={completeModalOpen}
        homework={selectedHomework}
        onClose={() => { setCompleteModalOpen(false); setSelectedHomework(null); }}
        onComplete={handleComplete}
      />
    </div>
  );
};

// ─── Task Cell Component ──────────────────────────────────

interface TaskCellProps {
  hw: Homework;
  subjectName: string;
  subjectColor: string;
  statusColor: string;
  onClick: () => void;
}

const TaskCell: React.FC<TaskCellProps> = ({ hw, subjectName, subjectColor, statusColor, onClick }) => (
  <div
    className={`time-slot-task time-slot-task--${hw.completedAt ? 'green' : 'pending'}`}
    style={{ background: `${subjectColor}20`, cursor: 'pointer' }}
    onClick={onClick}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: subjectColor, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {hw.title}
      </span>
    </div>
  </div>
);

// ─── Daily Detail Popup ───────────────────────────────────

interface DailyDetailPopupProps {
  day: Dayjs;
  homework: Homework[];
  subjects: { id: string; name: string; color: string }[];
  onTaskClick: (hw: Homework) => void;
  onUnschedule: (hw: Homework) => void;
  onDelete: (hw: Homework) => void;
  onClose: () => void;
  getSubjectName: (id: string) => string;
  getSubjectColor: (id: string) => string;
  getTaskStatusColor: (hw: Homework) => 'green' | 'red' | 'gray' | 'overdue';
  statusBorderColor: (s: string) => string;
}

const DailyDetailPopup: React.FC<DailyDetailPopupProps> = ({
  day,
  homework,
  onTaskClick,
  onUnschedule,
  onDelete,
  onClose,
  getSubjectName,
  getSubjectColor,
  getTaskStatusColor,
  statusBorderColor,
}) => {
  const dayName = DAY_NAMES[day.day() === 0 ? 6 : day.day() - 1];
  const total = homework.length;
  const completed = homework.filter((h) => h.completedAt).length;
  const plannedMinutes = homework.reduce((s, h) => s + h.estimatedMinutes, 0);
  const actualMinutes = homework.filter((h) => h.completedAt).reduce((s, h) => s + (h.actualMinutes || 0), 0);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.3)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface-container-lowest)',
          borderRadius: 24,
          padding: 24,
          width: 380,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0, fontWeight: 600, color: 'var(--color-on-surface)' }}>
            {day.format('M月D日')} {dayName}
          </Title>
          <Button size="small" onClick={onClose} style={{ borderRadius: 9999 }}>关闭</Button>
        </div>

        {/* Task list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {homework.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Text style={{ color: 'var(--color-on-surface-variant)' }}>当天没有作业</Text>
            </div>
          ) : (
            homework.map((hw) => {
              const status = getTaskStatusColor(hw);
              return (
                <div
                  key={hw.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--color-surface-container-low)',
                    borderLeft: `3px solid ${statusBorderColor(status)}`,
                    cursor: hw.completedAt ? 'default' : 'pointer',
                  }}
                  onClick={() => !hw.completedAt && onTaskClick(hw)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {hw.completedAt ? (
                        <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />
                      ) : status === 'overdue' ? (
                        <ExclamationCircleOutlined style={{ color: 'var(--color-warning)' }} />
                      ) : (
                        <ClockCircleOutlined style={{ color: 'var(--color-outline-variant)' }} />
                      )}
                      <span style={{ fontWeight: 500, color: 'var(--color-on-surface)', fontSize: 13, textDecoration: hw.completedAt ? 'line-through' : 'none' }}>
                        {hw.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {hw.scheduledHour !== undefined && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUnschedule(hw); }}
                          style={{
                            fontSize: 11, color: 'var(--color-error)', background: 'none',
                            border: 'none', cursor: 'pointer', padding: '2px 6px',
                          }}
                        >
                          取消安排
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(hw); }}
                        style={{
                          fontSize: 11, color: 'var(--color-error)', background: 'none',
                          border: 'none', cursor: 'pointer', padding: '2px 6px', opacity: 0.7,
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginTop: 4 }}>
                    <Tag style={{ background: getSubjectColor(hw.subjectId), border: 'none', borderRadius: 9999, fontSize: 10, padding: '0 6px' }}>
                      {getSubjectName(hw.subjectId)}
                    </Tag>
                    {hw.scheduledHour !== undefined && <span>{hw.scheduledHour}:00 · </span>}
                    {hw.completedAt && hw.actualMinutes !== undefined
                      ? `${hw.actualMinutes}/${hw.estimatedMinutes}min`
                      : `${hw.estimatedMinutes}min`}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        {total > 0 && (
          <div style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: 12, display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>完成率</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)' }}>
                {completed}/{total}
              </div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>计划</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)' }}>{plannedMinutes}min</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)' }}>实际</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-on-surface)' }}>{actualMinutes}min</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
