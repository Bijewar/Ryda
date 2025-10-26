import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Driver from "../../../../models/Driver";

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        const { email, password, accountType } = credentials;

        // Choose the correct model
        const Model = accountType === "driver" ? Driver : User;

        // Find user with password field
        const user = await Model.findOne({ email: email.toLowerCase().trim() })
          .select("+password")
          .lean();

        if (!user) {
          throw new Error("No account found with this email");
        }

        // Check driver approval status
        if (accountType === "driver") {
          if (user.approvalStatus === "rejected") {
            throw new Error("Your driver account has been rejected");
          }
          // Temporarily allow pending drivers to login for testing
          // if (user.approvalStatus === "pending") {
          //   throw new Error("Your driver account is pending approval");
          // }
        }

        // Verify password
        if (!user.password) {
          throw new Error("Account configuration error");
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        // Return user data for JWT
        const userData = {
          id: user._id.toString(),
          name: user.name || `${user.firstName} ${user.lastName}`,
          email: user.email,
          image: user.profilePic || null,
          accountType: accountType,
        };

        // Add driver-specific data
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
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.accountType = user.accountType || "user";

        if (user.accountType === "driver") {
          token.driverLicense = user.driverLicense;
          token.vehicleModel = user.vehicleModel;
          token.licensePlate = user.licensePlate;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image;
        session.user.accountType = token.accountType || "user";

        if (token.accountType === "driver") {
          session.user.driverLicense = token.driverLicense;
          session.user.vehicleModel = token.vehicleModel;
          session.user.licensePlate = token.licensePlate;
        }
      }

      return session;
    },

    async signIn({ user, account, profile }) {
      // Handle Google sign-in
      if (account?.provider === "google") {
        try {
          await dbConnect();

          let existingUser = await User.findOne({
            email: user.email.toLowerCase().trim()
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
});

export const { GET, POST } = handlers;
