import React, { useState, useEffect, useContext } from 'react';
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
  message,
  Badge,
  Tooltip,
  Divider
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { formsApi } from '../api';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;

export default function FormPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const data = await formsApi.getFormById(formId);
        setForm(data);

        const initialAnswers = {};
        data.answers.forEach(answer => {
          initialAnswers[answer.questionId] = answer.value;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Ошибка загрузки формы:', err);
        message.error('Не удалось загрузить форму');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const canEdit = () => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (form && form.userId === user.id) return true;
    return false;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        value
      }));

      await formsApi.updateFormAnswers(formId, answersArray);
      message.success('Ответы успешно обновлены!');
      setEditing(false);

      const updatedForm = await formsApi.getFormById(formId);
      setForm(updatedForm);
    } catch (err) {
      console.error('Ошибка при сохранении ответов:', err);
      message.error('Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderAnswer = (answer, question) => {
    if (!question) return <Text type="secondary">Вопрос не найден</Text>;

    switch (question.type) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'NUMBER':
        return <Text>{answer.value || <Text type="secondary">Нет ответа</Text>}</Text>;

      case 'CHECKBOX':
        const selectedOptions = Array.isArray(answer.value)
          ? answer.value.map(id =>
              question.options.find(opt => opt.id === id)?.value || id
            )
          : [];
        return (
          <div>
            {selectedOptions.map((opt, i) => (
              <div key={i}>{opt}</div>
            ))}
          </div>
        );

      case 'RADIO':
      case 'SELECT':
        const selectedOption = question.options.find(opt => opt.id === answer.value);
        return <Text>{selectedOption ? selectedOption.value : answer.value}</Text>;

      default:
        return <Text>{answer.value}</Text>;
    }
  };

  const renderEditableAnswer = (answer, question) => {
    if (!question) return null;

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

  if (!form) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Title level={3}>Форма не найдена</Title>
        <Button type="primary" onClick={() => navigate('/')}>
          На главную
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Card
        title={
          <Title level={2} style={{ marginBottom: 0 }}>
            {form.template?.title || 'Форма без названия'}
          </Title>
        }
        extra={
          canEdit() && (
            <Space>
              {editing ? (
                <>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                  >
                    Сохранить
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Отменить
                  </Button>
                </>
              ) : (
                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setEditing(true)}
                >
                    Редактировать
                </Button>
              )}
            </Space>
          )
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Заполнено:</Text>{' '}
            <Tooltip title={moment(form.createdAt).format('LLL')}>
              <span>{moment(form.createdAt).fromNow()}</span>
            </Tooltip>
          </div>

          <div>
            <Text strong>Пользователь:</Text>{' '}
            <span>
              {form.user?.username || 'Аноним'}
              {form.user?.id === user?.id && ' (Вы)'}
            </span>
          </div>

          <div>
            <Text strong>Статус:</Text>{' '}
            <Badge
              status={form.completed ? 'success' : 'warning'}
              text={form.completed ? 'Завершено' : 'Черновик'}
            />
          </div>
        </Space>

        <Divider orientation="left">Ответы</Divider>

        <List
          itemLayout="vertical"
          dataSource={form.answers}
          renderItem={answer => {
            const question = form.template?.questions?.find(q => q.id === answer.questionId);

            return (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Text strong>
                      {question?.title || 'Неизвестный вопрос'}
                      {question?.isRequired && (
                        <Text type="danger" style={{ marginLeft: 8 }}>*</Text>
                      )}
                    </Text>
                  }
                  description={question?.description}
                />

                {editing ? (
                  renderEditableAnswer(answer, question)
                ) : (
                  renderAnswer(answer, question)
                )}
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}
