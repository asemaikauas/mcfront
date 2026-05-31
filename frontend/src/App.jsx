import React from "react";
import aiesecLogo from "../../logo/aiesec.png";
import mastercardLogo from "../../logo/mastercard.png";
import initialFeatureHeatmap from "./assets/notebook/initial-feature-correlation-heatmap.png";
import modelScoreDistributions from "./assets/notebook/model-score-distributions.png";
import modelScoreSummary from "./assets/notebook/model-score-summary.png";
import prunedFeatureHeatmap from "./assets/notebook/pruned-feature-correlation-heatmap.png";
import scoreModelHeatmap from "./assets/notebook/score-model-correlation-heatmap.png";
import topFeatureContributions from "./assets/notebook/top-feature-contributions.png";
import topOverlapDiagnostics from "./assets/notebook/top-overlap-diagnostics.png";

const metrics = [
  { label: "Cards scored", value: "80K", note: "consumer cards ranked" },
  { label: "Feature matrix", value: "123", note: "card-level signals" },
  { label: "Hypotheses", value: "32", note: "business behavior tests" },
  { label: "Final target", value: "AUC", note: "continuous ranking score" },
];

const pipeline = [
  {
    step: "01",
    title: "Transaction profile",
    body: "Aggregate consumer and business histories to card-level behavior.",
  },
  {
    step: "02",
    title: "Business hypotheses",
    body: "Encode MCC, merchant, amount, calendar, recurring, and cross-border patterns.",
  },
  {
    step: "03",
    title: "One-class learning",
    body: "Calibrate on known business cards, then rank consumer cards by business-likeness.",
  },
  {
    step: "04",
    title: "Submission score",
    body: "Blend interpretable and nonlinear ranks into a stable ROC-AUC oriented score.",
  },
];

const mlChronology = [
  {
    step: "01",
    tag: "baseline test",
    title: "99th percentile if/else classifier",
    formula: "feature >= business_p99 ? 1 : 0",
    codeLines: [
      "business_p99 = quantile(business_feature, 0.99)",
      "flag = feature >= business_p99",
      "score_p99 = mean(flag_columns)",
    ],
    problem: "We needed a first business-likeness rule without hidden consumer labels.",
    move: "Compared each hypothesis feature with the 99th percentile of known business cards.",
    result: "Readable baseline, but too rigid for cards with only a few strong business signals.",
    summary:
      "We needed a first business-likeness rule without hidden consumer labels, so each hypothesis feature was compared with the 99th percentile of known business cards. The result was a readable baseline, but it was too rigid for cards with only a few strong business signals.",
  },
  {
    step: "02",
    tag: "hybrid mode",
    title: "Hybrid score with top feature peaks",
    formula: "0.4 * mean + 0.4 * top5 + 0.2 * max",
    codeLines: [
      "score_mean = mean(feature_scores)",
      "score_top5 = mean(top_5(feature_scores))",
      "score_hybrid = 0.4*mean + 0.4*top5 + 0.2*max",
    ],
    problem: "Hidden entrepreneurs may have narrow but very strong business behavior.",
    move: "Blended the mean with top-5 feature peaks and the strongest single feature.",
    result: "The tail improved, but the plots still showed raw scores were too low.",
    summary:
      "Because hidden entrepreneurs may show narrow but very strong business behavior, the score blended the mean with the top-5 feature peaks and the strongest single feature. This improved the tail, although the plots still showed that raw scores were too low.",
    visuals: [
      {
        title: "Hybrid score distribution",
        image: modelScoreDistributions,
        body: "Baseline, hybrid, rank ensemble, and KMeans variants plotted together after we moved beyond the p99 mean baseline.",
      },
      {
        title: "Low raw scores and rank spread",
        image: modelScoreSummary,
        body: "The ECDF comparison made the low-score compression visible, which led to rank blending with Isolation Forest.",
      },
    ],
  },
  {
    step: "03",
    tag: "anomaly detection",
    title: "Isolation Forest as a nonlinear one-class signal",
    formula: "rank_h90_i10 = 0.9 * rank(hybrid) + 0.1 * rank(iso)",
    codeLines: [
      "iso_score = IsolationForest(features)",
      "hybrid_rank = rank(score_hybrid)",
      "rank_h90_i10 = 0.9*hybrid_rank + 0.1*iso_rank",
    ],
    problem: "Rules missed nonlinear combinations across the full feature profile.",
    move: "Added Isolation Forest as a small rank-based anomaly signal beside hybrid.",
    result: "Improved score spread while keeping the interpretable hybrid score dominant.",
    summary:
      "Rules missed nonlinear combinations across the full feature profile, so Isolation Forest was added as a small rank-based anomaly signal beside the hybrid score. This improved score spread while keeping the interpretable hybrid score dominant.",
    visuals: [
      {
        title: "Isolation Forest alignment check",
        image: scoreModelHeatmap,
        body: "Spearman correlations checked that the nonlinear anomaly signal added information without breaking the business-likeness ordering.",
      },
    ],
  },
  {
    step: "04",
    tag: "clustering",
    title: "KMeans business-archetype clustering",
    formula: "rank(h90_i10) + rank(distance_to_business_centroids)",
    codeLines: [
      "centroids = KMeans(business_cards)",
      "cluster_score = distance_to_business_centroids",
      "final_alt = rank(h90_i10) + rank(cluster_score)",
    ],
    problem: "Business cards do not all follow one spending pattern.",
    move: "Compared candidates with KMeans business centroids to capture archetypes.",
    result: "Created a segment-aware backup that stayed close to the primary ensemble.",
    summary:
      "Because business cards do not all follow one spending pattern, candidates were compared with KMeans business centroids to capture different archetypes. This created a segment-aware backup that stayed close to the primary ensemble.",
    visuals: [
      {
        title: "KMeans top-bucket overlap",
        image: topOverlapDiagnostics,
        body: "Top 1% and 5% overlap showed whether clustering changed the strongest candidate set or mostly confirmed the final ensemble.",
      },
    ],
  },
];

const submissions = [
  ["submission_p99_soft.csv", "Readable baseline", "backup"],
  ["submission_rank_ens_h90_i10.csv", "Hybrid plus Isolation Forest", "primary"],
  ["submission_rank_h90_i10_kmeans_k8.csv", "Primary plus cluster signal", "alternate"],
];

const mlResults = [
  {
    label: "Baseline max",
    value: "0.3606",
    note: "p99 soft score",
  },
  {
    label: "Primary max",
    value: "0.9968",
    note: "hybrid + Isolation Forest",
  },
  {
    label: "Alternate max",
    value: "0.9961",
    note: "primary + KMeans",
  },
];

const pruningStages = [
  {
    label: "Initial matrix",
    value: "178",
    note: "engineered features from 32 hypotheses",
  },
  {
    label: "Weak hypotheses",
    value: "41",
    note: "columns where consumer behavior was stronger or misleading",
  },
  {
    label: "Duplicates",
    value: "15",
    note: "perfect or near-perfect correlation columns removed",
  },
  {
    label: "Final matrix",
    value: "122",
    note: "numeric features used for scoring",
  },
];

const removedHypotheses = [
  {
    label: "Consumer travel",
    body: "Travel share was higher for consumers, so it risked ranking frequent travelers.",
  },
  {
    label: "Operational streak",
    body: "High streaks mostly captured active consumer cards, not business operations.",
  },
  {
    label: "Seasonal gifts",
    body: "Holiday and March 8 gift spikes looked more consumer than commercial.",
  },
  {
    label: "Ticket size",
    body: "Large tickets risked ranking wealthy consumers instead of entrepreneurs.",
  },
  {
    label: "Cash working capital",
    body: "The cash proxy was stronger for consumers and worked against the reference profile.",
  },
  {
    label: "H27 duplicate",
    body: "Recurring calendar duplicated subscription stack, so we kept only the clearer signal.",
  },
];

function PartnerLockup({ compact = false }) {
  return (
    <div className={`partner-lockup${compact ? " partner-lockup-compact" : ""}`}>
      <img className="mastercard-logo" src={mastercardLogo} alt="Mastercard" />
      <span className="brand-divider" aria-hidden="true" />
      <img className="aiesec-logo" src={aiesecLogo} alt="AIESEC" />
    </div>
  );
}

function BrandBar() {
  return (
    <header className="brand-bar">
      <PartnerLockup />
      <span className="team-tag">Team BULT / May 2026</span>
    </header>
  );
}

function MetricStrip() {
  return (
    <div className="metric-strip" aria-label="Key case numbers">
      {metrics.map((metric) => (
        <div className="metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.note}</small>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="hero-shell">
      <div className="hero-frame">
        <div className="hero-logo">
          <PartnerLockup compact />
        </div>
        <div className="hero-copy">
          <span className="eyebrow">Mastercard Data Quest</span>
          <h1 className="hero-title">
            <span>Detecting</span>
            <span>Hidden</span>
            <span>Entrepreneurs</span>
          </h1>
          <div className="hero-rule" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ kicker, title, body }) {
  return (
    <div className="section-header">
      <span>{kicker}</span>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

function Pipeline() {
  return (
    <section className="content-band">
      <SectionHeader
        kicker="Case architecture"
        title="From raw transactions to ranked business-likeness"
        body="The site mirrors the pitch deck: a concise story for judges, but with enough technical detail to defend the modeling choices."
      />
      <div className="pipeline-grid">
        {pipeline.map((item) => (
          <article className="pipeline-step" key={item.step}>
            <span>{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HypothesisWork() {
  return (
    <section className="content-band hypothesis-band">
      <SectionHeader
        kicker="Hypothesis work"
        title="Feature engineering before the one-class model"
        body="The notebook starts with a wide hypothesis matrix, uses correlation and business-vs-consumer checks to remove weak or duplicate signals, then keeps the pruned matrix for scoring."
      />
      <div className="pruning-timeline" aria-label="Feature pruning chronology">
        {pruningStages.map((stage) => (
          <article className="pruning-stage" key={stage.label}>
            <span>{stage.label}</span>
            <strong>{stage.value}</strong>
            <small>{stage.note}</small>
          </article>
        ))}
      </div>
      <div className="heatmap-comparison">
        <article className="hypothesis-heatmap initial-heatmap-card">
          <div className="visual-copy">
            <span>before pruning</span>
            <h3>Initial feature correlation scan</h3>
          </div>
          <img src={initialFeatureHeatmap} alt="Initial feature correlation scan" />
        </article>
        <article className="hypothesis-heatmap pruned-heatmap-card">
          <div className="visual-copy">
            <span>after pruning</span>
            <h3>Pruned feature correlation heatmap</h3>
          </div>
          <img src={prunedFeatureHeatmap} alt="Pruned feature correlation heatmap" />
        </article>
      </div>
      <div className="cleanup-heading">
        <h3>Examples of features removed before modeling</h3>
      </div>
      <div className="feature-list" aria-label="Deleted weak hypotheses">
        {removedHypotheses.map((item) => (
          <article className="feature-item" key={item.label}>
            <div>
              <span>{item.label}</span>
            </div>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <article className="feature-contribution-card">
        <div className="visual-copy">
          <span>explainability</span>
          <h3>Top feature contributions</h3>
          <p>Most common high-likeness signals among the top hybrid cards.</p>
        </div>
        <img src={topFeatureContributions} alt="Top feature contributions" />
      </article>
    </section>
  );
}

function MlSolution() {
  return (
    <section className="content-band model-band">
      <SectionHeader
        kicker="ML solution"
        title="From first baseline to final model"
      />
      <div className="ml-chronology" aria-label="Machine learning experiment chronology">
        {mlChronology.map((item) => (
          <article className="ml-chronology-step" key={item.step}>
            <div className="chronology-copy">
              <div className="chronology-heading">
                <div>
                  <span>{item.tag}</span>
                  <h3>{item.title}</h3>
                </div>
              </div>
              <div className="experiment-ledger">
                <div className="experiment-summary">
                  <p>{item.summary}</p>
                </div>
                <div className="experiment-code" aria-label={`${item.title} code logic`}>
                  <span>logic</span>
                  <pre>
                    <code>{(item.codeLines || [item.formula]).join("\n")}</code>
                  </pre>
                </div>
              </div>
              {item.visuals ? (
                <div className="chronology-visuals">
                  {item.visuals.map((visual) => (
                    <figure className="chronology-visual" key={visual.title}>
                      <figcaption>
                        <span>graph</span>
                        <strong>{visual.title}</strong>
                      </figcaption>
                      <img src={visual.image} alt={visual.title} />
                    </figure>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <div className="ml-result-strip" aria-label="Maximum submission scores">
        {mlResults.map((result) => (
          <div className="ml-result" key={result.label}>
            <span>{result.label}</span>
            <strong>{result.value}</strong>
            <small>{result.note}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubmissionTable() {
  return (
    <section className="content-band">
      <SectionHeader
        kicker="Deliverables"
        title="Our Submissions"
        body="Each CSV keeps the required card_number and score columns. The primary file favors the stable rank ensemble."
      />
      <div className="submission-table" role="table" aria-label="Submission files">
        {submissions.map(([file, description, status]) => (
          <div className="submission-row" role="row" key={file}>
            <code>{file}</code>
            <span>{description}</span>
            <b>{status}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <PartnerLockup compact />
      <span>Mastercard Data Quest case solution</span>
      <span>Team BULT / AIESEC / May 2026</span>
    </footer>
  );
}

export default function App() {
  return (
    <main>
      <Hero />
      <Pipeline />
      <HypothesisWork />
      <MlSolution />
      <SubmissionTable />
      <Footer />
    </main>
  );
}
