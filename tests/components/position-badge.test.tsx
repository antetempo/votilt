import React from 'react';
import { render } from '@testing-library/react-native';
import { PositionBadge } from '../../src/components/PositionBadge';
test.each([1, 2, 3, 4, 100])(
  'posizione %i contestualizzata con categoria, senza certificazioni',
  async (position) => {
    const view = await render(
      <PositionBadge position={position} category="Bonsai" support={2} participants={3} />,
    );
    expect(view.getByText(position <= 3 ? String(position) : '#' + position)).toBeTruthy();
    expect(view.getByText('Bonsai')).toBeTruthy();
    expect(view.getByText('posizione attuale')).toBeTruthy();
  },
);
test.each([
  { position: 1, support: 0, participants: 2 },
  { position: 1, support: 2, participants: 1 },
  { position: 101, support: 2, participants: 200 },
])('nessun riconoscimento senza contesto sufficiente %#', async (props) => {
  const view = await render(<PositionBadge {...props} category="Bonsai" />);
  expect(view.queryByText('Bonsai')).toBeNull();
});
