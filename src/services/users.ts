import { User, Item, Address } from '../models';
import { hashPassword, comparePassword } from './auth';

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  avatar_url?: string;
  username?: string;
  address?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface SafeUserResponse {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  rating: number;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  address?: string | null;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  createdAt: Date;
  itemsCount: number;
}

class UsersService {
  async getById(userId: string): Promise<SafeUserResponse | null> {
    const user = await User.findByPk(userId, {
      include: [{ model: Address, as: 'address' }],
    });
    if (!user) {
      return null;
    }
    return this.toSafeUser(user);
  }

  async getByUsername(username: string): Promise<User | null> {
    return User.findOne({ where: { username } });
  }

  async getPublicProfile(username: string): Promise<PublicUserProfile | null> {
    const user = await User.findOne({ where: { username } });
    if (!user || !user.isActive) {
      return null;
    }

    const itemsCount = await Item.count({ where: { user_id: user.id } });

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url,
      rating: user.rating,
      createdAt: user.createdAt,
      itemsCount,
    };
  }

  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const existingUser = await User.findOne({ where: { username } });
    if (!existingUser) {
      return true;
    }
    return excludeUserId ? existingUser.id === excludeUserId : false;
  }

  async updateMe(userId: string, data: UpdateMeInput): Promise<SafeUserResponse | null> {
    const user = await User.findByPk(userId, {
      include: [{ model: Address, as: 'address' }],
    });

    if (!user) {
      return null;
    }

    const updateData: Partial<Omit<UpdateMeInput, 'address'>> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }
    if (data.avatar_url !== undefined) {
      updateData.avatar_url = data.avatar_url;
    }
    if (data.username !== undefined) {
      updateData.username = data.username;
    }

    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
    }

    if (data.address !== undefined) {
      const existingAddress = await Address.findOne({ where: { user_id: userId } });
      if (existingAddress) {
        await existingAddress.update({ address_line1: data.address });
      } else {
        await Address.create({
          user_id: userId,
          label: 'Pickup',
          address_line1: data.address,
          city: '',
          state: '',
          postal_code: '',
          country: 'India',
          is_default: true,
        });
      }
      await user.reload({ include: [{ model: Address, as: 'address' }] });
    }

    return this.toSafeUser(user);
  }

  async hasPassword(userId: string): Promise<boolean> {
    const user = await User.findByPk(userId);
    if (!user) {
      return false;
    }
    return !!user.password_hash && user.password_hash.length > 0;
  }

  async setPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await User.findByPk(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.password_hash && user.password_hash.length > 0) {
      return {
        success: false,
        message: 'Password already set. Use change password instead.',
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    await user.update({ password_hash: newPasswordHash });

    return { success: true, message: 'Password set successfully' };
  }

  async changePassword(
    userId: string,
    data: ChangePasswordInput
  ): Promise<{ success: boolean; message: string }> {
    const user = await User.findByPk(userId);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check if user has a password (not OAuth-only user)
    if (!user.password_hash || user.password_hash.length === 0) {
      return {
        success: false,
        message: 'No password set. Please set a password first.',
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      data.currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(data.newPassword);
    await user.update({ password_hash: newPasswordHash });

    return { success: true, message: 'Password changed successfully' };
  }

  toSafeUser(user: User): SafeUserResponse {
    const userAddress = (user as User & { address?: Address }).address;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      rating: user.rating,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      address: userAddress?.address_line1 ?? null,
    };
  }
}

export default new UsersService();
