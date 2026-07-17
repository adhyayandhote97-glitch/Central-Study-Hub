"use client";

import { TicketForm } from "@/components/student-voice/ticket-form";
import { MyTicketsList } from "@/components/student-voice/my-tickets-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentVoicePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Student Voice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Request a resource, flag a problem, or share feedback with the admin team.
        </p>
      </div>

      <Tabs defaultValue="submit">
        <TabsList>
          <TabsTrigger value="submit">Submit</TabsTrigger>
          <TabsTrigger value="mine">My Tickets</TabsTrigger>
        </TabsList>
        <TabsContent value="submit" className="pt-4">
          <TicketForm />
        </TabsContent>
        <TabsContent value="mine" className="pt-4">
          <MyTicketsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
