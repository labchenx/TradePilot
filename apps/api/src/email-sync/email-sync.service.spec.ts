import type { MessageAddressObject } from 'imapflow';
import {
  collectCandidateUids,
  formatAddresses,
  isIbkrTradeReport,
} from './email-sync.service';

describe('EmailSyncService mail matching helpers', () => {
  it('keeps name-only sender values so QQ IMAP IBKR mails can match', () => {
    const from = formatAddresses([
      { name: 'Interactive Brokers Client Service' } as MessageAddressObject,
    ]);

    expect(from).toBe('Interactive Brokers Client Service');
    expect(isIbkrTradeReport('05/22/2026日交易报告', from)).toBe(true);
  });

  it('matches IBKR trade reports with compact sender domains', () => {
    expect(
      isIbkrTradeReport(
        'Daily Trade Report',
        'donotreply@interactivebrokers.com',
      ),
    ).toBe(true);
  });

  it('does not treat activity statements as trade report mails', () => {
    expect(
      isIbkrTradeReport(
        '05/22/2026日活动报表',
        'Interactive Brokers Client Service',
      ),
    ).toBe(false);
  });

  it('allows a dated trade report subject with a PDF when sender is unavailable', () => {
    expect(
      isIbkrTradeReport('05/22/2026日交易报告', '', [
        {
          filename: 'DailyTradeRep_20260522.pdf',
          contentType: 'application/pdf',
        },
      ]),
    ).toBe(true);
  });
});

describe('collectCandidateUids', () => {
  it('uses targeted IBKR search results without scanning the whole mailbox', async () => {
    const since = new Date('2026-05-17T00:00:00.000Z');
    const client = {
      search: jest.fn().mockResolvedValue([5, 3, 5]),
    };

    await expect(collectCandidateUids(client, since)).resolves.toMatchObject({
      uids: [3, 5],
      strategy: 'targeted',
      truncated: false,
    });

    expect(client.search).toHaveBeenCalledTimes(1);
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({ since }),
      { uid: true },
    );
  });

  it('uses date range search when targeted IBKR search is empty', async () => {
    const since = new Date('2026-05-17T00:00:00.000Z');
    const client = {
      search: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([10, 9]),
    };

    await expect(collectCandidateUids(client, since)).resolves.toMatchObject({
      uids: [9, 10],
      strategy: 'date-range',
      truncated: false,
    });

    expect(client.search).toHaveBeenCalledTimes(2);
    expect(client.search).toHaveBeenLastCalledWith({ since }, { uid: true });
  });

  it('falls back to a small latest-mail window only when date search is empty', async () => {
    const allUids = Array.from({ length: 150 }, (_, index) => index + 1);
    const client = {
      search: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(allUids),
    };

    const result = await collectCandidateUids(
      client,
      new Date('2026-05-17T00:00:00.000Z'),
    );

    expect(client.search).toHaveBeenCalledTimes(3);
    expect(client.search).toHaveBeenLastCalledWith({ all: true }, { uid: true });
    expect(result.strategy).toBe('latest-fallback');
    expect(result.uids).toHaveLength(15);
    expect(result.uids[0]).toBe(136);
    expect(result.uids.at(-1)).toBe(150);
  });
});
