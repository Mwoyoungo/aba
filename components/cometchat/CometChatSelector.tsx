"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatButton,
  CometChatCallLogs,
  CometChatConversations,
  CometChatGroups,
  CometChatOption,
  CometChatUIKit,
  CometChatUsers,
  getLocalizedString,
  CometChatContextMenu,
  Placement,
} from '@cometchat/chat-uikit-react';
import { AppContext } from '@/context/cometchat/AppContext';
import { useCometChatContext } from '@/context/cometchat/CometChatContext';
import { CallLog } from '@cometchat/calls-sdk-javascript';
import { CometChatSettings } from '@/lib/cometchatSettings';
import { CometChatJoinGroup } from './CometChatJoinGroup';
import CometChatCreateGroup from './CometChatCreateGroup';

const chatIcon = '/cometchat/start_chat.svg';
const createGroupIcon = '/cometchat/create-group.svg';
const logoutIcon = '/cometchat/logout.svg';
const userIcon = '/cometchat/user.svg';

interface SelectorProps {
  group?: CometChat.Group;
  showJoinGroup?: boolean;
  activeTab?: string;
  activeItem?: CometChat.User | CometChat.Group | CometChat.Conversation | CometChat.Call | CallLog;
  onSelectorItemClicked?: (
    input: CometChat.User | CometChat.Group | CometChat.Conversation | CometChat.Call,
    type: string
  ) => void;
  onProtectedGroupJoin?: (group: CometChat.Group) => void;
  showCreateGroup?: boolean;
  setShowCreateGroup?: Dispatch<SetStateAction<boolean>>;
  onHide?: () => void;
  onNewChatClicked?: () => void;
  onGroupCreated?: (group: CometChat.Group) => void;
  onSearchClicked?: () => void;
  hideCreateGroupButton?: boolean;
}

const CometChatSelector = (props: SelectorProps) => {
  const {
    group,
    showJoinGroup,
    activeItem,
    activeTab,
    onSelectorItemClicked = () => {},
    onProtectedGroupJoin = () => {},
    showCreateGroup,
    setShowCreateGroup = () => {},
    onHide = () => {},
    onNewChatClicked = () => {},
    onGroupCreated = () => {},
    onSearchClicked = () => {},
    hideCreateGroupButton = true,
  } = props;

  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const { setAppState } = useContext(AppContext);
  const { chatFeatures, callFeatures } = useCometChatContext();

  const usersRequestBuilder = React.useMemo(() => {
    let builder = new CometChat.UsersRequestBuilder().setLimit(30);
    if (chatFeatures?.userManagement?.friendsOnly) {
      builder = builder.friendsOnly(true);
    }
    return builder;
  }, [chatFeatures?.userManagement?.friendsOnly]);

  useEffect(() => {
    CometChatUIKit.getLoggedinUser().then((user) => {
      setLoggedInUser(user ?? null);
    }).catch(() => setLoggedInUser(null));

    const listenerID = `SelectorLoginListener_${Date.now()}`;
    CometChat.addLoginListener(listenerID, new CometChat.LoginListener({
      loginSuccess: (user: CometChat.User) => setLoggedInUser(user),
      logoutSuccess: () => setLoggedInUser(null),
    }));
    return () => CometChat.removeLoginListener(listenerID);
  }, []);

  useEffect(() => {
    if (activeTab === 'calls') {
      const voiceCallIcons = document.getElementsByClassName('cometchat-call-logs__list-item-trailing-view-audio');
      const videoCallIcons = document.getElementsByClassName('cometchat-call-logs__list-item-trailing-view-video');

      const toggleCallIcons = () => {
        const voice = document.getElementsByClassName('cometchat-call-logs__list-item-trailing-view-audio');
        const video = document.getElementsByClassName('cometchat-call-logs__list-item-trailing-view-video');
        Array.from(voice).forEach((icon: any) => {
          icon.style.display = callFeatures.voiceAndVideoCalling.oneOnOneVoiceCalling ? '' : 'none';
        });
        Array.from(video).forEach((icon: any) => {
          icon.style.display = callFeatures.voiceAndVideoCalling.oneOnOneVideoCalling ? '' : 'none';
        });
      };

      if (voiceCallIcons.length === 0 && videoCallIcons.length === 0) {
        const interval = setInterval(() => {
          if (voiceCallIcons.length > 0 || videoCallIcons.length > 0) {
            clearInterval(interval);
            toggleCallIcons();
          }
        }, 1);
        return () => clearInterval(interval);
      } else {
        toggleCallIcons();
      }
    }
  }, [callFeatures, activeTab]);

  const getOptions = (): CometChatOption[] => {
    return [
      new CometChatOption({
        id: 'logged-in-user',
        title: loggedInUser?.getName() || loggedInUser?.getUid() || 'Profile',
        iconURL: userIcon,
      }),
      new CometChatOption({
        id: 'create-conversation',
        title: getLocalizedString('create_conversation') || 'New Chat',
        iconURL: chatIcon,
        onClick: () => { onNewChatClicked(); },
      }),
      new CometChatOption({
        id: 'log-out',
        title: getLocalizedString('log_out') || 'Log Out',
        iconURL: logoutIcon,
        onClick: () => { logOut(); },
      }),
    ];
  };

  const logOut = () => {
    CometChatUIKit.logout()
      .then(() => {
        setLoggedInUser(null);
        setAppState({ type: 'resetAppState' });
      })
      .catch((error) => {
        console.error('error', error);
      });
  };

  const conversationsHeaderView = () => {
    return (
      <div className="cometchat-conversations-header">
        <div className="cometchat-conversations-header__title">{getLocalizedString('conversation_chat_title')}</div>
        <div className="chat-menu">
          {loggedInUser && (
            <CometChatContextMenu
              key="delete-button"
              useParentContainer
              closeOnOutsideClick={true}
              placement={Placement.bottom}
              data={getOptions() as CometChatOption[]}
              topMenuSize={1}
              onOptionClicked={(e: CometChatOption) => {
                const { onClick } = e;
                if (onClick) { onClick(); }
              }}
            />
          )}
        </div>
      </div>
    );
  };

  const groupsHeaderView = () => {
    return (
      <div className="cometchat-groups-header">
        <div className="cometchat-groups-header__title">{getLocalizedString('group_title')}</div>
        {!hideCreateGroupButton && (
          <CometChatButton
            onClick={() => { setShowCreateGroup(true); }}
            iconURL={createGroupIcon}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {loggedInUser && (
        <>
          {showJoinGroup && group && (
            <CometChatJoinGroup
              group={group}
              onHide={onHide}
              onProtectedGroupJoin={(group) => onProtectedGroupJoin(group)}
            />
          )}
          {activeTab === 'chats' ? (
            <CometChatConversations
              showSearchBar={
                (chatFeatures && chatFeatures?.coreMessagingExperience?.conversationAndAdvancedSearch) ?? true
              }
              onSearchBarClicked={onSearchClicked}
              activeConversation={activeItem as CometChat.Conversation}
              headerView={conversationsHeaderView()}
              onItemClick={(e) => { onSelectorItemClicked(e, 'updateSelectedItem'); }}
              hideUserStatus={
                (chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence) ??
                !CometChatSettings.chatFeatures.coreMessagingExperience.userAndFriendsPresence
              }
              hideReceipts={
                (chatFeatures && !chatFeatures?.coreMessagingExperience?.messageDeliveryAndReadReceipts) ??
                !CometChatSettings.chatFeatures.coreMessagingExperience.messageDeliveryAndReadReceipts
              }
            />
          ) : activeTab === 'calls' ? (
            <CometChatCallLogs
              activeCall={activeItem as CometChat.Call}
              onItemClick={(e: CometChat.Call) => { onSelectorItemClicked(e, 'updateSelectedItemCall'); }}
            />
          ) : activeTab === 'users' ? (
            <CometChatUsers
              activeUser={activeItem as CometChat.User}
              onItemClick={(e) => { onSelectorItemClicked(e, 'updateSelectedItemUser'); }}
              usersRequestBuilder={usersRequestBuilder}
              hideUserStatus={
                (chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence) ??
                !CometChatSettings.chatFeatures.coreMessagingExperience.userAndFriendsPresence
              }
            />
          ) : activeTab === 'groups' ? (
            <CometChatGroups
              activeGroup={activeItem as CometChat.Group}
              headerView={groupsHeaderView()}
              onItemClick={(e) => { onSelectorItemClicked(e, 'updateSelectedItemGroup'); }}
            />
          ) : null}
          {showCreateGroup && (
            <CometChatCreateGroup
              setShowCreateGroup={setShowCreateGroup}
              onGroupCreated={(group) => onGroupCreated(group)}
            />
          )}
        </>
      )}
    </>
  );
};

const MemoizedCometChatSelector = React.memo(CometChatSelector);
export { MemoizedCometChatSelector as CometChatSelector };
