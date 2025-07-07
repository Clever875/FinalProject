import React, { useState, useEffect, useContext } from 'react';
import {
  Card,
  Tabs,
  Typography,
  Button,
  Skeleton,
  Space,
  Tag,
  Image,
  List,
  Statistic,
  Row,
  Col,
  Empty,
  Divider,
  Badge
} from 'antd';
import {
  UserOutlined,
  FormOutlined,
  QuestionCircleOutlined,
  BarChartOutlined,
  LikeOutlined,
  CommentOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { templatesApi, formsApi, analyticsApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import QuestionList from '../components/QuestionList';
import FormResultsTable from '../components/FormResultsTable';
import AnalyticsCharts from '../components/AnalyticsCharts';
import LikeButton from '../components/LikeButton';
import CommentsSection from '../components/CommentsSection';
import './css/TemplatePage.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function TemplatePage() {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [templateData, templateStats] = await Promise.all([
          templatesApi.getTemplateById(id),
          analyticsApi.getTemplateAnalytics(id)
        ]);

        setTemplate(templateData);
        setStats(templateStats);
      } catch (err) {
        console.error('Ошибка загрузки шаблона:', err);
        setError(t('template.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, t]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleCreateForm = () => {
    navigate(`/create-form/${id}`);
  };

  if (error) {
    return (
      <div className="template-error">
        <Card>
          <Title level={3} type="danger">{error}</Title>
          <Button onClick={() => navigate('/templates')} className="back-button">
            {t('template.backToTemplates')}
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="template-loading">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="template-not-found">
        <Title level={3}>{t('template.notFound')}</Title>
        <Button onClick={() => navigate('/templates')} className="back-button">
          {t('template.backToTemplates')}
        </Button>
      </div>
    );
  }

  const canEdit = user && (user.role === 'ADMIN' || user.id === template.authorId);
  const isPublic = template.isPublic;
  const canFillForm = user && (isPublic || template.allowedUsers?.some(u => u.id === user.id));

  return (
    <div className={`template-page ${darkMode ? 'dark' : 'light'}`}>
      <Card className="template-header-card">
        <Row gutter={24} align="middle">
          <Col xs={24} md={6} className="template-image-col">
            {template.imageUrl ? (
              <Image
                src={template.imageUrl}
                alt={template.title}
                className="template-image"
                preview={false}
              />
            ) : (
              <div className="template-image-placeholder">
                <FormOutlined />
              </div>
            )}
          </Col>

          <Col xs={24} md={18} className="template-info-col">
            <div className="template-header">
              <Title level={2} className="template-title">
                {template.title}
              </Title>

              <Space className="template-meta">
                <Tag color={isPublic ? 'green' : 'blue'} className="access-tag">
                  {isPublic ? t('template.public') : t('template.private')}
                </Tag>
                <Tag color="purple" className="topic-tag">
                  {template.theme}
                </Tag>
                <LikeButton templateId={id} count={template.likesCount} />
              </Space>
            </div>

            <Paragraph className="template-description">
              {template.description || t('template.noDescription')}
            </Paragraph>

            <div className="template-author">
              <UserOutlined className="author-icon" />
              <Text strong>{template.author?.username || t('template.anonymousAuthor')}</Text>
            </div>

            <div className="template-stats">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title={t('template.questions')}
                    value={template.questions?.length || 0}
                    prefix={<QuestionCircleOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('template.responses')}
                    value={stats?.formsCount || 0}
                    prefix={<FormOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={t('template.completionRate')}
                    value={stats?.completionRate ? `${stats.completionRate}%` : '0%'}
                    prefix={<BarChartOutlined />}
                  />
                </Col>
              </Row>
            </div>

            <div className="template-actions">
              <Space>
                {canEdit && (
                  <Button
                    type="primary"
                    onClick={() => navigate(`/edit-template/${id}`)}
                    className="edit-button"
                  >
                    {t('template.editTemplate')}
                  </Button>
                )}

                {canFillForm && (
                  <Button
                    type="primary"
                    onClick={handleCreateForm}
                    className="fill-form-button"
                  >
                    {t('template.fillForm')}
                  </Button>
                )}

                {!user && (
                  <Button
                    type="primary"
                    onClick={() => navigate('/login')}
                    className="login-button"
                  >
                    {t('template.loginToFill')}
                  </Button>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        className="template-tabs"
      >
        <TabPane
          tab={
            <span>
              <FormOutlined /> {t('template.infoTab')}
            </span>
          }
          key="info"
        >
          <Card className="info-card">
            <div className="tags-section">
              <Title level={4} className="section-title">{t('template.tags')}</Title>
              <div className="tags-container">
                {template.tags?.length > 0 ? (
                  template.tags.map(tag => (
                    <Tag key={tag} color="blue" className="template-tag">
                      {tag}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">{t('template.noTags')}</Text>
                )}
              </div>
            </div>

            <Divider />

            <Title level={4} className="section-title">{t('template.accessSettings')}</Title>
            {isPublic ? (
              <Text>{t('template.publicAccess')}</Text>
            ) : (
              <div>
                <Text>{t('template.privateAccess')}</Text>
                <div className="allowed-users">
                  {template.allowedUsers?.map(user => (
                    <Tag key={user.id} className="user-tag">
                      {user.username}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <CommentsSection templateId={id} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <QuestionCircleOutlined /> {t('template.questionsTab')}
            </span>
          }
          key="questions"
        >
          <Card className="questions-card">
            <QuestionList
              questions={template.questions}
              editable={canEdit}
              onUpdate={() => {}}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <FormOutlined /> {t('template.responsesTab')}
            </span>
          }
          key="responses"
        >
          <Card className="responses-card">
            {stats?.formsCount > 0 ? (
              <FormResultsTable templateId={id} />
            ) : (
              <Empty
                description={t('template.noResponses')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined /> {t('template.analyticsTab')}
            </span>
          }
          key="analytics"
        >
          <Card className="analytics-card">
            {stats?.formsCount > 0 ? (
              <AnalyticsCharts
                questions={template.questions}
                stats={stats}
              />
            ) : (
              <Empty
                description={t('template.noAnalytics')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
