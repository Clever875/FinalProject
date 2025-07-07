import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Select,
  Button,
  Spin,
  Modal,
  Space,
  Input,
  Alert,
  Badge,
  Typography
} from 'antd';
import {
  UserSwitchOutlined,
  BlockOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../AuthContext';
import { adminApi } from '../api';
import { useTranslation } from 'react-i18next';
import './css/AdminPanel.css';

const { Text, Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ROLE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'MODERATOR', label: 'Moderator' },
  { value: 'ADMIN', label: 'Admin' }
];

export default function AdminPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [error, setError] = useState(null);

  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const { current, pageSize } = pagination;
      const response = await adminApi.getUsers({
        page: params.pagination?.current || current,
        limit: params.pagination?.pageSize || pageSize,
        search: params.search || search,
      });

      setUsers(response.data);
      setPagination({
        ...pagination,
        total: response.pagination.total,
        current: response.pagination.page,
        pageSize: response.pagination.limit,
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  const handleRoleChange = async (id, newRole) => {
    try {
      setActionLoading(true);
      setError(null);

      await adminApi.updateUserRole(id, newRole);
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err);
      setError(t('admin.roleError'));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBlockUser = async (id, isBlocked) => {
    try {
      setActionLoading(true);
      setError(null);

      await adminApi.toggleUserBlock(id, !isBlocked);
      setUsers(users.map(u => u.id === id ? { ...u, isBlocked: !isBlocked } : u));
    } catch (err) {
      console.error('Error toggling block status:', err);
      setError(t('admin.blockError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = (id) => {
    confirm({
      title: t('admin.deleteConfirmTitle'),
      icon: <ExclamationCircleOutlined />,
      content: t('admin.deleteConfirmContent'),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      async onOk() {
        try {
          setActionLoading(true);
          setError(null);

          await adminApi.deleteUser(id);
          setUsers(users.filter(u => u.id !== id));

          setPagination(prev => ({
            ...prev,
            total: prev.total - 1
          }));
        } catch (err) {
          console.error('Error deleting user:', err);
          setError(t('admin.deleteError'));
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: t('admin.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Text strong={record.role === 'ADMIN'}>{text}</Text>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('admin.status'),
      dataIndex: 'isBlocked',
      key: 'status',
      render: (isBlocked) => (
        <Tag color={isBlocked ? 'red' : 'green'}>
          {isBlocked ? t('admin.blocked') : t('admin.active')}
        </Tag>
      )
    },
    {
      title: t('admin.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <Select
          value={role}
          style={{ width: 120 }}
          onChange={(value) => handleRoleChange(record.id, value)}
          disabled={record.id === user?.id || actionLoading}
          className="role-selector"
        >
          {ROLE_OPTIONS.map(option => (
            <Option key={option.value} value={option.value}>
              {t(`roles.${option.value.toLowerCase()}`)}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: t('admin.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<BlockOutlined />}
            danger={!record.isBlocked}
            type={record.isBlocked ? 'primary' : 'default'}
            onClick={() => toggleBlockUser(record.id, record.isBlocked)}
            loading={actionLoading}
            disabled={record.id === user?.id}
            className="block-btn"
          >
            {record.isBlocked ? t('admin.unblock') : t('admin.block')}
          </Button>

          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteUser(record.id)}
            loading={actionLoading}
            disabled={record.id === user?.id}
            className="delete-btn"
          />
        </Space>
      )
    }
  ];

  if (user?.role !== 'ADMIN') {
    return (
      <div className="admin-access-denied">
        <div className="access-denied-content">
          <ExclamationCircleOutlined className="denied-icon" />
          <Title level={3}>{t('admin.accessDeniedTitle')}</Title>
          <Text type="secondary">{t('admin.accessDeniedMessage')}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="header-left">
          <UserSwitchOutlined className="header-icon" />
          <Title level={2}>{t('admin.title')}</Title>
        </div>

        <div className="header-actions">
          <Input
            placeholder={t('admin.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => fetchUsers({ search })}
            className="search-input"
          />

          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => fetchUsers()}
            loading={loading}
            className="refresh-btn"
          >
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          className="error-alert"
        />
      )}

      <div className="stats-summary">
        <Space size="large">
          <div className="stat-item">
            <Text strong>{t('admin.totalUsers')}:</Text>
            <Badge count={pagination.total} className="stat-badge" />
          </div>
          <div className="stat-item">
            <Text strong>{t('admin.activeUsers')}:</Text>
            <Badge
              count={users.filter(u => !u.isBlocked).length}
              className="stat-badge active"
            />
          </div>
          <div className="stat-item">
            <Text strong>{t('admin.admins')}:</Text>
            <Badge
              count={users.filter(u => u.role === 'ADMIN').length}
              className="stat-badge admin"
            />
          </div>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(pagination) => {
          setPagination(pagination);
          fetchUsers({ pagination });
        }}
        scroll={{ x: true }}
        className="users-table"
        locale={{
          emptyText: (
            <div className="empty-table">
              <Text type="secondary">{t('admin.noUsers')}</Text>
            </div>
          )
        }}
      />
    </div>
  );
}
