import React, { useState, useEffect } from 'react';
import { Table, Typography, Tag, Button, Popover, Spin, Input, message } from 'antd';
import { FilterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formsApi } from '../api';

const { Title } = Typography;

export default function FormResultsTable({ templateId }) {
  const { t } = useTranslation();
  const [forms, setForms] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [filteredForms, setFilteredForms] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [templateData, formsData] = await Promise.all([
          formsApi.getTemplateByForm(templateId),
          formsApi.getFormsByTemplate(templateId)
        ]);

        setQuestions(templateData.questions);
        setForms(formsData);
        setFilteredForms(formsData);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchData();
    }
  }, [templateId]);

  const handleFilterChange = (questionId, value) => {
    const newFilters = { ...filters, [questionId]: value };
    setFilters(newFilters);

    // Применение фильтров
    let result = [...forms];
    Object.entries(newFilters).forEach(([qId, filterValue]) => {
      if (filterValue) {
        result = result.filter(form => {
          const answer = form.answers.find(a => a.questionId === parseInt(qId));
          return answer && answer.value.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    setFilteredForms(result);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const csvContent = await formsApi.exportFormData(templateId);

      // Создаем ссылку для скачивания
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form-results-${templateId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(t('forms.exportSuccess'));
    } catch (err) {
      console.error('Ошибка экспорта:', err);
      message.error(t('forms.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const getColumns = () => {
    const baseColumns = [
      {
        title: t('forms.table.user'),
        dataIndex: 'user',
        key: 'user',
        render: (user) => user.username,
        sorter: (a, b) => a.user.username.localeCompare(b.user.username),
      },
      {
        title: t('forms.table.date'),
        dataIndex: 'createdAt',
        key: 'date',
        render: (date) => new Date(date).toLocaleString(),
        sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      },
      {
        title: t('forms.table.status'),
        dataIndex: 'completed',
        key: 'status',
        render: (completed) => (
          <Tag color={completed ? 'green' : 'orange'}>
            {completed ? t('forms.completed') : t('forms.incomplete')}
          </Tag>
        ),
        filters: [
          { text: t('forms.completed'), value: true },
          { text: t('forms.incomplete'), value: false },
        ],
        onFilter: (value, record) => record.completed === value,
      },
    ];

    const questionColumns = questions.map(question => ({
      title: question.title,
      key: `q_${question.id}`,
      render: (form) => {
        const answer = form.answers.find(a => a.questionId === question.id);
        if (!answer) return '-';

        if (question.type === 'CHECKBOX') {
          return answer.value.join(', ');
        }

        return answer.value;
      },
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={t('forms.filterPlaceholder')}
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => {
              handleFilterChange(question.id, selectedKeys[0]);
              confirm();
            }}
          />
          <div style={{ marginTop: 8 }}>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                handleFilterChange(question.id, selectedKeys[0]);
                confirm();
              }}
            >
              {t('common.apply')}
            </Button>
          </div>
        </div>
      ),
      filterIcon: filtered => (
        <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    }));

    return [...baseColumns, ...questionColumns];
  };

  return (
    <div className="form-results-table">
      <div className="table-header">
        <Title level={4} className="table-title">
          {t('forms.resultsTitle')} ({filteredForms.length})
        </Title>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exporting}
        >
          {t('forms.exportCsv')}
        </Button>
      </div>

      {loading ? (
        <Spin size="large" className="table-spinner" />
      ) : (
        <Table
          columns={getColumns()}
          dataSource={filteredForms}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
}
