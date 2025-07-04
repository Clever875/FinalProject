import React, { useState, useEffect } from 'react';
import { Button, Space, Typography } from 'antd';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

const LikeButton = ({ templateId }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        const [statusRes, countRes] = await Promise.all([
          axios.get(`/api/likes/${templateId}/status`),
          axios.get(`/api/likes/${templateId}/count`)
        ]);
        setLiked(statusRes.data.liked);
        setLikeCount(countRes.data.count);
      } catch (err) {
        console.error('Ошибка загрузки лайков:', err);
      }
    };

    fetchLikeData();
  }, [templateId]);

  const handleLike = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/likes/${templateId}`);
      setLiked(response.data.liked);
      setLikeCount(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (err) {
      console.error('Ошибка при отправке лайка:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space>
      <Button
        type="text"
        icon={liked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
        onClick={handleLike}
        loading={loading}
      />
      <Text>{likeCount}</Text>
    </Space>
  );
};

export default LikeButton;
