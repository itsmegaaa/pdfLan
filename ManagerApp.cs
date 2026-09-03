using System;
using System.Drawing;
using System.Windows.Forms;
using System.Diagnostics;
using System.Net;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace PDFVaultManager
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form
    {
        // Server Control tab
        private Button btnStart, btnStop, btnRestart;
        private Label lblStatusTitle, lblStatus;
        private TextBox txtLogs;
        private System.Windows.Forms.Timer statusTimer;

        // Dashboard tab
        private Label lblUptime, lblRam, lblStorage, lblTransaksi, lblSuccessRate;
        private ProgressBar pbRam;
        private Panel pnlBinaries;
        private DataGridView dgvActivity;
        private Label lblDashError, lblLastRefresh;
        private Button btnDashRefresh, btnCleanup, btnResetStats;
        private CheckBox chkAutoRefresh;
        private System.Windows.Forms.Timer dashTimer;

        
        private const string API_BASE = "http://localhost:3000/api/admin";

        public MainForm()
        {
            InitializeComponent();
            CheckStatus();
            RefreshDashboard();
        }

        private void InitializeComponent()
        {
            this.Text = "PDFVault Manager";
            this.Size = new Size(840, 600);
            this.MinimumSize = new Size(720, 500);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Font = new Font("Segoe UI", 9f);
            this.BackColor = Color.FromArgb(20, 22, 35);
            this.ForeColor = Color.FromArgb(200, 205, 230);

            var tabs = new TabControl { Dock = DockStyle.Fill, Font = new Font("Segoe UI", 9.5f, FontStyle.Bold) };
            this.Controls.Add(tabs);
            tabs.TabPages.Add(BuildServerTab());
            tabs.TabPages.Add(BuildDashboardTab());

            statusTimer = new System.Windows.Forms.Timer { Interval = 5000 };
            statusTimer.Tick += (s, e) => CheckStatus();
            statusTimer.Start();

            dashTimer = new System.Windows.Forms.Timer { Interval = 10000 };
            dashTimer.Tick += (s, e) => RefreshDashboard();
        }

        // â”€â”€ TAB 1: Server Control â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        private TabPage BuildServerTab()
        {
            var page = new TabPage("  Server Control  ") { BackColor = Color.FromArgb(20, 22, 35) };
            var left = new Panel { Size = new Size(200, 400), Location = new Point(12, 12) };
            page.Controls.Add(left);

            btnStart   = MakeBtn("Start Server",   0,  Color.FromArgb(30, 140, 60));
            btnStop    = MakeBtn("Stop Server",    50, Color.FromArgb(160, 30, 30));
            btnRestart = MakeBtn("Restart Server", 100, Color.FromArgb(40, 80, 160));
            btnStart.Click   += (s, e) => RunAction("pm2 start backend/index.js --name pdfvault-server", "Menjalankan server...");
            btnStop.Click    += (s, e) => RunAction("pm2 stop pdfvault-server", "Menghentikan server...");
            btnRestart.Click += (s, e) => RunAction("pm2 restart pdfvault-server --update-env", "Merestart server...");
            left.Controls.AddRange(new Control[] { btnStart, btnStop, btnRestart });

            lblStatusTitle = new Label { Text = "Status Server:", Location = new Point(0, 162), Size = new Size(190, 20), ForeColor = Color.FromArgb(120, 130, 160) };
            lblStatus = new Label { Text = "MENGECEK...", Location = new Point(0, 185), Size = new Size(190, 34), Font = new Font("Segoe UI", 15, FontStyle.Bold), ForeColor = Color.Gray };
            left.Controls.AddRange(new Control[] { lblStatusTitle, lblStatus });

            var btnOpen = new Button { Text = "Buka di Browser", Location = new Point(0, 240), Size = new Size(190, 36), FlatStyle = FlatStyle.Flat, ForeColor = Color.FromArgb(140, 180, 255) };
            btnOpen.FlatAppearance.BorderColor = Color.FromArgb(40, 80, 160);
            btnOpen.Click += (s, e) => Process.Start(new ProcessStartInfo("http://localhost:3000") { UseShellExecute = true });
            left.Controls.Add(btnOpen);

            var right = new Panel { Location = new Point(225, 12), Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right, Size = new Size(580, 490) };
            page.Controls.Add(right);
            new Label { Text = "Log Output", Location = new Point(0, 0), Size = new Size(200, 18), ForeColor = Color.FromArgb(100, 110, 150), Parent = right };
            txtLogs = new TextBox { Multiline = true, ReadOnly = true, ScrollBars = ScrollBars.Vertical, WordWrap = false, Font = new Font("Consolas", 8.5f), BackColor = Color.FromArgb(12, 14, 22), ForeColor = Color.FromArgb(180, 220, 180), Location = new Point(0, 20), Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right, Size = new Size(576, 465) };
            right.Controls.Add(txtLogs);
            return page;
        }

        // â”€â”€ TAB 2: Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        private TabPage BuildDashboardTab()
        {
            var page = new TabPage("  Dashboard  ") { BackColor = Color.FromArgb(20, 22, 35), AutoScroll = true };
            int y = 14;

            // Header
            new Label { Text = "Server & Activity Dashboard", Location = new Point(14, y), Size = new Size(500, 28), Font = new Font("Segoe UI", 14, FontStyle.Bold), ForeColor = Color.White, Parent = page };

            btnDashRefresh = new Button { Text = "Refresh", Location = new Point(560, y + 2), Size = new Size(80, 26), FlatStyle = FlatStyle.Flat, ForeColor = Color.White, Font = new Font("Segoe UI", 8.5f) };
            btnDashRefresh.FlatAppearance.BorderColor = Color.FromArgb(50, 60, 90);
            btnDashRefresh.Click += (s, e) => RefreshDashboard();
            page.Controls.Add(btnDashRefresh);

            chkAutoRefresh = new CheckBox { Text = "Auto (10s)", Location = new Point(650, y + 4), Size = new Size(110, 20), Checked = true, ForeColor = Color.FromArgb(80, 210, 130), Parent = page };
            chkAutoRefresh.CheckedChanged += (s, e) => { if (dashTimer == null) return; if (chkAutoRefresh.Checked) dashTimer.Start(); else dashTimer.Stop(); };
            if (dashTimer != null) dashTimer.Start();

            lblLastRefresh = new Label { Text = "", Location = new Point(14, y + 32), Size = new Size(500, 16), ForeColor = Color.FromArgb(80, 90, 120), Font = new Font("Segoe UI", 8f), Parent = page };
            y += 56;

            // Error banner
            lblDashError = new Label { Text = "", Location = new Point(14, y), Size = new Size(760, 0), ForeColor = Color.FromArgb(255, 100, 100), BackColor = Color.FromArgb(55, 20, 20), Visible = false, Font = new Font("Segoe UI", 8.5f), Padding = new Padding(6), Parent = page };

            // KPI row
            var kpi = new TableLayoutPanel { Location = new Point(14, y), Size = new Size(764, 78), ColumnCount = 4, RowCount = 1, CellBorderStyle = TableLayoutPanelCellBorderStyle.None };
            for (int i = 0; i < 4; i++) kpi.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25));
            page.Controls.Add(kpi);
            lblUptime    = KpiCard(kpi, "UPTIME SERVER",     "...", 0);
            lblRam       = KpiCard(kpi, "RAM SISTEM",        "...", 1);
            lblStorage   = KpiCard(kpi, "TEMP STORAGE",      "...", 2);
            lblTransaksi = KpiCard(kpi, "TOTAL TRANSAKSI",   "...", 3);
            y += 86;

            pbRam = new ProgressBar { Location = new Point(14, y), Size = new Size(764, 6), Style = ProgressBarStyle.Continuous, Minimum = 0, Maximum = 100 };
            page.Controls.Add(pbRam);
            y += 12;

            lblSuccessRate = new Label { Text = "", Location = new Point(14, y), Size = new Size(764, 18), ForeColor = Color.FromArgb(80, 210, 130), Font = new Font("Segoe UI", 8f), Parent = page };
            y += 24;

            // Binary status
            SectionLabel(page, "Status Mesin Biner & Konversi", ref y);
            pnlBinaries = new Panel { Location = new Point(14, y), Size = new Size(764, 62), BackColor = Color.FromArgb(26, 29, 42), Parent = page };
            y += 70;

            // Action buttons
            btnCleanup = new Button { Text = "Bersihkan Cache", Location = new Point(14, y), Size = new Size(150, 30), FlatStyle = FlatStyle.Flat, ForeColor = Color.FromArgb(255, 100, 100) };
            btnCleanup.FlatAppearance.BorderColor = Color.FromArgb(120, 40, 40);
            btnCleanup.Click += (s, e) => DoCleanup();
            page.Controls.Add(btnCleanup);

            btnResetStats = new Button { Text = "Reset Statistik", Location = new Point(172, y), Size = new Size(140, 30), FlatStyle = FlatStyle.Flat, ForeColor = Color.FromArgb(140, 160, 220) };
            btnResetStats.FlatAppearance.BorderColor = Color.FromArgb(50, 60, 120);
            btnResetStats.Click += (s, e) => DoResetStats();
            page.Controls.Add(btnResetStats);
            y += 40;

            // Activity table
            SectionLabel(page, "Aktivitas Terakhir (20 transaksi terakhir)", ref y);
            dgvActivity = new DataGridView
            {
                Location = new Point(14, y), Size = new Size(764, 220),
                ReadOnly = true, AllowUserToAddRows = false, AllowUserToResizeRows = false,
                BackgroundColor = Color.FromArgb(22, 25, 38), GridColor = Color.FromArgb(40, 45, 65),
                BorderStyle = BorderStyle.None, RowHeadersVisible = false,
                SelectionMode = DataGridViewSelectionMode.FullRowSelect,
                Font = new Font("Consolas", 8.5f), AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
            };
            dgvActivity.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(30, 34, 52);
            dgvActivity.ColumnHeadersDefaultCellStyle.ForeColor = Color.FromArgb(120, 130, 170);
            dgvActivity.DefaultCellStyle.BackColor = Color.FromArgb(22, 25, 38);
            dgvActivity.DefaultCellStyle.ForeColor = Color.FromArgb(200, 205, 230);
            dgvActivity.DefaultCellStyle.SelectionBackColor = Color.FromArgb(40, 50, 90);
            dgvActivity.Columns.Add(new DataGridViewTextBoxColumn { Name = "Waktu",  HeaderText = "Waktu",       FillWeight = 14 });
            dgvActivity.Columns.Add(new DataGridViewTextBoxColumn { Name = "Tool",   HeaderText = "Tool",        FillWeight = 32 });
            dgvActivity.Columns.Add(new DataGridViewTextBoxColumn { Name = "Status", HeaderText = "Status",      FillWeight = 12 });
            dgvActivity.Columns.Add(new DataGridViewTextBoxColumn { Name = "Durasi", HeaderText = "Durasi",      FillWeight = 14 });
            dgvActivity.Columns.Add(new DataGridViewTextBoxColumn { Name = "Ukuran", HeaderText = "Ukuran File", FillWeight = 18 });
            page.Controls.Add(dgvActivity);

            return page;
        }

        private void RefreshDashboard()
        {
            Task.Run(() =>
            {
                try
                {
                    using (var wc = new WebClient())
                    {
                        var json = wc.DownloadString(API_BASE + "/stats");
                        this.Invoke(new Action(() => RenderDashboard(json)));
                    }
                }
                catch (Exception ex)
                {
                    try { this.Invoke(new Action(() => ShowDashError("Tidak dapat terhubung ke server: " + ex.Message))); } catch { }
                }
            });
        }

        private void RenderDashboard(string json)
        {
            HideDashError();
            lblLastRefresh.Text = "Terakhir diperbarui: " + DateTime.Now.ToString("HH:mm:ss");
            lblUptime.Text    = FormatUptime(ParseLong(json, "uptimeSeconds"));
            double ramPct = ParseDouble(json, "usagePercent");
            lblRam.Text       = ramPct.ToString("0.0") + "% Terpakai";
            pbRam.Value       = Math.Min(100, (int)ramPct);
            lblStorage.Text   = FormatBytes(ParseLong(json, "totalTempSizeBytes"));
            long total = ParseLong(json, "totalRequests");
            lblTransaksi.Text = total + " Dokumen";
            lblSuccessRate.Text = string.Format("Node.js RSS: {0:0.0} MB  |  File temp: {1}  |  Success Rate: {2}%",
                ParseDouble(json, "rssMb"), ParseLong(json, "totalTempFilesCount"), ParseDouble(json, "successRate"));
            RenderBinaries(json);
            RenderActivity(json);
        }

        private void RenderBinaries(string json)
        {
            pnlBinaries.Controls.Clear();
            string[] keys   = { "libreOffice", "ghostscript", "qpdf", "poppler", "chromium" };
            string[] labels = { "LibreOffice", "Ghostscript", "QPDF", "Poppler", "Chromium" };
            for (int i = 0; i < keys.Length; i++)
            {
                bool ok  = ParseBool(json, keys[i], "available");
                string v = ParseStr(json, keys[i], ok ? "version" : "error") ?? (ok ? "OK" : "Not found");
                if (v != null && v.Length > 20) v = v.Substring(0, 20) + "â€¦";
                var card = new Panel { Location = new Point(8 + i * 150, 8), Size = new Size(142, 46), BackColor = Color.FromArgb(30, 33, 50) };
                card.Controls.Add(new Label { Text = labels[i], Location = new Point(8, 4), Size = new Size(126, 16), Font = new Font("Segoe UI", 8f, FontStyle.Bold), ForeColor = Color.White });
                card.Controls.Add(new Label { Text = ok ? "READY" : "MISSING", Location = new Point(8, 22), Size = new Size(60, 16), Font = new Font("Segoe UI", 7.5f, FontStyle.Bold), ForeColor = ok ? Color.FromArgb(60, 220, 120) : Color.FromArgb(255, 80, 80) });
                card.Controls.Add(new Label { Text = v, Location = new Point(72, 24), Size = new Size(64, 14), Font = new Font("Consolas", 6.5f), ForeColor = Color.FromArgb(100, 110, 140) });
                pnlBinaries.Controls.Add(card);
            }
        }

        private void RenderActivity(string json)
        {
            dgvActivity.Rows.Clear();
            int a = json.IndexOf("\"recentActivity\""); if (a < 0) return;
            int s = json.IndexOf('[', a), e = json.IndexOf(']', s); if (s < 0 || e < 0) return;
            foreach (var item in Regex.Split(json.Substring(s + 1, e - s - 1), @"\},\s*\{"))
            {
                bool ok  = ParseBoolFlat(item, "success");
                long dur = ParseLongFlat(item, "durationMs");
                long fsz = ParseLongFlat(item, "fileSize");
                int row = dgvActivity.Rows.Add(
                    TryParseTime(ParseStrFlat(item, "timestamp")),
                    (ParseStrFlat(item, "toolId") ?? "").Replace("-", " "),
                    ok ? "Berhasil" : "Gagal",
                    dur > 1000 ? (dur / 1000.0).ToString("0.0") + "s" : dur + "ms",
                    fsz > 0 ? FormatBytes(fsz) : "-");
                dgvActivity.Rows[row].DefaultCellStyle.ForeColor = ok ? Color.FromArgb(80, 210, 130) : Color.FromArgb(255, 100, 100);
            }
        }

        private void DoCleanup()
        {
            if (MessageBox.Show("Hapus semua file sementara?", "Konfirmasi", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
            btnCleanup.Enabled = false;
            Task.Run(() =>
            {
                try
                {
                    using (var wc = new WebClient())
                    {
                        var b = wc.UploadString(API_BASE + "/cleanup", "POST", "");
                        this.Invoke(new Action(() => {
                            MessageBox.Show(ParseStrFlat(b, "message") ?? "Selesai.", "Cache Dibersihkan", MessageBoxButtons.OK, MessageBoxIcon.Information);
                            RefreshDashboard();
                        }));
                    }
                }
                catch (Exception ex) { this.Invoke(new Action(() => MessageBox.Show("Gagal: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error))); }
                finally { this.Invoke(new Action(() => btnCleanup.Enabled = true)); }
            });
        }

        private void DoResetStats()
        {
            if (MessageBox.Show("Reset semua statistik ke nol?", "Konfirmasi", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
            Task.Run(() =>
            {
                try
                {
                    using (var wc = new WebClient())
                    {
                        wc.UploadString(API_BASE + "/reset-stats", "POST", "");
                        this.Invoke(new Action(() => {
                            MessageBox.Show("Statistik direset.", "Reset", MessageBoxButtons.OK, MessageBoxIcon.Information);
                            RefreshDashboard();
                        }));
                    }
                }
                catch (Exception ex) { this.Invoke(new Action(() => MessageBox.Show("Gagal: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error))); }
            });
        }

        // â”€â”€ Server Control helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        private void Log(string msg) { if (this.InvokeRequired) { this.Invoke(new Action<string>(Log), msg); return; } txtLogs.AppendText("[" + DateTime.Now.ToString("HH:mm:ss") + "] " + msg + "\r\n"); }

        private void RunAction(string cmd, string startMsg)
        {
            Log(startMsg); btnStart.Enabled = btnStop.Enabled = btnRestart.Enabled = false;
            Task.Run(() =>
            {
                var lines = Exec(cmd).Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                var clean = new System.Collections.Generic.List<string>();
                foreach (var l in lines) if (!l.StartsWith("â”Œ") && !l.StartsWith("â”‚") && !l.StartsWith("â”œ") && !l.StartsWith("â””")) clean.Add(l);
                Log(clean.Count == 0 ? "Selesai." : string.Join("\r\n", clean).Trim());
                this.Invoke(new Action(() => { btnStart.Enabled = btnStop.Enabled = btnRestart.Enabled = true; CheckStatus(); }));
            });
        }

        private void CheckStatus()
        {
            Task.Run(() =>
            {
                string o = Exec("pm2 jlist");
                this.Invoke(new Action(() =>
                {
                    int idx = o.IndexOf("\"name\":\"pdfvault-server\"");
                    if (idx >= 0)
                    {
                        int statIdx = o.IndexOf("\"status\":\"", idx);
                        if (statIdx > 0)
                        {
                            int endQuote = o.IndexOf("\"", statIdx + 10);
                            string stat = o.Substring(statIdx + 10, endQuote - (statIdx + 10));
                            bool on = (stat == "online");
                            lblStatus.Text = on ? "ONLINE" : "OFFLINE";
                            lblStatus.ForeColor = on ? Color.FromArgb(60, 210, 100) : Color.FromArgb(220, 60, 60);
                        }
                    }
                    else
                    {
                        lblStatus.Text = "STOPPED";
                        lblStatus.ForeColor = Color.FromArgb(220, 60, 60);
                    }
                }));
            });
        }

        private string Exec(string command)
        {
            try
            {
                var psi = new ProcessStartInfo("cmd.exe", "/c " + command) { WindowStyle = ProcessWindowStyle.Hidden, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true, StandardOutputEncoding = System.Text.Encoding.UTF8, StandardErrorEncoding = System.Text.Encoding.UTF8, UseShellExecute = false };
                using (var p = Process.Start(psi)) { string o = p.StandardOutput.ReadToEnd(), e2 = p.StandardError.ReadToEnd(); p.WaitForExit(); return string.IsNullOrWhiteSpace(o) ? e2 : o; }
            }
            catch (Exception ex) { return "Error: " + ex.Message; }
        }

        // â”€â”€ UI Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        private Button MakeBtn(string text, int y, Color accent) { var b = new Button { Text = text, Location = new Point(0, y), Size = new Size(190, 42), FlatStyle = FlatStyle.Flat, ForeColor = Color.White, Font = new Font("Segoe UI", 9.5f, FontStyle.Bold) }; b.FlatAppearance.BorderColor = accent; b.FlatAppearance.MouseOverBackColor = Color.FromArgb(accent.R / 3, accent.G / 3, accent.B / 3); return b; }
        private Label KpiCard(TableLayoutPanel t, string title, string val, int col) { var c = new Panel { BackColor = Color.FromArgb(26, 29, 42), Margin = new Padding(3), Dock = DockStyle.Fill }; c.Controls.Add(new Label { Text = title, Location = new Point(10, 8), Size = new Size(160, 14), Font = new Font("Segoe UI", 7f), ForeColor = Color.FromArgb(100, 110, 150) }); var v = new Label { Text = val, Location = new Point(10, 24), Size = new Size(160, 26), Font = new Font("Segoe UI", 12, FontStyle.Bold), ForeColor = Color.White }; c.Controls.Add(v); t.Controls.Add(c, col, 0); return v; }
        private void SectionLabel(Control p, string text, ref int y) { p.Controls.Add(new Label { Text = text, Location = new Point(14, y), Size = new Size(764, 20), Font = new Font("Segoe UI", 9f, FontStyle.Bold), ForeColor = Color.FromArgb(160, 170, 220) }); y += 24; }
        private void ShowDashError(string msg) { lblDashError.Text = "Peringatan: " + msg; lblDashError.Size = new Size(760, 28); lblDashError.Visible = true; }
        private void HideDashError() { lblDashError.Visible = false; lblDashError.Size = new Size(760, 0); }

        // â”€â”€ Minimal JSON Parser (no external deps) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        private long   ParseLong(string j, string k)   { var m = Regex.Match(j, "\"" + k + "\"\\s*:\\s*([0-9.]+)"); return m.Success ? (long)double.Parse(m.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture) : 0; }
        private double ParseDouble(string j, string k) { var m = Regex.Match(j, "\"" + k + "\"\\s*:\\s*([0-9.]+)"); return m.Success ? double.Parse(m.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture) : 0; }
        private bool   ParseBool(string j, string sec, string k) { int si = j.IndexOf("\"" + sec + "\""); if (si < 0) return false; int ei = j.IndexOf('}', si); var m = Regex.Match(j.Substring(si, ei < 0 ? j.Length - si : ei - si), "\"" + k + "\"\\s*:\\s*(true|false)"); return m.Success && m.Groups[1].Value == "true"; }
        private string ParseStr(string j, string sec, string k)  { int si = j.IndexOf("\"" + sec + "\""); if (si < 0) return null; int ei = j.IndexOf('}', si); var m = Regex.Match(j.Substring(si, ei < 0 ? j.Length - si : ei - si), "\"" + k + "\"\\s*:\\s*\"([^\"]+)\""); return m.Success ? m.Groups[1].Value : null; }
        private long   ParseLongFlat(string s, string k)   { var m = Regex.Match(s, "\"" + k + "\"\\s*:\\s*([0-9.]+)"); return m.Success ? (long)double.Parse(m.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture) : 0; }
        private bool   ParseBoolFlat(string s, string k)   { var m = Regex.Match(s, "\"" + k + "\"\\s*:\\s*(true|false)"); return m.Success && m.Groups[1].Value == "true"; }
        private string ParseStrFlat(string s, string k)    { var m = Regex.Match(s, "\"" + k + "\"\\s*:\\s*\"([^\"\\\\]*)\""); return m.Success ? m.Groups[1].Value : null; }
        private string FormatUptime(long secs) { long d = secs/86400, h = (secs%86400)/3600, m = (secs%3600)/60, s = secs%60; if (d > 0) return d + " hari " + h + " jam"; if (h > 0) return h + " jam " + m + " menit"; if (m > 0) return m + " menit"; return s + " detik"; }
        private string FormatBytes(long b) { if (b <= 0) return "0 B"; string[] u = { "B","KB","MB","GB" }; int i = 0; double v = b; while (v >= 1024 && i < 3) { v /= 1024; i++; } return v.ToString("0.1") + " " + u[i]; }
        private string TryParseTime(string iso) { if (string.IsNullOrEmpty(iso)) return "-"; try { return DateTime.Parse(iso).ToLocalTime().ToString("HH:mm:ss"); } catch { return iso; } }
    }
}






