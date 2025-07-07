import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Skeleton,
  Empty,
  Popconfirm,
  message,
  Badge,
  Tooltip
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { formsApi } from '../api';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import './css/FormPages.css';

const { Title, Text } = Typography;

export default function UserFormsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchForms = async (params = {}) => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const response = await formsApi.getUserForms({
        page: params.pagination?.current || current,
        limit: params.pagination?.pageSize || pageSize,
        ...params,
      });

      setForms(response.data);
      setPagination({
        ...pagination,
        total: response.pagination.total,
        current: response.pagination.page,
        pageSize: response.pagination.limit,
      });
    } catch (err) {
      console.error('Error fetching forms:', err);
      message.error(t('forms.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await formsApi.deleteForm(id);
      message.success(t('forms.deleteSuccess'));
      fetchForms();
    } catch (err) {
      console.error('Error deleting form:', err);
      message.error(t('forms.deleteError'));
    }
  };

  const columns = [
    {
      title: t('forms.table.title'),
      dataIndex: ['template', 'title'],
      key: 'title',
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/templates/${record.template.id}`)}
          className="form-link"
        >
          {text || t('forms.untitled')}
        </Button>
      ),
    },
    {
      title: t('forms.table.status'),
      dataIndex: 'completed',
      key: 'status',
      render: (completed) => (
        <Tag color={completed ? 'green' : 'orange'}>
          {completed ? t('forms.completed') : t('forms.draft')}
        </Tag>
      ),
    },
    {
      title: t('forms.table.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('LLL'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: t('forms.table.updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => moment(date).format('LLL'),
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
    },
    {
      title: t('forms.table.answers'),
      dataIndex: 'answers',
      key: 'answers',
      render: (answers) => (
        <Badge
          count={answers.length}
          showZero
          className="answer-badge"
        />
      ),
    },
    {
      title: t('forms.table.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title={t('forms.view')}>
            <Button
              icon={<EyeOutlined />}
              onClick={() => navigate(`/forms/${record.id}`)}
            />
          </Tooltip>

          <Tooltip title={t('forms.edit')}>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/forms/${record.id}/edit`)}
              disabled={record.completed}
            />
          </Tooltip>

          <Popconfirm
            title={t('forms.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Tooltip title={t('forms.delete')}>
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-forms-page">
      <div className="page-header">
        <Title level={2} className="page-title">
          <FormOutlined /> {t('forms.myForms')}
        </Title>
        <Button
          type="primary"
          onClick={() => navigate('/templates')}
          className="new-form-btn"
        >
          {t('forms.newForm')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={forms}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={fetchForms}
        locale={{
          emptyText: (
            <Empty
              description={t('forms.noForms')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                onClick={() => navigate('/templates')}
              >
                {t('forms.browseTemplates')}
              </Button>
            </Empty>
          ),
        }}
        scroll={{ x: true }}
        className="forms-table"
      />
    </div>
  );
}
