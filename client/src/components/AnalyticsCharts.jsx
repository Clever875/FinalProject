import React from 'react';
import { Row, Col, Card, Typography, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsCharts({ questions, stats }) {
  const { t } = useTranslation();

  if (!stats || !questions || questions.length === 0 || stats.formsCount === 0) {
    return (
      <Card className="analytics-card">
        <Empty description={t('analytics.noData')} />
      </Card>
    );
  }

  const getQuestionData = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return null;

    const responses = stats.questionStats[questionId] || [];

    switch (question.type) {
      case 'NUMBER':
        return {
          average: responses.reduce((sum, r) => sum + Number(r.value), 0) / responses.length,
          min: Math.min(...responses.map(r => Number(r.value))),
          max: Math.max(...responses.map(r => Number(r.value))),
        };

      case 'RADIO':
      case 'SELECT':
      case 'CHECKBOX':
        const optionCounts = {};
        responses.forEach(response => {
          if (question.type === 'CHECKBOX') {
            response.value.forEach(val => {
              optionCounts[val] = (optionCounts[val] || 0) + 1;
            });
          } else {
            optionCounts[response.value] = (optionCounts[response.value] || 0) + 1;
          }
        });

        return Object.entries(optionCounts).map(([optionId, count]) => {
          const option = question.options.find(opt => opt.id === optionId);
          return {
            name: option ? option.value : optionId,
            value: count,
          };
        });

      default:
        return null;
    }
  };

  return (
    <div className="analytics-charts">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Title level={4} className="chart-title">
              {t('analytics.completionRate')}
            </Title>
            <div className="completion-stats">
              <div className="stat-item">
                <div className="stat-value">{stats.completionRate}%</div>
                <div className="stat-label">{t('analytics.completedForms')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.formsCount - stats.completionCount}</div>
                <div className="stat-label">{t('analytics.incompleteForms')}</div>
              </div>
            </div>
          </Card>
        </Col>

        {questions.map(question => {
          const data = getQuestionData(question.id);
          if (!data) return null;

          return (
            <Col xs={24} md={12} key={question.id}>
              <Card>
                <Title level={5} className="chart-title">
                  {question.title}
                </Title>

                {typeof data === 'object' && !Array.isArray(data) ? (
                  <BarChart
                    width={400}
                    height={300}
                    data={[data]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    className="analytics-bar-chart"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#8884d8" name={t('analytics.average')} />
                    <Bar dataKey="min" fill="#82ca9d" name={t('analytics.min')} />
                    <Bar dataKey="max" fill="#ffc658" name={t('analytics.max')} />
                  </BarChart>
                ) : Array.isArray(data) ? (
                  <PieChart width={400} height={300} className="analytics-pie-chart">
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : null}
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
