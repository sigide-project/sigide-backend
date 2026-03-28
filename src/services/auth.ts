import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models';
import { UserAttributes, JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const SALT_ROUNDS = 10;

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  photos?: Array<{ value: string }>;
}

export interface UserPublicData {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  user: UserPublicData;
  token: string;
}

export function signToken(user: Pick<UserAttributes, 'id' | 'email' | 'role'>): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function formatUserResponse(user: User): UserPublicData {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url || null,
    role: user.role,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return User.findOne({ where: { email: email.toLowerCase() } });
}

export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar_url?: string;
}): Promise<User> {
  const password_hash = data.password
    ? await hashPassword(data.password)
    : '';

  const userId = uuidv4();

  const user = await User.create({
    id: userId,
    username: userId,
    name: data.name,
    email: data.email.toLowerCase(),
    password_hash,
    phone: data.phone || null,
    avatar_url: data.avatar_url || null,
    role: 'user',
    rating: 0,
  });

  return user;
}

export async function findOrCreateGoogleUser(
  profile: GoogleProfile
): Promise<User> {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    throw new Error('Google profile does not contain an email address');
  }

  const avatarUrl = profile.photos?.[0]?.value || null;

  const existingUser = await findUserByEmail(email);
  if (existingUser && !existingUser.isDeleted) {
    if (!existingUser.avatar_url && avatarUrl) {
      await existingUser.update({ avatar_url: avatarUrl });
    }
    return existingUser;
  }

  const userId = uuidv4();

  const user = await User.create({
    id: userId,
    username: userId,
    name: profile.displayName,
    email: email.toLowerCase(),
    password_hash: '',
    avatar_url: avatarUrl,
    role: 'user',
    rating: 0,
  });

  return user;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  if (!user.password_hash) {
    return null;
  }

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return user;
}
