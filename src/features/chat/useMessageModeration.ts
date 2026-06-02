import { useCallback } from 'react';
import { Alert } from 'react-native';
import {
  blockUser,
  CHAT_COMMUNITY_GUIDELINES,
  chatReportReasonLabel,
  fetchBlockedUserIds,
  reportMessage,
  unblockUser,
  type ChatReportReason,
} from './moderation';
import { useChatStore } from './store';
import type { ChatMessageViewModel } from './types';

const REPORT_REASONS: ChatReportReason[] = ['spam', 'harassment', 'inappropriate', 'other'];

function showReportReasonPicker(onPick: (reason: ChatReportReason) => void) {
  Alert.alert(
    'Raportează mesajul',
    'Alege motivul. Echipa KHEYA va revizui raportul în 24 de ore.',
    [
      ...REPORT_REASONS.map((reason) => ({
        text: chatReportReasonLabel(reason),
        onPress: () => onPick(reason),
      })),
      { text: 'Anulează', style: 'cancel' },
    ],
  );
}

export function showChatCommunityGuidelines() {
  Alert.alert('Reguli comunitate', CHAT_COMMUNITY_GUIDELINES, [{ text: 'OK' }]);
}

export function useMessageModeration(currentUserId: string | null) {
  const blockedUserIds = useChatStore((s) => s.blockedUserIds);
  const addBlockedUserId = useChatStore((s) => s.addBlockedUserId);
  const removeBlockedUserId = useChatStore((s) => s.removeBlockedUserId);
  const removeMessagesByUserId = useChatStore((s) => s.removeMessagesByUserId);
  const setBlockedUserIds = useChatStore((s) => s.setBlockedUserIds);

  const loadBlockedUsers = useCallback(async () => {
    if (!currentUserId) {
      setBlockedUserIds([]);
      return new Set<string>();
    }
    const ids = await fetchBlockedUserIds(currentUserId);
    setBlockedUserIds([...ids]);
    return ids;
  }, [currentUserId, setBlockedUserIds]);

  const submitReport = useCallback(
    async (message: ChatMessageViewModel, reason: ChatReportReason) => {
      if (!currentUserId) return;

      try {
        await reportMessage({
          messageId: message.id,
          reporterId: currentUserId,
          reason,
        });
        Alert.alert(
          'Raport trimis',
          'Mulțumim. Vom analiza mesajul. Pentru urgențe: contact@kheya.ro',
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Nu s-a putut trimite raportul.';
        Alert.alert('Eroare', msg);
      }
    },
    [currentUserId],
  );

  const onReportMessage = useCallback(
    (message: ChatMessageViewModel) => {
      if (message.isOwn || !currentUserId) return;

      showReportReasonPicker((reason) => {
        if (reason === 'other') {
          Alert.prompt?.(
            'Detalii (opțional)',
            'Descrie pe scurt problema.',
            [
              { text: 'Anulează', style: 'cancel' },
              {
                text: 'Trimite',
                onPress: (text) => {
                  void (async () => {
                    try {
                      await reportMessage({
                        messageId: message.id,
                        reporterId: currentUserId,
                        reason: 'other',
                        details: text ?? undefined,
                      });
                      Alert.alert('Raport trimis', 'Mulțumim. Vom analiza mesajul.');
                    } catch (e) {
                      const msg =
                        e instanceof Error ? e.message : 'Nu s-a putut trimite raportul.';
                      Alert.alert('Eroare', msg);
                    }
                  })();
                },
              },
            ],
            'plain-text',
          );
          if (!Alert.prompt) {
            void submitReport(message, reason);
          }
          return;
        }
        void submitReport(message, reason);
      });
    },
    [currentUserId, submitReport],
  );

  const onBlockUser = useCallback(
    (message: ChatMessageViewModel) => {
      if (message.isOwn || !currentUserId) return;

      const alreadyBlocked = blockedUserIds.includes(message.userId);

      if (alreadyBlocked) {
        Alert.alert(
          `Deblochezi pe ${message.username}?`,
          'Vei vedea din nou mesajele acestui utilizator.',
          [
            { text: 'Anulează', style: 'cancel' },
            {
              text: 'Deblochează',
              onPress: () => {
                void (async () => {
                  try {
                    await unblockUser(currentUserId, message.userId);
                    removeBlockedUserId(message.userId);
                    Alert.alert('Deblocat', `${message.username} a fost deblocat.`);
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Nu s-a putut debloca.';
                    Alert.alert('Eroare', msg);
                  }
                })();
              },
            },
          ],
        );
        return;
      }

      Alert.alert(
        `Blochezi pe ${message.username}?`,
        'Nu vei mai vedea mesajele acestui utilizator în chatul global.',
        [
          { text: 'Anulează', style: 'cancel' },
          {
            text: 'Blochează',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await blockUser(currentUserId, message.userId);
                  addBlockedUserId(message.userId);
                  removeMessagesByUserId(message.userId);
                  Alert.alert('Blocat', `Nu vei mai vedea mesajele de la ${message.username}.`);
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'Nu s-a putut bloca.';
                  Alert.alert('Eroare', msg);
                }
              })();
            },
          },
        ],
      );
    },
    [
      addBlockedUserId,
      blockedUserIds,
      currentUserId,
      removeBlockedUserId,
      removeMessagesByUserId,
    ],
  );

  const onMessageLongPress = useCallback(
    (message: ChatMessageViewModel) => {
      if (message.isOwn || !currentUserId) return;

      const isBlocked = blockedUserIds.includes(message.userId);

      Alert.alert(message.username, undefined, [
        {
          text: 'Raportează mesajul',
          onPress: () => onReportMessage(message),
        },
        {
          text: isBlocked ? 'Deblochează utilizatorul' : 'Blochează utilizatorul',
          style: isBlocked ? 'default' : 'destructive',
          onPress: () => onBlockUser(message),
        },
        { text: 'Anulează', style: 'cancel' },
      ]);
    },
    [blockedUserIds, currentUserId, onBlockUser, onReportMessage],
  );

  return {
    blockedUserIds,
    loadBlockedUsers,
    onMessageLongPress,
    showCommunityGuidelines: showChatCommunityGuidelines,
  };
}
