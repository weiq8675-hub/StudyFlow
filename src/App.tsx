import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import { AppLayout } from './components/AppLayout';
import { TodayView } from './pages/TodayView';

// Configure dayjs for Chinese
dayjs.locale('zh-cn');

// Placeholder pages for routes not yet implemented
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div
    style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}
  >
    <h2>{title}</h2>
    <p style={{ color: '#999' }}>即将推出...</p>
  </div>
);

const CalendarView = () => <PlaceholderPage title="日历" />;
const HomeworkListView = () => <PlaceholderPage title="作业库" />;
const StatsView = () => <PlaceholderPage title="统计" />;
const SettingsView = () => <PlaceholderPage title="设置" />;

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontSize: 14,
          fontFamily:
            '"Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        components: {
          Layout: {
            siderBg: '#fff',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#e6f4ff',
            itemSelectedColor: '#1677ff',
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/today" replace />} />
              <Route path="/today" element={<TodayView />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/homework" element={<HomeworkListView />} />
              <Route path="/stats" element={<StatsView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
