import { ResourceAContent, ResourceBContent } from "@community-gate/contracts";

export function getResourceA(): ResourceAContent {
  return {
    resource: "A",
    name: "社区公开资料库",
    description: "社区入门指南与公告，所有成员均可访问",
    data: {
      announcements: [
        {
          id: "ann-001",
          title: "欢迎加入社区",
          date: "2026-06-15",
          summary: "欢迎所有新成员加入我们的社区！请阅读社区守则以了解基本规则。",
        },
        {
          id: "ann-002",
          title: "社区规范更新",
          date: "2026-06-20",
          summary: "社区规范 v2.0 已发布，新增关于用户名注册的AI审核说明。",
        },
        {
          id: "ann-003",
          title: "第一期社区活动公告",
          date: "2026-06-22",
          summary: "社区将于7月举办第一期线上交流活动，详情请关注后续通知。",
        },
      ],
      guides: [
        { id: "guide-001", title: "社区守则", url: "/docs/code-of-conduct" },
        { id: "guide-002", title: "新手指南：快速上手", url: "/docs/getting-started" },
        { id: "guide-003", title: "用户名注册规则说明", url: "/docs/username-policy" },
        { id: "guide-004", title: "常见问题解答", url: "/docs/faq" },
      ],
    },
  };
}

export function getResourceB(): ResourceBContent {
  return {
    resource: "B",
    name: "社区内部运营数据",
    description: "社区运营指标与操作日志，仅授权人员可访问",
    data: {
      metrics: {
        totalUsers: 12847,
        activeUsers24h: 3421,
        newRegistrations24h: 156,
        moderationPassRate: 87.3,
      },
      operations: [
        {
          id: "op-001",
          action: "系统升级",
          operator: "系统",
          timestamp: "2026-06-22T08:00:00Z",
        },
        {
          id: "op-002",
          action: "新增审核规则",
          operator: "admin",
          timestamp: "2026-06-21T14:30:00Z",
        },
        {
          id: "op-003",
          action: "清理过期会话",
          operator: "系统",
          timestamp: "2026-06-21T02:00:00Z",
        },
        {
          id: "op-004",
          action: "修改用户角色",
          operator: "admin",
          timestamp: "2026-06-20T10:15:00Z",
        },
      ],
    },
  };
}
