import { Section, SubSection, Lead, P, Bullets, CodeBlock, DataTable, Figure, Formula } from "@/components/article/prose";
import { LOAD_CODE, PRIOR_CODE, VIEW_CODE, OPT_CODE, NOVIEW_CODE } from "./bl-code";

/* eslint-disable @next/next/no-img-element */
export default function BlackLitterman() {
  return (
    <>
      <Lead>
        Plain mean-variance optimization has a dirty secret: feed it your historical-average returns
        and it hands back wild, concentrated, unstable portfolios (see the{" "}
        <a href="/research/mvo-efficient-frontier">previous tutorial</a>). Fischer Black and Robert
        Litterman&apos;s 1990 fix at Goldman Sachs was elegant — <b>start from the portfolio the
        market is already holding</b>, then tilt it only where you have a genuine view. The result is
        stable, intuitive weights that collapse back to the market when you stay quiet.
      </Lead>

      <Section id="summary" n={1} title="Summary">
        <P>
          Black-Litterman treats the <b>market-cap portfolio</b> as a rational starting point and
          works <em>backwards</em> to infer the expected returns that would justify it — the
          &ldquo;implied equilibrium returns&rdquo;. You then express views (&ldquo;German equities
          will outperform Japanese by 3%&rdquo;) with a confidence level, and the model{" "}
          <b>Bayesian-blends</b> your views with the equilibrium prior. Feed the blended returns into
          a standard optimizer and you get sensible weights that tilt toward your views in proportion
          to your confidence — and revert to the market when you have none.
        </P>
      </Section>

      <Section id="intuition" n={2} title="Intuition">
        <SubSection label="2.1" title="The market already did the optimization">
          <P>
            If everyone holds the market-cap portfolio, then — under CAPM — that portfolio is already
            mean-variance efficient for <em>some</em> set of expected returns.{" "}
            <b>Reverse optimization</b> recovers those returns from the observed market weights and
            covariance. This is the prior: not a guess, but the crowd&apos;s collective bet.
          </P>
        </SubSection>

        <SubSection label="2.2" title="Views as evidence, not commandments">
          <P>
            Rather than overwriting returns, you state a view and a <b>confidence</b>. A
            low-confidence view nudges the portfolio slightly; a high-confidence view moves it a lot.
            The math is Bayesian updating: prior (market) + likelihood (your view) → posterior
            (blended returns).
          </P>
        </SubSection>

        <SubSection label="2.3" title="Why the weights behave">
          <P>
            Because you start from the market and tilt, the output never explodes into the
            200%-long/150%-short monsters raw MVO produces. No view on an asset? Its weight stays at
            the market weight. This single property is why Black-Litterman is the allocation
            workhorse of real money managers.
          </P>
        </SubSection>
      </Section>

      <Section id="mechanics" n={3} title="Theory & Mechanics">
        <P>
          <b>Step 1 — implied equilibrium returns</b> from market weights{" "}
          <Formula>{String.raw`w_{mkt}`}</Formula> and covariance{" "}
          <Formula>{String.raw`\Sigma`}</Formula>:
        </P>
        <Formula block>{String.raw`\Pi = \delta\, \Sigma\, w_{mkt}`}</Formula>
        <P>
          where <Formula>{String.raw`\delta`}</Formula> is the market risk-aversion coefficient.
        </P>
        <P>
          <b>Step 2 — the views</b>, encoded as{" "}
          <Formula>{String.raw`P\,\mu = Q + \varepsilon`}</Formula>, with{" "}
          <Formula>{String.raw`P`}</Formula> picking the assets, <Formula>{String.raw`Q`}</Formula>{" "}
          the view magnitudes, and <Formula>{String.raw`\Omega`}</Formula> the view uncertainty.
        </P>
        <P><b>Step 3 — the Black-Litterman posterior returns:</b></P>
        <Formula block>{String.raw`\mu_{BL} = \Big[(\tau\Sigma)^{-1} + P^\top\Omega^{-1}P\Big]^{-1}\Big[(\tau\Sigma)^{-1}\Pi + P^\top\Omega^{-1}Q\Big]`}</Formula>
        <P>
          <Formula>{String.raw`\tau`}</Formula> scales the uncertainty of the prior. We&apos;ll let{" "}
          <b>PyPortfolioOpt</b> handle the linear algebra and focus on what goes in and what comes
          out.
        </P>
      </Section>

      <Section id="example" n={4} title="Applied Example — Five Country ETFs">
        <SubSection label="4.1" title="A global equity universe">
          <P>
            Five developed markets via iShares MSCI country ETFs — the natural setting for
            Black-Litterman, where &ldquo;views&rdquo; are macro calls on countries:
          </P>
          <DataTable
            variant="prose"
            head={["Ticker", "Country"]}
            rows={[
              ["EWJ", "Japan"],
              ["EWG", "Germany"],
              ["EWU", "United Kingdom"],
              ["EWA", "Australia"],
              ["EWC", "Canada"],
            ]}
          />
          <CodeBlock code={LOAD_CODE} />
        </SubSection>

        <SubSection label="4.2" title="Market weights and implied equilibrium returns">
          <P>
            Black-Litterman needs market-cap weights as the prior. Ideally these come from each
            market&apos;s investable cap; here we use approximate relative market sizes as a stand-in
            (in production you&apos;d pull real market caps). From these weights we reverse-engineer
            the returns that justify them.
          </P>
          <CodeBlock code={PRIOR_CODE} />
          <DataTable
            head={["Market", "Market weight", "Implied return"]}
            rows={[
              ["EWJ (Japan)", "37.7%", "6.6%"],
              ["EWG (Germany)", "15.7%", "8.2%"],
              ["EWU (UK)", "18.9%", "7.6%"],
              ["EWA (Australia)", "10.1%", "8.8%"],
              ["EWC (Canada)", "17.6%", "7.3%"],
            ]}
          />
          <P>
            Read the implied returns as &ldquo;what the crowd must believe&rdquo;: higher-beta
            markets (Australia) need higher expected returns to justify their market weight.
          </P>
        </SubSection>

        <SubSection label="4.3" title="Express a view">
          <P>
            Our macro call: <b>Germany (EWG) will return 10% annually</b> — versus an implied 8.2% —
            and we&apos;re <b>moderately confident</b> (50%, via Idzorek&apos;s method). The model
            figures out the full portfolio implications on its own.
          </P>
          <CodeBlock code={VIEW_CODE} />
          <DataTable
            head={["Market", "Implied (prior)", "Posterior (with view)"]}
            rows={[
              ["EWJ (Japan)", "6.6%", "7.1%"],
              ["EWG (Germany)", "8.2%", "9.1%"],
              ["EWU (UK)", "7.6%", "8.3%"],
              ["EWA (Australia)", "8.8%", "9.6%"],
              ["EWC (Canada)", "7.3%", "8.0%"],
            ]}
          />
          <Figure caption="Figure 4.3 · One view on Germany moves every posterior — via correlation">
            <img src="/figures/bl-returns.png" alt="Dumbbell chart of implied prior versus Black-Litterman posterior expected returns for the five country ETFs; Germany moves most, from 8.2% to 9.1%, but every other market's posterior also shifts up because the markets are correlated" className="w-full rounded-sm" />
          </Figure>
          <P>
            Only EWG had a view — but every posterior moved, because the markets are correlated. A
            bullish call on Germany is implicitly (weaker) good news for everything that co-moves
            with Germany.
          </P>
        </SubSection>

        <SubSection label="4.4" title="Optimize on the blended returns">
          <P>
            Feed the posterior returns into a max-Sharpe optimizer and compare the Black-Litterman
            weights against both the market prior and what naive MVO on historical means would have
            produced.
          </P>
          <CodeBlock code={OPT_CODE} />
          <DataTable
            head={["Market", "Market prior", "Black-Litterman", "Naive MVO"]}
            rows={[
              ["Japan", "37.7%", "20.5%", "74.8%"],
              ["Germany", "15.7%", "35.6%", "0.0%"],
              ["UK", "18.9%", "10.8%", "0.0%"],
              ["Australia", "10.1%", "25.7%", "0.0%"],
              ["Canada", "17.6%", "7.4%", "25.2%"],
            ]}
          />
          <Figure caption="Figure 4.4 · Allocations — market prior vs Black-Litterman vs naive MVO">
            <img src="/figures/bl-weights.png" alt="Grouped bar chart comparing three allocations across the five countries; naive MVO concentrates 75% in Japan and zeros out three markets, while Black-Litterman stays spread out and tilts toward Germany where the view was expressed" className="w-full rounded-sm" />
          </Figure>
          <P>
            The story in one chart: <b>naive MVO</b> lurches to extremes — 74.8% in Japan (the
            decade&apos;s backtest winner) and <em>zero</em> in three of five markets — while{" "}
            <b>Black-Litterman</b> holds every market and tilts sensibly toward Germany (15.7% →
            35.6%) where we expressed our view. That stability is the whole point.
          </P>
        </SubSection>

        <SubSection label="4.5" title="Sanity check: no views → back to the market">
          <P>
            The definitive test. With <em>no</em> views, the Black-Litterman posterior must equal the
            implied prior, and the optimized weights must return to market weights. Our run gives a
            maximum posterior-minus-prior difference of exactly <b>0.0</b> — the model is genuinely
            neutral by default.
          </P>
          <CodeBlock code={NOVIEW_CODE} />
        </SubSection>
      </Section>

      <Section id="conclusion" n={5} title="Conclusion">
        <SubSection label="5a" title="Strengths">
          <Bullets
            items={[
              <><b>Stable, intuitive weights</b> — no more 200%-long/150%-short monsters from raw MVO</>,
              <><b>Neutral by default</b> — with no views, you hold the market; tilts scale with confidence</>,
              <><b>Combines art and science</b> — a formal channel for a manager&apos;s macro views inside a rigorous framework</>,
              <><b>Partial views work</b> — a view on one asset sensibly adjusts the whole portfolio via correlations</>,
            ]}
          />
        </SubSection>

        <SubSection label="5b" title="Weaknesses & Limitations">
          <Bullets
            items={[
              <><b>Needs market-cap weights</b> — the prior is only as good as your market-weight and covariance inputs</>,
              <><b>τ and Ω are fiddly</b> — the uncertainty parameters have no universal setting and affect the outcome</>,
              <><b>Still mean-variance underneath</b> — inherits variance&apos;s blindness to tail risk</>,
              <><b>Views are yours to get right</b> — the model propagates a wrong view as faithfully as a right one</>,
            ]}
          />
        </SubSection>

        <SubSection label="5c" title="Applications in Practice">
          <Bullets
            items={[
              "The allocation engine at real asset managers, precisely because the weights are usable as-is",
              "Turning a research team's country/sector calls into a coherent portfolio",
              "Tactical tilts around a strategic (market) benchmark",
            ]}
          />
        </SubSection>

        <SubSection label="5d" title="Alternatives & Extensions">
          <Bullets
            items={[
              <><b>Idzorek&apos;s confidence method</b> — specify view confidence as an intuitive 0–100% instead of an abstract Ω (used above)</>,
              <><b>Risk parity</b> — skips return estimation entirely (the <a href="/research/risk-parity-futures">next tutorial</a>)</>,
              <><b>Entropy pooling (Meucci)</b> — a more general way to impose views, including on higher moments</>,
              <><b>Mean-variance optimization</b> — the raw method Black-Litterman was invented to tame (the <a href="/research/mvo-efficient-frontier">previous tutorial</a>)</>,
            ]}
          />
        </SubSection>
      </Section>
    </>
  );
}
