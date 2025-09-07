import { GET } from "@/app/api/auth/[...nextauth]/route";

export const ENV_CONFIG = {
  BASE_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT || 10000,
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "MinisPod",
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
};

export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE_LOGIN: "/api/auth/google/login",
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
  },
  USER: {
    PROFILE: "/api/user/profile",
  },
  WALLET: {
    INFO: "/api/wallet/info",
    TRANSACTIION: {
      GET_ALL: "/api/wallet/transactions",
      GET_BY_ID: "/api/wallet/transactions/:id",
    },
    TOPUP: "/api/wallet/topup",
    STATISTICS: "/api/wallet/statistics",
    REDEEM_COUPON: "/api/wallet/redeem-coupon",
  },
  CATALOG: {
    SERVICES: {
      GET_ALL: "/api/catalog/services",
    },
  },

  SUBSCRIPTIONS: {
    CREATE: "/api/subscriptions",
    GET_BY_ID: "/api/subscriptions/:id",
    UPGRADE: "/api/subscriptions/:id/upgrade",
    AUTO_RENEW_TOGGLE: "/api/subscriptions/:id/auto-renew",
  },
  ADMIN: {
    ANALYTICS: {
      DASHBOARD: "/api/admin/analytics/dashboard",
      REVENUE: "/api/admin/analytics/revenue",
      SUBSCRIPTIONS: "/api/admin/analytics/subscriptions",
      USERS: "/api/admin/analytics/users",
      SERVICE_CONTROL: "/api/admin/analytics/service-control",
    },
    USERS: {
      GET_ALL: "/api/admin/users", // no payload
      GET_BY_ID: "/api/admin/users/:id", // params: { id }
      CREATE: "/api/admin/users", // payload: {  name, email, phone, avatar, role, password  }
      UPDATE: "/api/admin/users/:id", // params: { id }, payload: {  name, email, phone, avatar, role  }
      DELETE: "/api/admin/users/:id", // params: { id }
      TOGGLE_STATUS: "/api/admin/users/:id/status", // params: { id }
    },
    SUBSCRIPTIONS: {
      GET_ALL: "/api/admin/subscriptions",
      CREATE: "/api/admin/subscriptions",
      UPGRADE: "/api/admin/subscriptions/:id/upgrade",
      CANCEL: "/api/admin/subscriptions/:id/force-cancel",
    },
    MANAGE_COUPONS: {
      GET_ALL: "/api/admin/coupons",
      CREATE: "/api/admin/coupons",
      UPDATE: "/api/admin/coupons/:id",
      DELETE: "/api/admin/coupons/:id",
    },
    MANAGE_SERVICE_CATALOG: {
      GET_CATAGORIES: "/api//catalog/categories",
      GET_ALL: "/api/admin/services",
      GET_BY_ID: "/api/admin/services/:id",
      CREATE: "/api/admin/services",
      UPDATE: "/api/admin/services/:id",
      DELETE: "/api/admin/services/:id",
      TOGGLE_STATUS: "/api/admin/services/:id/toggle-status",
      GET_ALL_SERVICE_PLANS: "/api/admin/services/plans",
      GET_SERVICE_PLANS: "/api/admin/services/:id/plans",
      UPDATE_SERVICE_PLAN: "/api/admin/services/:id/plans/:planId",
      CREATE_SERVICE_PLAN: "/api/admin/services/:id/plans",
      DELETE_SERVICE_PLAN: "/api/admin/services/:id/plans/:planId",
      TOGGLE_STATUS_SERVICE_PLAN:
        "/api/admin/services/:id/plans/:planId/toggle-status",
    },
    MANAGE_SERVVICE_CATALOG: {
      GET_ALL: "/api/admin/services",
      GET_BY_ID: "/api/admin/services/:id",
      CREATE: "/api/admin/services",
      UPDATE: "/api/admin/services/:id",
      DELETE: "/api/admin/services/:id",
      TOGGLE_STATUS: "/api/admin/services/:id/toggle-status", //PATCH
      GET_SERVICE_PLANS: "/api/admin/services/:id/plans",
      UPDATE_SERVICE_PLAN: "/api/admin/services/:id/plans/:planId",
      CREATE_SERVICE_PLAN: "/api/admin/services/:id/plans",
      UPDATE_SERVICE_PLAN: "/api/admin/services/:id/plans/:planId",
      DELETE_SERVICE_PLAN: "/api/admin/services/:id/plans/:planId",
      TOGGLE_STATUS_SERVICE_PLAN:
        "/api/admin/services/:id/plans/:planId/toggle-status",
    },
    SERVER: {
      NODES: {
        GET_ALL: "/api/admin/k8s/nodes",
        GET_BY_NAME: "/api/admin/k8s/nodes/:name",
      },
      NAMESPACES: {
        GET_ALL: "/api/admin/k8s/namespaces",
      },
      DEPLOYMENTS: {
        GET_ALL: "/api/admin/k8s/deployments",
      },
      PODS: {
        GET_ALL: "/api/admin/k8s/pods",
        GET_BY_NAME: "/api/admin/k8s/pods/:name",
      },
      INGRESSES: {
        GET_ALL: "/api/admin/k8s/ingresses",
      },
      SERVICES: {
        GET_ALL: "/api/admin/k8s/services",
      },
    },
    MANAGE_TICKETS: {
      STATS: "/api/admin/tickets/stats",
      GET_ALL: "/api/admin/tickets",
      RESPOND: "/api/admin/tickets/:id/messages",
      GET_BY_ID: "/api/admin/tickets/:id",
      CLOSE: "/api/admin/tickets/:id/close",
      REOPEN: "/api/admin/tickets/:id/reopen",
    },
  },
  SUPPORT_TICKET: {
    STATS: "/api/tickets/stats",
    GET_ALL: "/api/tickets",
    CREATE: "/api/tickets",
    RESPOND: "/api/tickets/:id/messages",
    GET_BY_ID: "/api/tickets/:id",
    CLOSE: "/api/tickets/:id/close",
  },
  MY_APPS: {
    GET_ALL: "/api/subscriptions",
    GET_BY_ID: "/api/subscriptions/:id",
    GET_METRICS: "/api/subscriptions/:id/metrics",
    GET_BILLING_INFO: "/api/subscriptions/:id/billing-info",
    STOP: "/api/subscriptions/:id/stop",
    RESTART: "/api/subscriptions/:id/restart",
    START: "/api/subscriptions/:id/start",
    RETRY_PROVISIONING: "/api/subscriptions/:id/retry-provisioning",
  },
};

export const isDevelopment = () => ENV_CONFIG.NODE_ENV === "development";
export const isProduction = () => ENV_CONFIG.NODE_ENV === "production";
