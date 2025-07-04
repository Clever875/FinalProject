import React, { useState } from 'react';
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
  Typography
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { templatesApi } from '../api'; // Измененный импорт
import QuestionEditor from './QuestionEditor';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

export default function CreateTemplateForm() {
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const questionTypes = [
    { value: 'TEXT', label: 'Текст (одна строка)' },
    { value: 'TEXTAREA', label: 'Текст (много строк)' },
    { value: 'NUMBER', label: 'Число' },
    { value: 'CHECKBOX', label: 'Чекбокс' },
    { value: 'SELECT', label: 'Выпадающий список' },
    { value: 'RADIO', label: 'Радиокнопки' },
  ];

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

  const handleImageUpload = (info) => {
    // Здесь должна быть логика загрузки в облако
    // Для примера просто сохраняем URL
    setImageUrl(info.file.name);
  };

  const onFinish = async (values) => {
    if (questions.length === 0) {
      message.warning('Добавьте хотя бы один вопрос');
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

    setLoading(true);
    try {
      // Используем templatesApi вместо прямой функции
      await templatesApi.createTemplate(templateData);
      message.success('Шаблон успешно создан!');
      form.resetFields();
      setQuestions([]);
      setImageUrl('');
    } catch (err) {
      console.error('Ошибка при создании шаблона:', err);
      message.error(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<Title level={2}>Создание шаблона</Title>} style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ isPublic: false }}
      >
        <Form.Item
          label="Название шаблона"
          name="title"
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input placeholder="Мой опрос" />
        </Form.Item>

        <Form.Item
          label="Описание"
          name="description"
        >
          <TextArea rows={3} placeholder="Описание вашего шаблона" />
        </Form.Item>

        <Form.Item
          label="Тема"
          name="theme"
          rules={[{ required: true, message: 'Выберите тему' }]}
        >
          <Select placeholder="Выберите тему">
            <Option value="education">Образование</Option>
            <Option value="health">Здоровье</Option>
            <Option value="business">Бизнес</Option>
            <Option value="other">Другое</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Изображение">
          <Upload
            accept="image/*"
            beforeUpload={() => false}
            onChange={handleImageUpload}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Загрузить изображение</Button>
            {imageUrl && <span style={{ marginLeft: 8 }}>{imageUrl}</span>}
          </Upload>
        </Form.Item>

        <Form.Item
          label="Доступ"
          name="isPublic"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="Публичный"
            unCheckedChildren="Приватный"
          />
        </Form.Item>

        <Divider orientation="left">Вопросы</Divider>

        {questions.map((q, index) => (
          <QuestionEditor
            key={index}
            index={index}
            question={q}
            questionTypes={questionTypes}
            onChange={updateQuestion}
            onRemove={removeQuestion}
          />
        ))}

        <Form.Item>
          <Button
            type="dashed"
            onClick={addQuestion}
            icon={<PlusOutlined />}
            style={{ width: '100%' }}
          >
            Добавить вопрос
          </Button>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Сохранить шаблон
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                form.resetFields();
                setQuestions([]);
              }}
            >
              Очистить
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
