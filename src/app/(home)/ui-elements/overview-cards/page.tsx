import React from "react";

import { OverviewCardsSkeleton } from "./skeleton";
import { OverviewCard } from "./card";

export default function page() {
  return (
    <div>
      <OverviewCard
        label={"datatatat"}
        data={{
          value: "23234425",
          growthRate: 0,
        }}
        Icon={(props) => (
          <svg {...props} fill="currentColor" viewBox="0 0 24 24"></svg>
        )}
      />
      <OverviewCardsSkeleton />
    </div>
  );
}
