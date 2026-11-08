import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button, Empty, Input } from '../../src/components/ui';
describe('controlli accessibili', () => {
  test('button invoca una azione, busy la blocca', async () => {
    const press = jest.fn();
    const view = await render(<Button title="Scegli il campione" onPress={press} />);
    await fireEvent.press(view.getByRole('button'));
    expect(press).toHaveBeenCalledTimes(1);
    await view.rerender(<Button title="Scegli il campione" onPress={press} busy />);
    await fireEvent.press(view.getByRole('button'));
    expect(press).toHaveBeenCalledTimes(1);
    expect(view.getByRole('button').props.accessibilityState.busy).toBe(true);
  });
  test('empty state porta a un’azione autentica e input ha label', async () => {
    const retry = jest.fn();
    const view = await render(
      <Empty title="Nessun campione" action="Vai al feed" onPress={retry} />,
    );
    await fireEvent.press(view.getByText('Vai al feed'));
    expect(retry).toHaveBeenCalled();
    const input = await render(<Input label="Email" />);
    expect(input.getByLabelText('Email')).toBeTruthy();
  });
});
