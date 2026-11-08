import React, { useState, useRef, useEffect } from 'react';
import * as Crypto from 'expo-crypto';
import { View, Alert, Switch } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Label, Input, Chip, Button, Card, Empty } from '../src/components/ui';
import { API_URL, getToken, rpc } from '../src/lib/api';
import { queryClient, useSession } from '../src/lib/session';
import { colors as c } from '../src/theme/tokens';
import type { Category } from '../src/types/domain';
import { normalizeReferenceUrl } from '../src/utils/references';
import { suggestCategories, categoryPath } from '../src/utils/categories';
import { useUploadSelection } from '../src/features/uploadSelection';
export default function Upload() {
  const { user } = useSession();
  const [uri, setUri] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tagText, setTagText] = useState('');
  const tags = [
    ...new Set(
      tagText
        .split(/[,\n]/)
        .map((tag) => tag.trim().replace(/^#+/, '').normalize('NFKC').toLowerCase())
        .filter(Boolean),
    ),
  ];
  const validTags =
    tags.length <= 20 && tags.every((tag) => tag.length <= 40 && /^[\p{L}\p{N} _-]+$/u.test(tag));
  const [kind, setKind] = useState('illustration');
  const [selected, setSelected] = useState<string[]>([]);
  const [rights, setRights] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const operation = useRef<{ key: string; id: string } | null>(null);
  const [progress, setProgress] = useState('');
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(true);
  const [references, setReferences] = useState<Record<string, { name?: string; url?: string }>>({});
  const cats = useQuery({ queryKey: ['categories'], queryFn: () => rpc<Category[]>('categories') });
  useEffect(
    () =>
      useUploadSelection.subscribe((state) => {
        if (!state.categoryId) return;
        const cat = cats.data?.find((x) => x.id === state.categoryId);
        if (!cat) return;
        setSelected((previous) => (previous.includes(cat.id) ? previous : [cat.id]));
        if (cat.allowed_kinds && !cat.allowed_kinds.includes(kind)) setKind(cat.allowed_kinds[0]);
        setSearch('');
        setShowPicker(false);
        useUploadSelection.getState().choose(null);
      }),
    [cats.data, kind],
  );
  const available = cats.data || [];
  const suggestionText = search.trim() || [title, caption, ...tags].join(' ').trim();
  const categoryResults = suggestionText
    ? suggestCategories(suggestionText, available, 12)
    : available.slice(0, 6);
  const selectedCategories = selected
    .map((id) => cats.data?.find((x) => x.id === id))
    .filter((x): x is Category => !!x);
  const metadata = Object.fromEntries(
    selectedCategories.map((cat) => [
      cat.id,
      { name: references[cat.id]?.name ?? title, url: references[cat.id]?.url || '' },
    ]),
  );
  const validReferences =
    selectedCategories.length > 0 &&
    selectedCategories.every((cat) => {
      const ref = metadata[cat.id];
      if (!ref.name.trim()) return false;
      try {
        return !cat.requires_url || !!normalizeReferenceUrl(ref.url);
      } catch {
        return false;
      }
    });
  if (!user)
    return (
      <Screen>
        <Empty
          title="La tua creatività merita spazio."
          action="Accedi per pubblicare"
          onPress={() => router.replace('/(auth)/login')}
        />
      </Screen>
    );
  const choose = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });
      if (!result.canceled) {
        const file = result.assets[0];
        if ((file.fileSize || 0) > 8 * 1024 * 1024) {
          Alert.alert('Immagine troppo grande', 'Scegli un file fino a 8 MB.');
          return;
        }
        setUri(file.uri);
      }
    } catch {
      Alert.alert('Galleria non disponibile', 'Controlla i permessi e riprova.');
    }
  };
  const submit = async () => {
    if (sending.current) return;
    if (
      !uri ||
      selected.length < 1 ||
      selected.length > 3 ||
      title.trim().length < 1 ||
      !validReferences ||
      !rights ||
      !consent ||
      !validTags ||
      selected.length !== 1
    )
      return;
    sending.current = true;
    setBusy(true);
    const expectedToken = getToken();
    const key = JSON.stringify({ uri, title, caption, tags, kind, selected, metadata });
    if (operation.current?.key !== key) operation.current = { key, id: Crypto.randomUUID() };
    try {
      setProgress('Prepariamo l’immagine…');
      const image = await manipulateAsync(uri, [{ resize: { width: 1600 } }], {
        compress: 0.86,
        format: SaveFormat.JPEG,
      });
      const form = new FormData();
      form.append(
        'metadata',
        JSON.stringify({
          clientOperationId: operation.current.id,
          title,
          caption,
          tags,
          kind,
          categoryIds: selected,
          rights,
          adultConsent: consent,
          metadata: Object.fromEntries(
            Object.entries(metadata).map(([id, ref]) => [
              id,
              { name: ref.name, url: ref.url ? normalizeReferenceUrl(ref.url) : undefined },
            ]),
          ),
          provenance:
            kind === 'ai_art'
              ? 'ai_generated'
              : kind === 'photo'
                ? 'unknown'
                : 'original_illustration',
        }),
      );
      form.append('image', new File(image.uri));
      setProgress('Invio al server locale…');
      if (getToken() !== expectedToken) throw new Error('L’account è cambiato. Riapri il modulo.');
      const res = await expoFetch(API_URL + '/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${expectedToken}` },
        body: form,
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(
          e.code === 'INVALID_MEDIA'
            ? 'Il file non è un’immagine supportata.'
            : 'Invio non completato. Controlla i dati e riprova.',
        );
      }
      await queryClient.invalidateQueries({ queryKey: ['uploads'] });
      Alert.alert('Proposta inviata.', 'Sarà visibile dopo la revisione.');
      setUri('');
      setTitle('');
      setCaption('');
      setSelected([]);
      setRights(false);
      setConsent(false);
      operation.current = null;
      router.replace('/(tabs)/profile');
    } catch (e) {
      Alert.alert(
        'Invio non confermato',
        (e as Error).message + ' Riprova: eviteremo una proposta duplicata.',
      );
    } finally {
      setBusy(false);
      sending.current = false;
      setProgress('');
    }
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Pubblica' }} />
      <Title style={{ fontSize: 24 }}>La tua immagine</Title>
      <Label style={{ color: c.muted }}>
        I contenuti vengono controllati prima della pubblicazione.
      </Label>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {[
          ['photo', 'Foto'],
          ['illustration', 'Illustrazione'],
          ['ai_art', 'AI Art'],
          ['ai_tool', 'AI Tool'],
        ].map(([id, label]) => (
          <Chip key={id} title={label} selected={kind === id} onPress={() => setKind(id)} />
        ))}
      </View>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: 300, borderRadius: 22 }}
          contentFit="contain"
        />
      ) : (
        <Card>
          <Label style={{ textAlign: 'center', paddingVertical: 40, color: c.muted }}>
            JPEG, PNG o WebP · massimo 8 MB{'\n'}Solo immagini di cui hai i diritti.
          </Label>
        </Card>
      )}
      <Button
        title={uri ? 'Scegli un’altra immagine' : 'Scegli dalla galleria'}
        secondary
        onPress={() => void choose()}
        disabled={busy}
      />
      <Label style={{ color: c.cyan }}>1. Scegli dove gareggia</Label>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {selectedCategories.map((cat) => (
          <Chip
            key={cat.id}
            title={`${cat.title} ×`}
            selected
            onPress={() => {
              setSelected((a) => a.filter((id) => id !== cat.id));
              if (selected.length === 1) setShowPicker(true);
            }}
          />
        ))}
      </View>
      <Input
        label="Descrizione · facoltativa"
        value={caption}
        onChangeText={setCaption}
        maxLength={400}
        multiline
      />
      <Input
        label="Tag liberi · separati da virgole"
        placeholder="bonsai, piante, giardinaggio"
        value={tagText}
        onChangeText={setTagText}
        multiline
        maxLength={820}
      />
      {!validTags && (
        <Label style={{ color: c.pink }}>
          Fino a 20 tag di 40 caratteri, con lettere, numeri, spazi, trattini o underscore.
        </Label>
      )}
      <Button
        secondary
        title="Suggerisci una categoria da descrizione e tag"
        onPress={() => {
          setSearch('');
          setShowPicker(true);
        }}
      />
      <Label style={{ fontSize: 11, color: c.muted }}>
        Suggerimenti da parole chiave e sinonimi. Scegli tu la categoria; i tag non cambiano
        categorie o voti.
      </Label>
      {showPicker && (
        <>
          <Input
            label={`Categoria unica · ${selected.length}/1`}
            value={search}
            onChangeText={setSearch}
            placeholder="Cerca una categoria"
          />
          <View style={{ gap: 8 }}>
            {categoryResults.map((x) => (
              <Chip
                key={x.id}
                title={categoryPath(x, available).join(' › ')}
                selected={selected.includes(x.id)}
                onPress={() => {
                  if (selected.length === 0 && x.allowed_kinds && !x.allowed_kinds.includes(kind))
                    setKind(x.allowed_kinds[0]);
                  setSelected((a) => (a.includes(x.id) ? a.filter((id) => id !== x.id) : [x.id]));
                  setSearch('');
                  setShowPicker(false);
                }}
              />
            ))}
          </View>
          <Label style={{ fontSize: 11, color: c.muted }}>
            {categoryResults.length
              ? 'Scegli una categoria esistente.'
              : 'Nessuna corrispondenza. Prova un sinonimo o un ramo più ampio.'}
          </Label>
        </>
      )}
      {!showPicker && selected.length === 0 && (
        <Button title="Scegli la categoria" secondary onPress={() => setShowPicker(true)} />
      )}
      <Label style={{ color: c.cyan }}>2. Dacci il riferimento giusto</Label>
      <Input
        label={selectedCategories[0]?.reference_label || 'Nome del contenuto'}
        placeholder={
          selectedCategories[0]?.reference_kind === 'person'
            ? 'Nome e cognome della persona'
            : 'Come si chiama?'
        }
        value={title}
        onChangeText={setTitle}
        maxLength={80}
      />
      {selectedCategories.map((cat, index) => (
        <View key={cat.id} style={{ gap: 12 }}>
          {index > 0 && cat.reference_kind !== selectedCategories[0]?.reference_kind && (
            <Input
              label={`${cat.reference_label} · ${cat.title}`}
              value={references[cat.id]?.name ?? title}
              onChangeText={(name) =>
                setReferences((r) => ({ ...r, [cat.id]: { ...r[cat.id], name } }))
              }
              maxLength={120}
            />
          )}
          {cat.requires_url && (
            <Input
              label={cat.reference_kind === 'website' ? 'Link del sito' : 'Link ufficiale'}
              placeholder="esempio.it"
              autoCapitalize="none"
              keyboardType="url"
              value={references[cat.id]?.url || ''}
              onChangeText={(url) =>
                setReferences((r) => ({ ...r, [cat.id]: { ...r[cat.id], url } }))
              }
            />
          )}
        </View>
      ))}
      {[
        { text: 'Ho il diritto di pubblicare questo contenuto.', value: rights, set: setRights },
        {
          text: 'Le persone riconoscibili sono adulte e hanno autorizzato la pubblicazione, oppure non ci sono persone riconoscibili.',
          value: consent,
          set: setConsent,
        },
      ].map((x) => (
        <View key={x.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Label style={{ flex: 1, fontSize: 12, lineHeight: 19 }}>{x.text}</Label>
          <Switch
            accessibilityLabel={x.text}
            value={x.value}
            onValueChange={x.set}
            trackColor={{ true: c.purple, false: c.border }}
          />
        </View>
      ))}
      <Label style={{ fontSize: 11, color: c.muted }}>
        La dichiarazione non costituisce una verifica certa dell’età o del consenso.
      </Label>
      {!!progress && <Label style={{ color: c.cyan }}>{progress}</Label>}
      <Button
        title="Invia per la revisione"
        busy={busy}
        disabled={
          !validTags ||
          selected.length !== 1 ||
          !uri ||
          title.trim().length < 1 ||
          !selected.length ||
          !validReferences ||
          !rights ||
          !consent
        }
        onPress={() => void submit()}
      />
    </Screen>
  );
}
