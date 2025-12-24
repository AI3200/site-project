"use client";

import React, { useMemo, useState } from "react";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbwpkDSnXJi63Tya7JQWctn3FxgQnIvpCHktseKTrnEnT2YzvcpMh7Ece65M_QjvGYT0pg/exec";

type FormState = {
  parentConsent: boolean;
  gradeBand: "" | "小1-2" | "小3-4" | "小5-6";

  // バッジ郵送が必須なら必須にする
  recipientName: string;
  postalCode: string;
  address1: string; // 都道府県・市区町村
  address2: string; // 番地・建物名
  phone: string;

  // アンケート
  q1: "" | "とても" | "まあまあ" | "ふつう" | "むずかしい";
  q2: "" | "またやりたい" | "またやるかも" | "わからない";
  q3: string; // 任意
};

const initial: FormState = {
  parentConsent: false,
  gradeBand: "",
  recipientName: "",
  postalCode: "",
  address1: "",
  address2: "",
  phone: "",
  q1: "",
  q2: "",
  q3: "",
};

const OFFICIAL_NOTICE = `本企画では、発送業務の都合上、
住所および電話番号を一時的に取得します。

ただし、利用目的はバッジ発送のみに限定しており、
発送完了後は速やかに削除します。

当該情報は共有・再利用・継続保管を行いません。`;

function onlyDigits(s: string) {
  return s.replace(/[^\d]/g, "");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function SurveyPage() {
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requiredKeys = useMemo(
    () =>
      [
        "parentConsent",
        "gradeBand",
        "recipientName",
        "postalCode",
        "address1",
        "address2",
        "phone",
        "q1",
        "q2",
      ] as const,
    []
  );

  const completedCount = useMemo(() => {
    let c = 0;
    for (const k of requiredKeys) {
      const v = form[k];
      if (typeof v === "boolean") {
        if (v) c++;
      } else {
        if (String(v).trim().length > 0) c++;
      }
    }
    return c;
  }, [form, requiredKeys]);

  const progress = useMemo(() => {
    const base = (completedCount / requiredKeys.length) * 95; // 必須で95%
    const bonus = form.q3.trim().length >= 5 ? 5 : 0; // 任意で+5
    return clamp(Math.round(base + bonus), 0, 100);
  }, [completedCount, requiredKeys.length, form.q3]);

  const canSubmit = useMemo(() => {
    // ざっくり必須が揃っていること
    const allRequiredFilled = completedCount === requiredKeys.length;
    // 電話・郵便番号の最低限チェック（ハイフン可）
    const phoneOk = onlyDigits(form.phone).length >= 10;
    const zipOk = onlyDigits(form.postalCode).length === 7;
    return (
      form.parentConsent &&
      allRequiredFilled &&
      phoneOk &&
      zipOk &&
      !submitting
    );
  }, [
    completedCount,
    form.parentConsent,
    form.phone,
    form.postalCode,
    requiredKeys.length,
    submitting,
  ]);

  const cheer = useMemo(() => {
    if (progress >= 100) return "完璧！バッジ目前！";
    if (progress >= 80) return "いいね！あと少し！";
    if (progress >= 50) return "その調子！";
    if (progress >= 20) return "いいスタート！";
    return "まずはやってみよう！";
  }, [progress]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitting(true);
    setStatus("送信中…");

    const payload = {
      issue: "00",
      submittedAt: new Date().toISOString(),
      ...form,
      // 正規化（保存しやすく）
      phoneDigits: onlyDigits(form.phone),
      postalCodeDigits: onlyDigits(form.postalCode),
    };

    try {
      // ⚠️ no-cors だと成功判定ができません（住所・電話なら改善推奨）
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setStatus("送信しました。ありがとうございました。バッジを準備します！");
      setForm(initial);
      (e.currentTarget as HTMLFormElement).reset?.();
    } catch {
      setStatus("送信に失敗しました。時間をおいて試してください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>バッジがもらえるアンケート</h1>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        1ページで完結。入力に合わせてゲージが進むよ。
      </p>

      {/* 進行ゲージ */}
      <div
        style={{
          margin: "16px 0",
          padding: 12,
          borderRadius: 14,
          background: "rgba(0,0,0,.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>進みぐあい</span>
          <strong>{progress}%</strong>
        </div>
        <div
          style={{
            height: 12,
            borderRadius: 999,
            background: "#e5e7eb",
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#111827",
              transition: "width .25s ease",
            }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
          {cheer}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        {/* 親同意（固定文を必ずここに） */}
        <section
          style={{
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,.9)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>
            保護者の方へ（必須）
          </h2>

          {/* ✅ 公式文（固定・改変不可） */}
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: "#111827",
              whiteSpace: "pre-line",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
            }}
          >
            {OFFICIAL_NOTICE}
          </p>

          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              marginTop: 12,
            }}
          >
            <input
              type="checkbox"
              checked={form.parentConsent}
              onChange={(e) => setField("parentConsent", e.target.checked)}
              required
            />
            <span style={{ fontSize: 14 }}>
              上記内容を確認し、同意します
            </span>
          </label>

          <a
            href="/odoru/privacy"
            style={{
              fontSize: 13,
              textDecoration: "underline",
              color: "#111827",
              display: "inline-block",
              marginTop: 6,
            }}
          >
            プライバシーポリシー
          </a>
        </section>

        {/* 学年 */}
        <section
          style={{
            padding: 14,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #e5e7eb",
          }}
        >
          <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
            学年（必須）
          </label>
          <select
            value={form.gradeBand}
            onChange={(e) =>
              setField("gradeBand", e.target.value as FormState["gradeBand"])
            }
            required
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            <option value="">えらんでね</option>
            <option value="小1-2">小1・小2</option>
            <option value="小3-4">小3・小4</option>
            <option value="小5-6">小5・小6</option>
          </select>
        </section>

        {/* 郵送情報（必須） */}
        <section
          style={{
            padding: 14,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>
            バッジの送り先（必須）
          </h2>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label
                style={{ display: "block", fontSize: 13, marginBottom: 6 }}
              >
                宛名（必須）
              </label>
              <input
                value={form.recipientName}
                onChange={(e) => setField("recipientName", e.target.value)}
                required
                placeholder="例：土屋 光巨（保護者）"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>

            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}
            >
              <div>
                <label
                  style={{ display: "block", fontSize: 13, marginBottom: 6 }}
                >
                  郵便番号（必須）
                </label>
                <input
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  required
                  inputMode="numeric"
                  placeholder="例：2200011"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", fontSize: 13, marginBottom: 6 }}
                >
                  電話番号（必須）
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  required
                  inputMode="tel"
                  placeholder="例：080-1234-5678"
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 12 }}>
                  ※ハイフンありでもOK
                </p>
              </div>
            </div>

            <div>
              <label
                style={{ display: "block", fontSize: 13, marginBottom: 6 }}
              >
                住所（都道府県・市区町村）（必須）
              </label>
              <input
                value={form.address1}
                onChange={(e) => setField("address1", e.target.value)}
                required
                placeholder="例：神奈川県横浜市西区高島"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>

            <div>
              <label
                style={{ display: "block", fontSize: 13, marginBottom: 6 }}
              >
                番地・建物名（必須）
              </label>
              <input
                value={form.address2}
                onChange={(e) => setField("address2", e.target.value)}
                required
                placeholder="例：1-2-5 横濱ゲートタワー19階"
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          </div>
        </section>

        {/* アンケート */}
        <section
          style={{
            padding: 14,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>しつもん</h2>

          <div style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Q1. この号はどうだった？（必須）
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
              {(["とても", "まあまあ", "ふつう", "むずかしい"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setField("q1", v)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: form.q1 === v ? "1px solid #111827" : "1px solid #e5e7eb",
                    background: "#fff",
                    boxShadow: form.q1 === v ? "0 10px 20px rgba(17,24,39,.10)" : "none",
                    cursor: "pointer",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <input type="hidden" name="q1" value={form.q1} required />
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Q2. またやりたい？（必須）
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
              {(["またやりたい", "またやるかも", "わからない"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setField("q2", v)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: form.q2 === v ? "1px solid #111827" : "1px solid #e5e7eb",
                    background: "#fff",
                    boxShadow: form.q2 === v ? "0 10px 20px rgba(17,24,39,.10)" : "none",
                    cursor: "pointer",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
            <input type="hidden" name="q2" value={form.q2} required />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontWeight: 700 }}>
              Q3. つぎに入れてほしいこと（任意）
            </label>
            <textarea
              value={form.q3}
              onChange={(e) => setField("q3", e.target.value)}
              rows={4}
              placeholder="例：もっとクイズをふやして！など"
              style={{
                width: "100%",
                marginTop: 10,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "14px 14px",
            borderRadius: 14,
            border: "1px solid #111827",
            background: canSubmit ? "#111827" : "rgba(17,24,39,.45)",
            color: "#fff",
            fontWeight: 800,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "送信中…" : "バッジを受け取る！"}
        </button>

        {status && <p style={{ marginTop: 6 }}>{status}</p>}

        {/* no-cors 注意（表示は任意） */}
        <p style={{ marginTop: 0, color: "#6b7280", fontSize: 12 }}>
          ※現在の送信方式（no-cors）は「送信成功」を厳密に判定できません。住所・電話必須運用なら、次のステップでCORS対応またはNext.js API経由に切替推奨です。
        </p>
      </form>
    </main>
  );
}
