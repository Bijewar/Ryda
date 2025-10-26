// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Driver from "../../../../models/Driver";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        accountType: { label: "Account Type", type: "text" },
      },
      async authorize(credentials) {
        await dbConnect();

        const email = credentials.email;
        const password = credentials.password;
        const accountType = credentials.accountType;

        const Model = accountType === "driver" ? Driver : User;

        const user = await Model.findOne({ email: email.toLowerCase().trim() })
          .select("+password")
          .lean();

        if (!user) throw new Error("No account found with this email");
        if (accountType === "driver" && user.approvalStatus === "rejected")
          throw new Error("Your driver account has been rejected");
        if (!user.password) throw new Error("Account configuration error");

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error("Invalid password");

        const userData = {
          id: user._id.toString(),
          name: user.name || (user.firstName + " " + user.lastName),
          email: user.email,
          image: user.profilePic || null,
          accountType,
        };

        if (accountType === "driver") {
          userData.driverLicense = user.driverLicense;
          userData.vehicleModel = user.vehicleModel;
          userData.licensePlate = user.licensePlate;
        }

        return userData;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.accountType = user.accountType;

        if (user.accountType === "driver") {
          token.driverLicense = user.driverLicense;
          token.vehicleModel = user.vehicleModel;
          token.licensePlate = user.licensePlate;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image;
        session.user.accountType = token.accountType;

        if (token.accountType === "driver") {
          session.user.driverLicense = token.driverLicense;
          session.user.vehicleModel = token.vehicleModel;
          session.user.licensePlate = token.licensePlate;
        }
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();

          let existingUser = await User.findOne({
            email: user.email.toLowerCase().trim(),
          });

          if (!existingUser) {
            existingUser = await User.create({
              name: user.name,
              email: user.email.toLowerCase().trim(),
              profilePic: user.image,
              provider: "google",
              googleId: profile?.sub,
              accountType: "user",
            });
          }

          user.id = existingUser._id.toString();
          user.accountType = "user";

          return true;
        } catch (error) {
          console.error("❌ Google sign-in error:", error);
          return false;
        }
      }

      return true;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Wrap NextAuth in async functions for GET and POST
export async function GET(req, res) {
  return await NextAuth(authOptions)(req, res);
}

export async function POST(req, res) {
  return await NextAuth(authOptions)(req, res);
}
