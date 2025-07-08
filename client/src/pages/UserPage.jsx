import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Card,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Empty,
  Popconfirm,
  message,
  Badge,
  Avatar,
  Descriptions,
  Divider,
  Switch
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { templatesApi, authApi } from '../api';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import moment from 'moment';
import './css/UserPage.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function UserPage() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [profileLoading, setProfileLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTemplates = async (params = {}) => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const response = await templatesApi.getUserTemplates({
        page: params.pagination?.current || current,
        limit: params.pagination?.pageSize || pageSize,
        ...params,
      });

      setTemplates(response.data);
      setPagination({
        ...pagination,
        total: response.pagination.total,
        current: response.pagination.page,
        pageSize: response.pagination.limit,
      });
    } catch (err) {
      console.error('Error fetching templates:', err);
      message.error(t('templates.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'templates') {
      fetchTemplates();
    }
  }, [user, activeTab]);

  const handleDeleteTemplate = async (id) => {
    try {
      await templatesApi.deleteTemplate(id);
      message.success(t('templates.deleteSuccess'));
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      message.error(t('templates.deleteError'));
    }
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
    message.success(t('profile.languageUpdated'));
  };

  const handleDeleteAccount = async () => {
    try {
      setProfileLoading(true);
      await authApi.deleteProfile();
      message.success(t('profile.deleteSuccess'));
      logout();
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      message.error(t('profile.deleteError'));
    } finally {
      setProfileLoading(false);
    }
  };

  const columns = [
    {
      title: t('templates.table.title'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/templates/${record.id}`)}
          className="template-link"
        >
          {text}
        </Button>
      ),
    },
    {
      title: t('templates.table.status'),
      dataIndex: 'isPublic',
      key: 'status',
      render: (isPublic) => (
        <Tag color={isPublic ? 'green' : 'blue'}>
          {isPublic ? t('templates.public') : t('templates.private')}
        </Tag>
      ),
    },
    {
      title: t('templates.table.questions'),
      dataIndex: 'questions',
      key: 'questions',
      render: (questions) => questions?.length || 0,
    },
    {
      title: t('templates.table.forms'),
      dataIndex: ['_count', 'forms'],
      key: 'forms',
      render: (count) => (
        <Badge
          count={count}
          showZero
          className="form-badge"
        />
      ),
    },
    {
      title: t('templates.table.likes'),
      dataIndex: ['_count', 'likes'],
      key: 'likes',
      render: (count) => (
        <Badge
          count={count}
          showZero
          className="like-badge"
        />
      ),
    },
    {
      title: t('templates.table.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('LL'),
    },
    {
      title: t('templates.table.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/templates/${record.id}/edit`)}
          />

          <Popconfirm
            title={t('templates.deleteConfirm')}
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-page">
      <Card className="profile-card">
        <div className="profile-header">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            src={user?.avatar}
            className="profile-avatar"
          />
          <div className="profile-info">
            <Title level={3} className="profile-name">
              {user?.name}
            </Title>
            <Text type="secondary" className="profile-email">
              {user?.email}
            </Text>
            <Tag color={user?.role === 'ADMIN' ? 'red' : 'blue'} className="profile-role">
              {user?.role === 'ADMIN' ? t('profile.admin') : t('profile.user')}
            </Tag>
          </div>
        </div>

        <Divider />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="profile-tabs"
        >
          <TabPane
            tab={
              <span>
                <FormOutlined /> {t('profile.myTemplates')}
              </span>
            }
            key="templates"
          >
            <div className="templates-section">
              <div className="section-header">
                <Title level={4} className="section-title">
                  {t('profile.myTemplates')}
                </Title>
                <Button
                  type="primary"
                  onClick={() => navigate('/templates/new')}
                  className="new-template-btn"
                >
                  {t('templates.createNew')}
                </Button>
              </div>

              <Table
                columns={columns}
                dataSource={templates}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={fetchTemplates}
                locale={{
                  emptyText: (
                    <Empty
                      description={t('templates.noTemplates')}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button
                        type="primary"
                        onClick={() => navigate('/templates/new')}
                      >
                        {t('templates.createFirst')}
                      </Button>
                    </Empty>
                  ),
                }}
                scroll={{ x: true }}
                className="templates-table"
              />
            </div>
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined /> {t('profile.profile')}
              </span>
            }
            key="profile"
          >
            <div className="profile-section">
              <Descriptions bordered column={1} className="profile-details">
                <Descriptions.Item label={t('profile.name')}>
                  {user?.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('profile.email')}>
                  {user?.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('profile.registrationDate')}>
                  {user?.createdAt ? moment(user.createdAt).format('LLL') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('profile.lastActive')}>
                  {user?.lastActive ? moment(user.lastActive).fromNow() : '-'}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Title level={4} className="settings-title">
                {t('profile.settings')}
              </Title>

              <div className="setting-item">
                <Space>
                  <Text strong>{t('profile.darkMode')}</Text>
                  <Switch
                    checked={darkMode}
                    onChange={toggleTheme}
                    checkedChildren={t('common.on')}
                    unCheckedChildren={t('common.off')}
                  />
                </Space>
              </div>

              <div className="setting-item">
                <Space>
                  <Text strong>{t('profile.language')}</Text>
                  <Button.Group>
                    <Button
                      type={i18n.language === 'en' ? 'primary' : 'default'}
                      onClick={() => handleLanguageChange('en')}
                    >
                      English
                    </Button>
                    <Button
                      type={i18n.language === 'ru' ? 'primary' : 'default'}
                      onClick={() => handleLanguageChange('ru')}
                    >
                      Русский
                    </Button>
                  </Button.Group>
                </Space>
              </div>

              <Divider />

              <div className="danger-zone">
                <Title level={4} type="danger">
                  {t('profile.dangerZone')}
                </Title>
                <Text className="danger-zone-description">
                  {t('profile.dangerZoneWarning')}
                </Text>
                <Popconfirm
                  title={t('profile.deleteAccountConfirm')}
                  onConfirm={handleDeleteAccount}
                  okText={t('common.yes')}
                  cancelText={t('common.no')}
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={profileLoading}
                    className="delete-account-btn"
                  >
                    {t('profile.deleteAccount')}
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}
