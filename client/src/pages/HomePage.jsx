import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Skeleton,
  List,
  Input,
  Button,
  Space,
  Badge,
  Empty,
  Statistic
} from 'antd';
import { SearchOutlined, StarFilled, FormOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { templatesApi, tagsApi, analyticsApi } from '../api';
import { useAuth } from '../AuthContext';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './css/HomePage.css';

const { Title, Text } = Typography;
const { Meta } = Card;

export default function HomePage() {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [latestTemplates, setLatestTemplates] = useState([]);
  const [popularTemplates, setPopularTemplates] = useState([]);
  const [tags, setTags] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [latest, popular, tagsData, statsData] = await Promise.all([
          templatesApi.getPublicTemplatesPaginated(1, 6, '', 'newest'),
          templatesApi.getPopularTemplates(5),
          tagsApi.getPopularTags(20),
          analyticsApi.getPlatformStats()
        ]);

        setLatestTemplates(latest.templates || []);
        setPopularTemplates(popular || []);
        setTags(tagsData || []);
        setStats(statsData || {});
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError(t('home.partialLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [t]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/templates?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTagClick = (tagName) => {
    navigate(`/templates?tag=${encodeURIComponent(tagName)}`);
  };

  const renderTemplateCard = (template) => (
    <Card
      key={template.id}
      hoverable
      className="template-card"
      cover={
        template.imageUrl ? (
          <div
            className="template-cover"
            style={{ backgroundImage: `url(${template.imageUrl})` }}
          />
        ) : (
          <div className="template-placeholder">
            <FormOutlined />
          </div>
        )
      }
      onClick={() => navigate(`/templates/${template.id}`)}
    >
      <Meta
        title={<Text strong ellipsis>{template.title}</Text>}
        description={
          <div className="template-meta">
            <Text type="secondary" ellipsis className="template-description">
              {template.description || t('home.noDescription')}
            </Text>
            <Space size={4} wrap className="template-tags">
              <Tag className="topic-tag">{template.topic || t('home.other')}</Tag>
              <Badge
                count={template.likesCount || 0}
                className="like-badge"
              >
                <StarFilled className="star-icon" />
              </Badge>
            </Space>
            <div className="template-author">
              <Text type="secondary">
                {t('home.createdBy')}: {template.author?.username || t('home.anonymous')}
              </Text>
            </div>
          </div>
        }
      />
    </Card>
  );

  const renderPopularTemplateItem = (item, index) => (
    <List.Item className="popular-list-item">
      <List.Item.Meta
        title={
          <Link to={`/templates/${item.id}`} className="popular-template-title">
            <Text strong>{index + 1}. {item.title}</Text>
          </Link>
        }
        description={
          <Space className="popular-template-meta">
            <Text type="secondary">{moment(item.createdAt).format('DD.MM.YYYY')}</Text>
            <Tag className="topic-tag">{item.topic}</Tag>
          </Space>
        }
      />
      <div className="popular-template-stats">
        <Space>
          <Badge
            count={item.formsCount || 0}
            className="form-count-badge"
            title={t('home.filledForms')}
          />
          <Badge
            count={item.likesCount || 0}
            className="like-count-badge"
            title={t('home.likes')}
          >
            <StarFilled className="star-icon" />
          </Badge>
        </Space>
      </div>
    </List.Item>
  );

  if (error) {
    return (
      <div className="error-container">
        <Title level={3} type="danger">{error}</Title>
        <Button type="primary" onClick={() => window.location.reload()}>
          {t('home.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Title level={2} className="welcome-title">
        {t('home.welcome')}
      </Title>

      <div className="search-container">
        <Input
          size="large"
          placeholder={t('home.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          className="search-input"
          addonAfter={
            <Button type="primary" onClick={handleSearch} className="search-button">
              {t('home.search')}
            </Button>
          }
        />
      </div>

      <Row gutter={[24, 24]} className="stats-row">
        <Col span={8}>
          <Card className="stat-card">
            <Statistic
              title={t('home.totalTemplates')}
              value={stats?.templatesCount || 0}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card">
            <Statistic
              title={t('home.totalForms')}
              value={stats?.formsCount || 0}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card">
            <Statistic
              title={t('home.activeUsers')}
              value={stats?.activeUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="content-row">
        <Col span={24}>
          <Title level={4} className="section-title">{t('home.latestTemplates')}</Title>
          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Col key={i} xs={24} sm={12} md={8} lg={6}>
                  <Card className="skeleton-card">
                    <Skeleton active avatar paragraph={{ rows: 3 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : latestTemplates.length > 0 ? (
            <Row gutter={[16, 16]} className="templates-grid">
              {latestTemplates.map(renderTemplateCard)}
            </Row>
          ) : (
            <Card className="empty-card">
              <Empty
                description={t('home.noTemplates')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} md={12} className="popular-column">
          <Card
            title={<Title level={4} className="section-title">{t('home.popularTemplates')}</Title>}
            className="popular-card"
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : popularTemplates.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={popularTemplates}
                renderItem={renderPopularTemplateItem}
                className="popular-list"
              />
            ) : (
              <Empty
                description={t('home.noPopularTemplates')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12} className="tags-column">
          <Card
            title={<Title level={4} className="section-title">{t('home.tagCloud')}</Title>}
            className="tags-card"
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : tags.length > 0 ? (
              <div className="tag-cloud">
                {tags.map(tag => (
                  <Tag
                    key={tag.name}
                    className={`tag-item ${darkMode ? 'dark-tag' : 'light-tag'}`}
                    onClick={() => handleTagClick(tag.name)}
                  >
                    {tag.name} ({tag.count})
                  </Tag>
                ))}
              </div>
            ) : (
              <Empty
                description={t('home.noTags')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>

      {!user && (
        <Card className="cta-card">
          <Title level={4} className="cta-title">{t('home.callToActionTitle')}</Title>
          <Text type="secondary" className="cta-description">
            {t('home.callToActionDescription')}
          </Text>
          <Space className="cta-buttons">
            <Button type="primary" size="large" onClick={() => navigate('/register')}>
              {t('home.registerNow')}
            </Button>
            <Button size="large" onClick={() => navigate('/templates')}>
              {t('home.browseTemplates')}
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}
