import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials');
            return null;
          }

          await connectToDatabase();

          const user = await User.findOne({ email: credentials.email.toLowerCase() });
          if (!user) {
            console.error('User not found:', credentials.email);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            console.error('Invalid password for user:', credentials.email);
            return null;
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          // Return user object for JWT
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email,
            role: user.role || 'staff',
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.iat = Date.now() / 1000; // Issued at timestamp
        token.exp = Date.now() / 1000 + (24 * 60 * 60); // Expires in 24 hours
      }
      
      // Return previous token if the user is already signed in
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      
      // Include token expiry in session for client-side checks
      session.expires = new Date(token.exp as number * 1000).toISOString();
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || 'K8x3J9mNp2QrL5vT7wY1aB6cD4eF0gH8iS3kR9nM2oP5qU7tV1xW4yZ6aB8cD0eF2g',
  debug: true, // Enable debug to see what's happening
  useSecureCookies: process.env.NODE_ENV === 'production',
};