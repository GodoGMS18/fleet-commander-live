import { User } from '@/types';

const MOCK_USERS: (User & { password: string })[] = [
  { id: '1', email: 'admin@demo.com', name: 'Admin User', role: 'admin', password: '123456' },
  { id: '2', email: 'supervisor@demo.com', name: 'Supervisor', role: 'supervisor', password: '123456' },
  { id: '3', email: 'operator@demo.com', name: 'Operator', role: 'operator', password: '123456' },
];

export function mockLogin(email: string, password: string): Promise<User | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const u = MOCK_USERS.find(u => u.email === email && u.password === password);
      resolve(u ? { id: u.id, email: u.email, name: u.name, role: u.role } : null);
    }, 500);
  });
}

export function getStoredUser(): User | null {
  try {
    const s = localStorage.getItem('fleet_user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function storeUser(user: User | null) {
  if (user) localStorage.setItem('fleet_user', JSON.stringify(user));
  else localStorage.removeItem('fleet_user');
}
