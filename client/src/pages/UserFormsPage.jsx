import React, { useState, useEffect, useContext } from 'react';
import { Card, List, Button, Typography, Skeleton, Space, Tag, Popconfirm, message } from 'antd';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formsApi } from '../api'; // Исправленный импорт
import { AuthContext } from '../AuthContext';
import moment from 'moment';

const { Title, Text } = Typography;

export default function UserFormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        // Используем formsApi вместо прямой функции
        const data = await formsApi.getMyForms();
        setForms(data);
      } catch (err) {
        console.error('Ошибка загрузки форм:', err);
        message.error('Не удалось загрузить ваши формы');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchForms();
    }
  }, [user]);

  const handleDelete = async (id) => {
    try {
      // Используем formsApi вместо прямой функции
      await formsApi.deleteForm(id);
      setForms(forms.filter(f => f.id !== id));
      message.success('Форма успешно удалена');
    } catch (err) {
      console.error('Ошибка при удалении формы:', err);
      message.error('Не удалось удалить форму');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Мои формы</Title>

      {loading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : forms.length === 0 ? (
        <Card>
          <Title level={4} style={{ textAlign: 'center' }}>
            У вас пока нет заполненных форм
          </Title>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              type="primary"
              onClick={() => navigate('/templates')}
            >
              Выбрать шаблон для заполнения
            </Button>
          </div>
        </Card>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={forms}
          renderItem={form => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  icon={<FormOutlined />}
                  onClick={() => navigate(`/form/${form.id}`)}
                >
                  Открыть
                </Button>,
                <Popconfirm
                  title="Вы уверены, что хотите удалить эту форму?"
                  onConfirm={() => handleDelete(form.id)}
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
                title={<Text strong>{form.template?.title || 'Без названия'}</Text>}
                description={
                  <Space>
                    <Tag color={form.completed ? 'green' : 'orange'}>
                      {form.completed ? 'Завершено' : 'Черновик'}
                    </Tag>
                    <Text type="secondary">
                      {moment(form.createdAt).format('DD.MM.YYYY HH:mm')}
                    </Text>
                  </Space>
                }
              />
              <div>
                <Text type="secondary">Ответов: {form.answers.length}</Text>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
