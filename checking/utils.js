function toMinutes(hhmm) {
  const hour = Number(hhmm.slice(0, 2));
  const minute = Number(hhmm.slice(2, 4));

  return hour * 60 + minute;
}

export function findEarliestScreening(dataList, SCREENS_NUMBER, MOVIE_MIN_TIME, MOVIE_MAX_TIME) {
  const min = toMinutes(MOVIE_MIN_TIME);
  const max = toMinutes(MOVIE_MAX_TIME);


  return dataList
    .filter(({ scnsNo, scnsrtTm, scnendTm }) => {
        console.log(
    scnsNo,
    SCREENS_NUMBER,
    scnsrtTm,
    scnendTm
  );
      const start = toMinutes(scnsrtTm);
      const end = toMinutes(scnendTm);

      return (
        scnsNo === SCREENS_NUMBER &&
        start >= min &&
        end <= max
      );
    })
    .sort((a, b) => toMinutes(a.scnsrtTm) - toMinutes(b.scnsrtTm))[0] ?? null;
}