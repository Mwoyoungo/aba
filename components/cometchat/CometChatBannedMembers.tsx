"use client";

/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatButton,
  CometChatGroupEvents,
  CometChatList,
  CometChatListItem,
  CometChatUIKitLoginListener,
  IGroupMemberUnBanned,
  States,
  getLocalizedString,
} from '@cometchat/chat-uikit-react';

const unbanIconURL = '/cometchat/close.svg';

interface bannedMembersProp {
  group: CometChat.Group;
}

export const CometChatBannedMembers = (props: bannedMembersProp) => {
  const { group } = props;
  const [bannedMembers, setBannedMembers] = useState<CometChat.User[]>([]);
  const [state, setState] = useState<States>(States.loading);
  const bannedMembersRequestBuilderRef = useRef<any>({});

  useEffect(() => {
    const GUID = group.getGuid();
    const limit = 30;
    const bannedMembersRequest = new CometChat.BannedMembersRequestBuilder(GUID).setLimit(limit).build();
    bannedMembersRequest.fetchNext().then(
      (bannedMembers) => { setBannedMembers(bannedMembers); },
      (error) => { console.error('Banned Group Member list fetching failed with exception:', error); }
    );
  }, [group]);

  const unbanMember = useCallback(
    async (bannedMember: CometChat.User): Promise<void> => {
      try {
        CometChat.unbanGroupMember(group.getGuid(), bannedMember.getUid()).then(() => {
          const unbannedUser: IGroupMemberUnBanned = {
            unbannedUser: bannedMember,
            unbannedBy: CometChatUIKitLoginListener.getLoggedInUser()!,
            unbannedFrom: group,
          };
          CometChatGroupEvents.ccGroupMemberUnbanned.next(unbannedUser);
          setBannedMembers((prevState) => {
            return prevState.filter((filterMember) => bannedMember.getUid() !== filterMember.getUid());
          });
        });
      } catch (error) {
        console.log(error);
      }
    },
    [group]
  );

  function getDefaultListTailView(bannedMember: CometChat.User): JSX.Element | null {
    return (
      <CometChatButton
        iconURL={unbanIconURL}
        onClick={() => unbanMember(bannedMember)}
        hoverText={getLocalizedString('unban')}
      />
    );
  }

  function getListItem(): (bannedMember: CometChat.User) => JSX.Element {
    return function (bannedMember: CometChat.User) {
      return (
        <CometChatListItem
          id={bannedMember.getUid()}
          title={bannedMember.getName()}
          avatarURL={bannedMember.getAvatar()}
          avatarName={bannedMember.getName()}
          trailingView={getDefaultListTailView(bannedMember)}
        />
      );
    };
  }

  const fetchNextAndAppendBannedMembers = useCallback(async (): Promise<void> => {
    try {
      setState(States.loading);
      if (Object.keys(bannedMembersRequestBuilderRef.current).length === 0) {
        const finalBannedMembersRequestBuilder = new CometChat.BannedMembersRequestBuilder(group.getGuid())
          .setLimit(30)
          .build();
        bannedMembersRequestBuilderRef.current = finalBannedMembersRequestBuilder;
      }
      const bannedMembersList = await bannedMembersRequestBuilderRef.current.fetchNext();
      if (bannedMembersList.length !== 0) {
        setBannedMembers((prevState) => {
          const list = [...prevState, ...bannedMembersList];
          return list.filter((obj1, i, arr) => arr.findIndex((obj2) => obj2.uid === obj1.uid) === i);
        });
      }
      setState(States.loaded);
    } catch (error) {
      console.log(error);
      setState(States.error);
    }
  }, [group, bannedMembersRequestBuilderRef]);

  useEffect(() => {
    fetchNextAndAppendBannedMembers();
  }, [fetchNextAndAppendBannedMembers, group]);

  const subscribeToEvents = useCallback(() => {
    const groupMemberBannedSub = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item) => {
      const { kickedFrom, kickedUser } = item;
      if (kickedFrom.getGuid() === group.getGuid()) {
        setBannedMembers((prevState) => [...prevState, kickedUser]);
      }
    });
    const groupMemberUnbannedSub = CometChatGroupEvents.ccGroupMemberUnbanned.subscribe((item) => {
      const { unbannedFrom, unbannedUser } = item;
      if (unbannedFrom.getGuid() === group.getGuid()) {
        setBannedMembers((prevState) => {
          return prevState.filter((filterMember) => unbannedUser.getUid() !== filterMember.getUid());
        });
      }
    });
    return () => {
      groupMemberBannedSub.unsubscribe();
      groupMemberUnbannedSub.unsubscribe();
    };
  }, [group]);

  const attachSDKGroupListener = useCallback(() => {
    const listenerId = 'BannedMembers_GroupListener_' + String(Date.now());
    CometChat.addGroupListener(
      listenerId,
      new CometChat.GroupListener({
        onGroupMemberBanned: (
          message: CometChat.Action,
          kickedUser: CometChat.User,
          kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          if (group.getGuid() !== kickedFrom.getGuid()) return;
          CometChatGroupEvents.ccGroupMemberBanned.next({ message, kickedBy, kickedFrom, kickedUser });
        },
        onGroupMemberUnbanned: (
          message: CometChat.Action,
          unbannedUser: CometChat.User,
          unbannedBy: CometChat.User,
          unbannedFrom: CometChat.Group
        ) => {
          if (group.getGuid() !== unbannedFrom.getGuid()) return;
          CometChatGroupEvents.ccGroupMemberUnbanned.next({ message, unbannedBy, unbannedFrom, unbannedUser });
        },
      })
    );
    return () => CometChat.removeGroupListener(listenerId);
  }, [group]);

  useEffect(() => {
    const unsubscribeFromEvents = subscribeToEvents();
    const unsubscribeFromSDKEvents = attachSDKGroupListener();
    return () => {
      unsubscribeFromEvents();
      unsubscribeFromSDKEvents();
    };
  }, [subscribeToEvents, attachSDKGroupListener]);

  return (
    <div className="cometchat-banned-members">
      {state === States.loading ? (
        <div className="cometchat-banned-members__shimmer">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="cometchat-banned-members__shimmer-item">
              <div className="cometchat-banned-members__shimmer-item-avatar"></div>
              <div className="cometchat-banned-members__shimmer-item-title"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {bannedMembers.length === 0 ? (
            <div className="cometchat-banned-members__empty">
              <div className="cometchat-banned-members__empty-icon" />
              <div className="cometchat-banned-members__empty-text">{getLocalizedString('no_banned_members')}</div>
            </div>
          ) : (
            <CometChatList
              hideSearch={true}
              list={bannedMembers}
              listItemKey="getUid"
              itemView={getListItem()}
              showSectionHeader={false}
              onScrolledToBottom={() => fetchNextAndAppendBannedMembers()}
              state={bannedMembers.length === 0 ? States.loading : States.loaded}
            />
          )}
        </>
      )}
    </div>
  );
};
