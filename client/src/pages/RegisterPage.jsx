import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  Space,
  message,
  Divider
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  GoogleOutlined,
  FacebookFilled,
  GithubOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import './css/AuthPages.css';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      await register(values.name, values.email, values.password);
      message.success(t('register.successMessage'));
      navigate('/templates');
    } catch (error) {
      message.error(error.message || t('register.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    message.info(t('register.socialComingSoon'));
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : 'light'}`}>
      <Card className="auth-card">
        <Title level={3} className="auth-title">
          {t('register.title')}
        </Title>

        <Form
          form={form}
          name="register"
          onFinish={onSubmit}
          layout="vertical"
          className="auth-form"
        >
          <Form.Item
            name="name"
            rules={[
              {
                required: true,
                message: t('register.nameRequired')
              },
              {
                min: 3,
                message: t('register.nameLength')
              }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('register.namePlaceholder')}
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              {
                required: true,
                message: t('register.emailRequired')
              },
              {
                type: 'email',
                message: t('register.emailInvalid')
              }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t('register.emailPlaceholder')}
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: t('register.passwordRequired')
              },
              {
                min: 8,
                message: t('register.passwordLength')
              },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: t('register.passwordComplexity')
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('register.passwordPlaceholder')}
              size="large"
              className="auth-input"
              visibilityToggle={{
                visible: passwordVisible,
                onVisibleChange: setPasswordVisible
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: t('register.confirmRequired')
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('register.confirmMismatch')));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('register.confirmPlaceholder')}
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              className="auth-button"
            >
              {t('register.submitButton')}
            </Button>
          </Form.Item>
        </Form>

        <Divider className="divider">{t('register.socialDivider')}</Divider>

        <Space className="social-buttons">
          <Button
            icon={<GoogleOutlined />}
            onClick={() => handleSocialRegister('google')}
            className="social-button google"
          />
          <Button
            icon={<FacebookFilled />}
            onClick={() => handleSocialRegister('facebook')}
            className="social-button facebook"
          />
          <Button
            icon={<GithubOutlined />}
            onClick={() => handleSocialRegister('github')}
            className="social-button github"
          />
        </Space>

        <div className="auth-footer">
          <Text>{t('register.haveAccount')}</Text>
          <Link to="/login" className="auth-link">
            {t('register.loginLink')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
