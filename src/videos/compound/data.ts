// Every number shown or spoken in this video comes from here, so the script and
// the visuals cannot drift apart. Check: 100/month, 7%/yr compounded monthly,
// end-of-month deposits, 30 years -> $121,997 (36,000 deposited).
export const MONTHLY = 100;
export const RATE = 0.07;
export const YEARS = 30;

export const balances: number[] = [];
export const deposits: number[] = [];
{
  let b = 0;
  balances.push(0);
  deposits.push(0);
  for (let m = 1; m <= YEARS * 12; m++) {
    b = b * (1 + RATE / 12) + MONTHLY;
    if (m % 12 === 0) {
      balances.push(b);
      deposits.push(m * MONTHLY);
    }
  }
}

export const FINAL = balances[balances.length - 1];
export const DEPOSITED = deposits[deposits.length - 1];

export const VO_FILES = ["01.wav", "02.wav", "03.wav", "04.wav"].map(
  (f) => `videos/compound/vo/${f}`,
);
