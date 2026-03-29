import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddHomeworkModal } from './AddHomeworkModal';

// Regression: Test AddHomeworkModal form behavior
// Found by /retro on 2026-03-25
// Report: .context/retros/2026-03-25-1.json

// Mock the stores
const mockAddHomework = vi.fn();
const mockUpdateHomework = vi.fn();
const mockLoadSubjects = vi.fn();

vi.mock('../stores/homeworkStore', () => ({
  useHomeworkStore: () => ({
    addHomework: mockAddHomework,
    updateHomework: mockUpdateHomework,
    homework: [],
  }),
}));

vi.mock('../stores/subjectStore', () => ({
  useSubjectStore: () => ({
    subjects: [
      { id: 'subject-1', name: '语文', color: '#fff7e6', createdAt: new Date() },
      { id: 'subject-2', name: '数学', color: '#e6f4ff', createdAt: new Date() },
    ],
    loadSubjects: mockLoadSubjects,
  }),
}));

describe('AddHomeworkModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<AddHomeworkModal open={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog', { name: /添加作业/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/作业标题/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddHomeworkModal open={false} onClose={mockOnClose} />);

    expect(screen.queryByRole('dialog', { name: /添加作业/ })).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    render(<AddHomeworkModal open={true} onClose={mockOnClose} />);

    // Button text has a space: "取 消"
    const cancelButton = screen.getByRole('button', { name: '取 消' });
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('pre-fills title from initialTitle prop', () => {
    render(
      <AddHomeworkModal open={true} onClose={mockOnClose} initialTitle="数学作业" />
    );

    const titleInput = screen.getByLabelText(/作业标题/) as HTMLInputElement;
    expect(titleInput.value).toBe('数学作业');
  });

  it('shows validation error when submitting without required fields', async () => {
    render(<AddHomeworkModal open={true} onClose={mockOnClose} />);

    // Button text has a space: "添 加"
    const submitButton = screen.getByRole('button', { name: '添 加' });
    await userEvent.click(submitButton);

    // Form validation should prevent submission
    expect(mockAddHomework).not.toHaveBeenCalled();
  });

  it('loads subjects on mount', () => {
    render(<AddHomeworkModal open={true} onClose={mockOnClose} />);

    expect(mockLoadSubjects).toHaveBeenCalled();
  });

  it('has all required form fields', () => {
    render(<AddHomeworkModal open={true} onClose={mockOnClose} />);

    expect(screen.getByLabelText(/作业标题/)).toBeInTheDocument();
    expect(screen.getByLabelText(/科目/)).toBeInTheDocument();
    expect(screen.getByLabelText(/预估时间/)).toBeInTheDocument();
    expect(screen.getByLabelText(/截止日期/)).toBeInTheDocument();
  });
});
