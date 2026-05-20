import { PageHeader } from "@/components/ui/page-header";

interface BusinessPageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}

export function BusinessPageHeader({
  title,
  description,
  eyebrow,
  action,
}: BusinessPageHeaderProps) {
  return (
    <div className="mb-2">
      <PageHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        action={action}
      />
    </div>
  );
}
