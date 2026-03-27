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

// Design System Theme Configuration
// Based on "The Digital Mentor" - Soft-Editorial Design System
const designTokens = {
  // Color Palette
  colorPrimary: '#136b5c',
  colorSuccess: '#2e7d32',
  colorWarning: '#ed6c02',
  colorError: '#ba1a1a',
  colorInfo: '#276775',

  // Background & Surface
  colorBgContainer: '#ffffff',
  colorBgLayout: '#eafdff',
  colorBgElevated: '#ffffff',
  colorBgSpotlight: '#c2eaee',
  colorBgMask: 'rgba(1, 17, 19, 0.45)',

  // Text Colors
  colorText: '#10383c',
  colorTextSecondary: '#406569',
  colorTextTertiary: '#70797a',
  colorTextQuaternary: '#9aa5a6',

  // Border - No-Line Rule (use tonal shifts instead)
  colorBorder: 'transparent',
  colorBorderSecondary: 'transparent',

  // Radius - Soft & Friendly
  borderRadius: 12,
  borderRadiusXS: 8,
  borderRadiusSM: 8,
  borderRadiusLG: 16,
  borderRadiusXL: 24,

  // Shadows - Ambient, tinted with on-surface color
  boxShadow: '0 4px 16px rgba(16, 56, 60, 0.05)',
  boxShadowSecondary: '0 8px 32px rgba(16, 56, 60, 0.06)',

  // Typography - Plus Jakarta Sans
  fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif',
  fontSize: 14,
  fontSizeHeading1: 44,
  fontSizeHeading2: 32,
  fontSizeHeading3: 24,
  fontSizeHeading4: 20,
  fontSizeHeading5: 16,
  fontSizeLG: 16,
  fontSizeSM: 12,
  fontSizeXL: 20,

  // Spacing
  padding: 16,
  paddingLG: 24,
  paddingXL: 32,
  margin: 16,
  marginLG: 24,
  marginXL: 32,

  // Motion
  motionDurationFast: '150ms',
  motionDurationMid: '250ms',
  motionDurationSlow: '350ms',
  motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: designTokens,
        components: {
          // Layout - Dark sidebar exception
          Layout: {
            siderBg: '#011113',
            headerBg: '#ffffff',
          },
          // Menu - Dark sidebar styling
          Menu: {
            itemBg: 'transparent',
            itemColor: '#c2f1f3',
            itemHoverBg: 'rgba(255, 255, 255, 0.08)',
            itemHoverColor: '#ffffff',
            itemSelectedBg: '#136b5c',
            itemSelectedColor: '#ffffff',
            subMenuItemBg: 'transparent',
            darkItemBg: 'transparent',
            darkItemColor: '#c2f1f3',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
            darkItemSelectedBg: '#136b5c',
            darkItemSelectedColor: '#ffffff',
            horizontalItemSelectedColor: '#136b5c',
            itemBorderRadius: 16,
            iconSize: 18,
          },
          // Button - Full rounded with gradient
          Button: {
            primaryShadow: '0 2px 8px rgba(19, 107, 92, 0.2)',
            defaultShadow: 'none',
            dangerShadow: '0 2px 8px rgba(186, 26, 26, 0.2)',
            defaultBg: '#eefafa',
            defaultColor: '#10383c',
            defaultBorderColor: 'transparent',
            defaultHoverBg: '#d8eff0',
            defaultHoverColor: '#136b5c',
            defaultHoverBorderColor: 'transparent',
            defaultActiveBg: '#c2eaee',
            defaultActiveBorderColor: 'transparent',
            borderRadius: 9999,
            borderRadiusLG: 9999,
            borderRadiusSM: 9999,
            paddingInline: 20,
            paddingInlineLG: 28,
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
          },
          // Input - Surface-container-lowest with ghost focus
          Input: {
            colorBgContainer: '#ffffff',
            colorBgContainerDisabled: '#eefafa',
            paddingInline: 16,
            paddingBlock: 10,
            borderRadius: 12,
          },
          // Select
          Select: {
            selectorBg: '#ffffff',
            colorBorder: 'transparent',
            colorBorderSecondary: 'transparent',
            optionSelectedBg: '#a8f0de',
            optionActiveBg: '#e4f5f6',
            borderRadius: 12,
            optionPadding: '10px 16px',
          },
          // Card - XL radius, no borders
          Card: {
            colorBorderSecondary: 'transparent',
            colorBgContainer: '#ffffff',
            headerBg: 'transparent',
            borderRadiusLG: 24,
            paddingLG: 24,
            boxShadowTertiary: '0 4px 16px rgba(16, 56, 60, 0.05)',
          },
          // Modal - Glassmorphism
          Modal: {
            contentBg: 'rgba(254, 253, 255, 0.92)',
            headerBg: 'transparent',
            footerBg: 'transparent',
            titleColor: '#10383c',
            borderRadiusLG: 24,
          },
          // List
          List: {
            colorBorder: 'transparent',
            colorSplit: 'transparent',
            itemPadding: '16px',
            metaMarginBottom: 8,
          },
          // Tag - Soft pills
          Tag: {
            defaultBg: '#e4f5f6',
            defaultColor: '#276775',
            borderRadiusSM: 9999,
          },
          // Progress - Rounded caps
          Progress: {
            defaultColor: '#136b5c',
            remainingColor: '#d8eff0',
            circleTextColor: '#10383c',
            lineBorderRadius: 9999,
          },
          // Statistic
          Statistic: {
            contentFontSize: 24,
            titleFontSize: 12,
          },
          // Calendar
          Calendar: {
            colorBgContainer: '#ffffff',
            itemActiveBg: '#a8f0de',
            borderRadius: 12,
          },
          // DatePicker
          DatePicker: {
            colorBgContainer: '#ffffff',
            colorBorder: 'transparent',
            borderRadius: 12,
          },
          // Empty
          Empty: {
            colorText: '#406569',
            colorTextDisabled: '#9aa5a6',
          },
          // Typography
          Typography: {
            colorText: '#10383c',
            colorTextSecondary: '#406569',
            colorTextTertiary: '#70797a',
          },
          // Segmented - Pill style
          Segmented: {
            itemColor: '#406569',
            itemHoverColor: '#10383c',
            itemSelectedColor: '#136b5c',
            itemSelectedBg: '#ffffff',
            trackBg: '#e4f5f6',
            trackPadding: 2,
            borderRadiusLG: 9999,
            borderRadiusSM: 9999,
          },
          // Table
          Table: {
            colorBorder: 'transparent',
            headerBg: '#eefafa',
            rowHoverBg: '#e4f5f6',
            borderColor: 'transparent',
          },
          // Badge
          Badge: {
            colorBgContainer: '#136b5c',
          },
          // Form
          Form: {
            labelColor: '#406569',
            labelFontSize: 13,
            verticalLabelPadding: '0 0 8px 0',
          },
          // Drawer
          Drawer: {
            colorBgElevated: 'rgba(254, 253, 255, 0.95)',
          },
          // Dropdown
          Dropdown: {
            colorBgElevated: 'rgba(254, 253, 255, 0.95)',
            borderRadiusLG: 16,
            paddingBlock: 8,
          },
          // Popover
          Popover: {
            colorBgElevated: 'rgba(254, 253, 255, 0.95)',
            borderRadiusLG: 16,
          },
          // Tooltip
          Tooltip: {
            colorBgSpotlight: '#011113',
            colorTextLightSolid: '#c2f1f3',
            borderRadius: 8,
          },
          // Message
          Message: {
            contentBg: 'rgba(254, 253, 255, 0.95)',
          },
          // Notification
          Notification: {
            colorBgElevated: 'rgba(254, 253, 255, 0.95)',
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
