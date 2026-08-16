import { Section, Lead, P, InlineCode, Formula, Term, Callout, CodeBlock, DataTable, Figure, References, Pipeline } from "@/components/article/prose";
import { Scatter } from "@/components/charts/echarts/Scatter";
import d from "./data/copulas-tail-dependence";
import { Bar } from "@/components/charts/echarts/Bar";
import { Heatmap } from "@/components/charts/echarts/Heatmap";

/* T11 / topic card 11-16 — all figures below render REAL computed results
   (^GSPC, ^FTSE, ^N225 weekly returns, Jan 2000 – Dec 2024) baked in by
   quant/tutorials/t11_copulas.py. */

const pc = (v: number, nd = 1) => `${(v * 100).toFixed(nd)}%`;

export default function CopulasTailDependence() {
  return (
    <>
      <Lead>
        A correlation matrix is a photograph of dependence taken in calm weather. The question
        risk managers actually get paid to answer — <Term>if the S&amp;P has one of its worst
        weeks, what happens to London and Tokyo?</Term> — lives in the corner of the joint
        distribution, where a single number cannot see. Copulas separate what each market does
        on its own from how they move together, and once you make that split on 25 years of
        real index data, the verdict is blunt: the Gaussian copula says joint crashes are
        vanishingly rare; the data says they cluster; and a Student-t copula with{" "}
        {d.params.dfHat} degrees of freedom repairs most of the damage.
      </Lead>

      <Pipeline
        steps={[
          "Weekly log returns for ^GSPC, ^FTSE, ^N225, 2000–2024 (holiday-aligned)",
          "Pearson vs Spearman vs Kendall — three answers to 'how correlated?'",
          "Rank-transform to pseudo-observations on the unit square",
          "Fit Gaussian and Student-t copulas (df by MLE over a 2–30 grid)",
          "Measure empirical tail dependence & conditional crash probabilities",
        ]}
      />

      <Section id="dependence" n={1} title="Dependence is not correlation">
        <P>
          The sample is {d.params.nWeeks.toLocaleString()} aligned weekly returns for the
          S&amp;P 500, FTSE 100 and Nikkei 225, {d.params.start} to {d.params.end} — dot-com
          bust, 2008, the euro crisis, COVID and the 2022 rates shock all included. Two
          alignment problems come free with global indices. Each exchange keeps its own holiday
          calendar, so returns are computed jointly and rows with a missing market dropped. And
          the markets do not even trade at the same time: Tokyo's 15:00 JST close lands roughly
          ten hours before London's and some fifteen before New York's, so a same-calendar-day Nikkei
          close <Term>leads</Term> the US close and daily cross-market correlations are
          structurally understated. Resampling to weekly (Friday-to-Friday) returns absorbs
          most of that offset — the SPX–Nikkei Pearson correlation jumps from{" "}
          <InlineCode>{d.params.dailyPearsonSpxNky.toFixed(2)}</InlineCode> on daily data to{" "}
          <InlineCode>{d.params.weeklyPearsonSpxNky.toFixed(2)}</InlineCode> on weekly.
        </P>
        <P>
          Even then, &ldquo;the correlation&rdquo; is three different numbers. Pearson measures
          linear co-movement and is hostage to outliers; Spearman and Kendall are rank-based,
          so they see only the ordering — exactly the part a copula models. Kendall&rsquo;s τ
          has the cleanest interpretation: the probability that two randomly chosen weeks agree
          in direction, minus the probability they disagree.
        </P>
        <Figure
          caption={`Kendall's τ, weekly returns ${d.params.start.slice(0, 4)}–${d.params.end.slice(0, 4)}`}
          legend={[{ label: "rank correlation", tone: "aqua" }]}
        >
          <Heatmap
            ariaLabel="Three-by-three Kendall tau matrix: SPX-FTSE 0.54, SPX-NKY 0.37, FTSE-NKY 0.35, ones on the diagonal."
            rows={d.corr.labels as unknown as string[]}
            cols={d.corr.labels as unknown as string[]}
            values={d.corr.kendall as unknown as number[][]}
            min={0}
            max={1}
            height={240}
          />
        </Figure>
        <Callout kind="Why practitioners care">
          Every multi-asset stress scenario is implicitly a statement about joint tails. If your
          scenario engine assumes a dependence structure with no tail clustering, diversification
          will look better on paper than it behaves in a crisis — precisely when you are counting
          on it.
        </Callout>
      </Section>

      <Section id="sklar" n={2} title="Sklar's theorem & pseudo-observations">
        <P>
          Sklar&rsquo;s theorem (1959) says any joint distribution factors into its marginals
          plus a <Term>copula</Term> — a joint distribution on the unit square with uniform
          margins that carries all of the dependence and none of the marginal shape. To see the
          copula empirically, replace each return by its normalised rank,{" "}
          <Formula>{String.raw`u = \frac{\operatorname{rank}(x)}{n + 1}`}</Formula> — the probability integral transform
          done with the empirical CDF. Margins become uniform by construction, so any structure
          that survives is pure dependence.
        </P>
        <CodeBlock
          file="pseudo_obs.py"
          code={`from scipy import stats

def pseudo_obs(x):                       # rank / probability integral transform
    return stats.rankdata(x) / (len(x) + 1)

U = pd.DataFrame({c: pseudo_obs(ret[c].values) for c in ret.columns})`}
        />
        <Figure
          caption="Pseudo-observations, SPX vs FTSE — 400 of 1,302 weeks"
          legend={[{ label: "one point = one week", tone: "muted" }]}
        >
          <Scatter
            ariaLabel="Scatter of rank-transformed SPX versus FTSE weekly returns on the unit square, with visible clustering in the lower-left and upper-right corners."
            height={300}
            xName="u = F(SPX weekly return)"
            yName="v = F(FTSE)"
            xFmt={{ decimals: 2 }}
            yFmt={{ decimals: 2 }}
            xLines={[0.05]}
            yLines={[0.05]}
            series={[{ name: "one week", points: d.pseudo.pts as unknown as [number, number][], color: "teal", size: 5, opacity: 0.45 }]}
          />
        </Figure>
        <P>
          If the two markets were independent this square would be filled uniformly. Instead the
          mass drains toward the diagonal — and, critically, <Term>piles up in the corners</Term>.
          The lower-left corner is the object of study for the rest of this article: weeks in
          which both markets were simultaneously in their worst tail.
        </P>
      </Section>

      <Section id="gaussian" n={3} title="The Gaussian copula — elegant, and wrong in the corner">
        <P>
          The Gaussian copula is what you implicitly assume whenever you summarise joint
          behaviour with a correlation matrix alone. Fitting it is one line: push the
          pseudo-observations through the standard normal quantile function
          (&ldquo;normal scores&rdquo;) and take their correlation — for SPX–FTSE that gives{" "}
          <Formula>{`\\rho = ${d.pairs[0].rhoGauss.toFixed(2)}`}</Formula>. It is analytically
          convenient, scales to any dimension, and has one fatal property:{" "}
          <Term>zero tail dependence</Term>. For any ρ &lt; 1, the probability that both
          markets sit below their q-quantile, divided by q, goes to zero as q shrinks. In the
          limit, joint crashes are not just rare — they are assumed away.
        </P>
        <P>
          You can watch the assumption fail at finite depth. At the 10% level the fitted
          Gaussian copula implies a joint-crash ratio of {pc(d.pairs[0].gauss10)} for SPX–FTSE;
          at 5% it has slipped to {pc(d.tail.gauss.q05[0])}; at 1% it is down to{" "}
          {pc(d.tail.gauss.q01[0])}, on its way to zero. The empirical series goes the other
          way: {pc(d.tail.empirical.q10[0])} at 10%, {pc(d.tail.empirical.q05[0])} at 5%,{" "}
          {pc(d.tail.empirical.q01[0])} at 1%. The deeper you look into the tail, the more the
          data diverges from the model — in the direction that hurts.
        </P>
        <Callout kind="The cautionary tale">
          David Li&rsquo;s 2000 paper &ldquo;On Default Correlation: A Copula Function
          Approach&rdquo; put the Gaussian copula at the centre of CDO pricing, and for a few
          years a single correlation number priced trillions in structured credit. The formula
          did exactly what it says here: it made simultaneous defaults look almost impossible at
          depth. 2008 was, among other things, the empirical tail-dependence estimate arriving.
        </Callout>
      </Section>

      <Section id="t-copula" n={4} title="The t copula & tail dependence">
        <P>
          The Student-t copula adds exactly one parameter — the degrees of freedom ν — and that
          single knob buys tail dependence. We set ρ by Kendall&rsquo;s τ inversion,{" "}
          <Formula>{String.raw`\rho = \sin\!\left(\tfrac{\pi\tau}{2}\right)`}</Formula>, which is exact for elliptical copulas, and
          profile the exact copula log-likelihood over a ν grid from {d.params.dfGridLo} to{" "}
          {d.params.dfGridHi} on the SPX–FTSE pair:
        </P>
        <CodeBlock
          file="fit_t_copula.py"
          code={`rho  = np.sin(np.pi * tau / 2)                  # tau inversion: ${d.pairs[0].rhoT.toFixed(3)}
grid = np.arange(2.0, 30.5, 0.5)
ll   = np.array([t_copula_loglik(u, v, rho, df) for df in grid])
df_hat = grid[ll.argmax()]                      # -> ${d.params.dfHat}

# lower-tail dependence, closed form (Demarta & McNeil 2005)
lam = 2 * stats.t.cdf(-np.sqrt((df_hat+1)*(1-rho)/(1+rho)), df=df_hat+1)`}
        />
        <P>
          The likelihood picks <Formula>{`\\nu = ${d.params.dfHat}`}</Formula> — heavy joint
          tails — and prefers the t copula decisively: log-likelihood{" "}
          {d.params.llT.toFixed(1)} against the Gaussian&rsquo;s {d.params.llGauss.toFixed(1)}{" "}
          on the same pseudo-observations, one extra parameter. Unlike the Gaussian, the t
          copula&rsquo;s tail dependence does not vanish: it converges to the closed-form λ
          above, which at ν = {d.params.dfHat} gives {pc(d.pairs[0].lambdaT)} for SPX–FTSE,{" "}
          {pc(d.pairs[1].lambdaT)} for SPX–NKY and {pc(d.pairs[2].lambdaT)} for FTSE–NKY.
        </P>
        <Figure
          caption="Joint-crash ratio P(both < 5% quantile) / 5% — data vs models"
          legend={[
            { label: "empirical", tone: "aqua" },
            { label: "Gaussian at 5% · t copula λ", tone: "muted" },
          ]}
        >
          <Bar
            ariaLabel="Grouped bars for three index pairs comparing empirical tail dependence at the 5 percent level with Gaussian-implied and t-copula values; empirical bars are highest, Gaussian lowest."
            labels={d.tail.pairs as unknown as string[]}
            series={[
              { name: "empirical", values: d.tail.empirical.q05 as unknown as number[], color: "teal" },
              { name: "Gaussian copula", values: d.tail.gauss.q05 as unknown as number[], color: "graphite" },
              { name: "t-copula", values: d.tail.tLambda as unknown as number[], color: "amber" },
            ]}
            yFmt={{ percent: true, decimals: 0 }}
          />
        </Figure>
        <P>
          Read the teal-vs-graphite gap per pair: the Gaussian copula, fitted to the{" "}
          <Term>same data</Term> with the <Term>same correlation</Term>, undershoots the observed
          5% joint-crash ratio for every pair — and remember its bar keeps falling as q shrinks
          while the empirical one rises. The amber bar is the t copula&rsquo;s limiting λ: a
          floor that does not decay, sitting close to what the data shows.
        </P>
      </Section>

      <Section id="crashes" n={5} title="Conditional crash probabilities">
        <P>
          The same mathematics, phrased the way a risk committee asks it: given that one market
          has a worst-decile week, what is the probability the other one does too? Under
          independence the answer would be 10%. The data answers between{" "}
          {pc(d.pairs[2].condCrash)} and {pc(d.pairs[0].condCrash)}:
        </P>
        <DataTable
          head={["Pair", "Kendall tau", "Rho (t copula)", "P(both worst-decile | one is)", "Gaussian @10%", "t copula lambda-L (nu = " + String(d.params.dfHat) + ")"]}
          rows={d.pairs.map((p) => [
            p.pair,
            p.tau.toFixed(2),
            p.rhoT.toFixed(2),
            `${pc(p.condCrash)}  (${p.nBoth}/${p.nCond})`,
            pc(p.gauss10),
            pc(p.lambdaT),
          ])}
        />
        <P>
          A worst-decile S&amp;P week drags the FTSE into its own worst decile more than half
          the time — {p0Frac(d.pairs[0].nBoth, d.pairs[0].nCond)} of the {d.pairs[0].nCond}{" "}
          conditioning weeks — and even the geographically and temporally distant Nikkei follows{" "}
          {pc(d.pairs[1].condCrash)} of the time. Note the ordering in every row:
          empirical ≥ t copula λ &gt; Gaussian-at-depth. The single-parameter fix gets you most,
          not all, of the way — the residual gap is the asymmetry between crash and boom
          corners that symmetric elliptical copulas cannot express.
        </P>
      </Section>

      <Section id="practitioner" n={6} title="The practitioner take">
        <P>
          For multi-asset stress testing, the workflow this tutorial rehearses is the one that
          survives contact with a crisis. Model marginals separately — fat tails, volatility
          clustering, whatever each series needs — then choose the dependence structure as a
          deliberate act, not as a side effect of writing down a correlation matrix. Check any
          candidate copula against the empirical joint-crash ratios at several depths before
          trusting it, and when in doubt between Gaussian and t, the t copula&rsquo;s extra
          parameter is the cheapest tail insurance in the toolbox: here it turned
          &ldquo;joint crashes become impossible&rdquo; into λ ≈ {pc(d.pairs[0].lambdaT, 0)} for
          the closest pair. And know where this road ends: the t copula is elliptical, so it
          buys its lower-tail dependence bundled with an identical upper tail — it must price
          joint booms as generously as joint crashes. When the residual crash/boom asymmetry in
          the data matters, the next tools up are the asymmetric Archimedean families (Clayton
          glues lower tails only) and vine constructions, which assemble a high-dimensional
          copula from freely chosen pairs.
        </P>
        <Callout kind="Practitioner take">
          Correlation tells you how markets dance; the copula tells you how they die. Simulate
          scenarios from a fitted t copula (ν = {d.params.dfHat} here) rather than a Gaussian
          one and your stress engine will generate the co-crashing weeks that actually populate
          the historical record — 130 worst-decile S&amp;P weeks in this sample, the majority of
          them shared with London.
        </Callout>
      </Section>

      <References
        items={[
          "Sklar, A. (1959). Fonctions de répartition à n dimensions et leurs marges. Publications de l'Institut de Statistique de l'Université de Paris, 8, 229–231.",
          "Embrechts, P., McNeil, A. & Straumann, D. (2002). Correlation and dependence in risk management: properties and pitfalls. In Risk Management: Value at Risk and Beyond, Cambridge University Press.",
          "Demarta, S. & McNeil, A. J. (2005). The t copula and related copulas. International Statistical Review, 73(1), 111–129.",
          "Aas, K., Czado, C., Frigessi, A. & Bakken, H. (2009). Pair-copula constructions of multiple dependence. Insurance: Mathematics and Economics, 44(2), 182–198.",
          "Li, D. X. (2000). On default correlation: a copula function approach. Journal of Fixed Income, 9(4), 43–54.",
          <span key="nb">Companion notebook: <InlineCode>copulas-tail-dependence.ipynb</InlineCode> — reproduces every figure from raw data (seed {String(d.params.seed)}).</span>,
        ]}
      />
    </>
  );
}

/** "72 of 130" style fraction for prose. */
function p0Frac(a: number, b: number) {
  return `${a} of ${b}`;
}
