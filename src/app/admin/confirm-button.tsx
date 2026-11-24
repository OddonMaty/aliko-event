"use client";

import { Button } from "@/components/ui/button";

/** Bouton d'envoi de formulaire qui demande confirmation avant une action irréversible. */
export function ConfirmButton({
  message, children, ...props
}: { message: string } & React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
