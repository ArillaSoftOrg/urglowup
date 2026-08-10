export interface Account {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface AccountPreferences {
  locale: string;
  theme: string;
  emailTransactional: boolean;
  whatsappTransactional: boolean;
  emailMarketing: boolean;
  whatsappMarketing: boolean;
}
