// app/odoru/survey_00/page.tsx
"use client";

import React, { useMemo, useState } from "react";

const BASE = process.env.NODE_ENV === "production" ? "/site-project" : "";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbyduHXEvbK0bfEjkECun71-50aO6UqhCoYqP8vgxHW8jnltKuFOChImwNTxhPipssFdrQ/exec";

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
        <img className="illust mio" src={`${BASE}/media/odoru_mio.png`} alt="" />

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
                  <label className="label">宛名（必須）</label>
                  <input
                    className="input"
                    value={form.recipientName}
                    onChange={(e) => setField("recipientName", e.target.value)}
                    required
                    placeholder="例：TN 博士（保護者）"
                    autoComplete="name"
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
                        autoComplete="postal-code"
                      />
                      <p className="hint">※ハイフンなし7桁</p>
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
                        autoComplete="tel"
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
                    autoComplete="address-level1"
                  />

                  <label className="label">番地・建物名（必須）</label>
                  <input
                    className="input"
                    value={form.address2}
                    onChange={(e) => setField("address2", e.target.value)}
                    required
                    placeholder="例：1-2-5 横濱ゲートタワー19階"
                    autoComplete="street-address"
                  />
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
                      {(["またやりたい", "またやるかも", "わからない"] as const).map(
                        (v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setField("q2", v)}
                            className={form.q2 === v ? "chip on" : "chip"}
                          >
                            {v}
                          </button>
                        )
                      )}
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
                  ※現在の送信方式（no-cors）は「送信成功」を厳密に判定できません。住所・電話必須運用なら、次のステップでCORS対応またはNext.js API経由に切替推奨です。
                </p>
              </div>
            </form>
          </section>

          {/* ✅ TN博士：カードの外、通常フローで“下に置く”ので被らない */}
          <div className="tnZone" aria-label="TN博士（装飾）">
            <img className="tn" src={`${BASE}/media/odoru_TN.png`} alt="" />
          </div>
        </main>

        {/* ✅ フッターはこれだけ */}
        <footer className="siteFooter">© 一般社団法人スマートライフ教育研究所</footer>
      </div>

      <style jsx global>{`
        :root{
          --ink:#1f2937;
          --ink2:#111827;
          --muted:rgba(31,41,55,.62);

          --orange:#ff7a00;
          --orange2:#ffb21a;

          --border:3px solid rgba(17,24,39,.92);
          --shadow:0 14px 0 rgba(17,24,39,.10);
          --r:18px;
          --r2:22px;
        }

        body{
          margin:0;
          color:var(--ink2);
          background:
            radial-gradient(1200px 520px at 50% 0%, rgba(255,255,255,.85) 0%, rgba(255,255,255,0) 62%),
            linear-gradient(180deg, rgba(125,211,252,.95) 0%, rgba(56,189,248,.95) 34%, #f7f7fb 34%, #f7f7fb 100%);
          overflow-x:hidden;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", sans-serif;
        }

        .wrap{ position:relative; min-height:100dvh; }

        .bgTop{
          position:absolute; inset:0 0 auto 0; height:360px;
          background:
            linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,0)),
            radial-gradient(900px 260px at 50% 40%, rgba(255,255,255,.35), rgba(255,255,255,0) 60%);
          pointer-events:none;
        }
        .bgDots{
          position:absolute; inset:0; pointer-events:none;
          background-image: radial-gradient(rgba(255,255,255,.22) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity:.5;
          mask-image: linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.18) 45%, rgba(0,0,0,0) 70%);
        }

        .stage{
          position:relative;
          max-width: 980px;
          margin: 0 auto;
          padding: 22px 16px 80px;
        }

        .brand{
          display:flex;
          align-items:center;
          justify-content:flex-start;
        }
        .brandPill{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding:10px 14px;
          background: rgba(255,255,255,.92);
          border: var(--border);
          border-radius: 999px;
          box-shadow: var(--shadow);
        }
        .brandDot{
          width:10px; height:10px; border-radius:999px;
          background: var(--orange);
          border: 2px solid rgba(17,24,39,.9);
        }
        .brandName{ font-weight:900; letter-spacing:.02em; }

        .hero{
          text-align:center;
          margin: 10px 0 12px;
          position:relative;
          z-index:2;
        }
        .heroLogo{
          width: min(260px, 56vw);
          height:auto;
          display:block;
          margin: 0 auto;
          filter: drop-shadow(0 10px 0 rgba(17,24,39,.08));
        }
        .heroSub{
          display:inline-flex;
          margin-top: 10px;
          padding: 10px 14px;
          border: var(--border);
          border-radius: 999px;
          background: rgba(255,255,255,.92);
          font-weight: 900;
          box-shadow: var(--shadow);
        }

        .illust{
          position:absolute;
          pointer-events:none;
          user-select:none;
          -webkit-user-drag:none;
          filter: drop-shadow(0 16px 0 rgba(17,24,39,.10));
        }
        .taichi{
          left: clamp(-6px, -1vw, 16px);
          top: 120px;
          width: clamp(140px, 22vw, 260px);
          transform: rotate(-4deg);
          z-index:1;
        }
        .mio{
          right: clamp(-2px, 1vw, 24px);
          top: 140px;
          width: clamp(110px, 18vw, 210px);
          transform: rotate(3deg);
          z-index:1;
        }

        .cardWrap{
          position:relative;
          width: min(820px, 92vw);
          margin: 20px auto 0;
          z-index:3;
        }

        .card{
          background: rgba(255,255,255,.95);
          border: var(--border);
          border-radius: var(--r2);
          box-shadow: var(--shadow);
          padding: 16px;
        }

        .intro{
          border: var(--border);
          border-radius: var(--r);
          background: linear-gradient(180deg, rgba(255,178,26,.22), rgba(255,255,255,.92));
          padding: 14px;
          margin-bottom: 14px;
        }
        .introHead{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-bottom: 10px;
        }
        .chipTitle{
          display:inline-flex;
          padding: 8px 10px;
          border-radius: 999px;
          border: 2px solid rgba(17,24,39,.9);
          background: rgba(255,255,255,.92);
          font-weight: 900;
          font-size: 12px;
        }
        .chipTitle.alt{
          background: rgba(255,122,0,.15);
        }

        .meter{
          padding: 10px;
          border-radius: 14px;
          border: 2px solid rgba(17,24,39,.9);
          background: rgba(255,255,255,.92);
        }
        .meterTop{
          display:flex;
          align-items:baseline;
          justify-content:space-between;
          font-weight: 900;
          font-size: 12px;
          color: rgba(17,24,39,.78);
        }
        .meterTop strong{
          color: var(--ink2);
          font-size: 14px;
        }
        .bar{
          height: 14px;
          border-radius: 999px;
          border: 2px solid rgba(17,24,39,.9);
          background: rgba(17,24,39,.08);
          overflow:hidden;
          margin-top: 8px;
        }
        .barIn{
          height:100%;
          background: linear-gradient(90deg, var(--orange), var(--orange2));
          width:0%;
          transition: width .25s ease;
        }
        .cheer{
          margin-top: 8px;
          font-weight: 900;
          color: rgba(17,24,39,.78);
          font-size: 13px;
        }

        .form{
          display:grid;
          gap: 14px;
        }

        .step{
          display:grid;
          gap: 10px;
        }
        .stepHead{
          display:flex;
          align-items:center;
          gap: 10px;
        }
        .stepBadge{
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: var(--border);
          background: linear-gradient(180deg, rgba(255,122,0,.95), rgba(255,178,26,.95));
          color: #111;
          display:grid;
          place-items:center;
          font-weight: 1000;
          letter-spacing:.04em;
          box-shadow: 0 10px 0 rgba(17,24,39,.10);
          flex: 0 0 auto;
        }
        .stepTitle{
          font-weight: 1000;
          letter-spacing: .02em;
          font-size: 16px;
          padding: 8px 12px;
          border: 2px solid rgba(17,24,39,.9);
          border-radius: 999px;
          background: rgba(255,255,255,.92);
        }

        .panel{
          border: var(--border);
          border-radius: var(--r);
          background: rgba(255,255,255,.96);
          padding: 14px;
        }

        .notice{
          margin:0;
          white-space: pre-line;
          line-height: 1.7;
          background: rgba(255,178,26,.18);
          border: 2px solid rgba(17,24,39,.85);
          border-radius: 14px;
          padding: 12px;
          font-weight: 800;
        }

        .check{
          display:flex;
          gap: 10px;
          align-items:flex-start;
          margin-top: 12px;
          font-weight: 900;
        }
        .check input{ transform: translateY(2px); }

        .label{
          display:block;
          margin: 12px 0 6px;
          font-size: 12px;
          font-weight: 1000;
          color: rgba(17,24,39,.75);
        }

        .input{
          width:100%;
          padding: 12px;
          border-radius: 14px;
          border: 2px solid rgba(17,24,39,.9);
          background: rgba(247,248,252,.95);
          outline: none;
        }
        .input:focus{
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255,122,0,.18);
        }

        .grid2{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .hint{
          margin: 6px 0 0;
          font-size: 12px;
          color: var(--muted);
          font-weight: 800;
        }

        .q{ margin-top: 6px; }
        .qTitle{
          margin:0;
          font-weight: 1000;
          font-size: 14px;
          color: rgba(17,24,39,.85);
        }

        .chips{
          display:flex;
          flex-wrap:wrap;
          gap: 10px;
          margin-top: 10px;
        }
        .chip{
          padding: 10px 12px;
          border-radius: 999px;
          border: 2px solid rgba(17,24,39,.9);
          background: rgba(255,255,255,.92);
          cursor: pointer;
          font-weight: 1000;
          transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
        }
        .chip:hover{
          transform: translateY(-1px);
          box-shadow: 0 10px 0 rgba(17,24,39,.10);
          background: rgba(255,178,26,.18);
        }
        .chip.on{
          background: linear-gradient(180deg, rgba(255,122,0,.22), rgba(255,255,255,.92));
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 12px 0 rgba(17,24,39,.12);
        }

        .submitZone{
          border: var(--border);
          border-radius: var(--r);
          background: linear-gradient(180deg, rgba(255,178,26,.18), rgba(255,255,255,.96));
          padding: 14px;
        }

        .submit{
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          border: var(--border);
          background: linear-gradient(180deg, rgba(255,122,0,.95), rgba(255,178,26,.95));
          color: #111;
          font-weight: 1000;
          letter-spacing: .04em;
          cursor: pointer;
          box-shadow: 0 14px 0 rgba(17,24,39,.12);
          transition: transform .12s ease;
        }
        .submit:hover{ transform: translateY(-1px); }
        .submit.off{
          opacity: .55;
          cursor: not-allowed;
          transform: none !important;
        }

        .status{
          margin: 10px 0 0;
          font-weight: 1000;
        }
        .tiny{
          margin: 10px 0 0;
          font-size: 12px;
          color: var(--muted);
          font-weight: 800;
        }

        /* ✅ TN博士ゾーン：通常フローで右寄せ＝被らない */
        .tnZone{
          position: relative;
          width: 100%;
          margin-top: 18px;
          padding: 0 6px 18px;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }
        .tn{
          position: relative;
          width: clamp(240px, 34vw, 470px);
          height: auto;
          display: block;
          pointer-events:none;
          user-select:none;
          -webkit-user-drag:none;
          filter: drop-shadow(0 18px 0 rgba(17,24,39,.10));
        }

        .siteFooter{
          text-align:center;
          padding: 26px 12px 34px;
          font-size: 12px;
          font-weight: 900;
          color: rgba(17,24,39,.45);
        }

        @media (max-width: 640px){
          .grid2{ grid-template-columns: 1fr; }
          .taichi{ top: 150px; left: -6px; }
          .mio{ top: 170px; right: 0px; }
          .card{ padding: 14px; }
          .stepTitle{ font-size: 15px; }
          .tnZone{ margin-top: 14px; padding-bottom: 22px; }
          .tn{ width: clamp(260px, 78vw, 420px); }
        }

        @media (max-width: 380px){
          .stepBadge{ width: 40px; height: 40px; }
          .heroSub{ font-size: 13px; }
        }
      `}</style>
    </div>
  );
}
