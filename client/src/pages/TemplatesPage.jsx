import { UserOutlined, PlusOutlined, SearchOutlined, FormOutlined } from '@ant-design/icons';
import { useAuth } from '../AuthContext';
import TemplateCard from '../components/TemplateCard';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Skeleton,
  Typography,
  Tabs,
  Input,
  Space,
  Empty,
  Pagination
} from 'antd';
import api, { templatesApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './css/TemplatesPage.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function TemplatesPage() {
  const {
    token,
    user,
    loading,
    error,
    handleRefreshToken,
    refreshToken
  } = useAuth();

  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const [myTemplates, setMyTemplates] = useState([]);
  const [publicTemplates, setPublicTemplates] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('my');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        const refreshTokenValue = localStorage.getItem("refreshToken");
        await handleRefreshToken(refreshTokenValue);
      }

      try {
        setLocalLoading(true);
        setLocalError(null);

        const isMyTab = activeTab === 'my';
        const params = {
          page: currentPage,
          limit: pageSize,
          search: search.trim() || undefined,
        };

        let response;
        if (isMyTab && user) {
          response = await templatesApi.getUserTemplatesPaginated(params);
        } else {
          response = await templatesApi.getPublicTemplatesPaginated(params);
        }

        if (isMyTab) {
          setMyTemplates(response.templates);
        } else {
          setPublicTemplates(response.templates);
        }

        setTotalTemplates(response.total);
      } catch (err) {
        console.error('Ошибка загрузки шаблонов:', err);
        setLocalError(t('templates.loadError'));
      } finally {
        setLocalLoading(false);
      }
    };

    fetchData();
  }, [activeTab, currentPage, pageSize, search, token, user, t, handleRefreshToken]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const renderTemplates = (templates) => {
    if (localLoading) {
      return (
        <Row gutter={[16, 16]}>
          {[...Array(pageSize)].map((_, i) => (
            <Col key={i} xs={24} sm={12} md={8} lg={6}>
              <Card className="skeleton-card">
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      );
    }

    if (localError) {
      return (
        <Card className="error-card">
          <Text type="danger">{localError}</Text>
          <Button onClick={() => window.location.reload()} className="reload-button">
            {t('templates.reload')}
          </Button>
        </Card>
      );
    }

    if (templates.length === 0) {
      return (
        <Card className="empty-card">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              activeTab === 'my'
                ? t('templates.noPersonalTemplates')
                : t('templates.noPublicTemplates')
            }
          >
            {activeTab === 'my' && (
              <Button
                type="primary"
                onClick={() => navigate('/create-template')}
                className="create-button"
              >
                {t('templates.createFirstTemplate')}
              </Button>
            )}
          </Empty>
        </Card>
      );
    }

    return (
      <>
        <Row gutter={[16, 16]} className="templates-grid">
          {templates.map(template => (
            <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
              <TemplateCard
                template={template}
                onEdit={() => navigate(`/edit-template/${template.id}`)}
                onUse={() => navigate(`/create-form/${template.id}`)}
                darkMode={darkMode}
              />
            </Col>
          ))}
        </Row>

        <div className="pagination-container">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalTemplates}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger
            showQuickJumper
            className="templates-pagination"
          />
        </div>
      </>
    );
  };

  return (
    <div className={`templates-page ${darkMode ? 'dark' : 'light'}`}>
      <div className="page-header">
        <Title level={2} className="page-title">
          {t('templates.title')}
        </Title>

        <Space className="header-actions">
          <Input
            placeholder={t('templates.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
            allowClear
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/create-template')}
            className="create-button"
          >
            {t('templates.createTemplate')}
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        className="templates-tabs"
      >
        <TabPane
          tab={
            <span>
              <UserOutlined /> {t('templates.myTemplates')}
            </span>
          }
          key="my"
        >
          {renderTemplates(myTemplates)}
        </TabPane>

        <TabPane
          tab={
            <span>
              <FormOutlined /> {t('templates.publicTemplates')}
            </span>
          }
          key="public"
        >
          {renderTemplates(publicTemplates)}
        </TabPane>
      </Tabs>
    </div>
  );
}
