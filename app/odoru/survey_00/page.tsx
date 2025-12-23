'use client';

import { useState } from 'react';

const GAS_WEBAPP_URL =
  'https://script.google.com/macros/s/AKfycbzXaSM39w7n8haIshxHlEfdzL0J2DNrd7iSw7er-mUtqjAR5OQ2ezXfNJO-KzrenhzB7A/exec';

// ※本来は公開リポジトリに直書きしない（.env + サーバー側推奨）
// ただし「いま動かす」目的ならこれでOK
const SECRET_TOKEN = 's00_2025-12-23__R9x4Kq7P3mZ8N2aW6JtEoBvC';

type GasResponse =
  | { ok: true; row?: number; message?: string }
  | { ok: false; error?: string };

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

    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const answer = (form.elements.namedItem('answer') as HTMLTextAreaElement).value.trim();
    const company = (form.elements.namedItem('company') as HTMLInputElement).value.trim(); // ←ハニーポット実値

    const payload = {
      token: SECRET_TOKEN,
      company, // ← hidden input の実値を送る
      name,
      email,
      answer,
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      ref: typeof document !== 'undefined' ? document.referrer : '',
      campaign: '',
    };

    // 送信直前ログ（必須）
    console.log('payload sending:', payload);

    try {
      const res = await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        headers: {
          // ★プリフライト回避（GAS向け定石）
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      // ★ここが肝：まず text で受ける（JSONじゃない返答を検出する）
      const text = await res.text();

      // デバッグログ（最重要）
      console.log('GAS status:', res.status);
      console.log('GAS response head:', text.slice(0, 200));

      // JSONでなければ（HTMLログイン画面/403ページなど）即エラーにする
      let json: GasResponse;
      try {
        json = JSON.parse(text) as GasResponse;
      } catch {
        throw new Error(`Non-JSON response (status ${res.status}): ${text.slice(0, 200)}`);
      }

      if (!res.ok || !json.ok) {
        throw new Error(`GAS error (status ${res.status}): ${('error' in json && json.error) || text}`);
      }

      setDone(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || '送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main style={{ padding: 24 }}>
        <h1>送信完了</h1>
        <p>ご回答ありがとうございました。</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>アンケート</h1>

      <form onSubmit={handleSubmit}>
        {/* ハニーポット（画面に見せない） */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none' }}
        />

        <div style={{ marginTop: 12 }}>
          <label>
            お名前
            <br />
            <input type="text" name="name" required />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            メールアドレス
            <br />
            <input type="email" name="email" />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            回答
            <br />
            <textarea name="answer" required rows={6} />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={loading}>
            {loading ? '送信中…' : '送信'}
          </button>
        </div>

        {error && (
          <p style={{ marginTop: 12, color: 'red', whiteSpace: 'pre-wrap' }}>
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
