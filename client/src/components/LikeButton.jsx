import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Badge, Spin, message } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useAuth } from '../AuthContext';
import { likesApi } from '../api';
import { useTranslation } from 'react-i18next';

export default function LikeButton({ templateId, initialCount }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikeData = async () => {
      if (!templateId) return;

      try {
        setLoading(true);
        const status = await likesApi.getLikeStatus(templateId);
        setLiked(status.liked);

        if (initialCount === undefined) {
          const countRes = await likesApi.getLikeCount(templateId);
          setLikeCount(countRes.count);
        }
      } catch (err) {
        console.error('Ошибка загрузки данных о лайках:', err);
        message.error(t('likes.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchLikeData();
  }, [user, templateId, initialCount, t]);

  const handleLike = async () => {
    if (!user) {
      message.info(t('likes.loginRequired'));
      return;
    }

    if (!templateId) return;

    try {
      setLoading(true);
      const response = await likesApi.toggleLike(templateId);
      setLiked(response.liked);
      setLikeCount(response.count);
    } catch (err) {
      console.error('Ошибка при обновлении лайка:', err);
      message.error(t('likes.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const tooltipText = !user
    ? t('likes.loginRequired')
    : liked
      ? t('likes.unlike')
      : t('likes.like');

  return (
    <div className="like-button-container">
      <Tooltip title={tooltipText}>
        <Button
          type="text"
          icon={
            loading ? (
              <Spin size="small" />
            ) : liked ? (
              <HeartFilled className="like-icon liked" />
            ) : (
              <HeartOutlined className="like-icon" />
            )
          }
          onClick={handleLike}
          disabled={!user || loading || !templateId}
          className="like-btn"
        />
      </Tooltip>

      <Badge
        count={likeCount}
        showZero
        className="like-count-badge"
      />
    </div>
  );
}
