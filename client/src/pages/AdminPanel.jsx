import React, { useEffect, useState, useContext } from 'react';
import {
  Space,
  Table,
  Tag,
  Select,
  Button,
  message,
  Spin,
  Typography,
  Modal
} from 'antd';
import {
  ExclamationCircleOutlined,
  UserSwitchOutlined,
  BlockOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { AuthContext } from '../AuthContext';
import { request } from '../api';

const { Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

export default function AdminPanel() {
  const { token, user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    loadUsers();
  }, [user, token]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await request('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
    } catch (e) {
      message.error('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      setActionLoading(true);
      await request(`/admin/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(users.map(u => (u.id === id ? { ...u, role: newRole } : u)));
      message.success('Роль обновлена');
    } catch {
      message.error('Ошибка при изменении роли');
    } finally {
      setActionLoading(false);
    }
  };
  const handleBlockToggle = async (id, isBlocked) => {
    try {
      await request(`/users/${id}/block`, {
        method: 'PUT',
        body: JSON.stringify({ blocked: !isBlocked }),
      });
      // Исправлено: добавлена закрывающая скобка
      setUsers(users.map(u => (u.id === id ? { ...u, blocked: !isBlocked } : u)));
      message.success(`Пользователь ${isBlocked ? 'разблокирован' : 'заблокирован'}`);
    } catch {
      message.error('Ошибка при изменении статуса');
    }
  };
  const toggleBlockUser = async (id, isBlocked) => {
    try {
      setActionLoading(true);
      await request(`/admin/users/${id}/block`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ blocked: !isBlocked }),
      });
      setUsers(users.map(u => (u.id === id ? { ...u, blocked: !isBlocked } : u)));
      message.success(`Пользователь ${isBlocked ? 'разблокирован' : 'заблокирован'}`);
    } catch {
      message.error('Ошибка при изменении статуса');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = (id) => {
    confirm({
      title: 'Удалить пользователя?',
      icon: <ExclamationCircleOutlined />,
      content: 'Это действие нельзя отменить',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      async onOk() {
        try {
          await request(`/admin/users/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsers(users.filter(u => u.id !== id));
          message.success('Пользователь удален');
        } catch {
          message.error('Ошибка при удалении');
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
    },
    {
      title: 'Имя',
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
      title: 'Статус',
      dataIndex: 'blocked',
      key: 'status',
      render: (blocked) => (
        <Tag color={blocked ? 'red' : 'green'}>
          {blocked ? 'Заблокирован' : 'Активен'}
        </Tag>
      )
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <Select
          value={role}
          style={{ width: 120 }}
          onChange={(value) => handleRoleChange(record.id, value)}
          disabled={record.id === user?.id || actionLoading}
        >
          <Option value="ADMIN">Admin</Option>
          <Option value="USER">User</Option>
        </Select>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<BlockOutlined />}
            danger={!record.blocked}
            type={record.blocked ? 'primary' : 'default'}
            onClick={() => toggleBlockUser(record.id, record.blocked)}
            loading={actionLoading}
            disabled={record.id === user?.id}
          >
            {record.blocked ? 'Разблокировать' : 'Блокировать'}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => deleteUser(record.id)}
            loading={actionLoading}
            disabled={record.id === user?.id}
          />
        </Space>
      )
    }
  ];

  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ textAlign: 'center', marginTop: 50 }}>
        <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
        <h2>Доступ запрещен</h2>
        <Text type="secondary">Требуются права администратора</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 24
      }}>
        <h2>
          <UserSwitchOutlined /> Управление пользователями
        </h2>
        <Button
          type="primary"
          onClick={loadUsers}
          loading={loading}
        >
          Обновить
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </div>
  );
}
