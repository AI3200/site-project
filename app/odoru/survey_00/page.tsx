// app/odoru/survey_00/page.tsx
"use client";

import React, { useMemo, useState } from "react";

/**
 * GH Pages / static export 前提
 * - basePath は next.config 側で /site-project を付ける想定
 * - 画像パスも basePath を考慮して BASE を使う
 * - GAS へは preflight 回避のため text/plain で JSON 文字列を送る
 * - mode:no-cors のためレスポンス判定はできない（保存はGAS側で最優先）
 */

const BASE = process.env.NODE_ENV === "production" ? "/site-project" : "";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyduHXEvbK0bfEjkECun71-50aO6UqhCoYqP8vgxHW8jnltKuFOChImwNTxhPipssFdrQ/exec";

// ✅ GAS 側の SECRET_TOKEN と完全一致させる
const SECRET_TOKEN = "s00_2025-12-23__R9x4Kq7P3mZ8N2aW6JtEoBvC";

const OFFICIAL_NOTICE = `本企画では、発送業務の都合上、
住所および電話番号を一時的に取得します。

ただし、利用目的はバッジ発送のみに限定しており、
発送完了後は速やかに削除します。

当該情報は共有・再利用・継続保管を行いません。`;

type FormState = {
  parentConsent: boolean;
  gradeBand: "" | "小1-2" | "小3-4" | "小5-6";

  recipientName: string;
  postalCode: string;
  address1: string;
  address2: string;
  phone: string;
  email: string;

  q1: "" | "とても" | "まあまあ" | "ふつう" | "むずかしい";
  q2: "" | "またやりたい" | "またやるかも" | "わからない";
  q3: string;

  // ハニーポット（UIには出さない。botが埋めがち）
  company?: string;
};

const initial: FormState = {
  parentConsent: false,
  gradeBand: "",
  recipientName: "",
  postalCode: "",
  address1: "",
  address2: "",
  phone: "",
  email: "",
  q1: "",
  q2: "",
  q3: "",
  company: "", // honeypot
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
        "email",
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
    // emailはブラウザのtype="email"+requiredで担保（ここでは空チェックだけでOK）
    return (
      form.parentConsent && allRequiredFilled && phoneOk && zipOk && !submitting
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

  // ✅ 郵便番号 → 住所自動入力（zipcloud）
  const handleZipChange = async (zip: string) => {
    setField("postalCode", zip);

    const digits = zip.replace(/[^\d]/g, "");
    if (digits.length !== 7) return;

    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`
      );
      const data = await res.json();

      if (data?.results?.[0]) {
        const r = data.results[0];
        const addr = `${r.address1}${r.address2}${r.address3}`;
        setField("address1", addr);
      }
    } catch {
      // 失敗しても手入力できるので握りつぶし
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitting(true);
    setStatus("送信中…");

    // ✅ GAS が期待する形（token必須）
    const payload = {
      token: SECRET_TOKEN,
      issue: "00",
      submittedAt: new Date().toISOString(),
      ...form,
      phoneDigits: onlyDigits(form.phone),
      postalCodeDigits: onlyDigits(form.postalCode),
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
      ref: typeof window !== "undefined" ? document.referrer : "",
    };

    // ✅ デバッグしたい時だけON（普段はコメントでもOK）
    // console.log("payload", payload);

    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          // ✅ プリフライト回避
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      // no-cors なので厳密には成功判定できないが、UX安定を優先
      setStatus("送信しました。ありがとうございました。バッジを準備します！");
      setForm(initial);
    } catch {
      setStatus("送信に失敗しました。時間をおいて試してください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wrap">
      {/* 背景（上：水色、下：薄グレー） */}
      <div className="bgTop" aria-hidden />
      <div className="bgDots" aria-hidden />

      <div className="stage">
        {/* ブランド */}
        <header className="brand">
          <div className="brandPill">
            <span className="brandDot" aria-hidden />
            <span className="brandName">Smart Life</span>
          </div>
        </header>

        {/* タイトル */}
        <div className="hero">
          <img
            className="heroLogo"
            src={`${BASE}/media/odoru_LOGO.png`}
            alt="おどるクイズシリーズ"
          />
          <div className="heroSub">バッジがもらえるアンケート</div>
        </div>

        {/* 左右キャラ */}
        <img
          className="illust taichi"
          src={`${BASE}/media/odoru_taichi.png`}
          alt=""
        />
        <img
          className="illust mio"
          src={`${BASE}/media/odoru_mio.png`}
          alt=""
        />

        {/* メインカード */}
        <main className="cardWrap" aria-label="アンケート">
          <section className="card">
            {/* イントロ */}
            <div className="intro">
              <div className="introHead">
                <span className="chipTitle alt">入力に合わせてゲージUP</span>
              </div>

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
            </div>

            <form onSubmit={handleSubmit} className="form">
              {/* honeypot（見えない入力） */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.company || ""}
                onChange={(e) => setField("company", e.target.value)}
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                }}
                aria-hidden="true"
              />

              {/* STEP 01 */}
              <section className="step">
                <div className="stepHead">
                  <div className="stepBadge">01</div>
                  <div className="stepTitle">保護者の方へ（必須）</div>
                </div>

                <div className="panel">
                  <p className="notice">{OFFICIAL_NOTICE}</p>

                  <label className="check">
                    <input
                      type="checkbox"
                      checked={form.parentConsent}
                      onChange={(e) =>
                        setField("parentConsent", e.target.checked)
                      }
                      required
                    />
                    <span>上記内容を確認し、同意します</span>
                  </label>
                </div>
              </section>

              {/* STEP 02 */}
              <section className="step">
                <div className="stepHead">
                  <div className="stepBadge">02</div>
                  <div className="stepTitle">学年（必須）</div>
                </div>

                <div className="panel">
                  <select
                    value={form.gradeBand}
                    onChange={(e) =>
                      setField(
                        "gradeBand",
                        e.target.value as FormState["gradeBand"]
                      )
                    }
                    required
                    className="input"
                  >
                    <option value="">えらんでね</option>
                    <option value="小1-2">小1・小2</option>
                    <option value="小3-4">小3・小4</option>
                    <option value="小5-6">小5・小6</option>
                  </select>
                </div>
              </section>

              {/* STEP 03 */}
              <section className="step">
                <div className="stepHead">
                  <div className="stepBadge">03</div>
                  <div className="stepTitle">バッジの送り先（必須）</div>
                </div>

                <div className="panel">
                  {/* 宛名 */}
                  <label className="label">宛名（必須）</label>
                  <input
                    className="input"
                    value={form.recipientName}
                    onChange={(e) => setField("recipientName", e.target.value)}
                    required
                    placeholder="例：TN 博士（保護者）"
                    autoComplete="name"
                  />

                  {/* 郵便番号（小さくする） */}
                  <label className="label">郵便番号（必須）</label>
                  <input
                    className="input inputHalf"
                    value={form.postalCode}
                    onChange={(e) => handleZipChange(e.target.value)}
                    required
                    inputMode="numeric"
                    placeholder="例：2200011"
                    autoComplete="postal-code"
                  />
                  <p className="hint">※ハイフンなし7桁（入力すると住所が自動で入ります）</p>

                  {/* 住所（自動入力される） */}
                  <label className="label">住所（都道府県・市区町村）（必須）</label>
                  <input
                    className="input"
                    value={form.address1}
                    onChange={(e) => setField("address1", e.target.value)}
                    required
                    placeholder="例：神奈川県横浜市西区高島"
                    autoComplete="address-level1"
                  />

                  {/* 番地 */}
                  <label className="label">番地・建物名（必須）</label>
                  <input
                    className="input"
                    value={form.address2}
                    onChange={(e) => setField("address2", e.target.value)}
                    required
                    placeholder="例：1-2-5 横濱ゲートタワー19階"
                    autoComplete="street-address"
                  />

                  {/* 電話（改行） */}
                  <label className="label">電話番号（必須）</label>
                  <input
                    className="input inputHalf"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    required
                    inputMode="tel"
                    placeholder="例：080-1234-5678"
                    autoComplete="tel"
                  />
                  <p className="hint">※ハイフンありでもOK</p>

                  {/* メール（改行） */}
                  <label className="label">メールアドレス（必須）</label>
                  <input
                    className="input"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="例：example@gmail.com"
                    autoComplete="email"
                  />
                  <p className="hint">※連絡が必要な場合のみ使用します</p>
                </div>
              </section>


              {/* STEP 04 */}
              <section className="step">
                <div className="stepHead">
                  <div className="stepBadge">04</div>
                  <div className="stepTitle">しつもん</div>
                </div>

                <div className="panel">
                  <div className="q">
                    <p className="qTitle">Q1. この号はどうだった？（必須）</p>
                    <div className="chips">
                      {(["とても", "まあまあ", "ふつう", "むずかしい"] as const).map(
                        (v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setField("q1", v)}
                            className={form.q1 === v ? "chip on" : "chip"}
                          >
                            {v}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="q">
                    <p className="qTitle">Q2. またやりたい？（必須）</p>
                    <div className="chips">
                      {(
                        ["またやりたい", "またやるかも", "わからない"] as const
                      ).map((v) => (
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
                    <label className="qTitle">
                      Q3. つぎに入れてほしいこと（任意）
                    </label>
                    <textarea
                      className="input"
                      value={form.q3}
                      onChange={(e) => setField("q3", e.target.value)}
                      rows={4}
                      placeholder="例：もっとクイズをふやして！など"
                    />
                  </div>
                </div>
              </section>

              {/* 送信 */}
              <div className="submitZone">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={canSubmit ? "submit" : "submit off"}
                >
                  {submitting ? "送信中…" : "バッジを受け取る！"}
                </button>

                {status && <p className="status">{status}</p>}

                <p className="tiny">
                  ※現在の送信方式（no-cors）は「送信成功」を厳密に判定できません。住所・電話必須運用なら、
                  次のステップで CORS対応 または Next.js API 経由に切替推奨です。
                </p>
              </div>
            </form>
          </section>

          {/* TN博士：カードの外、下に置く */}
          <div className="tnZone" aria-label="TN博士（装飾）">
            <img className="tn" src={`${BASE}/media/odoru_TN.png`} alt="" />
          </div>
        </main>

        <footer className="siteFooter">© 一般社団法人スマートライフ教育研究所</footer>
      </div>

      <style jsx global>{`
        :root {
          --ink: #1f2937;
          --ink2: #111827;
          --muted: rgba(31, 41, 55, 0.62);

          --orange: #ff7a00;
          --orange2: #ffb21a;

          --border: 3px solid rgba(17, 24, 39, 0.92);
          --shadow: 0 14px 0 rgba(17, 24, 39, 0.1);
          --r: 18px;
          --r2: 22px;
        }

        body {
          margin: 0;
          color: var(--ink2);
          background: radial-gradient(
              1200px 520px at 50% 0%,
              rgba(255, 255, 255, 0.85) 0%,
              rgba(255, 255, 255, 0) 62%
            ),
            linear-gradient(
              180deg,
              rgba(125, 211, 252, 0.95) 0%,
              rgba(56, 189, 248, 0.95) 34%,
              #f7f7fb 34%,
              #f7f7fb 100%
            );
          overflow-x: hidden;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
            "Noto Sans JP", sans-serif;
        }

        .wrap {
          position: relative;
          min-height: 100dvh;
        }

        .bgTop {
          position: absolute;
          inset: 0 0 auto 0;
          height: 360px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0)),
            radial-gradient(
              900px 260px at 50% 40%,
              rgba(255, 255, 255, 0.35),
              rgba(255, 255, 255, 0) 60%
            );
          pointer-events: none;
        }
        .bgDots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.5;
          mask-image: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.55) 0%,
            rgba(0, 0, 0, 0.18) 45%,
            rgba(0, 0, 0, 0) 70%
          );
        }

        .stage {
          position: relative;
          max-width: 980px;
          margin: 0 auto;
          padding: 22px 16px 80px;
        }

        .brand {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .brandPill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.92);
          border: var(--border);
          border-radius: 999px;
          box-shadow: var(--shadow);
        }
        .brandDot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--orange);
          border: 2px solid rgba(17, 24, 39, 0.9);
        }
        .brandName {
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .hero {
          text-align: center;
          margin: 10px 0 12px;
          position: relative;
          z-index: 2;
        }
        .heroLogo {
          width: min(260px, 56vw);
          height: auto;
          display: block;
          margin: 0 auto;
          filter: drop-shadow(0 10px 0 rgba(17, 24, 39, 0.08));
        }
        .heroSub {
          display: inline-flex;
          margin-top: 10px;
          padding: 10px 14px;
          border: var(--border);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          font-weight: 900;
          box-shadow: var(--shadow);
        }

        .illust {
          position: absolute;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          filter: drop-shadow(0 16px 0 rgba(17, 24, 39, 0.1));
        }
        .taichi {
          left: clamp(-6px, -1vw, 16px);
          top: 120px;
          width: clamp(140px, 22vw, 260px);
          transform: rotate(-4deg);
          z-index: 1;
        }
        .mio {
          right: clamp(-2px, 1vw, 24px);
          top: 140px;
          width: clamp(110px, 18vw, 210px);
          transform: rotate(3deg);
          z-index: 1;
        }

        .cardWrap {
          position: relative;
          width: min(820px, 92vw);
          margin: 20px auto 0;
          z-index: 3;
        }

        .card {
          background: rgba(255, 255, 255, 0.95);
          border: var(--border);
          border-radius: var(--r2);
          box-shadow: var(--shadow);
          padding: 16px;
        }

        .intro {
          border: var(--border);
          border-radius: var(--r);
          background: linear-gradient(180deg, rgba(255, 178, 26, 0.22), rgba(255, 255, 255, 0.92));
          padding: 14px;
          margin-bottom: 14px;
        }
        .introHead {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 10px;
        }
        .chipTitle {
          display: inline-flex;
          padding: 8px 10px;
          border-radius: 999px;
          border: 2px solid rgba(17, 24, 39, 0.9);
          background: rgba(255, 255, 255, 0.92);
          font-weight: 900;
          font-size: 12px;
        }
        .chipTitle.alt {
          background: rgba(255, 122, 0, 0.15);
        }

        .meter {
          padding: 10px;
          border-radius: 14px;
          border: 2px solid rgba(17, 24, 39, 0.9);
          background: rgba(255, 255, 255, 0.92);
        }
        .meterTop {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          font-weight: 900;
          font-size: 12px;
          color: rgba(17, 24, 39, 0.78);
        }
        .meterTop strong {
          color: var(--ink2);
          font-size: 14px;
        }
        .bar {
          height: 14px;
          border-radius: 999px;
          border: 2px solid rgba(17, 24, 39, 0.9);
          background: rgba(17, 24, 39, 0.08);
          overflow: hidden;
          margin-top: 8px;
        }
        .barIn {
          height: 100%;
          background: linear-gradient(90deg, var(--orange), var(--orange2));
          width: 0%;
          transition: width 0.25s ease;
        }
        .cheer {
          margin-top: 8px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.78);
          font-size: 13px;
        }

        .form {
          display: grid;
          gap: 14px;
        }

        .step {
          display: grid;
          gap: 10px;
        }
        .stepHead {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .stepBadge {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: var(--border);
          background: linear-gradient(180deg, rgba(255, 122, 0, 0.95), rgba(255, 178, 26, 0.95));
          color: #111;
          display: grid;
          place-items: center;
          font-weight: 1000;
          letter-spacing: 0.04em;
          box-shadow: 0 10px 0 rgba(17, 24, 39, 0.1);
          flex: 0 0 auto;
        }
        .stepTitle {
          font-weight: 1000;
          letter-spacing: 0.02em;
          font-size: 16px;
          padding: 8px 12px;
          border: 2px solid rgba(17, 24, 39, 0.9);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
        }

        .panel {
          border: var(--border);
          border-radius: var(--r);
          background: rgba(255, 255, 255, 0.96);
          padding: 14px;
        }

        .notice {
          margin: 0;
          white-space: pre-line;
          line-height: 1.7;
          background: rgba(255, 178, 26, 0.18);
          border: 2px solid rgba(17, 24, 39, 0.85);
          border-radius: 14px;
          padding: 12px;
          font-weight: 800;
        }

        .check {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-top: 12px;
          font-weight: 900;
        }
        .check input {
          transform: translateY(2px);
        }

        .label {
          display: block;
          margin: 12px 0 6px;
          font-size: 12px;
          font-weight: 1000;
          color: rgba(17, 24, 39, 0.75);
        }

        .input {
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 2px solid rgba(17, 24, 39, 0.9);
          background: rgba(247, 248, 252, 0.95);
          outline: none;
        }

/* 郵便番号・電話番号：PCは220px固定、SPは100% */
.inputHalf{
  width: 100%;        /* .input の width:100% と衝突させない */
  max-width: 220px;   /* PCで220pxに締める */
}

@media (max-width: 640px){
  .inputHalf{
    max-width: 100%;  /* SPはフル幅 */
  }
}



        .input:focus {
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255, 122, 0, 0.18);
        }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .hint {
          margin: 6px 0 0;
          font-size: 12px;
          color: var(--muted);
          font-weight: 800;
        }

        .q {
          margin-top: 6px;
        }
        .qTitle {
          margin: 0;
          font-weight: 1000;
          font-size: 14px;
          color: rgba(17, 24, 39, 0.85);
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        .chip {
          padding: 10px 12px;
          border-radius: 999px;
          border: 2px solid rgba(17, 24, 39, 0.9);
          background: rgba(255, 255, 255, 0.92);
          cursor: pointer;
          font-weight: 1000;
          transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
        }
        .chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 0 rgba(17, 24, 39, 0.1);
          background: rgba(255, 178, 26, 0.18);
        }
        .chip.on {
          background: linear-gradient(180deg, rgba(255, 122, 0, 0.22), rgba(255, 255, 255, 0.92));
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 12px 0 rgba(17, 24, 39, 0.12);
        }

        .submitZone {
          border: var(--border);
          border-radius: var(--r);
          background: linear-gradient(180deg, rgba(255, 178, 26, 0.18), rgba(255, 255, 255, 0.96));
          padding: 14px;
        }

        .submit {
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          border: var(--border);
          background: linear-gradient(180deg, rgba(255, 122, 0, 0.95), rgba(255, 178, 26, 0.95));
          color: #111;
          font-weight: 1000;
          letter-spacing: 0.04em;
          cursor: pointer;
          box-shadow: 0 14px 0 rgba(17, 24, 39, 0.12);
          transition: transform 0.12s ease;
        }
        .submit:hover {
          transform: translateY(-1px);
        }
        .submit.off {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
        }

        .status {
          margin: 10px 0 0;
          font-weight: 1000;
        }
        .tiny {
          margin: 10px 0 0;
          font-size: 12px;
          color: var(--muted);
          font-weight: 800;
        }

        .tnZone {
          position: relative;
          width: 100%;
          margin-top: 18px;
          padding: 0 6px 18px;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }
        .tn {
          position: relative;
          width: clamp(240px, 34vw, 470px);
          height: auto;
          display: block;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          filter: drop-shadow(0 18px 0 rgba(17, 24, 39, 0.1));
        }

        .siteFooter {
          text-align: center;
          padding: 26px 12px 34px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(17, 24, 39, 0.45);
        }

        @media (max-width: 640px) {
          .grid2 {
            grid-template-columns: 1fr;
          }
          .taichi {
            top: 150px;
            left: -6px;
          }
          .mio {
            top: 170px;
            right: 0px;
          }
          .card {
            padding: 14px;
          }
          .stepTitle {
            font-size: 15px;
          }
          .tnZone {
            margin-top: 14px;
            padding-bottom: 22px;
          }
          .tn {
            width: clamp(260px, 78vw, 420px);
          }
        }

        @media (max-width: 380px) {
          .stepBadge {
            width: 40px;
            height: 40px;
          }
          .heroSub {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
