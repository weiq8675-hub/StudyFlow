import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  CalendarOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  SunOutlined,
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
      <Sider
        width={200}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
        breakpoint="md"
        collapsedWidth={0}
      >
        <div
          style={{
            padding: '24px 16px',
            borderBottom: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <Text strong style={{ fontSize: 18 }}>
            📚 StudyFlow
          </Text>
        </div>

        {/* Gamification - subtle display */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                积分
              </Text>
              <div style={{ fontWeight: 600, fontSize: 20 }}>{totalPoints}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                连续
              </Text>
              <div style={{ fontWeight: 600, fontSize: 20 }}>
                🔥 {streak}天
              </div>
            </div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Content
          style={{
            background: '#fff',
            minHeight: '100vh',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
