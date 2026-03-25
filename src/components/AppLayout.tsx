import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  CalendarOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  SunOutlined,
  FireOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePointsStore } from '../stores/pointsStore';

const { Sider, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { key: '/today', icon: <SunOutlined />, label: '今日' },
  { key: '/calendar', icon: <CalendarOutlined />, label: '日历' },
  { key: '/homework', icon: <BookOutlined />, label: '作业库' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalPoints, streak } = usePointsStore();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Dark Sidebar - The Dark Mode Exception */}
      <Sider
        width={220}
        style={{
          background: 'var(--color-inverse-surface)',
          boxShadow: 'none',
        }}
        breakpoint="md"
        collapsedWidth={0}
        theme="dark"
      >
        {/* Logo / Brand */}
        <div
          style={{
            padding: '28px 20px',
            borderBottom: 'none',
            textAlign: 'center',
          }}
        >
          <Text
            strong
            style={{
              fontSize: 20,
              color: 'var(--color-primary-fixed)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            📚 StudyFlow
          </Text>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-inverse-on-surface)',
              opacity: 0.6,
              marginTop: 4,
            }}
          >
            智能学习助手
          </div>
        </div>

        {/* Gamification Stats - Tonal Card in Dark */}
        <div
          style={{
            margin: '12px 16px',
            padding: '16px',
            borderRadius: 16,
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <TrophyOutlined
                style={{
                  fontSize: 18,
                  color: 'var(--color-primary-fixed)',
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  color: 'var(--color-inverse-on-surface)',
                  fontSize: 10,
                  opacity: 0.7,
                  marginBottom: 2,
                }}
              >
                积分
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                  color: 'var(--color-primary-fixed)',
                }}
              >
                {totalPoints}
              </div>
            </div>
            <div
              style={{
                width: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                margin: '4px 0',
              }}
            />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <FireOutlined
                style={{
                  fontSize: 18,
                  color: '#ff9f43',
                  marginBottom: 4,
                }}
              />
              <div
                style={{
                  color: 'var(--color-inverse-on-surface)',
                  fontSize: 10,
                  opacity: 0.7,
                  marginBottom: 2,
                }}
              >
                连续
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                  color: '#ff9f43',
                }}
              >
                {streak}天
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            borderRight: 0,
            marginTop: 8,
            padding: '0 8px',
            background: 'transparent',
          }}
        />

        {/* Footer Motivational Quote */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 16,
            right: 16,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(98, 244, 223, 0.08)',
            textAlign: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: 'var(--color-primary-fixed)',
              opacity: 0.9,
              fontStyle: 'italic',
            }}
          >
            "每一步都是进步 ✨"
          </Text>
        </div>
      </Sider>

      {/* Main Content Area */}
      <Layout>
        <Content
          style={{
            background: 'var(--color-surface)',
            minHeight: '100vh',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
