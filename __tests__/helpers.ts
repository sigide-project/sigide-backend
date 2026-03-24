import { AuthenticatedUser } from '../src/types';

export function createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    phone: null,
    avatar_url: null,
    rating: 0,
    role: 'user',
    isActive: true,
    ...overrides,
  };
}
