import Transactions from "@/_shared/components/Transactions";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    period?: string;
    account?: string;
  }>;
}) {
  const { year, month, period, account } = await searchParams;
  const parsedYear = year ? Number(year) : NaN;
  const validYear =
    Number.isInteger(parsedYear) && parsedYear > 0 ? parsedYear : undefined;
  const parsedMonth = month ? Number(month) : NaN;
  const validMonth =
    Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : undefined;
  const parsedPeriod = period ? Number(period) : NaN;
  const validPeriod =
    Number.isInteger(parsedPeriod) && parsedPeriod > 0
      ? parsedPeriod
      : undefined;
  const parsedAccount = account ? Number(account) : NaN;
  const validAccount =
    Number.isInteger(parsedAccount) && parsedAccount > 0
      ? parsedAccount
      : undefined;
  return (
    <Transactions
      initialYear={validYear}
      initialMonth={validMonth}
      initialPeriod={validPeriod}
      initialAccount={validAccount}
    />
  );
}
