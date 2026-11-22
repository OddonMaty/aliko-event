import * as React from "react";

import { cn } from "@/lib/utils";

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      data-slot="alert"
      className={cn("bg-muted/50 text-muted-foreground rounded-lg border px-4 py-3 text-sm", className)}
      {...props}
    />
  );
}

export { Alert };
