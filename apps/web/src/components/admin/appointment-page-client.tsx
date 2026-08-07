"use client";

import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AppointmentPageTabsProps {
  pendingQueue: ReactNode;
  allAppointments: ReactNode;
  businessMetrics: ReactNode;
}

export function AppointmentPageTabs({
  pendingQueue,
  allAppointments,
  businessMetrics,
}: AppointmentPageTabsProps) {
  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="pending">Pending Queue</TabsTrigger>
        <TabsTrigger value="all">All Appointments</TabsTrigger>
        <TabsTrigger value="metrics">Business Metrics</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-6">
        {pendingQueue}
      </TabsContent>

      <TabsContent value="all" className="mt-6">
        {allAppointments}
      </TabsContent>

      <TabsContent value="metrics" className="mt-6">
        {businessMetrics}
      </TabsContent>
    </Tabs>
  );
}
