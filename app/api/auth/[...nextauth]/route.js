import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { ENV_CONFIG, API_ENDPOINTS } from "@/config/environment";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(
            `${
              process.env.API_BASE_URL || "http://localhost:3000"
            }/api/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            return {
              id: data.data.user.id,
              name: data.data.user.name,
              email: data.data.user.email,
              phone: data.data.user.phone,
              role: data.data.user.role,
              avatar: data.data.user.avatar,
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken,
            };
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          // Send Google ID token to backend for verification and user creation/login
          const response = await fetch(
            `${ENV_CONFIG.BASE_API_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                idToken: account.id_token,
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            // Store additional user data for later use
            user.role = data.data.user.role;
            user.phone = data.data.user.phone;
            user.creditBalance = data.data.user.creditBalance;
            user.totalTopUp = data.data.user.totalTopUp;
            user.totalSpent = data.data.user.totalSpent;
            user.accessToken = data.data.accessToken;
            user.refreshToken = data.data.refreshToken;
            return true;
          }

          return false;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.role = user.role;
        token.phone = user.phone;
        token.avatar = user.avatar || user.image;
        token.creditBalance = user.creditBalance;
        token.totalTopUp = user.totalTopUp;
        token.totalSpent = user.totalSpent;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.phone = token.phone;
      session.user.avatar = token.avatar;
      session.user.creditBalance = token.creditBalance;
      session.user.totalTopUp = token.totalTopUp;
      session.user.totalSpent = token.totalSpent;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-here",
});

export { handler as GET, handler as POST };
