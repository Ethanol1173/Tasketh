import { expect, it } from 'vitest';
import { readLimitedJson } from '@/lib/request';
it('parses bounded JSON and rejects streamed oversized bodies even without content-length', async () => {
  expect(
    await readLimitedJson(
      new Request('http://test', { method: 'POST', body: '{"available_minutes":30}' }),
      100,
    ),
  ).toEqual({ available_minutes: 30 });
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('x'.repeat(200)));
      controller.close();
    },
  });
  const request = new Request('http://test', {
    method: 'POST',
    body: stream,
    duplex: 'half',
  } as RequestInit);
  await expect(readLimitedJson(request, 100)).rejects.toThrow(RangeError);
});
