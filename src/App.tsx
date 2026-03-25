import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import { AppLayout } from './components/AppLayout';
import { TodayView } from './pages/TodayView';
import { HomeworkListView } from './pages/HomeworkListView';
import { CalendarView } from './pages/CalendarView';
import { StatsView } from './pages/StatsView';
import { SettingsView } from './pages/SettingsView';

// Configure dayjs for Chinese
dayjs.locale('zh-cn');

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
