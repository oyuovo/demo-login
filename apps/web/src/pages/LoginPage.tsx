import { useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext.js";
import { ApiErrorResponse } from "../api/client.js";

type Mode = "login" | "register";

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [moderationNotice, setModerationNotice] = useState(false);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
    setModerationNotice(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setModerationNotice(false);

      if (!username.trim() || !password.trim()) {
        setError("请填写用户名和密码");
        return;
      }

      if (mode === "register" && password.length < 8) {
        setError("密码至少 8 个字符");
        return;
      }

      setBusy(true);
      try {
        if (mode === "login") {
          await login(username.trim(), password);
        } else {
          setModerationNotice(true);
          await register(username.trim(), password);
        }
      } catch (err) {
        if (err instanceof ApiErrorResponse) {
          setError(err.body.message ?? "操作失败");
        } else {
          setError("网络错误，请稍后重试");
        }
      } finally {
        setBusy(false);
      }
    },
    [mode, username, password, login, register]
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Community Gate</h1>
        <p className="auth-subtitle">社区资源访问控制台</p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
            type="button"
          >
            登录
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
            type="button"
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-label" htmlFor="username">
            用户名
          </label>
          <input
            id="username"
            className="field-input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="输入用户名"
            autoComplete="username"
            disabled={busy}
            maxLength={32}
          />

          <label className="field-label" htmlFor="password">
            密码
          </label>
          <input
            id="password"
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "至少 8 个字符" : "输入密码"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={busy}
            maxLength={128}
          />

          {mode === "register" && (
            <p className="moderation-notice">
              ⓘ 注册名将由 AI 根据社区规则进行审核
            </p>
          )}

          {error && (
            <div className="error-msg" role="alert">
              {error}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy
              ? mode === "register" && moderationNotice
                ? "审核中..."
                : "处理中..."
              : mode === "login"
              ? "登录"
              : "注册"}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === "login" ? "还没有账号？" : "已有账号？"}
          <button type="button" className="link-btn" onClick={toggleMode}>
            {mode === "login" ? "立即注册" : "去登录"}
          </button>
        </p>
      </div>
    </div>
  );
}
