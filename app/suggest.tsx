import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Label, Input, Chip, Button, Card, ErrorState } from '../src/components/ui';
import { rpc } from '../src/lib/api';
import { queryClient, useSession } from '../src/lib/session';
import { useUploadSelection } from '../src/features/uploadSelection';
import { checkCategoryWords, type CategoryCheck } from '../src/utils/categoryPolicy';
import { categoryPath } from '../src/utils/domain';
import type { Category } from '../src/types/domain';
import { colors as c } from '../src/theme/tokens';
export default function Suggest() {
  const params = useLocalSearchParams<{ title?: string; from?: string }>();
  const { user } = useSession();
  const [title, setTitle] = useState(params.title || '');
  const [description, setDescription] = useState('');
  const [examples, setExamples] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [root, setRoot] = useState('');
  const [parent, setParent] = useState('');
  const [kind, setKind] = useState('name');
  const [busy, setBusy] = useState(false);
  const list = examples
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);
  const payload = { title: title.trim(), description: description.trim(), examples: list };
  const key = JSON.stringify(payload);
  const [checked, setChecked] = useState(payload);
  const checkedKey = JSON.stringify(checked);
  useEffect(() => {
    const timer = setTimeout(() => setChecked(JSON.parse(key)), 300);
    return () => clearTimeout(timer);
  }, [key]);
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => rpc<Category[]>('categories'),
  });
  const check = useQuery({
    queryKey: ['category-check', checkedKey, user?.id],
    queryFn: () => rpc<CategoryCheck>('category_check', checked),
    enabled: !!user && checked.title.length >= 3,
    retry: false,
  });
  const local = checkCategoryWords(payload);
  const issues = local.length ? local : check.data?.issues || [];
  const choose = (id: string) => {
    if (params.from === 'upload') {
      useUploadSelection.getState().choose(id);
      router.back();
    } else router.replace({ pathname: '/category/[id]', params: { id } });
  };
  const send = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!check.data?.allowed || checkedKey !== key || !parent) return;
    setBusy(true);
    try {
      await rpc('suggest_category', { ...payload, parentId: parent, referenceKind: kind });
      await queryClient.invalidateQueries({ queryKey: ['category-check'] });
      Alert.alert(
        'Categoria proposta',
        'La proposta sarà rivista prima di essere pubblicata. La tua immagine resta nel modulo.',
      );
      router.back();
    } catch (error) {
      Alert.alert('Proposta non inviata', (error as Error).message);
      void check.refetch();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Nuova categoria' }} />
      <Title style={{ fontSize: 24 }}>Crea la tua categoria</Title>
      <Input
        label="Nome della categoria"
        value={title}
        onChangeText={setTitle}
        maxLength={60}
        placeholder="Un nome chiaro e specifico"
      />
      {!!title &&
        issues.map((x) => (
          <Label
            key={x.field + x.code}
            accessibilityRole="alert"
            style={{ fontSize: 12, color: c.danger }}
          >
            {x.message}
          </Label>
        ))}
      {check.isFetching && (
        <Label style={{ fontSize: 12, color: c.muted }}>Controllo testo e categorie simili…</Label>
      )}
      {check.error && <ErrorState error={check.error} retry={() => void check.refetch()} />}
      {!!check.data?.matches.length && (
        <Card>
          <Label style={{ fontSize: 14 }}>
            {check.data.duplicate
              ? 'Questa categoria esiste già.'
              : 'Categorie simili: potrebbero fare al caso tuo.'}
          </Label>
          {check.data.matches.map((x) => (
            <Button
              key={x.id}
              title={x.status === 'published' ? 'Usa ' + x.title : x.title + ' · in revisione'}
              secondary
              disabled={x.status !== 'published'}
              onPress={() => choose(x.id)}
            />
          ))}
        </Card>
      )}
      {check.data?.pendingDuplicate && (
        <Label style={{ fontSize: 12, color: c.muted }}>
          Esiste già una proposta equivalente in revisione. Non ne creiamo una seconda.
        </Label>
      )}
      <Input
        label="Cosa si confronterà? · almeno 20 caratteri"
        value={description}
        onChangeText={setDescription}
        maxLength={250}
        multiline
        placeholder="Descrivi brevemente quali immagini fanno parte della categoria."
      />
      <Label style={{ fontSize: 13 }}>Riferimento richiesto alle immagini</Label>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {[
          ['person', 'Nome della persona'],
          ['website', 'Nome e link del sito'],
          ['place', 'Nome del luogo'],
          ['tool', 'Nome e link del tool'],
          ['name', 'Nome della creazione'],
        ].map(([id, label]) => (
          <Chip key={id} title={label} selected={kind === id} onPress={() => setKind(id)} />
        ))}
      </View>
      <Label style={{ fontSize: 13 }}>Ambito</Label>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {categories.data
          ?.filter((x) => x.depth === 1)
          .map((x) => (
            <Chip
              key={x.id}
              title={x.title}
              selected={root === x.id}
              onPress={() => {
                setRoot(x.id);
                setParent('');
              }}
            />
          ))}
      </View>
      {!!root && (
        <View style={{ gap: 8 }}>
          {categories.data
            ?.filter((x) => x.depth === 3 && categoryPath(x.id, categories.data!)[0]?.id === root)
            .map((x) => (
              <Chip
                key={x.id}
                title={categories.data?.find((p) => p.id === x.parent_id)?.title + ' · ' + x.title}
                selected={parent === x.id}
                onPress={() => setParent(x.id)}
              />
            ))}
        </View>
      )}
      <Button
        title={showExamples ? 'Nascondi esempi' : 'Aggiungi esempi · facoltativo'}
        secondary
        onPress={() => setShowExamples(!showExamples)}
      />
      {showExamples && (
        <Input
          label="Esempi · uno per riga"
          multiline
          value={examples}
          onChangeText={setExamples}
          maxLength={1000}
        />
      )}
      <Label style={{ fontSize: 11, color: c.muted }}>
        Controlliamo nome, descrizione ed esempi. Le nuove categorie passano anche dalla revisione
        del team.
      </Label>
      <Button
        title={user ? 'Proponi categoria' : 'Accedi per proporre'}
        busy={busy}
        disabled={
          !!user &&
          (!parent ||
            title.trim().length < 3 ||
            description.trim().length < 20 ||
            issues.length > 0 ||
            checkedKey !== key ||
            !check.data?.allowed ||
            check.isFetching)
        }
        onPress={() => void send()}
      />
    </Screen>
  );
}
