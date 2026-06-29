using System;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
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
        private Button btnStart;
        private Button btnStop;
        private Button btnRestart;
        private Label lblStatusTitle;
        private Label lblStatus;
        private TextBox txtLogs;
        private Timer statusTimer;

        public MainForm()
        {
            InitializeComponent();
            CheckStatus();
        }

        private void InitializeComponent()
        {
            this.Text = "PDFVault Server Manager";
            this.Size = new Size(600, 400);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.Sizable;
            this.MaximizeBox = true;
            this.Icon = SystemIcons.Application;

            // Left Panel
            Panel panelLeft = new Panel();
            panelLeft.Size = new Size(200, 360);
            panelLeft.Location = new Point(10, 10);
            panelLeft.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left;
            this.Controls.Add(panelLeft);

            // Right Panel
            Panel panelRight = new Panel();
            panelRight.Size = new Size(360, 340);
            panelRight.Location = new Point(220, 10);
            panelRight.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            this.Controls.Add(panelRight);

            // Buttons
            btnStart = new Button() { Text = "▶ Start Server", Location = new Point(0, 0), Size = new Size(180, 40), Font = new Font("Segoe UI", 10, FontStyle.Bold) };
            btnStop = new Button() { Text = "⏹ Stop Server", Location = new Point(0, 50), Size = new Size(180, 40), Font = new Font("Segoe UI", 10) };
            btnRestart = new Button() { Text = "🔄 Restart Server", Location = new Point(0, 100), Size = new Size(180, 40), Font = new Font("Segoe UI", 10) };
            
            btnStart.Click += (s, e) => RunAction("pm2 start backend/index.js --name \"pdfvault-server\"", "Starting server...");
            btnStop.Click += (s, e) => RunAction("pm2 stop pdfvault-server", "Stopping server...");
            btnRestart.Click += (s, e) => RunAction("pm2 restart pdfvault-server", "Restarting server...");

            panelLeft.Controls.Add(btnStart);
            panelLeft.Controls.Add(btnStop);
            panelLeft.Controls.Add(btnRestart);

            // Status Label
            lblStatusTitle = new Label() { Text = "Status Server:", Location = new Point(0, 160), Size = new Size(180, 20), Font = new Font("Segoe UI", 10) };
            lblStatus = new Label() { Text = "MENGECEK...", Location = new Point(0, 185), Size = new Size(180, 30), Font = new Font("Segoe UI", 14, FontStyle.Bold), ForeColor = Color.Gray };
            
            panelLeft.Controls.Add(lblStatusTitle);
            panelLeft.Controls.Add(lblStatus);

            // Logs
            txtLogs = new TextBox();
            txtLogs.Multiline = true;
            txtLogs.ReadOnly = true;
            txtLogs.Dock = DockStyle.Fill;
            txtLogs.ScrollBars = ScrollBars.Vertical;
            txtLogs.WordWrap = true;
            txtLogs.Font = new Font("Consolas", 9);
            txtLogs.BackColor = Color.FromArgb(30, 30, 30);
            txtLogs.ForeColor = Color.LightGray;
            panelRight.Controls.Add(txtLogs);

            // Timer
            statusTimer = new Timer();
            statusTimer.Interval = 5000;
            statusTimer.Tick += (s, e) => CheckStatus();
            statusTimer.Start();
        }

        private void Log(string message)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string>(Log), message);
                return;
            }
            string time = DateTime.Now.ToString("HH:mm:ss");
            txtLogs.AppendText(string.Format("[{0}] {1}\r\n", time, message));
        }

        private void RunAction(string command, string startMsg)
        {
            Log(startMsg);
            btnStart.Enabled = false;
            btnStop.Enabled = false;
            btnRestart.Enabled = false;

            System.Threading.Tasks.Task.Run(() =>
            {
                string output = ExecuteCmd(command);
                
                // 🐴 ponytail: Filter out the giant PM2 ASCII table so the log stays neat
                var lines = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                var cleanLines = new System.Collections.Generic.List<string>();
                foreach (var line in lines)
                {
                    if (!line.StartsWith("┌") && !line.StartsWith("│") && !line.StartsWith("├") && !line.StartsWith("└"))
                    {
                        cleanLines.Add(line);
                    }
                }
                output = string.Join("\r\n", cleanLines).Trim();

                Log(string.IsNullOrWhiteSpace(output) ? "Perintah selesai." : output);
                
                this.Invoke(new Action(() =>
                {
                    btnStart.Enabled = true;
                    btnStop.Enabled = true;
                    btnRestart.Enabled = true;
                    CheckStatus();
                }));
            });
        }

        private void CheckStatus()
        {
            System.Threading.Tasks.Task.Run(() =>
            {
                string output = ExecuteCmd("pm2 jlist");
                this.Invoke(new Action(() =>
                {
                    if (output.Contains("\"name\":\"pdfvault-server\""))
                    {
                        if (output.Contains("\"status\":\"online\""))
                        {
                            lblStatus.Text = "ONLINE";
                            lblStatus.ForeColor = Color.Green;
                        }
                        else
                        {
                            lblStatus.Text = "OFFLINE";
                            lblStatus.ForeColor = Color.Red;
                        }
                    }
                    else
                    {
                        lblStatus.Text = "STOPPED";
                        lblStatus.ForeColor = Color.Red;
                    }
                }));
            });
        }

        private string ExecuteCmd(string command)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("cmd.exe", "/c " + command);
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.CreateNoWindow = true;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                psi.StandardOutputEncoding = System.Text.Encoding.UTF8;
                psi.StandardErrorEncoding = System.Text.Encoding.UTF8;
                psi.UseShellExecute = false;

                using (Process process = Process.Start(psi))
                {
                    string output = process.StandardOutput.ReadToEnd();
                    string err = process.StandardError.ReadToEnd();
                    process.WaitForExit();
                    return string.IsNullOrWhiteSpace(output) ? err : output;
                }
            }
            catch (Exception ex)
            {
                return "Error: " + ex.Message;
            }
        }
    }
}
