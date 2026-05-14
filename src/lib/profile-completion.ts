export interface ProfileCompletionData {
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  address: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  categories: { categoryId: string }[];
  services: { id: string }[];
  hours: { id: string }[];
  media: { id: string }[];
}

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

export interface ProfileCompletion {
  score: number;
  completedCount: number;
  totalCount: number;
  items: CompletionItem[];
  missing: CompletionItem[];
}

export function calculateProfileCompletion(
  data: ProfileCompletionData | null
): ProfileCompletion {
  const totalCount = 10;

  if (!data) {
    return {
      score: 0,
      completedCount: 0,
      totalCount,
      items: [],
      missing: [],
    };
  }

  const items: CompletionItem[] = [
    {
      key: "name",
      label: "Business name",
      done: !!data.name,
      href: "/business/profile",
    },
    {
      key: "description",
      label: "Business description",
      done: !!data.description?.trim(),
      href: "/business/profile",
    },
    {
      key: "category",
      label: "At least one category",
      done: data.categories.length > 0,
      href: "/business/profile",
    },
    {
      key: "location",
      label: "City or address",
      done: !!(data.city?.trim() || data.address?.trim()),
      href: "/business/profile",
    },
    {
      key: "contact",
      label: "Phone number or WhatsApp",
      done: !!(data.phone?.trim() || data.whatsapp?.trim()),
      href: "/business/profile",
    },
    {
      key: "service",
      label: "At least one active service",
      done: data.services.length > 0,
      href: "/business/services",
    },
    {
      key: "hours",
      label: "Working hours configured",
      done: data.hours.length > 0,
      href: "/business/hours",
    },
    {
      key: "cover",
      label: "Cover image",
      done: !!data.coverImageUrl,
      href: "/business/media",
    },
    {
      key: "logo",
      label: "Logo image",
      done: !!data.logoUrl,
      href: "/business/media",
    },
    {
      key: "portfolio",
      label: "At least one portfolio photo or video",
      done: data.media.length > 0,
      href: "/business/media",
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const score = Math.round((completedCount / totalCount) * 100);

  return {
    score,
    completedCount,
    totalCount,
    items,
    missing: items.filter((i) => !i.done),
  };
}
