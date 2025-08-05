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
  ADMIN: {
    USERS: {
      GET_ALL: "/api/admin/users", // no payload
      GET_BY_ID: "/api/admin/users/:id", // params: { id }
      CREATE: "/api/admin/users", // payload: {  name, email, phone, avatar, role, password  }
      UPDATE: "/api/admin/users/:id", // params: { id }, payload: {  name, email, phone, avatar, role  }
      DELETE: "/api/admin/users/:id", // params: { id }
      TOGGLE_STATUS: "/api/admin/users/:id/status", // params: { id }
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
    },
  },
};

export const isDevelopment = () => ENV_CONFIG.NODE_ENV === "development";
export const isProduction = () => ENV_CONFIG.NODE_ENV === "production";
