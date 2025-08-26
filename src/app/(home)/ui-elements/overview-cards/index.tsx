import { compactFormat } from "@/utils/format-number";
import { OverviewCard } from "./card";
import * as icons from "./icons";

export async function OverviewCardsGroup() {
  // Mock data for demonstration - replace with actual data fetching
  const views = { value: 45000, growthRate: 12.5 };
  const profit = { value: 125000, growthRate: 8.3 };
  const products = { value: 450, growthRate: -2.1 };
  const users = { value: 3200, growthRate: 15.7 };

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Total Views"
        data={{
          ...views,
          value: compactFormat(views.value),
        }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Total Profit"
        data={{
          ...profit,
          value: "$" + compactFormat(profit.value),
        }}
        Icon={icons.Profit}
      />

      <OverviewCard
        label="Total Products"
        data={{
          ...products,
          value: compactFormat(products.value),
        }}
        Icon={icons.Product}
      />

      <OverviewCard
        label="Total Users"
        data={{
          ...users,
          value: compactFormat(users.value),
        }}
        Icon={icons.Users}
      />
    </div>
  );
}
