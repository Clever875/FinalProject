import React, { useState, useEffect } from 'react';
import {
  List,
  Avatar,
  Form,
  Button,
  Input,
  Typography,
  Spin,
  message
} from 'antd';
import { Comment } from '@ant-design/compatible';
import { UserOutlined } from '@ant-design/icons';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import { commentsApi } from '../api';
import moment from 'moment';

const { Title } = Typography;
const { TextArea } = Input;

// Встроенные стили вместо CSS файла
const styles = {
  commentsSection: {
    marginTop: '24px',
    padding: '16px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  commentList: {
    marginBottom: '24px',
  },
  darkMode: {
    backgroundColor: '#1f1f1f',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  }
};

export default function CommentsSection({ templateId }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await commentsApi.getComments(templateId);
        setComments(response);
      } catch (err) {
        console.error('Error fetching comments:', err);
        message.error(t('comments.loadError'));
      }
    };

    if (templateId) {
      fetchComments();
    }
  }, [templateId, t]);

  const handleSubmit = async () => {
    if (!value.trim()) return;

    try {
      setSubmitting(true);
      const newComment = await commentsApi.addComment(templateId, {
        content: value,
      });

      setComments([...comments, newComment]);
      setValue('');
      message.success(t('comments.addSuccess'));
    } catch (err) {
      console.error('Error adding comment:', err);
      message.error(t('comments.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Определяем стиль в зависимости от темы
  const sectionStyle = user?.darkMode
    ? {...styles.commentsSection, ...styles.darkMode}
    : styles.commentsSection;

  return (
    <div style={sectionStyle}>
      <Title level={4}>{t('comments.title')}</Title>

      {comments.length > 0 ? (
        <List
          style={styles.commentList}
          itemLayout="horizontal"
          dataSource={comments}
          renderItem={item => (
            <li>
              <Comment
                author={item.user.name}
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    src={item.user.avatar}
                  />
                }
                content={item.content}
                datetime={moment(item.createdAt).fromNow()}
              />
            </li>
          )}
        />
      ) : (
        <p>{t('comments.noComments')}</p>
      )}

      <Form.Item>
        <TextArea
          rows={4}
          onChange={e => setValue(e.target.value)}
          value={value}
          placeholder={t('comments.placeholder')}
          disabled={!user}
        />
      </Form.Item>
      <Form.Item>
        <Button
          htmlType="submit"
          loading={submitting}
          onClick={handleSubmit}
          type="primary"
          disabled={!user || !value.trim()}
        >
          {t('comments.addComment')}
        </Button>
      </Form.Item>
    </div>
  );
}
