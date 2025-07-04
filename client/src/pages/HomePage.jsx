import React, { useEffect, useState } from 'react';
import { request } from '../api';

export default function HomePage() {
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await request('/templates/public');
      setTemplates(data);
    } catch (err) {
      console.error('Ошибка при загрузке публичных шаблонов:', err);
      setError('Не удалось загрузить шаблоны');
    }
  };

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  return (
    <div>
      <h2>Публичные шаблоны</h2>
      {templates.length === 0 ? (
        <p>Нет шаблонов</p>
      ) : (
        <ul className="list-group">
          {templates.map(t => (
            <li key={t.id} className="list-group-item">
              <strong>{t.title}</strong> — {t.topic}
              <br />
              <small>{t.description}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
