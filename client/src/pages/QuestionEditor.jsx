import React from 'react';
import {
  Input,
  Select,
  Switch,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Form
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './css/QuestionEditor.css';

const { Text } = Typography;
const { TextArea } = Input;

const QuestionEditor = ({
  question = {},
  index = 0,
  onChange = () => {},
  onRemove = () => {},
  t
}) => {
  const { darkMode } = useTheme();
  const [form] = Form.useForm();

  // Инициализация формы
  React.useEffect(() => {
    form.setFieldsValue({
      text: question.text || '',
      type: question.type || 'TEXT',
      isRequired: question.isRequired !== false,
      displayInTable: !!question.displayInTable
    });
  }, [question, form]);

  const questionTypes = [
    { value: 'TEXT', label: t('question.types.TEXT') },
    { value: 'TEXTAREA', label: t('question.types.TEXTAREA') },
    { value: 'NUMBER', label: t('question.types.NUMBER') },
    { value: 'CHECKBOX', label: t('question.types.CHECKBOX') },
    { value: 'SELECT', label: t('question.types.SELECT') },
    { value: 'RADIO', label: t('question.types.RADIO') },
  ];

  const handleValuesChange = (_, allValues) => {
    const newQuestion = {
      ...question,
      ...allValues,
      options: ['SELECT', 'RADIO', 'CHECKBOX'].includes(allValues.type)
        ? question.options || []
        : []
    };
    onChange(newQuestion);
  };

  const handleOptionChange = (optionIndex, value) => {
    const options = [...(question.options || [])];
    options[optionIndex] = value;
    onChange({ ...question, options });
  };

  const addOption = () => {
    onChange({
      ...question,
      options: [...(question.options || []), '']
    });
  };

  const removeOption = (optionIndex) => {
    const options = [...(question.options || [])];
    options.splice(optionIndex, 1);
    onChange({ ...question, options });
  };

  const renderOptions = () => {
    if (!['SELECT', 'RADIO', 'CHECKBOX'].includes(question.type)) return null;

    return (
      <div className="options-section">
        <Text strong className="options-title">
          {t('question.options')}
        </Text>

        <div className="options-list">
          {(question.options || []).map((option, idx) => (
            <div key={idx} className="option-item">
              <Input
                value={option}
                placeholder={`${t('question.option')} ${idx + 1}`}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                className="option-input"
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => removeOption(idx)}
                className="remove-option-button"
                danger
              />
            </div>
          ))}
        </div>

        <Button
          type="dashed"
          onClick={addOption}
          icon={<PlusOutlined />}
          className="add-option-button"
        >
          {t('question.addOption')}
        </Button>
      </div>
    );
  };

  return (
    <Card
      title={`${t('question.title')} ${index + 1}`}
      className={`question-editor-card ${darkMode ? 'dark' : 'light'}`}
      extra={
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          danger
          className="remove-question-button"
        />
      }
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        className="question-form"
      >
        <Form.Item
          name="text"
          rules={[
            {
              required: true,
              message: t('question.textRequired')
            }
          ]}
        >
          <TextArea
            placeholder={t('question.textPlaceholder')}
            autoSize={{ minRows: 2, maxRows: 6 }}
            className="question-text"
          />
        </Form.Item>

        <Row gutter={16} className="question-settings">
          <Col span={12}>
            <Form.Item
              name="type"
              label={t('question.typeLabel')}
              className="type-select"
            >
              <Select options={questionTypes} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Space className="switches-group">
              <Form.Item
                name="isRequired"
                label={t('question.requiredLabel')}
                valuePropName="checked"
                className="switch-item"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="displayInTable"
                label={t('question.displayInTableLabel')}
                valuePropName="checked"
                className="switch-item"
              >
                <Switch />
              </Form.Item>
            </Space>
          </Col>
        </Row>

        {renderOptions()}
      </Form>
    </Card>
  );
};

export default QuestionEditor;
