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
