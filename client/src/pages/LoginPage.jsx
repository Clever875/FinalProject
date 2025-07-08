import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  Space,
  message,
  Divider,
  Checkbox
} from 'antd';
import {
  UserOutlined,
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

export default function LoginPage() {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const success = await login({
      email: values.email,
      password: values.password,
      rememberMe: rememberMe
    });
      if (success) {
        message.success(t('login.welcomeMessage'));
        navigate('/templates');
      } else {
        message.error(t('login.errorMessage'));
      }
    } catch (e) {
      message.error(e.message || t('login.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    message.info(t('login.socialComingSoon'));
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : 'light'}`}>
      <Card className="auth-card">
        <Title level={3} className="auth-title">
          {t('login.title')}
        </Title>

        <Form
          form={form}
          name="login"
          onFinish={onSubmit}
          layout="vertical"
          className="auth-form"
        >
          <Form.Item
            name="email"
            rules={[
              {
                required: true,
                message: t('login.emailRequired')
              },
              {
                type: 'email',
                message: t('login.emailInvalid')
              }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('login.emailPlaceholder')}
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: t('login.passwordRequired')
              },
              {
                min: 6,
                message: t('login.passwordLength')
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('login.passwordPlaceholder')}
              size="large"
              className="auth-input"
            />
          </Form.Item>

          <Space className="auth-options">
            <Checkbox
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="remember-checkbox"
            >
              {t('login.rememberMe')}
            </Checkbox>
            <Link to="/forgot-password" className="forgot-link">
              {t('login.forgotPassword')}
            </Link>
          </Space>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              className="auth-button"
            >
              {t('login.submitButton')}
            </Button>
          </Form.Item>
        </Form>

        <Divider className="divider">{t('login.socialDivider')}</Divider>

        <Space className="social-buttons">
          <Button
            icon={<GoogleOutlined />}
            onClick={() => handleSocialLogin('google')}
            className="social-button google"
          />
          <Button
            icon={<FacebookFilled />}
            onClick={() => handleSocialLogin('facebook')}
            className="social-button facebook"
          />
          <Button
            icon={<GithubOutlined />}
            onClick={() => handleSocialLogin('github')}
            className="social-button github"
          />
        </Space>

        <div className="auth-footer">
          <Text>{t('login.noAccount')}</Text>
          <Link to="/register" className="auth-link">
            {t('login.registerLink')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
