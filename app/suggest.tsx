import React from 'react';
import { Screen, Title, Label } from '../src/components/ui';
export default function Suggest() {
  return (
    <Screen>
      <Title>Il catalogo cresce con cura.</Title>
      <Label>
        Le proposte di nuove categorie arriveranno con una coda separata e revisione editoriale. Per
        ora scegli una categoria esistente: anche un ramo intermedio.
      </Label>
    </Screen>
  );
}
