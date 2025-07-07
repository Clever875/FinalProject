import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  Switch,
  Divider,
  Card,
  Upload,
  message,
  Space,
  Typography,
  Row,
  Col,
  Spin
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { templatesApi } from '../api';
import QuestionEditor from './QuestionEditor';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './css/TemplateForm.css';

const { TextArea } = Input;
const { Title } = Typography;

export default function TemplateEditor() {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { templateId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [initialValues, setInitialValues] = useState(null);

  const themes = [
    { value: 'education', label: t('template.themes.education') },
    { value: 'health', label: t('template.themes.health') },
    { value: 'business', label: t('template.themes.business') },
    { value: 'technology', label: t('template.themes.technology') },
    { value: 'entertainment', label: t('template.themes.entertainment') },
    { value: 'other', label: t('template.themes.other') },
  ];

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const template = await templatesApi.getTemplateById(templateId);

        setInitialValues({
          title: template.title,
          description: template.description,
          theme: template.theme,
          isPublic: template.isPublic
        });

        setImageUrl(template.imageUrl || '');
        setQuestions(template.questions || []);
        form.setFieldsValue({
          title: template.title,
          description: template.description,
          theme: template.theme,
          isPublic: template.isPublic
        });
      } catch (err) {
        console.error('Ошибка загрузки шаблона:', err);
        message.error(t('template.loadError'));
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId, form, t]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'TEXT',
        isRequired: true,
        displayInTable: false,
        options: [],
      },
    ]);
  };

  const updateQuestion = (index, updatedQuestion) => {
    const updated = [...questions];
    updated[index] = updatedQuestion;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const handleImageUpload = async (file) => {
    setImageLoading(true);
    try {
      // В реальном приложении здесь будет загрузка в облачное хранилище
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      message.success(t('template.imageUploadSuccess'));
    } catch (error) {
      message.error(t('template.imageUploadError'));
    } finally {
      setImageLoading(false);
    }
    return false; // Prevent default upload
  };

  const onFinish = async (values) => {
    if (questions.length === 0) {
      message.warning(t('template.minQuestionsWarning'));
      return;
    }

    const templateData = {
      ...values,
      imageUrl,
      questions: questions.map(q => ({
        ...q,
        options: ['SELECT', 'RADIO', 'CHECKBOX'].includes(q.type) ? q.options : [],
      })),
    };

    setSaving(true);
    try {
      await templatesApi.updateTemplate(templateId, templateData);
      message.success(t('template.updateSuccess'));
      navigate(`/templates/${templateId}`);
    } catch (err) {
      console.error('Ошибка при обновлении шаблона:', err);
      message.error(err.message || t('template.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="template-loading">
        <Spin size="large" />
        <Text className="loading-text">{t('template.loading')}</Text>
      </div>
    );
  }

  return (
    <div className={`template-form-page ${darkMode ? 'dark' : 'light'}`}>
      <Card
        title={
          <Title level={2} className="editor-title">
            {t('template.editTitle')}
          </Title>
        }
        className="template-form-card"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={saving}
            className="save-button"
          >
            {t('template.saveChanges')}
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={initialValues}
        >
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Form.Item
                label={t('template.titleLabel')}
                name="title"
                rules={[{
                  required: true,
                  message: t('template.titleRequired')
                }]}
              >
                <Input
                  placeholder={t('template.titlePlaceholder')}
                  className="form-input"
                />
              </Form.Item>

              <Form.Item
                label={t('template.descriptionLabel')}
                name="description"
              >
                <TextArea
                  rows={3}
                  placeholder={t('template.descriptionPlaceholder')}
                  className="form-textarea"
                />
              </Form.Item>

              <Form.Item
                label={t('template.themeLabel')}
                name="theme"
                rules={[{
                  required: true,
                  message: t('template.themeRequired')
                }]}
              >
                <Select
                  placeholder={t('template.themePlaceholder')}
                  className="form-select"
                  options={themes}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label={t('template.imageLabel')}>
                <Upload
                  accept="image/*"
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                  className="image-upload"
                >
                  {imageUrl ? (
                    <div className="image-preview">
                      <img src={imageUrl} alt="Template preview" />
                      <div className="image-overlay">
                        <Button
                          icon={<UploadOutlined />}
                          loading={imageLoading}
                        >
                          {t('template.changeImage')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="image-upload-placeholder">
                      <UploadOutlined style={{ fontSize: 32 }} />
                      <div>{t('template.uploadText')}</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item
                label={t('template.accessLabel')}
                name="isPublic"
                valuePropName="checked"
                className="access-switch"
              >
                <Switch
                  checkedChildren={t('template.public')}
                  unCheckedChildren={t('template.private')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">{t('template.questionsSection')}</Divider>

          {questions.map((q, index) => (
            <QuestionEditor
              key={index}
              index={index}
              question={q}
              onChange={(updated) => updateQuestion(index, updated)}
              onRemove={() => removeQuestion(index)}
              t={t}
            />
          ))}

          <Form.Item>
            <Button
              type="dashed"
              onClick={addQuestion}
              icon={<PlusOutlined />}
              className="add-question-button"
            >
              {t('template.addQuestion')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
