'use client';

import { useState } from 'react';

const GAS_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbzXaSM39w7n8haIshxHlEfdzL0J2DNrd7iSw7er-mUtqjAR5OQ2ezXfNJO-KzrenhzB7A/exec';
const SECRET_TOKEN = 's00_2025-12-23__R9x4Kq7P3mZ8N2aW6JtEoBvC';

export default function Survey00Page() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    const form = e.currentTarget;

    const payload = {
      token: SECRET_TOKEN,
      company: '', // ハニーポット
      name: (form.elements.namedItem('name') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      answer: (form.elements.namedItem('answer') as HTMLTextAreaElement).value.trim(),
      ua: navigator.userAgent,
      ref: document.referrer,
      campaign: '',
    };

    try {
      const res = await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Send failed');

      setDone(true);
    } catch {
      setError('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main>
        <h1>送信完了</h1>
        <p>ご回答ありがとうございました。</p>
      </main>
    );
  }

  return (
    <main>
      <h1>アンケート</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none' }}
        />

        <div>
          <label>
            お名前
            <input type="text" name="name" required />
          </label>
        </div>

        <div>
          <label>
            メールアドレス
            <input type="email" name="email" />
          </label>
        </div>

        <div>
          <label>
            回答
            <textarea name="answer" required />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? '送信中…' : '送信'}
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </main>
  );
}
