import { timestamp_format } from '../../utils/momentFormat'

test('timestamp_format returns correct format', () => {
  const result = timestamp_format();
  expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
});
