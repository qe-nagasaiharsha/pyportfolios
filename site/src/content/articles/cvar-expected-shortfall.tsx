import { Section, Lead, P, InlineCode, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import d from "./data/cvar-expected-shortfall";
import { Bar } from "@/components/charts/echarts/Bar";
import { Histogram } from "@/components/charts/echarts/Histogram";
import { Line } from "@/components/charts/echarts/Line";

/* T10 / topic card 10-16 — all figures below render REAL computed results
   (HYG + VWO 2007 – 2024, incl. the GFC) baked in by quant/tutorials/t10_cvar.py. */

const pc = (v: number) => `${(v * 100).toFixed(2)}%`;
const pc1 = (v: number) => `${(v * 100).toFixed(1)}%`;
const pcAxis = (v: number) => `${(v * 100).toFixed(0)}%`;

export default function CvarExpectedShortfall() {
  const H = d.risk.HYG;
  const V = d.risk.VWO;
  const Pt = d.risk.PORT;
  const viol = d.sub.worstViolation;

  return (
    <>
      <Lead>
        Value-at-Risk tells you where the tail begins; it says nothing about what lives inside
        it. Two books with identical 99% VaR can differ threefold in what they lose once the
        threshold breaks — and for fat-tailed assets like high-yield credit, that difference is
        the whole risk. Expected shortfall (CVaR) averages the tail instead of pointing at its
        door, which is why Basel made it the regulatory standard. We estimate both, historically
        and with a Student-t, on {d.params.nObs.toLocaleString()} days of HYG and VWO — a sample
        that includes the crisis these measures were built for.
      </Lead>

      <Pipeline
        steps={[
          "Load HYG + VWO daily closes, 2007–2024 — the GFC included",
          "Build two synthetic books with identical 99% VaR, very different tails",
          "Estimate 97.5% / 99% VaR & CVaR — historical and Student-t (Acerbi's formula)",
          "Test subadditivity: CVaR always passes, VaR fails in crisis-year samples",
          "Zoom into HYG's GFC tail against its full-sample 99% VaR",
          'Spend the same 4% tail budget through rm="MV" vs rm="CVaR" (Riskfolio-Lib)',
        ]}
      />

      <Section id="blind" n={1} title="What VaR cannot see">
        <P>
          VaR at confidence α is a <Term>quantile</Term>: the smallest loss exceeded on only the
          worst (1−α) of days. It is a threshold, not an average — so it is structurally blind
          to everything beyond itself. The demonstration takes ten lines: two 1,000-day P&L
          histories that agree on 990 benign days <Term>and</Term> on the day that sets the 99%
          quantile, but whose ten worst days differ by a factor of six.
        </P>
        <DataTable
          head={["Synthetic book", "99% VaR", "99% CVaR", "Worst day"]}
          rows={[
            ["A — thin tail", pc(d.blind.varA), pc(d.blind.cvarA), "−2.60%"],
            ["B — fat tail", pc(d.blind.varB), pc(d.blind.cvarB), "−15.00%"],
          ]}
        />
        <P>
          Identical VaR, {(d.blind.cvarB / d.blind.cvarA).toFixed(1)}× the expected tail loss.
          CVaR — the <Term>mean</Term> loss conditional on breaching the VaR quantile — separates
          the two books instantly, because it integrates over the tail instead of reading one
          point of it.
        </P>
        <Callout kind="Why practitioners care">
          Basel's Fundamental Review of the Trading Book (FRTB) replaced 99% VaR with 97.5%
          expected shortfall as the capital measure for trading desks — precisely because VaR
          ignores tail severity and can punish diversification. The 97.5% level was chosen so
          that, for a normal distribution, ES roughly matches the old 99% VaR — but unlike VaR
          it keeps paying attention when the tail turns out fatter than normal.
        </Callout>
      </Section>

      <Section id="data" n={2} title="Two fat-tailed assets">
        <P>
          HYG (iShares high-yield corporate bond ETF) and VWO (Vanguard emerging-markets equity)
          are chosen deliberately: EM equity is honestly volatile, while credit is the classic
          smile-now-cry-later asset — a {pc1(H.annVol)} annualised vol that looks safer than
          VWO's {pc1(V.annVol)}, wrapped around a worst day of {pc(H.worstDay)}. The aligned
          sample runs {d.params.start} (HYG's listing) to {d.params.end}. A Student-t fitted to
          HYG's daily returns lands at ν ≈ {H.nu} degrees of freedom — below 2, which means the
          fitted distribution does not possess a finite variance at all. Read that as a
          diagnostic as much as an estimate: an unconditional iid fit has nowhere to put 2008's
          volatility clustering except the tail parameter, so it buys realism at the extremes by
          overstating how wild a <Term>typical</Term> day is. (Condition on a GARCH filter and
          the residual df comes out higher; the unconditional fit is the honest worst case.)
        </P>
        <Figure
          caption={`HYG daily returns 2007 → 2024 with fitted Student-t (ν = ${H.nu}) — VaR marks the door, CVaR the room behind it`}
          legend={[
            { label: "Student-t fit", tone: "aqua" },
            { label: "daily returns", tone: "muted" },
          ]}
        >
          <Histogram
            ariaLabel="Sharply peaked histogram of HYG daily returns with a Student-t curve overlaid; dashed vertical lines mark the 99 percent VaR and the further-left 99 percent CVaR."
            binEdges={d.hist.edges as unknown as number[]}
            counts={d.hist.counts as unknown as number[]}
            overlay={{ name: "tOverlay", y: d.hist.tOverlay as unknown as number[] }}
            xFmt={{ percent: true, decimals: 0 }}
            vLines={[
              { v: d.hist.var99, label: "99% VaR", color: "rust" },
              { v: d.hist.cvar99, label: "99% CVaR", color: "amber" },
            ]}
          />
        </Figure>
        <P>
          The horizontal gap between the two dashed lines — {pc(H.var99)} to {pc(H.cvar99)} — is
          everything VaR does not price. For HYG that gap is {H.ratio99}× the VaR itself, the
          widest of the three books we measure.
        </P>
      </Section>

      <Section id="estimate" n={3} title="Historical and Student-t estimates">
        <P>
          The historical estimator reads the empirical distribution directly: sort, take the
          quantile, average beyond it. The parametric route fits a Student-t and uses{" "}
          <Term>Acerbi's closed-form expected shortfall</Term> — the analytic mean of the t's
          tail — which extrapolates severity even past the worst observed day:
        </P>
        <CodeBlock
          file="estimators.py"
          code={`def var_hist(x, a):
    return -np.quantile(x, 1 - a)

def cvar_hist(x, a):
    q = np.quantile(x, 1 - a)
    return -x[x <= q].mean()

def cvar_t(params, a):                    # Acerbi & Tasche closed form
    nu, loc, scale = params
    p = 1 - a
    xp = stats.t.ppf(p, nu)
    return -loc + scale * stats.t.pdf(xp, nu) * (nu + xp**2) / ((nu - 1) * p)`}
        />
        <DataTable
          head={["HYG estimate", "97.5%", "99%"]}
          rows={[
            ["Historical VaR", pc(H.var975), pc(H.var99)],
            ["Historical CVaR", pc(H.cvar975), pc(H.cvar99)],
            [`Student-t VaR (ν = ${H.nu})`, pc(H.var975t), pc(H.var99t)],
            ["Student-t CVaR (Acerbi)", pc(H.cvar975t), pc(H.cvar99t)],
          ]}
        />
        <P>
          Note the FRTB calibration at work: HYG's 97.5% CVaR ({pc(H.cvar975)}) sits close to its
          99% VaR ({pc(H.var99)}) — similar magnitude, but the CVaR number keeps growing when the
          tail does. The t-parametric CVaR ({pc(H.cvar99t)}) exceeds the historical one because
          with ν ≈ {H.nu} the fitted tail expects days worse than any yet observed. One caveat
          belongs next to every number in this table: at 99% the historical CVaR is the mean of
          just {Math.round(d.params.nObs * 0.01)} observations. The estimator with the best
          theoretical properties is also the one standing on the fewest data points — which is
          the practical argument for fitting a parametric tail and letting it extrapolate, rather
          than trusting {Math.round(d.params.nObs * 0.01)} draws to have already shown you the
          worst.
        </P>
        <Figure
          caption="99% VaR vs 99% CVaR, historical — per asset and for the daily-rebalanced 50/50"
          legend={[
            { label: "99% VaR", tone: "aqua" },
            { label: "99% CVaR", tone: "muted" },
          ]}
        >
          <Bar
            ariaLabel="Grouped bar chart: for HYG, VWO and the 50/50 portfolio, the CVaR bar is roughly one and a half times the VaR bar."
            labels={["HYG", "VWO", "50/50"]}
            series={[
              { name: "99% VaR", values: [H.var99, V.var99, Pt.var99] },
              { name: "99% CVaR", values: [H.cvar99, V.cvar99, Pt.cvar99] },
            ]}
            yFmt={{ percent: true, decimals: 0 }}
          />
        </Figure>
        <DataTable
          head={["Asset", "Ann. vol", "99% VaR", "99% CVaR", "CVaR/VaR", "Worst day"]}
          rows={[
            ["HYG", pc1(H.annVol), pc(H.var99), pc(H.cvar99), `${H.ratio99}×`, `${pc(H.worstDay)} (${H.worstDate})`],
            ["VWO", pc1(V.annVol), pc(V.var99), pc(V.cvar99), `${V.ratio99}×`, `${pc(V.worstDay)} (${V.worstDate})`],
            ["50/50", pc1(Pt.annVol), pc(Pt.var99), pc(Pt.cvar99), `${Pt.ratio99}×`, `${pc(Pt.worstDay)} (${Pt.worstDate})`],
          ]}
        />
        <P>
          Read the first and fifth columns together. HYG's volatility is well under half of
          VWO's, yet its CVaR/VaR ratio of {H.ratio99}× is the <Term>highest</Term> in the table
          — credit's deceptively quiet variance hides the most disproportionate tail. Any tool
          that ranks these assets by σ alone has the risk ordering half wrong.
        </P>
      </Section>

      <Section id="coherence" n={4} title="Subadditivity — the coherence test">
        <P>
          Artzner, Delbaen, Eber and Heath (1999) axiomatised what a risk measure should do; the
          axiom VaR fails is <Term>subadditivity</Term>: ρ(A+B) ≤ ρ(A) + ρ(B), i.e.
          diversification must never create risk. The classic counterexample needs only two
          independent bonds, each defaulting with probability 0.7%. Held alone, each has{" "}
          <Term>zero</Term> 99% VaR — a 0.7% loss probability hides entirely below the 1%
          threshold. A 50/50 mix loses on {pc1(d.sub.bondMixP)} of scenarios, which is above 1% —
          so the diversified book has strictly <Term>positive</Term> 99% VaR. Diversifying
          "created" risk, says VaR.
        </P>
        <P>
          It is not just a parlour trick. On the full HYG/VWO sample the 50/50 portfolio behaves
          — 99% VaR of {pc(d.sub.var99Port)} against a weighted blend of {pc(d.sub.var99Blend)}.
          But scan calendar-year subsamples across confidence levels and historical VaR breaks
          subadditivity {d.sub.nViolations} times; the worst case is {viol.year} at α ={" "}
          {pc1(viol.alpha)}, where the portfolio's VaR of {pc(viol.port)} exceeds the blend's{" "}
          {pc(viol.blend)}. CVaR, by construction — Rockafellar & Uryasev's convex formulation
          makes this explicit — never violates: {pc(d.sub.cvar99Port)} for the portfolio versus{" "}
          {pc(d.sub.cvar99Blend)} for the blend at 99%, and it passes at every year and level
          where VaR fails.
        </P>
        <Callout>
          Subadditivity is what makes a risk measure <Term>aggregable</Term>: desk CVaRs can be
          summed into a conservative firm-wide bound, and CVaR limits can be pushed through a
          convex optimiser. Neither is true of VaR — a VaR-constrained optimisation is
          non-convex and can reward concentration.
        </Callout>
      </Section>

      <Section id="gfc" n={5} title="The GFC, seen from the tail">
        <P>
          HYG's full-sample 99% VaR is {pc(H.var99)}. Now watch the crisis ignore it: from
          September 2008 through March 2009, HYG breached that threshold on {d.gfc.exceed99} of{" "}
          {d.gfc.crisisDays} trading days — a 1% tail arriving at {d.gfc.exceed99}× its expected
          frequency of ~{d.gfc.expected99} days. The worst prints came fast: {pc(d.gfc.worst[0].r)}{" "}
          on {d.gfc.worst[0].d}, {pc(d.gfc.worst[1].r)} on {d.gfc.worst[1].d},{" "}
          {pc(d.gfc.worst[2].r)} on {d.gfc.worst[2].d} — every one of them multiples of the VaR
          line, in an ETF marketed as a bond fund.
        </P>
        <Figure
          caption={`HYG cumulative return, ${d.params.start} → 2010 — the GFC drawdown that a ${pc(H.var99)} VaR never described`}
          legend={[{ label: "HYG growth of $1", tone: "aqua" }]}
        >
          <Line
            ariaLabel="Line chart of HYG cumulative return 2007 to 2010: roughly flat, collapsing about a third below its start into early 2009, then recovering by 2010."
            series={[{ name: "HYG cumulative", y: d.gfc.y as unknown as number[], area: true }]}
            xLabels={d.gfc.xLabels as unknown as [number, string][]}
            hLines={[{ v: 1, color: "graphite", label: "start" }]}
            yFmt={{ decimals: 2 }}
          />
        </Figure>
        <P>
          At the trough a dollar invested at HYG's listing was worth ${d.gfc.trough.toFixed(2)}.
          VaR answered "how often?" — and even that answer failed under regime change. CVaR at
          least asks the question that mattered in 2008: <Term>how bad is it when it happens?</Term>
        </P>
      </Section>

      <Section id="optimize" n={6} title="Spending a tail budget: CVaR vs MV">
        <P>
          With two assets, pure min-risk is degenerate here — volatility and tail agree that HYG
          is the quieter asset, and both <InlineCode>rm=&quot;MV&quot;</InlineCode> and{" "}
          <InlineCode>rm=&quot;CVaR&quot;</InlineCode> corner at 100% HYG. The measures diverge
          the moment you <Term>spend a risk budget</Term>. Hand two desks the same mandate — an
          expected loss on the worst 1% of days of at most {pcAxis(d.rf.budget)} — and let each
          maximise return against it. The MV desk translates the budget into a volatility cap
          via normality (ES₉₉ = 2.665σ for a Gaussian, so σ ≤ {pc(d.rf.sigBudget)} daily); the
          CVaR desk constrains the realised tail directly:
        </P>
        <CodeBlock
          file="riskfolio_budget.py"
          code={`import riskfolio as rp

p_mv = rp.Portfolio(returns=rets[["HYG", "VWO"]])
p_mv.assets_stats(method_mu="hist", method_cov="hist")
p_mv.upperdev = ${d.rf.sigBudget}                    # 4% ES budget, normal-translated
w_mv = p_mv.optimization(model="Classic", rm="MV", obj="MaxRet", hist=True)

p_cv = rp.Portfolio(returns=rets[["HYG", "VWO"]])
p_cv.assets_stats(method_mu="hist", method_cov="hist")
p_cv.alpha = 0.01
p_cv.upperCVaR = ${d.rf.budget}                      # the tail budget itself
w_cv = p_cv.optimization(model="Classic", rm="CVaR", obj="MaxRet", hist=True)`}
        />
        <DataTable
          head={["Desk", "HYG", "VWO", "Ann. return", "Ann. vol", "Realised 99% CVaR"]}
          rows={[
            ["MV (vol-translated budget)", pc1(d.rf.mv.HYG), pc1(d.rf.mv.VWO), pc1(d.rf.mv.annRet), pc1(d.rf.mv.annVol), `${pc(d.rf.mv.cvar99)} — budget was ${pcAxis(d.rf.budget)}`],
            ["CVaR (direct)", pc1(d.rf.cvar.HYG), pc1(d.rf.cvar.VWO), pc1(d.rf.cvar.annRet), pc1(d.rf.cvar.annVol), pc(d.rf.cvar.cvar99)],
          ]}
        />
        <P>
          Same stated risk appetite, radically different books: {pc1(d.rf.mv.VWO)} VWO through
          the variance lens versus {pc1(d.rf.cvar.VWO)} through the CVaR lens. Because both
          assets' tails are fatter than the Gaussian used in the translation, the MV desk's
          realised 99% CVaR of {pc(d.rf.mv.cvar99)} overshoots its own {pcAxis(d.rf.budget)}{" "}
          mandate by roughly {Math.round((d.rf.mv.cvar99 / d.rf.budget - 1) * 100)}% — the tail
          it was told to cap is exactly what its risk measure could not see.
        </P>
        <Callout kind="Practitioner take">
          Use CVaR where the loss distribution is asymmetric or fat-tailed — credit, options,
          carry, anything with a "smile now, cry later" profile. HYG is the canonical trap: its
          vol whispers safety while its CVaR/VaR ratio of {H.ratio99}× shouts the opposite.
          Practically: quote 97.5% ES next to any 99% VaR (FRTB's own calibration), fit a
          Student-t rather than trusting the empirical tail alone when ν comes out below ~4, and
          put the CVaR constraint <Term>inside</Term> the optimiser — Rockafellar–Uryasev makes
          it a linear program, so there is no computational excuse. The one honest cost of the
          switch: ES is harder to <Term>backtest</Term> than VaR. A quantile is directly
          falsifiable by counting breaches; an expected shortfall is not elicitable on its own,
          only jointly with its VaR — which is why desk validation (Acerbi–Székely) and FRTB's
          own backtesting still run on VaR exceptions at two confidence levels, even though the
          capital number is ES.
        </Callout>
      </Section>

      <References
        items={[
          "Artzner, P., Delbaen, F., Eber, J.-M. & Heath, D. (1999). Coherent Measures of Risk. Mathematical Finance 9(3), 203–228.",
          "Acerbi, C. & Tasche, D. (2002). On the coherence of expected shortfall. Journal of Banking & Finance 26(7), 1487–1503.",
          "Rockafellar, R.T. & Uryasev, S. (2000). Optimization of Conditional Value-at-Risk. Journal of Risk 2(3), 21–41.",
          "Acerbi, C. & Székely, B. (2014). Back-testing Expected Shortfall. Risk Magazine, December 2014.",
          "Basel Committee on Banking Supervision (2019). Minimum capital requirements for market risk (FRTB). Bank for International Settlements.",
          <span key="nb">Companion notebook: <InlineCode>cvar-expected-shortfall.ipynb</InlineCode> — reproduces every figure from raw data (fully deterministic; no simulation).</span>,
        ]}
      />
    </>
  );
}
