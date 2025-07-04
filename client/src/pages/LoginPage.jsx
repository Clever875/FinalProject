import React, { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd]     = useState('');
  const [err, setErr]     = useState('');
  const { login }         = useContext(AuthContext);
  const nav = useNavigate();

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await login(email, pwd);
      nav('/templates');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>Login</h2>
      {err && <div className="alert alert-danger">{err}</div>}
      <div className="mb-3">
        <label>Email</label>
        <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="mb-3">
        <label>Password</label>
        <input type="password" className="form-control" value={pwd} onChange={e => setPwd(e.target.value)} />
      </div>
      <button className="btn btn-primary">Login</button>
    </form>
  );
}
