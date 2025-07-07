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
  message,
  Alert,
  Steps
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { AuthContext } from '../AuthContext';
import { formsApi, templatesApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './css/FormPages.css';

const { Title, Text } = Typography;
const { Step } = Steps;

export default function FormCreatePage() {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await templatesApi.getTemplateById(templateId);
        setTemplate(data);

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
        setError(t('form.templateLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, t]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < template.questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        value
      }));

      const form = await formsApi.createForm(templateId);
      await formsApi.updateFormAnswers(form.id, answersArray);
      await formsApi.completeForm(form.id);

      message.success(t('form.submitSuccess'));
      navigate(`/form/${form.id}`);
    } catch (err) {
      console.error('Ошибка при сохранении формы:', err);
      message.error(t('form.submitError'));
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

  if (!template) {
    return (
      <div className="form-not-found">
        <Title level={3}>{t('form.templateNotFound')}</Title>
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

  const currentQuestion = template.questions[currentStep];

  return (
    <div className={`form-create-page ${darkMode ? 'dark' : 'light'}`}>
      <Card
        title={<Title level={2}>{template.title}</Title>}
        className="form-card"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={saving}
            className="submit-button"
            disabled={Object.values(answers).some(a => a === '' || (Array.isArray(a) && a.length === 0))}
          >
            {t('form.submitButton')}
          </Button>
        }
      >
        <div className="form-description">
          <Text>{template.description}</Text>
        </div>

        <Steps current={currentStep} className="form-steps">
          {template.questions.map((q, index) => {
            const isAnswered = answers[q.id] !== undefined &&
                             answers[q.id] !== '' &&
                             (!Array.isArray(answers[q.id]) || answers[q.id].length > 0);

            return (
              <Step
                key={q.id}
                title={`${t('form.question')} ${index + 1}`}
                status={
                  currentStep === index
                    ? 'process'
                    : isAnswered
                      ? 'finish'
                      : 'wait'
                }
              />
            );
          })}
        </Steps>

        <div className="question-container">
          <div className="question-header">
            <Title level={4}>
              {currentQuestion.title}
              {currentQuestion.isRequired && (
                <Text type="danger" className="required-star">*</Text>
              )}
            </Title>
            {currentQuestion.description && (
              <Text type="secondary" className="question-description">
                {currentQuestion.description}
              </Text>
            )}
          </div>

          <div className="answer-container">
            {renderEditableAnswer(currentQuestion)}
          </div>
        </div>

        <div className="navigation-buttons">
          <Space>
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="nav-button prev-button"
            >
              {t('form.previous')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === template.questions.length - 1}
              className="nav-button next-button"
            >
              {t('form.next')}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
