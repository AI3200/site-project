"use client";

import React, { useMemo, useState } from "react";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyduHXEvbK0bfEjkECun71-50aO6UqhCoYqP8vgxHW8jnltKuFOChImwNTxhPipssFdrQ/exec";

const OFFICIAL_NOTICE = `本企画では、発送業務の都合上、
住所および電話番号を一時的に取得します。

ただし、利用目的はバッジ発送のみに限定しており、
発送完了後は速やかに削除します。

当該情報は共有・再利用・継続保管を行いません。`;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const withBase = (path: string) => `${BASE}${path}`;

type FormState = {
  parentConsent: boolean;
  gradeBand: "" | "小1-2" | "小3-4" | "小5-6";

  recipientName: string;
  postalCode: string;
  address1: string;
  address2: string;
  phone: string;

  q1: "" | "とても" | "まあまあ" | "ふつう" | "むずかしい";
  q2: "" | "またやりたい" | "またやるかも" | "わからない";
  q3: string;
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
    const base = (completedCount / requiredKeys.length) * 95;
    const bonus = form.q3.trim().length >= 5 ? 5 : 0;
    return clamp(Math.round(base + bonus), 0, 100);
  }, [completedCount, requiredKeys.length, form.q3]);

  const canSubmit = useMemo(() => {
    const allRequiredFilled = completedCount === requiredKeys.length;
    const phoneOk = onlyDigits(form.phone).length >= 10;
    const zipOk = onlyDigits(form.postalCode).length === 7;
    return form.parentConsent && allRequiredFilled && phoneOk && zipOk && !submitting;
  }, [completedCount, form.parentConsent, form.phone, form.postalCode, submitting, requiredKeys.length]);

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

  const SECRET_TOKEN = "s00_2025-12-23__R9x4Kq7P3mZ8N2aW6JtEoBvC"; // GASと一致させる

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setSubmitting(true);
  setStatus("送信中…");

  const payload = {
    token: SECRET_TOKEN, // ✅ 必須：GASの入口トークン
    issue: "00",
    submittedAt: new Date().toISOString(),
    ...form,
    phoneDigits: onlyDigits(form.phone),
    postalCodeDigits: onlyDigits(form.postalCode),
  };

  console.log("payload", payload); // ✅ ここに移動

  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors", // ✅ 今回はこれで送る（レスポンスは取れない）
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // ✅ プリフライト回避
      body: JSON.stringify(payload),
    });

    setStatus("送信しました。ありがとうございました。バッジを準備します！");
    setForm(initial);
  } catch (e) {
    setStatus("送信に失敗しました。時間をおいて試してください。");
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="stage">
      <header className="brand">
        <div className="name">Smart Life</div>
      </header>

      {/* 左右キャラ */}
      <img className="illust taichi" src={withBase("/media/odoru_taichi.png")} alt="" />
      <img className="illust mio" src={withBase("/media/odoru_mio.png")} alt="" />

      {/* ロゴ */}
      <div className="heroTitle" aria-label="おどるクイズシリーズ">
        <img className="heroLogo" src={withBase("/media/odoru_LOGO.png")} alt="おどるクイズシリーズ" />
        <h1 className="srOnly">おどるクイズシリーズ</h1>
      </div>

      {/* カード */}
      <div className="cardWrap" aria-label="アンケート">
        <section className="card">
          {/* TN博士 */}
          <img className="illust tn" src={withBase("/media/odoru_TN.png")} alt="" />

          <h2>バッジがもらえるアンケート</h2>
          <p className="muted">1ページで完結。入力に合わせてゲージが進むよ。</p>

          <div className="meter">
            <div className="meterTop">
              <span>進みぐあい</span>
              <strong>{progress}%</strong>
            </div>
            <div className="bar">
              <div className="barIn" style={{ width: `${progress}%` }} />
            </div>
            <div className="cheer">{cheer}</div>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <section className="box">
              <h3>保護者の方へ（必須）</h3>
              <p className="notice">{OFFICIAL_NOTICE}</p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.parentConsent}
                  onChange={(e) => setField("parentConsent", e.target.checked)}
                  required
                />
                <span>上記内容を確認し、同意します</span>
              </label>
            </section>

            <section className="box">
              <label className="label">学年（必須）</label>
              <select
                value={form.gradeBand}
                onChange={(e) => setField("gradeBand", e.target.value as FormState["gradeBand"])}
                required
                className="input"
              >
                <option value="">えらんでね</option>
                <option value="小1-2">小1・小2</option>
                <option value="小3-4">小3・小4</option>
                <option value="小5-6">小5・小6</option>
              </select>
            </section>

            <section className="box">
              <h3>バッジの送り先（必須）</h3>

              <label className="label">宛名（必須）</label>
              <input
                className="input"
                value={form.recipientName}
                onChange={(e) => setField("recipientName", e.target.value)}
                required
                placeholder="例：TN 博士（保護者）"
              />

              <div className="grid2">
                <div>
                  <label className="label">郵便番号（必須）</label>
                  <input
                    className="input"
                    value={form.postalCode}
                    onChange={(e) => setField("postalCode", e.target.value)}
                    required
                    inputMode="numeric"
                    placeholder="例：2200011"
                  />
                </div>
                <div>
                  <label className="label">電話番号（必須）</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    required
                    inputMode="tel"
                    placeholder="例：080-1234-5678"
                  />
                  <p className="hint">※ハイフンありでもOK</p>
                </div>
              </div>

              <label className="label">住所（都道府県・市区町村）（必須）</label>
              <input
                className="input"
                value={form.address1}
                onChange={(e) => setField("address1", e.target.value)}
                required
                placeholder="例：神奈川県横浜市西区高島"
              />

              <label className="label">番地・建物名（必須）</label>
              <input
                className="input"
                value={form.address2}
                onChange={(e) => setField("address2", e.target.value)}
                required
                placeholder="例：1-2-5 横濱ゲートタワー19階"
              />
            </section>

            <section className="box">
              <h3>しつもん</h3>

              <div className="q">
                <p className="qTitle">Q1. この号はどうだった？（必須）</p>
                <div className="chips">
                  {(["とても", "まあまあ", "ふつう", "むずかしい"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setField("q1", v)}
                      className={form.q1 === v ? "chip on" : "chip"}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="q">
                <p className="qTitle">Q2. またやりたい？（必須）</p>
                <div className="chips">
                  {(["またやりたい", "またやるかも", "わからない"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setField("q2", v)}
                      className={form.q2 === v ? "chip on" : "chip"}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="q">
                <label className="qTitle">Q3. つぎに入れてほしいこと（任意）</label>
                <textarea
                  className="input"
                  value={form.q3}
                  onChange={(e) => setField("q3", e.target.value)}
                  rows={4}
                  placeholder="例：もっとクイズをふやして！など"
                />
              </div>
            </section>

            <button type="submit" disabled={!canSubmit} className={canSubmit ? "submit" : "submit off"}>
              {submitting ? "送信中…" : "バッジを受け取る！"}
            </button>

            {status && <p className="status">{status}</p>}

            <p className="tiny">
              ※現在の送信方式（no-cors）は「送信成功」を厳密に判定できません。住所・電話必須運用なら、次のステップでCORS対応またはNext.js API経由に切替推奨です。
            </p>
          </form>
        </section>
      </div>

      <footer className="siteFooter">© 一般社団法人スマートライフ教育研究所</footer>

      <style jsx global>{`
        :root {
          --bg: #f4f6fb;
          --card: rgba(255, 255, 255, 0.88);
          --text: #111827;
          --muted: #6b7280;
          --shadow: 0 16px 40px rgba(17, 24, 39, 0.10);
          --radius: 20px;

          --stage-max: 1120px;
          --stage-pad-x: clamp(16px, 4vw, 40px);
          --stage-pad-top: clamp(18px, 4vw, 42px);
          --stage-pad-bottom: 120px;

          --logo-w: 20vw;
          --logo-min: 120px;
          --logo-max: 220px;

          --card-w: min(760px, 92vw);
          --card-gap-top: clamp(18px, 4vw, 34px);

          --taichi-w: clamp(160px, 24vw, 340px);
          --mio-w: clamp(120px, 18vw, 250px);
          --tn-w: clamp(220px, 28vw, 420px);

          --tn-right: -10px;
          --tn-top: 120px;
          --tn-flow-space: clamp(220px, calc(var(--tn-w) * 1.05), 520px);
        }

        body {
          margin: 0;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
          color: var(--text);
          background: radial-gradient(1200px 600px at 50% 0%, #ffffff 0%, var(--bg) 55%, var(--bg) 100%);
          overflow-x: hidden;
        }

        .stage {
          position: relative;
          max-width: var(--stage-max);
          margin: 0 auto;
          padding: var(--stage-pad-top) var(--stage-pad-x) var(--stage-pad-bottom);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0 18px;
        }
        .brand .name {
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .heroTitle {
          position: relative;
          z-index: 2;
          text-align: center;
          margin: clamp(8px, 2vw, 16px) 0 0;
        }
        .heroLogo {
          width: var(--logo-w);
          min-width: var(--logo-min);
          max-width: var(--logo-max);
          height: auto;
          display: block;
          margin: 0 auto;
        }

        .srOnly {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }

        .illust {
          position: absolute;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          filter: drop-shadow(0 14px 26px rgba(17, 24, 39, 0.12));
        }
        .taichi {
          z-index: 1;
          width: var(--taichi-w);
          left: clamp(-10px, -1vw, 6px);
          top: clamp(88px, 10vw, 120px);
          transform: rotate(-4deg);
        }
        .mio {
          z-index: 1;
          width: var(--mio-w);
          right: clamp(0px, 2vw, 24px);
          top: clamp(132px, 12vw, 170px);
          transform: rotate(3deg);
        }

        .cardWrap {
          width: var(--card-w);
          margin: var(--card-gap-top) auto 0;
          position: relative;
          z-index: 3;
        }
        .cardWrap::after {
          content: "";
          display: block;
          height: var(--tn-flow-space);
        }

        .card {
          position: relative;
          z-index: 3;
          padding: clamp(18px, 3.5vw, 28px);
          background: var(--card);
          border: 1px solid rgba(17, 24, 39, 0.06);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          backdrop-filter: blur(6px);
          overflow: visible;
        }

        .tn {
          z-index: 4;
          width: var(--tn-w);
          right: var(--tn-right);
          top: var(--tn-top);
        }

        .muted {
          color: var(--muted);
          margin: 6px 0 0;
        }

        .meter {
          margin: 16px 0;
          padding: 12px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.04);
        }
        .meterTop {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--muted);
        }
        .meterTop strong {
          color: var(--text);
          font-size: 14px;
        }
        .bar {
          height: 12px;
          border-radius: 999px;
          background: #e5e7eb;
          overflow: hidden;
          margin-top: 8px;
        }
        .barIn {
          height: 100%;
          background: #111827;
          transition: width 0.25s ease;
        }
        .cheer {
          margin-top: 8px;
          font-size: 13px;
          color: #374151;
        }

        .form {
          display: grid;
          gap: 14px;
          margin-top: 12px;
        }
        .box {
          padding: 14px;
          border-radius: 14px;
          background: #fff;
          border: 1px solid #e5e7eb;
        }
        .box h3 {
          margin: 0 0 8px;
          font-size: 16px;
        }

        .notice {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: #111827;
          white-space: pre-line;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
        }

        .check {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-top: 12px;
        }

        .label {
          display: block;
          font-size: 13px;
          margin: 10px 0 6px;
        }

        .input {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
        }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 10px;
        }

        .hint {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 12px;
        }

        .q {
          margin-top: 12px;
        }
        .qTitle {
          margin: 0;
          font-weight: 700;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }

        .chip {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          transition: transform 0.12s ease;
        }
        .chip.on {
          border: 1px solid #111827;
          box-shadow: 0 10px 20px rgba(17, 24, 39, 0.10);
          transform: translateY(-1px) scale(1.02);
        }

        .submit {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid #111827;
          background: #111827;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }
        .submit.off {
          background: rgba(17, 24, 39, 0.45);
          cursor: not-allowed;
        }

        .status {
          margin: 6px 0 0;
        }
        .tiny {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
        }

        .siteFooter {
          text-align: center;
          padding: 22px 12px 28px;
          font-size: 12px;
          color: rgba(17, 24, 39, 0.45);
          background: transparent;
        }

        @media (max-width: 520px) {
          :root {
            --logo-w: 22vw;
            --logo-min: 110px;
            --logo-max: 200px;

            --tn-w: clamp(200px, 62vw, 320px);
            --taichi-w: clamp(150px, 42vw, 210px);
            --mio-w: clamp(110px, 30vw, 170px);

            --card-gap-top: clamp(150px, 32vw, 220px);
            --tn-right: -6px;
            --tn-top: 150px;
            --tn-flow-space: clamp(260px, calc(var(--tn-w) * 1.15), 640px);
          }
          .taichi {
            top: 86px;
            left: -6px;
          }
          .mio {
            top: 120px;
            right: 4px;
          }
          .grid2 {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 380px) and (max-height: 700px) {
          :root {
            --card-gap-top: 120px;
            --tn-top: 90px;
            --tn-flow-space: clamp(300px, calc(var(--tn-w) * 1.25), 720px);
          }
        }
      `}</style>
    </div>
  );
}
