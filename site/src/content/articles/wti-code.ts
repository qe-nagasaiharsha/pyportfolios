/* WTI (Figure 4.1) code — verbatim from the T1_Brownian_Motion notebook, cell In[4]. */
export const WTI_CODE = `# ── Figure 4.1: WTI Crude Oil GBM ─────────────────────────────────────────────
S0, mu, sigma = 80.0, 0.05, 0.35
T, N = 1.0, 252
dt = T / N
t_days = np.arange(N + 1)
n_paths = 200

dW    = rng.normal(0, np.sqrt(dt), (n_paths, N))
log_r = (mu - 0.5 * sigma**2) * dt + sigma * dW
S     = S0 * np.exp(np.hstack([np.zeros((n_paths, 1)), np.cumsum(log_r, axis=1)]))
all_log_returns = log_r.flatten()

fig, axes = plt.subplots(1, 3, figsize=(16, 5))
fig.suptitle(
    f'Figure 4.1 — WTI Crude Oil: GBM Simulation  '
    f'($S_0={S0}$, $\\\\sigma={sigma}$, daily $1\\\\sigma \\\\approx {sigma/np.sqrt(252)*100:.1f}\\\\%$)',
    fontsize=12, color='white')

# Panel 1: price paths
ax = axes[0]
for i in range(n_paths):
    ax.plot(t_days, S[i], lw=0.4, alpha=0.18, color=C[0])
ax.plot(t_days, np.median(S, axis=0),          color=C[1], lw=2.5, label='Median path')
ax.plot(t_days, np.percentile(S, 10, axis=0),  color='white', lw=1.2, ls='--', alpha=0.7)
ax.plot(t_days, np.percentile(S, 90, axis=0),  color='white', lw=1.2, ls='--', alpha=0.7,
        label='10th / 90th pctile')
ax.fill_between(t_days, np.percentile(S, 10, axis=0), np.percentile(S, 90, axis=0),
                alpha=0.07, color=C[0])
ax.axhline(S0, color=C[3], lw=1, ls=':', label=f'$S_0 = {S0}$')
# mark the 1-sigma band at 1 year
one_sig_up   = S0 * np.exp((mu - 0.5*sigma**2)*T + sigma*np.sqrt(T))
one_sig_down = S0 * np.exp((mu - 0.5*sigma**2)*T - sigma*np.sqrt(T))
ax.annotate(f'\${one_sig_up:.0f}\\n(+1$\\\\sigma$)', xy=(252, one_sig_up),
            xytext=(220, one_sig_up+3), color='#a0a0a0', fontsize=7)
ax.annotate(f'\${one_sig_down:.0f}\\n(-1$\\\\sigma$)', xy=(252, one_sig_down),
            xytext=(220, one_sig_down-8), color='#a0a0a0', fontsize=7)
ax.set_title('200 GBM price paths\\nFan widens as $\\\\sqrt{t}$ (Brownian variance)', color='white')
ax.set_xlabel('Trading Day')
ax.set_ylabel('WTI Price (\\$/bbl)')
ax.legend(fontsize=8)

# Panel 2: log-return histogram
ax = axes[1]
ax.hist(all_log_returns, bins=80, density=True, color=C[0], alpha=0.7, label='Simulated log-returns')
x   = np.linspace(all_log_returns.min(), all_log_returns.max(), 400)
mu_d, sd_d = (mu - 0.5*sigma**2)*dt, sigma*np.sqrt(dt)
ax.plot(x, norm.pdf(x, mu_d, sd_d), color=C[1], lw=2.5,
        label=f'$\\\\mathcal{{N}}$(mean={mu_d:.4f}, $\\\\sigma$={sd_d:.4f})')
ax.axvline(0, color='white', lw=0.6, ls=':', alpha=0.5)
ax.axvline( 2*sd_d, color=C[2], lw=1, ls='--', alpha=0.7, label='±2σ daily')
ax.axvline(-2*sd_d, color=C[2], lw=1, ls='--', alpha=0.7)
ax.set_title('Daily log-returns are Gaussian\\n'
             r'$\\ln(S_{t+1}/S_t) \\sim \\mathcal{N}(\\mu\\,dt,\\;\\sigma^2 dt)$', color='white')
ax.set_xlabel('Daily log-return')
ax.set_ylabel('Density')
ax.legend(fontsize=8)

# Panel 3: Q-Q plot
ax = axes[2]
sample = rng.choice(all_log_returns, 2000, replace=False)
(osm, osr), (slope, intercept, r) = probplot(sample, dist='norm', fit=True)
ax.scatter(osm, osr, s=4, alpha=0.35, color=C[0], label='Simulated returns')
line_x = np.array([osm.min(), osm.max()])
ax.plot(line_x, slope*line_x + intercept, color=C[1], lw=2,
        label=f'Normal fit ($R^2={r**2:.4f}$)')
# show where real data would diverge
ax.annotate('Real CL data\\ndiverges here\\n(fat tails)', xy=(2.8, osr[-3]),
            xytext=(1.3, osr[-8]), color=C[1], fontsize=7.5,
            arrowprops=dict(arrowstyle='->', color=C[1], lw=0.9))
ax.set_title('Q-Q Plot — Normality Check\\nPoints off the line = fat tails in real data', color='white')
ax.set_xlabel('Theoretical quantiles')
ax.set_ylabel('Sample quantiles')
ax.legend(fontsize=8)

plt.tight_layout()
plt.savefig('bm_fig3_wti.png', dpi=150, bbox_inches='tight')
plt.show()

print('WTI GBM terminal price stats (day 252):')
print(f'  Mean:     \${np.mean(S[:,-1]):.2f}   (theory: \${S0*np.exp(mu*T):.2f})')
print(f'  Median:   \${np.median(S[:,-1]):.2f}  (theory: \${S0*np.exp((mu-0.5*sigma**2)*T):.2f})')
print(f'  10th pct: \${np.percentile(S[:,-1],10):.2f}')
print(f'  90th pct: \${np.percentile(S[:,-1],90):.2f}')
print(f'  Daily 1σ: {sigma/np.sqrt(252)*100:.2f}%  (= {sigma*100:.0f}% / √252)')`;
