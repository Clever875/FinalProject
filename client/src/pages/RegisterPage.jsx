import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd]     = useState('');
  const [err, setErr]     = useState('');
  const { register }      = useContext(AuthContext);
  const nav = useNavigate();
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());
  const onSubmit = async e => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setErr('Введите корректный email');
      return;
    }
    setErr('');
    try {
      await register(name, email, pwd);
      nav('/templates');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>Register</h2>
      {err && <div className="alert alert-danger">{err}</div>}
      <div className="mb-3">
        <label>Name</label>
        <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="mb-3">
        <label>Email</label>
        <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="mb-3">
        <label>Password</label>
        <input type="password" className="form-control" value={pwd} onChange={e => setPwd(e.target.value)} />
      </div>
      <button className="btn btn-success">Register</button>
    </form>
  );
}
