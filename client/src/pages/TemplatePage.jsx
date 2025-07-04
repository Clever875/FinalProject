import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { request as axios } from '../api';

export default function TemplatePage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!id) {
      console.error('ID шаблона отсутствует');
      return;
    }
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const res = await axios.get(`/api/templates/${id}`);
      setTemplate(res.data);
      setQuestions(res.data.questions || []);
    } catch (error) {
      console.error('Ошибка загрузки шаблона:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (!template) return <div>Шаблон не найден</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div>
            <p>{template.description}</p>
            {template.imageUrl && (
              <img src={template.imageUrl} alt="Изображение" style={{ maxWidth: '300px' }} />
            )}
            <p><strong>Автор:</strong> {template.author?.username || 'Неизвестен'}</p>
            <p><strong>Тема:</strong> {template.topic}</p>
            <p><strong>Теги:</strong> {template.tags?.join(', ') || 'нет'}</p>
          </div>
        );
      case 'questions':
        return (
          <div>
            {questions.length > 0 ? (
              <ul>
                {questions.map((q, i) => (
                  <li key={q.id}>
                    <strong>{i + 1}. {q.title}</strong>
                    <p>{q.description}</p>
                    <p><em>Тип:</em> {q.type}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Нет добавленных вопросов.</p>
            )}
          </div>
        );
      case 'forms':
        return <div>Тут будут заполненные формы (в следующем шаге)</div>;
      case 'analytics':
        return <div>Тут будет аналитика (в следующем шаге)</div>;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1>{template.title}</h1>

      {user && (
        <a href={`/forms/create/${template.id}`}>
          <button>Заполнить форму</button>
        </a>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setActiveTab('info')}>Описание</button>
        <button onClick={() => setActiveTab('questions')}>Вопросы</button>
        <button onClick={() => setActiveTab('forms')}>Ответы</button>
        <button onClick={() => setActiveTab('analytics')}>Аналитика</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
