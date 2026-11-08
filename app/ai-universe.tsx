import React, { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  Title,
  Label,
  Chip,
  Button,
  Card,
  Empty,
  Loading,
  ErrorState,
} from '../src/components/ui';
import { rpc, mediaSource } from '../src/lib/api';
import { useAction } from '../src/hooks/useAction';
import { useSession } from '../src/lib/session';
import type { Category } from '../src/types/domain';
import { colors as c } from '../src/theme/tokens';
export default function AiUniverse() {
  const [tab, setTab] = useState('art');
  const { user } = useSession();
  const action = useAction();
  const [answers, setAnswers] = useState<
    Record<string, { correct: boolean; groundTruth: string; evidence: string }>
  >({});
  const q = useQuery({ queryKey: ['categories'], queryFn: () => rpc<Category[]>('categories') });
  const quiz = useQuery({
    queryKey: ['quiz', user?.id],
    queryFn: () => rpc<{ items: { id: string; mediaUrl: string }[]; message: string }>('quiz'),
    enabled: tab === 'quiz',
  });
  const leaves = q.data?.filter(
    (x) =>
      x.terminal !== false &&
      (() => {
        let node: Category | undefined = x;
        let parentTitle = '';
        while (node?.parent_id) {
          node = q.data.find((a) => a.id === node?.parent_id);
          if (node?.depth === 2) parentTitle = node.title;
        }
        return (
          node?.title === 'AI Universe' &&
          (tab === 'tools' ? parentTitle === 'AI Tools' : parentTitle !== 'AI Tools')
        );
      })(),
  );
  return (
    <Screen>
      <Stack.Screen options={{ title: 'AI Universe' }} />
      <Label style={{ color: c.cyan, fontSize: 11, letterSpacing: 2 }}>
        CREATIVITÀ SENZA CONFINI
      </Label>
      <Title>Oltre il possibile.</Title>
      <Label style={{ color: c.muted }}>
        Scegli l’arte che ti sorprende. Metti alla prova i tuoi strumenti preferiti.
      </Label>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {[
          ['art', 'Art Battle'],
          ['tools', 'Tools Arena'],
          ['quiz', 'Real or AI?'],
        ].map(([id, title]) => (
          <Chip key={id} title={title} selected={tab === id} onPress={() => setTab(id)} />
        ))}
      </View>
      {tab === 'quiz' ? (
        quiz.isPending ? (
          <Loading />
        ) : quiz.error ? (
          <ErrorState error={quiz.error} retry={() => void quiz.refetch()} />
        ) : quiz.data?.items.length ? (
          <View style={{ gap: 16 }}>
            {quiz.data.items.map((item) => (
              <Card key={item.id}>
                <Image
                  source={mediaSource(item.mediaUrl)}
                  style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 18 }}
                  contentFit="cover"
                  cachePolicy="none"
                  accessibilityLabel="Immagine del quiz, provenienza da indovinare"
                />
                {answers[item.id] ? (
                  <>
                    <Title style={{ fontSize: 22 }}>
                      {answers[item.id].correct ? 'Ci hai preso!' : 'Questa volta ti ha sorpreso.'}
                    </Title>
                    <Label>Provenienza: {answers[item.id].groundTruth}</Label>
                    <Label>{answers[item.id].evidence}</Label>
                  </>
                ) : (
                  <>
                    <Label>Fotografia reale o creazione AI?</Label>
                    {['REAL', 'AI'].map((answer) => (
                      <Button
                        key={answer}
                        title={answer === 'REAL' ? 'Fotografia reale' : 'Creazione AI'}
                        busy={action.busy}
                        onPress={() => {
                          if (!user) {
                            router.push('/(auth)/login');
                            return;
                          }
                          void action.run<{
                            correct: boolean;
                            groundTruth: string;
                            evidence: string;
                          }>('quiz_answer', { quizId: item.id, answer }, (data) =>
                            setAnswers((previous) => ({ ...previous, [item.id]: data })),
                          );
                        }}
                      />
                    ))}
                  </>
                )}
              </Card>
            ))}
          </View>
        ) : (
          <Empty
            title="Il mistero merita fonti certe."
            body={quiz.data?.message || 'Catalogo in preparazione.'}
          />
        )
      ) : q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : (
        leaves?.map((x) => (
          <Card key={x.id}>
            <Title style={{ fontSize: 23 }}>{x.title}</Title>
            <Label style={{ fontSize: 12, color: c.muted }}>
              {tab === 'tools'
                ? 'Card di strumenti dimostrativi. Scegli la tua preferenza, senza claim inventati.'
                : 'Creazioni originali con provenienza dichiarata. Un campione per foglia.'}
            </Label>
            <Button title="Entra in TILT" onPress={() => router.push(`/category/${x.id}`)} />
          </Card>
        ))
      )}
      <Label style={{ color: c.muted, fontSize: 11 }}>
        AI Universe non usa un generatore AI dentro l’app. Le preferenze e i duelli restano sul
        server locale.
      </Label>
    </Screen>
  );
}
