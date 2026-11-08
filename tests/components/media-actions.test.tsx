import React from 'react';
import { Alert, Share } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { MediaActions } from '../../src/components/MediaActions';
import type { MediaItem } from '../../src/types/domain';
let mockUserId = 'viewer';
const mockRun = jest.fn();
jest.mock('../../src/lib/session', () => ({ useSession: () => ({ user: { id: mockUserId } }) }));
jest.mock('../../src/hooks/useAction', () => ({ useAction: () => ({ run: mockRun }) }));
const item = {
  id: 'image',
  authorId: 'author',
  categoryId: 'leaf',
  title: 'Immagine',
  status: 'approved',
} as MediaItem;
beforeEach(() => {
  jest.clearAllMocks();
  mockUserId = 'viewer';
});
test('like, share e segnalazione mantengono i simboli senza pulsanti testuali', async () => {
  const like = jest.fn();
  const share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
  const view = await render(
    <MediaActions item={item} current={false} busy={false} disabled={false} onLike={like} />,
  );
  expect(view.queryByText('Mi piace')).toBeNull();
  expect(view.queryByText('Condividi')).toBeNull();
  expect(view.queryByText('Segnala contenuto')).toBeNull();
  await fireEvent.press(view.getByLabelText('Mi piace'));
  expect(like).toHaveBeenCalledTimes(1);
  await fireEvent.press(view.getByLabelText('Condividi'));
  expect(share).toHaveBeenCalledWith({
    message: 'Immagine · VOTILT\nvotilt://content/image?categoryId=leaf',
  });
  await fireEvent.press(view.getByLabelText('Altre opzioni'));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/report', params: { contentId: 'image' } });
});
test('i contenuti non approvati non votano e il ritiro proprietario resta dietro conferma', async () => {
  mockUserId = 'author';
  const like = jest.fn();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const view = await render(
    <MediaActions
      item={{ ...item, status: 'pending_review' }}
      current={false}
      busy={false}
      disabled={false}
      onLike={like}
    />,
  );
  await fireEvent.press(view.getByLabelText('Mi piace'));
  expect(like).not.toHaveBeenCalled();
  await fireEvent.press(view.getByLabelText('Altre opzioni'));
  expect(alert).toHaveBeenCalledWith(
    'Altre opzioni',
    undefined,
    expect.arrayContaining([expect.objectContaining({ text: 'Ritira la tua creazione' })]),
  );
  expect(mockRun).not.toHaveBeenCalled();
});
