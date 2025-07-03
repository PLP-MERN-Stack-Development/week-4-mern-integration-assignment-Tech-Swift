import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function Register({ onAuth }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiRequest('/auth/register', 'POST', form);
      onAuth(res.token, res.user);
    } catch (err) {
      setError(err.error || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-12 p-6 bg-white rounded-xl shadow-md flex flex-col gap-4">
      <h2 className="text-2xl font-bold mb-2">Register</h2>
      {error && <Alert variant="destructive" className="mb-2">{error}</Alert>}
      <Input name="username" placeholder="Username" value={form.username} onChange={handleChange} required className="mb-2" />
      <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="mb-2" />
      <Input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="mb-4" />
      <Button type="submit" className="w-full">Register</Button>
    </form>
  );
} 