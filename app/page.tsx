"use client";

import { useState } from "react";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbwpkDSnXJi63Tya7JQWctn3FxgQnIvpCHktseKTrnEnT2YzvcpMh7Ece65M_QjvGYT0pg/exec";

export default function SurveyPage() {
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("送信中…");

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      setStatus("送信しました。ありがとうございました。");
      e.currentTarget.reset();
    } catch (err) {
      setStatus("送信に失敗しました。");
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 600 }}>
      <h1>アンケートフォーム</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>お名前</label>
          <br />
          <input name="name" required />
        </div>

        <div>
          <label>メールアドレス</label>
          <br />
          <input name="email" type="email" required />
        </div>

        <div>
          <label>メッセージ</label>
          <br />
          <textarea name="message" rows={4} required />
        </div>

        <button type="submit">送信</button>
      </form>

      {status && <p>{status}</p>}
    </main>
  );
}
