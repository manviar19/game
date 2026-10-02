document.addEventListener('DOMContentLoaded', () => {
    let trafficChart;
    
    // Initialize Chart.js Chart
    const ctx = document.getElementById('trafficChart').getContext('2d');
    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Requests / sec',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3
                },
                {
                    label: 'Latency (ms)',
                    data: [],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.05)',
                    borderWidth: 2,
                    borderDash: [4, 4],
                    fill: false,
                    tension: 0.35,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { size: 11 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#64748b', font: { size: 10 } },
                    grid: { color: 'rgba(51, 65, 85, 0.3)' }
                },
                y: {
                    ticks: { color: '#64748b', font: { size: 10 } },
                    grid: { color: 'rgba(51, 65, 85, 0.3)' },
                    beginAtZero: true
                }
            }
        }
    });

    // Helper: format uptime
    function formatUptime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Fetch Health
    async function fetchHealth() {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            
            document.getElementById('uptime-counter').textContent = formatUptime(data.uptimeSeconds);
            document.getElementById('stat-memory').textContent = data.system.memoryUsagePercent;
            document.getElementById('memory-bar').style.width = data.system.memoryUsagePercent;

            const dbPill = document.getElementById('db-status-text');
            if (data.database.connected) {
                dbPill.textContent = "MongoDB Connected";
                dbPill.className = "text-emerald-400 font-medium";
            } else {
                dbPill.textContent = "Standalone Mode";
                dbPill.className = "text-amber-400 font-medium";
            }
        } catch (e) {
            console.error("Health fetch error", e);
        }
    }

    // Fetch Metrics
    async function fetchMetrics() {
        try {
            const res = await fetch('/api/metrics');
            const data = await res.json();

            document.getElementById('stat-requests').textContent = data.summary.totalRequests.toLocaleString();
            document.getElementById('stat-latency').textContent = `${data.summary.avgLatencyMs} ms`;
            document.getElementById('stat-error-rate').textContent = `${data.summary.errorRatePct}%`;

            // Update chart labels and data
            const labels = data.trafficHistory.map(item => item.time);
            const reqData = data.trafficHistory.map(item => item.requests);
            const latData = data.trafficHistory.map(item => item.latency);

            trafficChart.data.labels = labels;
            trafficChart.data.datasets[0].data = reqData;
            trafficChart.data.datasets[1].data = latData;
            trafficChart.update('none');
        } catch (e) {
            console.error("Metrics fetch error", e);
        }
    }

    // Fetch Microservices
    async function fetchServices() {
        try {
            const res = await fetch('/api/services');
            const services = await res.json();

            const container = document.getElementById('services-list');
            container.innerHTML = services.map(s => {
                const isHealthy = s.status === 'HEALTHY';
                const statusBadgeClass = isHealthy 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                
                return `
                    <div class="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                        <div class="flex items-center space-x-3">
                            <div class="w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}"></div>
                            <div>
                                <h4 class="text-xs font-semibold text-slate-200">${s.name}</h4>
                                <p class="text-[10px] text-slate-500 font-mono">Port: ${s.port} • Uptime: ${s.uptime}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] font-semibold px-2 py-0.5 rounded border ${statusBadgeClass}">${s.status}</span>
                            <div class="text-[10px] text-slate-400 font-mono mt-0.5">${s.responseTime}</div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error("Services fetch error", e);
        }
    }

    // Fetch Logs
    async function fetchLogs() {
        try {
            const res = await fetch('/api/logs');
            const logs = await res.json();

            document.getElementById('logs-count').textContent = `${logs.length} logs recorded`;

            const tbody = document.getElementById('logs-tbody');
            tbody.innerHTML = logs.map(l => {
                let levelBadgeClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
                if (l.level === 'WARN') levelBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                if (l.level === 'ERROR') levelBadgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

                let statusColor = 'text-emerald-400';
                if (l.status >= 400) statusColor = 'text-amber-400';
                if (l.status >= 500) statusColor = 'text-rose-400';

                const timeStr = new Date(l.timestamp).toLocaleTimeString();

                return `
                    <tr class="hover:bg-slate-800/40 transition">
                        <td class="p-2.5 text-slate-400">${timeStr}</td>
                        <td class="p-2.5"><span class="px-1.5 py-0.5 rounded text-[10px] border ${levelBadgeClass}">${l.level}</span></td>
                        <td class="p-2.5 text-slate-200">${l.method} ${l.endpoint}</td>
                        <td class="p-2.5 font-bold ${statusColor}">${l.status}</td>
                        <td class="p-2.5 text-slate-400">${l.responseTimeMs} ms</td>
                    </tr>
                `;
            }).join('');
        } catch (e) {
            console.error("Logs fetch error", e);
        }
    }

    // Traffic Simulator Form
    const simRange = document.getElementById('sim-count');
    const simCountVal = document.getElementById('sim-count-val');
    simRange.addEventListener('input', (e) => {
        simCountVal.textContent = `${e.target.value} requests`;
    });

    const trafficForm = document.getElementById('trafficForm');
    trafficForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const endpoint = document.getElementById('sim-endpoint').value;
        const count = simRange.value;

        const feedbackEl = document.getElementById('sim-feedback');
        feedbackEl.classList.remove('hidden');
        feedbackEl.textContent = 'Dispatching traffic requests...';

        try {
            const res = await fetch('/api/simulate-traffic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint, count })
            });
            const data = await res.json();
            feedbackEl.textContent = data.message;
            feedbackEl.className = "mt-4 p-3 bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs";
            
            // Refresh logs & metrics immediately
            fetchLogs();
            fetchMetrics();
        } catch (err) {
            feedbackEl.textContent = 'Error dispatching requests';
            feedbackEl.className = "mt-4 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl text-xs";
        }
    });

    // Initial Load & Intervals
    fetchHealth();
    fetchMetrics();
    fetchServices();
    fetchLogs();

    setInterval(fetchHealth, 3000);
    setInterval(fetchMetrics, 3000);
    setInterval(fetchLogs, 4000);
});
