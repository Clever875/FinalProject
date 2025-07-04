import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  List,
  Typography,
  Button,
  Input,
  Select,
  Checkbox,
  Radio,
  Skeleton,
  Space,
  message
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { AuthContext } from '../AuthContext';
import { formsApi, templatesApi } from '../api';

const { Title, Text } = Typography;

export default function FormCreatePage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const data = await templatesApi.getTemplateById(templateId);
        setTemplate(data);

        // Инициализируем пустые ответы
        const initialAnswers = {};
        data.questions.forEach(question => {
          if (question.type === 'CHECKBOX') {
            initialAnswers[question.id] = [];
          } else {
            initialAnswers[question.id] = '';
          }
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Ошибка загрузки шаблона:', err);
        message.error('Не удалось загрузить шаблон');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Преобразуем ответы в нужный формат
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        value
      }));

      // Создаем форму
      const form = await formsApi.createForm(templateId);

      // Обновляем ответы
      await formsApi.updateFormAnswers(form.id, answersArray);

      // Помечаем как завершенную
      await formsApi.completeForm(form.id);

      message.success('Форма успешно сохранена!');
      navigate(`/form/${form.id}`);
    } catch (err) {
      console.error('Ошибка при сохранении формы:', err);
      message.error('Не удалось сохранить форму');
    } finally {
      setSaving(false);
    }
  };

  const renderEditableAnswer = (question) => {
    switch (question.type) {
      case 'TEXT':
        return (
          <Input
            value={answers[question.id] || ''}
            onChange={e => handleAnswerChange(question.id, e.target.value)}
            placeholder="Введите ответ"
          />
        );

      case 'TEXTAREA':
        return (
          <Input.TextArea
            rows={3}
            value={answers[question.id] || ''}
            onChange={e => handleAnswerChange(question.id, e.target.value)}
            placeholder="Введите ответ"
          />
        );

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={answers[question.id] || ''}
            onChange={e => handleAnswerChange(question.id, e.target.value)}
            placeholder="Введите число"
          />
        );

      case 'CHECKBOX':
        return (
          <Checkbox.Group
            value={answers[question.id] || []}
            onChange={values => handleAnswerChange(question.id, values)}
          >
            <Space direction="vertical">
              {question.options?.map(option => (
                <Checkbox key={option.id} value={option.id}>
                  {option.value}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case 'RADIO':
        return (
          <Radio.Group
            value={answers[question.id]}
            onChange={e => handleAnswerChange(question.id, e.target.value)}
          >
            <Space direction="vertical">
              {question.options?.map(option => (
                <Radio key={option.id} value={option.id}>
                  {option.value}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'SELECT':
        return (
          <Select
            value={answers[question.id]}
            onChange={value => handleAnswerChange(question.id, value)}
            style={{ width: '100%' }}
          >
            {question.options?.map(option => (
              <Select.Option key={option.id} value={option.id}>
                {option.value}
              </Select.Option>
            ))}
          </Select>
        );

      default:
        return <Input placeholder="Ответ" />;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Title level={3}>Шаблон не найден</Title>
        <Button type="primary" onClick={() => navigate('/')}>
          На главную
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Card
        title={<Title level={2}>{template.title}</Title>}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={saving}
          >
            Сохранить форму
          </Button>
        }
      >
        <Text>{template.description}</Text>

        <List
          itemLayout="vertical"
          dataSource={template.questions}
          renderItem={question => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Text strong>
                    {question.title}
                    {question.isRequired && <Text type="danger" style={{ marginLeft: 8 }}>*</Text>}
                  </Text>
                }
                description={question.description}
              />
              {renderEditableAnswer(question)}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
