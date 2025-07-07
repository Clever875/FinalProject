import { Alert } from 'antd';
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
  Divider,
  Tag,
  Descriptions
} from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UserOutlined,
  CalendarOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { formsApi } from '../api';
import moment from 'moment';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './css/FormPages.css';

const { Title, Text } = Typography;

export default function FormPage() {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const { formId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await formsApi.getFormById(formId);
        setForm(data);

        const initialAnswers = {};
        data.answers.forEach(answer => {
          initialAnswers[answer.questionId] = answer.value;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Ошибка загрузки формы:', err);
        setError(t('form.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, t]);

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
      message.success(t('form.updateSuccess'));
      setEditing(false);

      // Обновляем данные формы
      const updatedForm = await formsApi.getFormById(formId);
      setForm(updatedForm);
    } catch (err) {
      console.error('Ошибка при сохранении ответов:', err);
      message.error(t('form.updateError'));
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
    if (!question) return <Text type="secondary">{t('form.questionNotFound')}</Text>;

    switch (question.type) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'NUMBER':
        return <Text>{answer.value || <Text type="secondary">{t('form.noAnswer')}</Text>}</Text>;

      case 'CHECKBOX':
        const selectedOptions = Array.isArray(answer.value)
          ? answer.value.map(id =>
              question.options.find(opt => opt.id === id)?.value || id
            )
          : [];
        return (
          <div className="checkbox-answers">
            {selectedOptions.map((opt, i) => (
              <Tag key={i} color="blue" className="answer-tag">
                {opt}
              </Tag>
            ))}
          </div>
        );

      case 'RADIO':
      case 'SELECT':
        const selectedOption = question.options.find(opt => opt.id === answer.value);
        return (
          <Text strong className="selected-answer">
            {selectedOption ? selectedOption.value : answer.value}
          </Text>
        );

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
            placeholder={t('form.answerPlaceholder')}
            className="form-input"
          />
        );

      case 'TEXTAREA':
        return (
          <Input.TextArea
            rows={3}
            value={answers[question.id] || ''}
            onChange={e => handleAnswerChange(question.id, e.target.value)}
            placeholder={t('form.answerPlaceholder')}
            className="form-textarea"
          />
        );

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={answers[question.id] || ''}
            onChange={e => handleAnswerChange(question.id, e.target.value)}
            placeholder={t('form.numberPlaceholder')}
            className="form-input"
          />
        );

      case 'CHECKBOX':
        return (
          <Checkbox.Group
            value={answers[question.id] || []}
            onChange={values => handleAnswerChange(question.id, values)}
            className="checkbox-group"
          >
            <Space direction="vertical">
              {question.options?.map(option => (
                <Checkbox
                  key={option.id}
                  value={option.id}
                  className="form-checkbox"
                >
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
            className="radio-group"
          >
            <Space direction="vertical">
              {question.options?.map(option => (
                <Radio
                  key={option.id}
                  value={option.id}
                  className="form-radio"
                >
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
            className="form-select"
            placeholder={t('form.selectPlaceholder')}
          >
            {question.options?.map(option => (
              <Select.Option key={option.id} value={option.id}>
                {option.value}
              </Select.Option>
            ))}
          </Select>
        );

      default:
        return <Input placeholder={t('form.answerPlaceholder')} className="form-input" />;
    }
  };

  if (error) {
    return (
      <div className="form-error-container">
        <Alert
          message={t('form.errorTitle')}
          description={error}
          type="error"
          showIcon
        />
        <Button
          type="primary"
          onClick={() => navigate('/')}
          className="home-button"
        >
          {t('form.backToHome')}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="form-loading-container">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="form-not-found">
        <Title level={3}>{t('form.formNotFound')}</Title>
        <Button
          type="primary"
          onClick={() => navigate('/')}
          className="home-button"
        >
          {t('form.backToHome')}
        </Button>
      </div>
    );
  }

  return (
    <div className={`form-page ${darkMode ? 'dark' : 'light'}`}>
      <Card
        title={
          <Title level={2} className="form-title">
            {form.template?.title || t('form.untitledForm')}
          </Title>
        }
        className="form-card"
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
                    className="save-button"
                  >
                    {t('form.save')}
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="cancel-button"
                  >
                    {t('form.cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                  className="edit-button"
                >
                  {t('form.edit')}
                </Button>
              )}
            </Space>
          )
        }
      >
        <Descriptions
          bordered
          column={1}
          className="form-metadata"
        >
          <Descriptions.Item label={t('form.submitted')}>
            <Tooltip title={moment(form.createdAt).format('LLL')}>
              <span>
                <CalendarOutlined /> {moment(form.createdAt).fromNow()}
              </span>
            </Tooltip>
          </Descriptions.Item>

          <Descriptions.Item label={t('form.user')}>
            <span>
              <UserOutlined /> {form.user?.username || t('form.anonymous')}
              {form.user?.id === user?.id && ` (${t('form.you')})`}
            </span>
          </Descriptions.Item>

          {form.user?.email && (
            <Descriptions.Item label={t('form.email')}>
              <span>
                <MailOutlined /> {form.user.email}
              </span>
            </Descriptions.Item>
          )}

          <Descriptions.Item label={t('form.status')}>
            <Badge
              status={form.completed ? 'success' : 'warning'}
              text={form.completed ? t('form.completed') : t('form.draft')}
            />
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">{t('form.answersSection')}</Divider>

        <List
          itemLayout="vertical"
          dataSource={form.answers}
          renderItem={answer => {
            const question = form.template?.questions?.find(q => q.id === answer.questionId);

            return (
              <List.Item className="answer-item">
                <List.Item.Meta
                  title={
                    <Text strong className="question-title">
                      {question?.title || t('form.unknownQuestion')}
                      {question?.isRequired && (
                        <Text type="danger" className="required-star">*</Text>
                      )}
                    </Text>
                  }
                  description={question?.description && (
                    <Text type="secondary" className="question-description">
                      {question.description}
                    </Text>
                  )}
                />

                <div className="answer-content">
                  {editing ? (
                    renderEditableAnswer(answer, question)
                  ) : (
                    renderAnswer(answer, question)
                  )}
                </div>
              </List.Item>
            );
          }}
          className="answers-list"
        />
      </Card>
    </div>
  );
}
