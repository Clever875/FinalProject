import React, { useState, useEffect, useContext } from 'react';
import { Card, Tabs, List, Button, Typography, Skeleton, Space, Popconfirm, message } from 'antd';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';
import { templatesApi } from '../api'; // Исправленный импорт
import { AuthContext } from '../AuthContext';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function UserPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        // Используем templatesApi вместо прямой функции
        const data = await templatesApi.getUserTemplates();
        setTemplates(data);
      } catch (err) {
        console.error('Ошибка загрузки шаблонов:', err);
        message.error('Не удалось загрузить ваши шаблоны');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const handleDeleteTemplate = async (id) => {
    try {
      // Используем templatesApi вместо прямой функции
      await templatesApi.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
      message.success('Шаблон успешно удален');
    } catch (err) {
      console.error('Ошибка при удалении шаблона:', err);
      message.error('Не удалось удалить шаблон');
    }
  };

  return (
    <Card title={<Title level={2}>Личный кабинет</Title>} style={{ maxWidth: 800, margin: '0 auto' }}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Мои шаблоны" key="1">
          {loading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Title level={4}>У вас пока нет шаблонов</Title>
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={templates}
              renderItem={template => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => window.location.href = `/edit-template/${template.id}`}
                    >
                      Редактировать
                    </Button>,
                    <Popconfirm
                      title="Вы уверены, что хотите удалить этот шаблон?"
                      onConfirm={() => handleDeleteTemplate(template.id)}
                      okText="Да"
                      cancelText="Отмена"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Удалить
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={<Text strong>{template.title}</Text>}
                    description={
                      <Space direction="vertical">
                        <Text type="secondary">{template.description || 'Без описания'}</Text>
                        <Text type="secondary">
                          Создан: {moment(template.createdAt).format('DD.MM.YYYY')}
                        </Text>
                        <Tag color={template.isPublic ? 'green' : 'blue'}>
                          {template.isPublic ? 'Публичный' : 'Приватный'}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </TabPane>

        <TabPane tab="Настройки" key="2">
          <div style={{ padding: 16 }}>
            <Title level={4}>Настройки аккаунта</Title>
            <p>Здесь будут настройки вашего аккаунта...</p>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
}
