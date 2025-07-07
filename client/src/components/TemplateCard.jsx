import React from 'react';
import { Card, Typography, Tag, Button, Avatar, Tooltip } from 'antd';
import { FormOutlined, UserOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

export default function TemplateCard({ template, onEdit, onUse }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/templates/${template.id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(template.id);
  };

  const handleUse = (e) => {
    e.stopPropagation();
    onUse(template.id);
  };

  return (
    <Card
      hoverable
      className="template-card"
      onClick={handleCardClick}
      cover={
        template.imageUrl ? (
          <div
            className="template-image"
            style={{ backgroundImage: `url(${template.imageUrl})` }}
          />
        ) : (
          <div className="template-image-placeholder">
            <FormOutlined />
          </div>
        )
      }
    >
      <div className="template-header">
        <Title level={5} className="template-title" ellipsis={{ rows: 1 }}>
          {template.title}
        </Title>

        <div className="template-meta">
          <Tag color={template.isPublic ? 'green' : 'blue'}>
            {template.isPublic ? t('templates.public') : t('templates.private')}
          </Tag>

          <div className="template-stats">
            <Tooltip title={t('templates.likesCount')}>
              <span className="stat-item">
                <StarFilled className="stat-icon" />
                <Text>{template.likesCount || 0}</Text>
              </span>
            </Tooltip>

            <Tooltip title={t('templates.formsCount')}>
              <span className="stat-item">
                <FormOutlined className="stat-icon" />
                <Text>{template.formsCount || 0}</Text>
              </span>
            </Tooltip>
          </div>
        </div>
      </div>

      <Text className="template-description" ellipsis={{ rows: 2 }}>
        {template.description || t('templates.noDescription')}
      </Text>

      <div className="template-footer">
        <div className="template-author">
          <Avatar
            size="small"
            src={template.author?.avatar}
            icon={<UserOutlined />}
          />
          <Text className="author-name" ellipsis>
            {template.author?.username || t('templates.anonymousAuthor')}
          </Text>
        </div>

        <div className="template-actions">
          <Button
            type="link"
            onClick={handleEdit}
            className="edit-button"
          >
            {t('common.edit')}
          </Button>
          <Button
            type="primary"
            onClick={handleUse}
            className="use-button"
          >
            {t('templates.use')}
          </Button>
        </div>
      </div>

      {template.tags?.length > 0 && (
        <div className="template-tags">
          {template.tags.slice(0, 3).map(tag => (
            <Tag key={tag} className="tag-item">
              {tag}
            </Tag>
          ))}
          {template.tags.length > 3 && (
            <Tag className="more-tags">
              +{template.tags.length - 3}
            </Tag>
          )}
        </div>
      )}
    </Card>
  );
}
