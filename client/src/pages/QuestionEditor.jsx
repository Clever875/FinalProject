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
  Col
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

const DEFAULT_QUESTION_TYPES = [
  { value: 'TEXT', label: 'Текст (одна строка)' },
  { value: 'TEXTAREA', label: 'Текст (много строк)' },
  { value: 'NUMBER', label: 'Число' },
  { value: 'CHECKBOX', label: 'Чекбокс' },
  { value: 'SELECT', label: 'Выпадающий список' },
  { value: 'RADIO', label: 'Радиокнопки' },
];

const QuestionEditor = ({
  question = {},
  index = 0,
  onChange = () => {},
  onRemove = () => {},
  questionTypes = DEFAULT_QUESTION_TYPES
}) => {
  const handleTextChange = (e) => {
    onChange({ ...question, text: e.target.value });
  };

  const handleTypeChange = (value) => {
    const newQuestion = { ...question, type: value };

    if (!['SELECT', 'RADIO', 'CHECKBOX'].includes(value)) {
      newQuestion.options = [];
    }

    onChange(newQuestion);
  };

  const handleOptionChange = (optionIndex, value) => {
    const options = [...question.options || []];
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
    const options = [...question.options || []];
    options.splice(optionIndex, 1);
    onChange({ ...question, options });
  };

  const renderOptions = () => {
    if (!['SELECT', 'RADIO', 'CHECKBOX'].includes(question.type)) return null;

    return (
      <div style={{ marginTop: 16 }}>
        <Text strong>Варианты ответов:</Text>
        {(question.options || []).map((option, idx) => (
          <div key={idx} style={{ marginTop: 8, display: 'flex', alignItems: 'center' }}>
            <Input
              value={option}
              placeholder={`Вариант ${idx + 1}`}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              style={{ flex: 1 }}
            />
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => removeOption(idx)}
              style={{ marginLeft: 8 }}
              danger
            />
          </div>
        ))}
        <Button
          type="dashed"
          onClick={addOption}
          icon={<PlusOutlined />}
          style={{ marginTop: 8 }}
        >
          Добавить вариант
        </Button>
      </div>
    );
  };

  return (
    <Card
      title={`Вопрос ${index + 1}`}
      size="small"
      style={{ marginBottom: 16 }}
      extra={
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={onRemove}
          danger
        />
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <TextArea
          placeholder="Текст вопроса"
          value={question.text || ''}
          onChange={handleTextChange}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Тип вопроса</Text>
              <Select
                value={question.type || 'TEXT'}
                onChange={handleTypeChange}
                style={{ width: '100%' }}
              >
                {questionTypes.map((type) => (
                  <Select.Option key={type.value} value={type.value}>
                    {type.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>

          <Col span={12}>
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>Обязательный</Text>
                <Switch
                  checked={question.isRequired !== false}
                  onChange={checked => onChange({ ...question, isRequired: checked })}
                />
              </div>

              <div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>В таблице</Text>
                <Switch
                  checked={!!question.displayInTable}
                  onChange={checked => onChange({ ...question, displayInTable: checked })}
                />
              </div>
            </Space>
          </Col>
        </Row>

        {renderOptions()}
      </Space>
    </Card>
  );
};

export default QuestionEditor;
