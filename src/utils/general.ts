export const oneDayAgo = () => new Date(Date.now() - (24 * 60 * 60 * 1000))
export const daysBefore = (d:Date,beforeDays:number) => new Date(d.getTime() - (beforeDays * 24 * 60 * 60 * 1000))
