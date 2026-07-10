/* The three structural signatures — ax4/ax5/ax6 from the T1_Brownian_Motion
   notebook (Figure 3.1), trimmed into a standalone 3-panel snippet. */
export const SIGNATURES_CODE = String.raw`# Three signatures: independent increments, self-similarity, no derivative
T, N = 1.0, 2000
dt = T / N
t  = np.linspace(0, T, N + 1)

fig, (ax4, ax5, ax6) = plt.subplots(1, 3, figsize=(16, 5))

# ── Independent increments — two non-overlapping increments are uncorrelated
n_pts = 5000
dW_all = rng.normal(0, np.sqrt(dt), (n_pts, N))
W_all  = np.hstack([np.zeros((n_pts, 1)), np.cumsum(dW_all, axis=1)])
inc1 = W_all[:, 250] - W_all[:, 0]
inc2 = W_all[:, 500] - W_all[:, 250]
ax4.scatter(inc1, inc2, s=1, alpha=0.12, color=C[0], rasterized=True)
corr = np.corrcoef(inc1, inc2)[0, 1]
ax4.text(0.04, 0.93, f'Corr = {corr:.3f}  (≈ 0)', transform=ax4.transAxes, color=C[3], fontsize=9)
ax4.set_title('Independent increments', color='white')
ax4.set_xlabel('$W_{0.125} - W_0$'); ax4.set_ylabel('$W_{0.25} - W_{0.125}$')

# ── Self-similar zoom — 1% of the path, with a 0.2% inset, looks equally rough
dW_fine = rng.normal(0, np.sqrt(dt), N)
W_fine  = np.concatenate([[0], np.cumsum(dW_fine)])
mask  = (t >= 0.30) & (t <= 0.31)
mask2 = (t >= 0.300) & (t <= 0.302)
ax5.plot(t[mask], W_fine[mask], color=C[1], lw=1.5)
ax5_in = ax5.inset_axes([0.55, 0.05, 0.43, 0.43])
ax5_in.plot(t[mask2], W_fine[mask2], color=C[2], lw=1.2)
ax5_in.set_xticks([]); ax5_in.set_yticks([])
ax5.indicate_inset_zoom(ax5_in, edgecolor=C[2])
ax5.set_title('Self-similar at every scale', color='white')
ax5.set_xlabel('Time (zoom: 1% of $[0,1]$)'); ax5.set_ylabel('$W_t$')

# ── No derivative — the difference quotient diverges as the step h shrinks
h_vals = np.logspace(-1, -4, 60)
avg_q  = [np.mean(np.abs((W_fine[max(1, int(h/dt)):] - W_fine[:-max(1, int(h/dt))]) / h))
          for h in h_vals]
ax6.loglog(h_vals, avg_q, color=C[0], lw=2, label='$\\langle|\\Delta W/h|\\rangle$')
ax6.loglog(h_vals, 1 / np.sqrt(h_vals), 'w--', lw=1.8, label='$1/\\sqrt{h}$ (theory)')
ax6.invert_xaxis()
ax6.set_title('No derivative: slope $\\to \\infty$', color='white')
ax6.set_xlabel('Step $h$ (decreasing)'); ax6.set_ylabel('$|\\Delta W/h|$')
ax6.legend(fontsize=8)

plt.tight_layout()
plt.show()`;
