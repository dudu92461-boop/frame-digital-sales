import type { Request, Response } from 'express';
import { query } from '../lib/query';
import { currentPeriod } from '../lib/dates';
import { rankingRows } from './dashboardController';

export async function getRanking(req: Request, res: Response) {
  const q = query<{ month?: number; year?: number; sort?: string }>(req);
  const now = currentPeriod();
  const period = { month: q.month ?? now.month, year: q.year ?? now.year };

  const rows = await rankingRows(period);

  // O ranking oficial e por valor vendido; `sort=count` reordena por quantidade.
  const sorted =
    q.sort === 'count'
      ? [...rows]
          .sort((a, b) => b.salesCount - a.salesCount || b.revenue - a.revenue)
          .map((row, index) => ({ ...row, position: index + 1 }))
      : rows;

  const mySellerId = req.auth?.sellerId;
  const me = mySellerId ? sorted.find((r) => r.sellerId === mySellerId) ?? null : null;

  res.json({
    period,
    sort: q.sort === 'count' ? 'count' : 'revenue',
    items: sorted,
    me,
    totals: {
      revenue: sorted.reduce((sum, r) => sum + r.revenue, 0),
      salesCount: sorted.reduce((sum, r) => sum + r.salesCount, 0),
    },
  });
}
