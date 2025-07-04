import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Button, Skeleton, Typography, Tabs, Tag, Input, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { templatesApi } from '../api'; // Исправленный импорт
import { AuthContext } from '../AuthContext';
import TemplateCard from '../components/TemplateCard';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function TemplatesPage() {
  const [myTemplates, setMyTemplates] = useState([]);
  const [publicTemplates, setPublicTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);

        // Используем templatesApi вместо прямых функций
        const [my, publicTemps] = await Promise.all([
          templatesApi.getUserTemplates(),
          templatesApi.getPublicTemplates()
        ]);

        setMyTemplates(my);
        setPublicTemplates(publicTemps);
      } catch (err) {
        console.error('Ошибка загрузки шаблонов:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const filteredMyTemplates = myTemplates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPublicTemplates = publicTemplates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Шаблоны форм</Title>

      <Space style={{ marginBottom: 24, width: '100%' }}>
        <Input
          placeholder="Поиск шаблонов..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/create-template')}
        >
          Создать шаблон
        </Button>
      </Space>

      <Tabs defaultActiveKey="1">
        <TabPane tab="Мои шаблоны" key="1">
          {loading ? (
            <Row gutter={[16, 16]}>
              {[1, 2, 3].map(i => (
                <Col span={8} key={i}>
                  <Card>
                    <Skeleton active />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredMyTemplates.length > 0 ? (
                filteredMyTemplates.map(template => (
                  <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                    <TemplateCard
                      template={template}
                      onEdit={() => navigate(`/edit-template/${template.id}`)}
                    />
                  </Col>
                ))
              ) : (
                <div style={{ padding: 24, textAlign: 'center', width: '100%' }}>
                  <Title level={4}>У вас пока нет шаблонов</Title>
                  <Button
                    type="primary"
                    onClick={() => navigate('/create-template')}
                  >
                    Создать первый шаблон
                  </Button>
                </div>
              )}
            </Row>
          )}
        </TabPane>

        <TabPane tab="Публичные шаблоны" key="2">
          <Row gutter={[16, 16]}>
            {filteredPublicTemplates.map(template => (
              <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                <TemplateCard
                  template={template}
                  onUse={() => navigate(`/create-form/${template.id}`)}
                />
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
}
