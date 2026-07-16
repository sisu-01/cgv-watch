function toMinutes(hhmm) {
  const hour = Number(hhmm.slice(0, 2));
  const minute = Number(hhmm.slice(2, 4));

  return hour * 60 + minute;
}

export function findEarliestScreening(dataList, minTime, maxTime) {
  const min = toMinutes(minTime);
  const max = toMinutes(maxTime);

  return dataList
    .filter(({ scnsrtTm, scnendTm }) => {
      const start = toMinutes(scnsrtTm);
      const end = toMinutes(scnendTm);

      return start >= min && end <= max;
    })
    .sort((a, b) => toMinutes(a.scnsrtTm) - toMinutes(b.scnsrtTm))[0] ?? null;
}