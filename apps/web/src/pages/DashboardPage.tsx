import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiErrorResponse } from "../api/client.js";
import type {
  ResourceAContent,
  ResourceBContent,
} from "@community-gate/contracts";

type ResourceStatus = "loading" | "granted" | "denied" | "error";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [resourceA, setResourceA] = useState<ResourceAContent | null>(null);
  const [resourceB, setResourceB] = useState<ResourceBContent | null>(null);
  const [statusA, setStatusA] = useState<ResourceStatus>("loading");
  const [statusB, setStatusB] = useState<ResourceStatus>("loading");
  const [errorB, setErrorB] = useState("");

  const fetchResourceA = useCallback(async () => {
    setStatusA("loading");
    try {
      const data = await api.getResourceA();
      setResourceA(data);
      setStatusA("granted");
    } catch {
      setStatusA("error");
    }
  }, []);

  const fetchResourceB = useCallback(async () => {
    setStatusB("loading");
    setErrorB("");
    try {
      const data = await api.getResourceB();
      setResourceB(data);
      setStatusB("granted");
    } catch (err) {
      if (err instanceof ApiErrorResponse && err.status === 403) {
        setStatusB("denied");
        setErrorB(err.body.message ?? "无权限");
      } else {
        setStatusB("error");
      }
    }
  }, []);

  useEffect(() => {
    fetchResourceA();
    fetchResourceB();
  }, [fetchResourceA, fetchResourceB]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // logout already sets user to null in finally
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1 className="dash-title">Community Gate</h1>
        <div className="dash-user">
          <span className="user-name">{user?.username}</span>
          <span className={`role-badge ${user?.role === "PRIVILEGED" ? "privileged" : "member"}`}>
            {user?.role === "PRIVILEGED" ? "特权账号" : "普通成员"}
          </span>
          <button className="btn-logout" onClick={handleLogout} type="button">
            退出登录
          </button>
        </div>
      </header>

      <main className="dash-main">
        <h2 className="section-title">资源控制台</h2>
        <div className="resource-grid">
          {/* Resource A */}
          <div className={`resource-card ${statusA}`}>
            <div className="resource-header">
              <h3>资源 A — 社区公开资料库</h3>
              <span className={`access-badge ${statusA}`}>
                {statusA === "granted" ? "已授权" : statusA === "loading" ? "加载中..." : "加载失败"}
              </span>
            </div>
            {resourceA && (
              <div className="resource-body">
                <section>
                  <h4>📢 社区公告</h4>
                  <ul>
                    {resourceA.data.announcements.map((ann) => (
                      <li key={ann.id}>
                        <strong>{ann.title}</strong>
                        <span className="date">{ann.date}</span>
                        <p>{ann.summary}</p>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4>📚 入门指南</h4>
                  <ul>
                    {resourceA.data.guides.map((g) => (
                      <li key={g.id}>
                            {g.title}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}
          </div>

          {/* Resource B */}
          <div className={`resource-card ${statusB}`}>
            <div className="resource-header">
              <h3>资源 B — 社区内部运营数据</h3>
              <span className={`access-badge ${statusB}`}>
                {statusB === "granted"
                  ? "已授权"
                  : statusB === "denied"
                  ? "无权限"
                  : statusB === "loading"
                  ? "加载中..."
                  : "加载失败"}
              </span>
            </div>
            {statusB === "denied" && (
              <div className="resource-denied">
                <p>🔒 {errorB || "您的账号没有权限访问该资源"}</p>
                <p className="hint">如需访问内部运营数据，请联系管理员提升权限。</p>
              </div>
            )}
            {resourceB && statusB === "granted" && (
              <div className="resource-body">
                <section>
                  <h4>📊 运营指标</h4>
                  <div className="metrics-grid">
                    <div className="metric">
                      <span className="metric-value">
                        {resourceB.data.metrics.totalUsers.toLocaleString()}
                      </span>
                      <span className="metric-label">总用户数</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">
                        {resourceB.data.metrics.activeUsers24h.toLocaleString()}
                      </span>
                      <span className="metric-label">24h 活跃</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">
                        {resourceB.data.metrics.newRegistrations24h}
                      </span>
                      <span className="metric-label">24h 新注册</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">
                        {resourceB.data.metrics.moderationPassRate}%
                      </span>
                      <span className="metric-label">审核通过率</span>
                    </div>
                  </div>
                </section>
                <section>
                  <h4>📋 最近操作</h4>
                  <ul>
                    {resourceB.data.operations.map((op) => (
                      <li key={op.id}>
                        <strong>{op.action}</strong>
                        <span className="date">{op.timestamp}</span>
                        <span className="operator">操作人: {op.operator}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}
            {statusB === "loading" && (
              <div className="resource-loading">
                <div className="spinner" />
                <p>加载资源中...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
