"use client";

/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatAvatar,
  CometChatButton,
  CometChatConfirmDialog,
  CometChatConversationEvents,
  CometChatGroupEvents,
  CometChatGroupMembers,
  CometChatGroups,
  CometChatIncomingCall,
  CometChatMessageEvents,
  CometChatToast,
  CometChatUIKit,
  CometChatUIKitConstants,
  CometChatUIKitLoginListener,
  CometChatUIKitUtility,
  CometChatUserEvents,
  CometChatUsers,
  getLocalizedString,
  CometChatUIEvents,
  IMouseEvent,
  IActiveChatChanged,
  IGroupMemberKickedBanned,
  IGroupMemberAdded,
  IGroupMemberJoined,
  CometChatSearch,
  IMessages,
  MessageStatus,
  CometChatAIAssistantChat,
} from '@cometchat/chat-uikit-react';
import { CallLog, CometChatCalls } from '@cometchat/calls-sdk-javascript';
import { useCometChatContext } from '@/context/cometchat/CometChatContext';
import { AppContext, AppContextProvider } from '@/context/cometchat/AppContext';
import { CometChatSettings } from '@/lib/cometchatSettings';
import { CometChatMessages } from './CometChatMessages';
import { CometChatTabs } from './CometChatTabs';
import { CometChatSelector } from './CometChatSelector';
import { CometChatUserDetails } from './CometChatUserDetails';
import { CometChatThreadedMessages } from './CometChatThreadedMessages';
import { CometChatCallDetails } from './CometChatCallLogDetails';
import { CometChatAlertPopup } from './CometChatAlertPopup';
import { CometChatAddMembers } from './CometChatAddMembers';
import { CometChatBannedMembers } from './CometChatBannedMembers';
import { CometChatTransferOwnership } from './CometChatTransferOwnership';
import { CometChatJoinGroup } from './CometChatJoinGroup';
import { CometChatEmptyStateView } from './CometChatEmptyStateView';
import CometChatSearchView from './CometChatSearchView';

const blockIcon = '/cometchat/block.svg';
const deleteIcon = '/cometchat/delete.svg';
const addMembersIcon = '/cometchat/addMembers.svg';
const leaveGroupIcon = '/cometchat/leaveGroup.svg';
const backbutton = '/cometchat/arrow_back.svg';

interface ThreadProps { message: CometChat.BaseMessage; }
interface CometChatHomeProps {
  defaultUser?: CometChat.User;
  defaultGroup?: CometChat.Group;
  showGroupActionMessages?: boolean;
  autoOpenFirstItem?: boolean;
  defaultActiveTab?: 'chats' | 'calls' | 'users' | 'groups';
}

const MOBILE_BREAKPOINT = 768;

function CometChatHome({
  defaultUser, defaultGroup, showGroupActionMessages, autoOpenFirstItem = true, defaultActiveTab,
}: CometChatHomeProps) {
  const { chatFeatures, styleFeatures, layoutFeatures } = useCometChatContext();
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [group, setGroup] = useState<CometChat.Group>();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(defaultActiveTab ?? layoutFeatures.tabs[0]);
  const [selectedItem, setSelectedItem] = useState<
    CometChat.Conversation | CometChat.User | CometChat.Group | CometChat.Call | CallLog | undefined
  >();
  const [showNewChat, setShowNewChat] = useState<boolean>(false);
  const showJoinGroupRef = useRef(false);
  const [newChat, setNewChat] = useState<{ user?: CometChat.User; group?: CometChat.Group } | undefined>();
  const [showAlertPopup, setShowAlertPopup] = useState({ visible: false, description: '' });
  const [showToast, setShowToast] = useState(false);
  const toastTextRef = useRef<string>('');
  const isFreshChatRef = useRef<boolean>(false);
  const currentChatRef = useRef<CometChat.Conversation | null>(null);
  const { appState, setAppState } = useContext(AppContext);
  const freshChatRef = useRef<{ conversation: CometChat.Conversation | undefined; isNewChat: boolean }>({ conversation: undefined, isNewChat: false });
  const conversationItemClicked = useRef<boolean>(false);
  const activeSideComponentRef = useRef<string>('');
  const hasInitializedTab = useRef<boolean>(false);
  const colorScheme = 'dark';

  function isMobileView() { return window.innerWidth <= MOBILE_BREAKPOINT; }

  useEffect(() => {
    if (appState.sideComponent.type) activeSideComponentRef.current = appState.sideComponent.type;
    else activeSideComponentRef.current = '';
  }, [appState.sideComponent]);

  useEffect(() => {
    const chatChanged = CometChatUIEvents.ccActiveChatChanged.subscribe((activeChat: IActiveChatChanged) => {
      if (activeChat && !activeChat.message) {
        setAppState({ type: 'updateIsFreshChat', payload: true });
        isFreshChatRef.current = true;
      } else {
        setAppState({ type: 'updateIsFreshChat', payload: false });
        isFreshChatRef.current = false;
      }
    });
    return () => chatChanged.unsubscribe();
  }, []);

  useEffect(() => {
    const listenerID = `HomeLoginListener_${new Date().getTime()}`;
    CometChat.addLoginListener(listenerID, new CometChat.LoginListener({
      loginSuccess: (user: CometChat.User) => {
        setLoggedInUser(user);
      },
      logoutSuccess: () => {
        setLoggedInUser(null);
        setSelectedItem(undefined); setNewChat(undefined);
        setAppState({ type: 'updateSelectedItem', payload: undefined });
        setAppState({ type: 'updateSelectedItemUser', payload: undefined });
        setAppState({ type: 'updateSelectedItemGroup', payload: undefined });
        setAppState({ type: 'newChat', payload: undefined });
      },
    }));
    return () => CometChat.removeLoginListener(listenerID);
  }, []);

  useEffect(() => {
    const ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe(() => { toastTextRef.current = getLocalizedString('ownership_transferred_successfully'); setShowToast(true); });
    const ccGroupMemberScopeChanged = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(() => { toastTextRef.current = getLocalizedString('permissions_updated_successfully'); setShowToast(true); });
    const ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe(() => { toastTextRef.current = getLocalizedString('member_added'); setShowToast(true); });
    const ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe(() => { toastTextRef.current = getLocalizedString('member_banned'); setShowToast(true); });
    const ccGroupMemberUnbanned = CometChatGroupEvents.ccGroupMemberUnbanned.subscribe(() => { toastTextRef.current = getLocalizedString('member_unbanned'); setShowToast(true); });
    const ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe(() => { toastTextRef.current = getLocalizedString('member_removed'); setShowToast(true); });
    return () => { ccOwnershipChanged?.unsubscribe(); ccGroupMemberScopeChanged?.unsubscribe(); ccGroupMemberAdded?.unsubscribe(); ccGroupMemberBanned?.unsubscribe(); ccGroupMemberUnbanned?.unsubscribe(); ccGroupMemberKicked?.unsubscribe(); };
  }, []);

  useEffect(() => {
    CometChatUIKit.getLoggedinUser().then((user) => {
      setLoggedInUser(user ?? null);
    }).catch(() => setLoggedInUser(null));
  }, []);

  useEffect(() => {
    const isMessageListOpen = selectedItem && (selectedItem instanceof CometChat.User || selectedItem instanceof CometChat.Group || selectedItem instanceof CometChat.Conversation);
    if (activeTab === 'chats' || isMessageListOpen) return;
    const messageListenerId = `misc-message_${Date.now()}`;
    attachMessageReceivedListener(messageListenerId);
    return () => { CometChat.removeMessageListener(messageListenerId); };
  }, [activeTab, selectedItem]);

  const onMessageReceived = useCallback(async (message: CometChat.BaseMessage): Promise<void> => {
    if (message.getSender().getUid() !== CometChatUIKitLoginListener.getLoggedInUser()?.getUid() && !message.getDeliveredAt()) {
      try { CometChat.markAsDelivered(message); } catch (error) { console.error(error); }
    }
  }, []);

  const attachMessageReceivedListener = useCallback((messageListenerId: string) => {
    CometChat.addMessageListener(messageListenerId, new CometChat.MessageListener({
      onTextMessageReceived: (m: CometChat.TextMessage) => onMessageReceived(m),
      onMediaMessageReceived: (m: CometChat.MediaMessage) => onMessageReceived(m),
      onCustomMessageReceived: (m: CometChat.CustomMessage) => onMessageReceived(m),
    }));
  }, [onMessageReceived]);

  const updateUserAfterBlockUnblock = (user: CometChat.User) => {
    if (appState.selectedItemUser?.getUid() === user.getUid()) setAppState({ type: 'updateSelectedItemUser', payload: user });
    if ((appState.selectedItem?.getConversationWith() as CometChat.User)?.getUid?.() === user.getUid()) {
      appState.selectedItem?.setConversationWith(user);
      setAppState({ type: 'updateSelectedItem', payload: appState.selectedItem });
    }
  };

  const TabComponent = () => {
    const onTabClicked = (tabItem: { name: string; icon: string; id: string }) => {
      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
      setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
      setAppState({ type: 'updateThreadedMessage', payload: undefined });
      setAppState({ type: 'updateGoToMessageId', payload: undefined });
      setAppState({ type: 'updateShowMessagesSearch', payload: false });
      setNewChat(undefined); setActiveTab(tabItem.id);
    };
    return <CometChatTabs onTabClicked={onTabClicked} activeTab={activeTab} />;
  };

  const fetchDefaultUser = () => {
    if (!autoOpenFirstItem) return;
    if (defaultUser) { setSelectedItem(defaultUser); setAppState({ type: 'updateSelectedItemUser', payload: defaultUser }); return; }
    new CometChat.UsersRequestBuilder().setLimit(30).build().fetchNext().then((list: CometChat.User[]) => { setSelectedItem(list[0]); setAppState({ type: 'updateSelectedItemUser', payload: list[0] }); }, console.error);
  };

  const fetchDefaultGroup = () => {
    if (!autoOpenFirstItem) return;
    if (defaultGroup) { setSelectedItem(defaultGroup); setAppState({ type: 'updateSelectedItemGroup', payload: defaultGroup }); return; }
    new CometChat.GroupsRequestBuilder().setLimit(30).build().fetchNext().then((list: CometChat.Group[]) => { setSelectedItem(list[0]); setAppState({ type: 'updateSelectedItemGroup', payload: list[0] }); }, console.error);
  };

  const fetchDefaultCallDetail = () => {
    if (!autoOpenFirstItem || !loggedInUser) return;
    new CometChatCalls.CallLogRequestBuilder().setLimit(30).setAuthToken(loggedInUser.getAuthToken() as string).setCallCategory('call').build().fetchNext().then((list: CallLog[]) => setSelectedItem(list[0]), console.error);
  };

  const fetchDefaultConversation = () => {
    if (!autoOpenFirstItem) return;
    const conversationType = layoutFeatures?.chatType === 'group' ? 'group' : 'user';
    if (defaultUser && conversationType === 'user') {
      CometChat.getConversation(defaultUser.getUid(), conversationType).then(c => { setSelectedItem(c); setAppState({ type: 'updateSelectedItem', payload: c }); }, () => fetchDefaultUser());
    } else if (defaultGroup && conversationType === 'group') {
      CometChat.getConversation(defaultGroup.getGuid(), conversationType).then(c => { setSelectedItem(c); setAppState({ type: 'updateSelectedItem', payload: c }); }, () => fetchDefaultGroup());
    } else if (activeTab === 'chats') {
      new CometChat.ConversationsRequestBuilder().setLimit(30).setConversationType(layoutFeatures.withSideBar ? '' : conversationType).build().fetchNext().then((list: CometChat.Conversation[]) => setSelectedItem(list?.[0]), () => fetchDefaultGroup());
    }
  };

  useEffect(() => {
    if (layoutFeatures?.tabs && layoutFeatures?.withSideBar) {
      let tabToSet: string;
      if (!hasInitializedTab.current && defaultActiveTab && layoutFeatures?.tabs?.includes(defaultActiveTab)) tabToSet = defaultActiveTab;
      else if (hasInitializedTab.current && layoutFeatures?.tabs?.includes(activeTab)) return;
      else if (layoutFeatures?.tabs?.includes('chats')) tabToSet = 'chats';
      else if (layoutFeatures?.tabs?.includes('calls')) tabToSet = 'calls';
      else if (layoutFeatures?.tabs?.includes('users')) tabToSet = 'users';
      else tabToSet = 'groups';
      setActiveTab(tabToSet!);
      if (tabToSet! === 'chats') fetchDefaultConversation();
      else if (tabToSet! === 'calls' && loggedInUser) fetchDefaultCallDetail();
      else if (tabToSet! === 'users') fetchDefaultUser();
      else fetchDefaultGroup();
      hasInitializedTab.current = true;
    }
    if (!layoutFeatures?.withSideBar) { fetchDefaultConversation(); setActiveTab('chats'); }
  }, [layoutFeatures?.tabs, layoutFeatures?.withSideBar, loggedInUser, defaultActiveTab, activeTab]);

  useEffect(() => {
    if (activeTab === 'chats' && appState.selectedItem) setSelectedItem(appState.selectedItem);
    else if (activeTab === 'users' && appState.selectedItemUser) setSelectedItem(appState.selectedItemUser);
    else if (activeTab === 'groups' && appState.selectedItemGroup) setSelectedItem(appState.selectedItemGroup);
    else if (activeTab === 'calls' && appState.selectedItemCall) setSelectedItem(appState.selectedItemCall);
    else setSelectedItem(undefined);
  }, [activeTab]);

  const InformationComponent = useCallback(() => (
    <>
      {showNewChat ? <CometChatNewChatView />
        : selectedItem || newChat?.user || newChat?.group ? <CometChatMessagesViewComponent />
        : <CometChatEmptyStateView activeTab={activeTab} />}
    </>
  ), [activeTab, showNewChat, selectedItem, newChat, appState.goToMessageId]);

  const CometChatMessagesViewComponent = () => {
    const [showComposer, setShowComposer] = useState(true);
    const [messageUser, setMessageUser] = useState<CometChat.User>();
    const [messageGroup, setMessageGroup] = useState<CometChat.Group>();
    const { layoutFeatures } = useCometChatContext();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
      if (newChat?.user) { setMessageUser(newChat.user); setMessageGroup(undefined); }
      else if (newChat?.group) { setMessageUser(undefined); setMessageGroup(newChat.group); }
      else {
        if (activeTab === 'chats') {
          if ((selectedItem as CometChat.Conversation)?.getConversationType?.() === CometChatUIKitConstants.MessageReceiverType.user) {
            setMessageUser((selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.User); setMessageGroup(undefined);
          } else if ((selectedItem as CometChat.Conversation)?.getConversationType?.() === CometChatUIKitConstants.MessageReceiverType.group) {
            setMessageUser(undefined); setMessageGroup((selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.Group);
          }
        } else if (activeTab === 'users') { setMessageUser(selectedItem as CometChat.User); setMessageGroup(undefined); }
        else if (activeTab === 'groups') { setMessageUser(undefined); setMessageGroup(selectedItem as CometChat.Group); }
        else { setMessageUser(undefined); setMessageGroup(undefined); }
      }
    }, [activeTab, selectedItem]);

    const updateisFirstChat = ({ message, status }: IMessages) => {
      const receiverId = message?.getReceiverId();
      const sender = message?.getSender();
      if (((appState.selectedItemUser && (appState.selectedItemUser.getUid() == receiverId || ((!sender || (sender && appState.selectedItemUser.getUid() == sender.getUid())) && receiverId == loggedInUser?.getUid()))) || (appState.selectedItemGroup && (appState.selectedItemGroup.getGuid() == receiverId || loggedInUser?.getUid() == receiverId))) && isFreshChatRef.current && status == MessageStatus.success) {
        setAppState({ type: 'updateIsFreshChat', payload: false }); isFreshChatRef.current = false;
        const convWith = appState.selectedItemUser ? appState.selectedItemUser.getUid() : appState.selectedItemGroup?.getGuid();
        const convType = appState.selectedItemUser ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
        if (!convWith) return;
        CometChat.getConversation(convWith, convType).then(c => { setAppState({ type: 'updateSelectedItem', payload: c }); currentChatRef.current = c; });
      }
    };

    const subscribeToEvents = useCallback(() => {
      const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(u => { if (u.getBlockedByMe()) setShowComposer(false); updateUserAfterBlockUnblock(u); });
      const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe(u => { if (!u.getBlockedByMe()) setShowComposer(true); updateUserAfterBlockUnblock(u); });
      const ccMessageDeleted = CometChatMessageEvents.ccMessageDeleted.subscribe(msg => { if (msg.getId() === appState.threadedMessage?.getId()) setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); });
      const ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe((data: IMessages) => updateisFirstChat(data));
      const onTextMessageReceived = CometChatMessageEvents.onTextMessageReceived.subscribe((m: CometChat.TextMessage) => updateisFirstChat({ message: m, status: MessageStatus.success }));
      const onMediaMessageReceived = CometChatMessageEvents.onMediaMessageReceived.subscribe((m: CometChat.MediaMessage) => updateisFirstChat({ message: m, status: MessageStatus.success }));
      const onCustomMessageReceived = CometChatMessageEvents.onCustomMessageReceived.subscribe((m: CometChat.CustomMessage) => updateisFirstChat({ message: m, status: MessageStatus.success }));
      return () => { ccUserBlocked?.unsubscribe(); ccUserUnblocked?.unsubscribe(); ccMessageDeleted?.unsubscribe(); ccMessageSent?.unsubscribe(); onTextMessageReceived?.unsubscribe(); onMediaMessageReceived?.unsubscribe(); onCustomMessageReceived?.unsubscribe(); };
    }, [selectedItem]);

    useEffect(() => {
      if (messageUser?.getBlockedByMe?.()) setShowComposer(false);
      const unsub = subscribeToEvents(); return () => unsub();
    }, [subscribeToEvents, selectedItem]);

    const showSideComponent = () => {
      let type = '';
      if (activeTab === 'chats') type = (selectedItem as CometChat.Conversation)?.getConversationType?.() === 'group' ? 'group' : 'user';
      else if (activeTab === 'users') type = 'user';
      else if (activeTab === 'groups') type = 'group';
      if (newChat?.user) type = 'user';
      else if (newChat?.group) type = 'group';
      if (activeSideComponentRef.current !== type) { activeSideComponentRef.current = type; setAppState({ type: 'updateSideComponent', payload: { visible: true, type } }); }
    };

    const updateThreadedMessage = (msg: CometChat.BaseMessage) => {
      setAppState({ type: 'updateSideComponent', payload: { visible: true, type: 'threadedMessage' } });
      setAppState({ type: 'updateThreadedMessage', payload: msg });
    };

    const onBack = () => {
      setSelectedItem(undefined); setNewChat(undefined);
      setAppState({ type: 'updateSelectedItem', payload: undefined });
      setAppState({ type: 'updateSelectedItemUser', payload: undefined });
      setAppState({ type: 'updateSelectedItemGroup', payload: undefined });
      setAppState({ type: 'newChat', payload: undefined });
    };

    const onSearchClicked = () => {
      setAppState({ type: 'updateShowMessagesSearch', payload: true });
      setAppState({ type: 'updateSideComponent', payload: { visible: true, type: 'search' } });
      activeSideComponentRef.current = '';
    };

    let messageComponent = (
      <CometChatMessages user={messageUser} group={messageGroup} onBack={onBack} onHeaderClicked={showSideComponent} onThreadRepliesClick={updateThreadedMessage} showComposer={showComposer} onSearchClicked={onSearchClicked} goToMessageId={appState.threadSearchMessage ? undefined : appState.goToMessageId} searchKeyword={appState.goToMessageId ? appState.searchKeyword : undefined} showGroupActionMessages={showGroupActionMessages} />
    );

    if (!conversationItemClicked.current && ((layoutFeatures.chatType === 'user' && defaultUser && activeTab !== 'groups') || (layoutFeatures.chatType === 'group' && defaultGroup && activeTab !== 'users'))) {
      messageComponent = <CometChatMessages user={layoutFeatures.chatType === 'user' ? defaultUser : undefined} group={layoutFeatures.chatType === 'group' ? defaultGroup : undefined} onBack={onBack} onHeaderClicked={showSideComponent} onThreadRepliesClick={updateThreadedMessage} showComposer={showComposer} onSearchClicked={onSearchClicked} goToMessageId={appState.threadSearchMessage ? undefined : appState.goToMessageId} searchKeyword={appState.goToMessageId ? appState.searchKeyword : undefined} showGroupActionMessages={showGroupActionMessages} />;
    }

    if (messageUser && messageUser.getRole() === '@agentic') {
      messageComponent = <CometChatAIAssistantChat user={messageUser} onBackButtonClicked={onBack} showBackButton={isMobile} />;
    }

    return (
      <>
        {(selectedItem as any)?.mode === 'call' ? (
          <CometChatCallDetails selectedItem={selectedItem as CometChat.Call} onBack={() => { setSelectedItem(undefined); setAppState({ type: 'updateSelectedItemCall', payload: undefined }); }} />
        ) : messageComponent}
      </>
    );
  };

  const CometChatNewChatView: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<string>('user');
    const [grp, setGrp] = useState<CometChat.Group>();
    const loggedIn = CometChatUIKitLoginListener.getLoggedInUser();
    const { chatFeatures } = useCometChatContext();

    const joinGroup = (e: CometChat.Group) => {
      if (!e.getHasJoined()) {
        if (e.getType() === CometChatUIKitConstants.GroupTypes.public) {
          CometChat.joinGroup(e.getGuid(), e.getType() as CometChat.GroupType).then((resp: any) => {
            setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
            resp.setHasJoined?.(true); resp.setScope?.(CometChatUIKitConstants.groupMemberScope.participant);
            setNewChat({ group: resp, user: undefined }); setShowNewChat(false);
            setTimeout(() => CometChatGroupEvents.ccGroupMemberJoined.next({ joinedGroup: resp, joinedUser: loggedIn! }), 100);
          }).catch(console.error);
        } else {
          setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setGrp(e); showJoinGroupRef.current = true;
        }
      } else {
        setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setNewChat({ group: e, user: undefined }); setShowNewChat(false);
      }
    };

    const TabContent = ({ selectedTab }: { selectedTab: string }) => {
      let usersRB = new CometChat.UsersRequestBuilder().setLimit(30);
      if (chatFeatures?.userManagement?.friendsOnly) usersRB = usersRB.friendsOnly(true);
      return selectedTab === 'user' ? (
        <CometChatUsers usersRequestBuilder={usersRB} onItemClick={(u: CometChat.User) => { setNewChat({ user: u, group: undefined }); setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setShowNewChat(false); setAppState({ type: 'updateSelectedItemUser', payload: u }); setAppState({ type: 'updateSelectedItemGroup', payload: undefined }); }} hideUserStatus={(chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence) ?? !CometChatSettings.chatFeatures.coreMessagingExperience.userAndFriendsPresence} />
      ) : (
        <CometChatGroups groupsRequestBuilder={new CometChat.GroupsRequestBuilder().joinedOnly(true).setLimit(30)} onItemClick={(e: CometChat.Group) => { setAppState({ type: 'updateSelectedItemUser', payload: undefined }); setAppState({ type: 'updateSelectedItemGroup', payload: e }); joinGroup(e); }} />
      );
    };

    return (
      <div className="cometchat-new-chat-view">
        {showJoinGroupRef.current && grp && (
          <CometChatJoinGroup group={grp} onHide={() => (showJoinGroupRef.current = false)} onProtectedGroupJoin={g => {
            if (activeTab === 'chats') {
              setShowNewChat(false);
              CometChat.getConversation(g?.getGuid()!, CometChatUIKitConstants.MessageReceiverType.group).then(c => setSelectedItem(c), () => setSelectedItem(undefined));
            } else setSelectedItem(g);
          }} />
        )}
        <div className="cometchat-new-chat-view__header">
          <CometChatButton iconURL={backbutton} onClick={() => setShowNewChat(false)} />
          <div className="cometchat-new-chat-view__header-title">{getLocalizedString('new_chat_title')}</div>
        </div>
        <div className="cometchat-new-chat-view__tabs">
          <div className={`cometchat-new-chat-view__tabs-tab ${selectedTab === 'user' ? 'cometchat-new-chat-view__tabs-tab-active' : ''}`} onClick={() => setSelectedTab('user')}>{getLocalizedString('user_title')}</div>
          <div className={`cometchat-new-chat-view__tabs-tab ${selectedTab === 'group' ? 'cometchat-new-chat-view__tabs-tab-active' : ''}`} onClick={() => setSelectedTab('group')}>{getLocalizedString('group_title')}</div>
        </div>
        <div style={{ overflow: 'hidden' }}><TabContent selectedTab={selectedTab} /></div>
      </div>
    );
  };

  const SideComponent = React.memo(() => {
    const [sideUser, setSideUser] = useState<CometChat.User>();
    const [sideGroup, setSideGroup] = useState<CometChat.Group>();

    useEffect(() => {
      if (activeTab === 'chats') {
        if ((selectedItem as CometChat.Conversation)?.getConversationType?.() === 'user') setSideUser((selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.User);
        else if ((selectedItem as CometChat.Conversation)?.getConversationType?.() === 'group') setSideGroup((selectedItem as CometChat.Conversation).getConversationWith() as CometChat.Group);
        else if (defaultUser instanceof CometChat.User) { if (autoOpenFirstItem) setSideUser(defaultUser); }
        else if (defaultGroup instanceof CometChat.Group) { if (autoOpenFirstItem) setSideGroup(defaultGroup); }
      } else if (activeTab === 'users') setSideUser(selectedItem as CometChat.User);
      else if (activeTab === 'groups') setSideGroup(selectedItem as CometChat.Group);
    }, [selectedItem, activeTab]);

    useEffect(() => {
      if (newChat?.user) setSideUser(newChat.user);
      else if (newChat?.group) setSideGroup(newChat.group);
    }, [newChat]);

    const updateGroupDetails = (eventGroup: CometChat.Group) => {
      if (eventGroup.getGuid() === sideGroup?.getGuid()) {
        sideGroup.setMembersCount(eventGroup.getMembersCount()); sideGroup.setScope(eventGroup.getScope()); sideGroup.setOwner(eventGroup.getOwner()); setSideGroup({ ...sideGroup } as CometChat.Group);
      }
    };

    const attachSDKGroupListenerForDetails = useCallback(() => {
      const listenerId = 'GroupDetailsListener_' + String(Date.now());
      CometChat.addGroupListener(listenerId, new CometChat.GroupListener({
        onGroupMemberBanned: (_: any, __: any, ___: any, g: CometChat.Group) => updateGroupDetails(g),
        onGroupMemberKicked: (_: any, __: any, ___: any, g: CometChat.Group) => updateGroupDetails(g),
        onMemberAddedToGroup: (_: any, __: any, ___: any, g: CometChat.Group) => updateGroupDetails(g),
        onGroupMemberJoined: (_: any, __: any, g: CometChat.Group) => updateGroupDetails(g),
        onGroupMemberLeft: (_: any, __: any, g: CometChat.Group) => updateGroupDetails(g),
      }));
      return () => CometChat.removeGroupListener(listenerId);
    }, [sideGroup]);

    useEffect(() => { if (loggedInUser) { const unsub = attachSDKGroupListenerForDetails(); return () => unsub(); } }, [loggedInUser, attachSDKGroupListenerForDetails]);

    const onBack = () => {
      setAppState({ type: 'updateShowMessagesSearch', payload: false });
      setAppState({ type: 'updateSideComponentTop', payload: null });
      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
      activeSideComponentRef.current = appState.sideComponent.type;
    };

    const onSearchMessageClicked = async (message: CometChat.BaseMessage, searchKeyword?: string) => {
      const el = document.querySelector('.side-component-wrapper');
      const computedZIndex = el ? window.getComputedStyle(el).zIndex : 'auto';
      if (searchKeyword) setAppState({ type: 'UpdateSearchKeyword', payload: searchKeyword });
      if (message.getParentMessageId()) {
        const msg = await CometChat.getMessageDetails(message.getParentMessageId());
        if (msg) {
          setAppState({ type: 'updateSideComponent', payload: { visible: true, type: 'threadedMessage' } });
          setAppState({ type: 'updateThreadSearchMessage', payload: message });
          setAppState({ type: 'updateThreadedMessage', payload: msg });
          setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) });
        }
      } else {
        setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
        setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) });
      }
      if (isMobileView() || computedZIndex !== 'auto') onBack();
    };

    return (
      <>
        {appState.sideComponent.visible ? (
          <div className={`side-component-wrapper ${appState.threadSearchMessage ? 'side-component-wrapper--threaded' : ''}`}>
            <div className="side-component-wrapper__content">
              {appState.sideComponent.type === 'user' && sideUser && (
                <div style={appState.sideComponentTop === 'user' ? { display: 'block' } : { display: 'none' }} className={`side-component-wrapper__content-view ${appState.sideComponentTop === 'user' ? 'side-component-wrapper__content-top' : 'side-component-wrapper__content-bottom'}`}>
                  <SideComponentUser user={sideUser} />
                </div>
              )}
              {appState.sideComponent.type === 'group' && sideGroup && (
                <div style={appState.sideComponentTop === 'group' ? { display: 'block' } : { display: 'none' }} className={`side-component-wrapper__content-view ${appState.sideComponentTop === 'group' ? 'side-component-wrapper__content-top' : 'side-component-wrapper__content-bottom'}`}>
                  <SideComponentGroup group={sideGroup} />
                </div>
              )}
              {appState.sideComponent.type === 'threadedMessage' && appState.threadedMessage ? (
                <div style={appState.sideComponentTop === 'threadedMessage' ? { display: 'block' } : { display: 'none' }} className={`side-component-wrapper__content-view ${appState.sideComponentTop === 'threadedMessage' ? 'side-component-wrapper__content-top' : 'side-component-wrapper__content-bottom'}`}>
                  <SideComponentThread message={appState.threadedMessage} />
                </div>
              ) : null}
              {appState.sideComponent.type === 'search' && appState.showMessagesSearch ? (
                <div style={appState.sideComponentTop === 'search' ? { display: 'block' } : { display: 'none' }} className={`side-component-wrapper__content-view ${appState.sideComponentTop === 'search' ? 'side-component-wrapper__content-top' : 'side-component-wrapper__content-bottom'}`}>
                  <CometChatSearchView user={sideUser} group={sideGroup} onClose={onBack} onMessageClicked={onSearchMessageClicked} />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </>
    );
  });
  SideComponent.displayName = 'SideComponent';

  const SideComponentUser = (props: { user: CometChat.User }) => {
    const { user } = props;
    const actionItemsArray = [
      { id: 'block-unblock', name: user.getBlockedByMe?.() ? getLocalizedString('user_details_unblock') : getLocalizedString('user_details_block'), icon: blockIcon },
      { id: 'delete', name: getLocalizedString('delete_chat'), icon: deleteIcon },
    ];
    const [actionItems, setActionItems] = useState(actionItemsArray);
    const [showStatus, setShowStatus] = useState(true);
    const [showBlockUserDialog, setShowBlockUserDialog] = useState(false);
    const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false);

    const onBlockUserClicked: () => Promise<void> = () => new Promise((resolve, reject) => {
      CometChat.blockUsers([user.getUid()]).then(() => { user.setBlockedByMe(true); CometChatUserEvents.ccUserBlocked.next(user); toastTextRef.current = getLocalizedString('blocked_successfully'); setShowToast(true); return resolve(); }, () => reject());
    });

    const onUnblockUserClicked = () => {
      CometChat.unblockUsers([user.getUid()]).then(() => {
        setActionItems([{ id: 'block-unblock', name: getLocalizedString('user_details_block'), icon: blockIcon }, { id: 'delete', name: getLocalizedString('delete_chat'), icon: deleteIcon }]);
        user.setBlockedByMe(false); CometChatUserEvents.ccUserUnblocked.next(user);
      }, console.error);
    };

    const onDeleteConversationClicked: () => Promise<void> = () => new Promise((resolve, reject) => {
      CometChat.deleteConversation(user.getUid(), 'user').then(() => {
        setSelectedItem(undefined); setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
        CometChatConversationEvents.ccConversationDeleted.next((selectedItem instanceof CometChat.Conversation ? selectedItem : freshChatRef.current.conversation as CometChat.Conversation)!);
        toastTextRef.current = getLocalizedString('chat_deleted_successfully'); setShowToast(true); return resolve();
      }, () => reject());
    });

    const onUserActionClick = (item: { name: string; icon: string }) => {
      if (item.name === getLocalizedString('user_details_block')) setShowBlockUserDialog(true);
      else if (item.name === getLocalizedString('user_details_unblock')) onUnblockUserClicked();
      else if (item.name === getLocalizedString('delete_chat')) setShowDeleteConversationDialog(true);
    };

    useEffect(() => {
      if (user.getHasBlockedMe()) setShowStatus(false);
      const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(u => { if (u.getBlockedByMe()) { setShowStatus(false); setActionItems([{ id: 'block-unblock', name: getLocalizedString('user_details_unblock'), icon: blockIcon }, { id: 'delete', name: getLocalizedString('delete_chat'), icon: deleteIcon }]); } updateUserAfterBlockUnblock(u); });
      const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe(u => { if (!u.getBlockedByMe()) { setShowStatus(true); setActionItems([{ id: 'block-unblock', name: getLocalizedString('user_details_block'), icon: blockIcon }, { id: 'delete', name: getLocalizedString('delete_chat'), icon: deleteIcon }]); } updateUserAfterBlockUnblock(u); });
      return () => { ccUserBlocked?.unsubscribe(); ccUserUnblocked?.unsubscribe(); };
    }, [selectedItem]);

    const onHide = () => setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });

    return (
      <>
        {showDeleteConversationDialog && <div className="cometchat-delete-chat-dialog__backdrop"><CometChatConfirmDialog title={getLocalizedString('delete_chat')} messageText={getLocalizedString('confirm_delete_chat')} confirmButtonText={getLocalizedString('conversation_delete_title')} onCancelClick={() => setShowDeleteConversationDialog(!showDeleteConversationDialog)} onSubmitClick={onDeleteConversationClicked} /></div>}
        {showBlockUserDialog && <div className="cometchat-block-user-dialog__backdrop"><CometChatConfirmDialog title={getLocalizedString('block_contact')} messageText={getLocalizedString('confirm_block_contact')} confirmButtonText={getLocalizedString('user_details_block')} onCancelClick={() => setShowBlockUserDialog(!showBlockUserDialog)} onSubmitClick={onBlockUserClicked} /></div>}
        <CometChatUserDetails user={user} actionItems={actionItems} onHide={onHide} showStatus={showStatus} onUserActionClick={onUserActionClick} />
      </>
    );
  };

  interface ActionItem { id: string; name: string; icon: string; type: 'scope' | 'alert'; onClick: () => void; isAllowed: () => boolean; }

  const SideComponentGroup = React.memo((props: { group: CometChat.Group }) => {
    const [groupTab, setGroupTab] = useState('view');
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [showLeaveGroup, setShowLeaveGroup] = useState(false);
    const [showTransferownershipDialog, setShowTransferownershipDialog] = useState(false);
    const [showDeleteGroup, setShowDeleteGroup] = useState(false);
    const [showTransferOwnership, setShowTransferOwnership] = useState(false);
    const [showDeleteGroupChatDialog, setShowDeleteGroupChatDialog] = useState(false);
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [scopeChanged, setScopeChanged] = useState(false);
    const { group } = props;
    const groupListenerRef = useRef('groupinfo_GroupListener_' + String(Date.now()));
    const [memberCount, setMemberCount] = useState(group.getMembersCount());
    const [groupOwner, setGroupOwner] = useState(group.getOwner());
    const { chatFeatures } = useCometChatContext();

    useEffect(() => {
      CometChat.addGroupListener(groupListenerRef.current, new CometChat.GroupListener({
        onGroupMemberScopeChanged: (_: any, changedUser: CometChat.GroupMember, __: any, ___: any, changedGroup: CometChat.Group) => {
          if (changedGroup.getGuid() !== group?.getGuid()) return;
          if (changedUser.getUid() === loggedInUser?.getUid()) { setGroup(changedGroup); setGroupOwner(changedGroup.getOwner()); setScopeChanged(true); }
        },
        onGroupMemberKicked: (_: any, __: any, ___: any, g: CometChat.Group) => { setMemberCount(g.getMembersCount()); setGroup(g); setGroupOwner(g.getOwner()); },
        onGroupMemberBanned: (_: any, __: any, ___: any, g: CometChat.Group) => { setMemberCount(g.getMembersCount()); setGroup(g); setGroupOwner(g.getOwner()); },
        onMemberAddedToGroup: (_: any, __: any, ___: any, g: CometChat.Group) => { setMemberCount(g.getMembersCount()); setGroup(g); },
        onGroupMemberLeft: (_: any, __: any, g: CometChat.Group) => { setMemberCount(g.getMembersCount()); setGroup(g); setGroupOwner(g.getOwner()); },
        onGroupMemberJoined: (_: any, __: any, g: CometChat.Group) => { setMemberCount(g.getMembersCount()); setGroup(g); },
      }));
      const ccGMA = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => { setMemberCount(item.userAddedIn.getMembersCount()); setGroup(item.userAddedIn); });
      const ccGMB = CometChatGroupEvents.ccGroupMemberBanned.subscribe((item: IGroupMemberKickedBanned) => { setMemberCount(item.kickedFrom.getMembersCount()); setGroup(item.kickedFrom); });
      const ccGMK = CometChatGroupEvents.ccGroupMemberKicked.subscribe((item: IGroupMemberKickedBanned) => { setMemberCount(item.kickedFrom.getMembersCount()); setGroup(item.kickedFrom); });
      return () => { ccGMA?.unsubscribe(); ccGMB?.unsubscribe(); ccGMK?.unsubscribe(); CometChat.removeGroupListener(groupListenerRef.current); };
    }, [group]);

    useEffect(() => {
      const isAdminOrOwner = () => group.getScope() === CometChatUIKitConstants.groupMemberScope.admin || group.getScope() === CometChatUIKitConstants.groupMemberScope.owner;
      const tempItems: ActionItem[] = [
        { id: 'addMembersToGroups', name: getLocalizedString('add_members'), icon: addMembersIcon, type: 'scope', onClick: () => setShowAddMembers(true), isAllowed: isAdminOrOwner },
        { id: 'deleteChat', name: getLocalizedString('delete_chat'), icon: deleteIcon, type: 'alert', onClick: () => setShowDeleteGroupChatDialog(true), isAllowed: () => true },
        { id: 'joinLeaveGroup', name: getLocalizedString('leave'), icon: leaveGroupIcon, type: 'alert', onClick: () => { if (group.getOwner() === CometChatUIKitLoginListener.getLoggedInUser()?.getUid()) setShowTransferownershipDialog(!showTransferownershipDialog); else setShowLeaveGroup(!showLeaveGroup); }, isAllowed: () => group.getMembersCount() > 1 || (group.getMembersCount() === 1 && loggedInUser?.getUid() !== group.getOwner()) },
        { id: 'deleteGroup', name: getLocalizedString('delete_and_exit'), icon: deleteIcon, type: 'alert', onClick: () => setShowDeleteGroup(!showDeleteGroup), isAllowed: isAdminOrOwner },
      ];
      const gmp = chatFeatures.groupManagement;
      setActionItems(tempItems.filter(item => item.id === 'deleteChat' || gmp[item.id as keyof typeof gmp]));
    }, [scopeChanged, group, memberCount, chatFeatures?.groupManagement]);

    const isAdminOrOwner = () => group.getScope() === CometChatUIKitConstants.groupMemberScope.admin || group.getScope() === CometChatUIKitConstants.groupMemberScope.owner;
    const createGroupMemberLeftActionMessage = useCallback((grp: CometChat.Group, loggedIn: CometChat.User): CometChat.Action => {
      const action = CometChatUIKitConstants.groupMemberAction.LEFT;
      const actionMessage = new CometChat.Action(grp.getGuid(), CometChatUIKitConstants.MessageTypes.groupMember, CometChatUIKitConstants.MessageReceiverType.group, CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory);
      actionMessage.setAction(action); actionMessage.setActionBy(CometChatUIKitUtility.clone(loggedIn)); actionMessage.setActionFor(CometChatUIKitUtility.clone(grp)); actionMessage.setActionOn(CometChatUIKitUtility.clone(loggedIn)); actionMessage.setReceiver(CometChatUIKitUtility.clone(grp)); actionMessage.setSender(CometChatUIKitUtility.clone(loggedIn)); actionMessage.setConversationId('group_' + grp.getGuid()); actionMessage.setMuid(CometChatUIKitUtility.ID()); actionMessage.setMessage(`${loggedIn.getName()} ${action} ${loggedIn.getUid()}`); actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
      return actionMessage;
    }, []);

    const onDeleteGroupConversationClicked: () => Promise<void> = () => new Promise((resolve, reject) => {
      CometChat.deleteConversation(group.getGuid(), CometChatUIKitConstants.MessageReceiverType.group).then(() => { setSelectedItem(undefined); setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); CometChatConversationEvents.ccConversationDeleted.next((selectedItem as CometChat.Conversation)!); return resolve(); }, (e) => { console.error(e); return reject(); });
    });

    return (
      <>
        <div className="side-component-header">
          <div className="side-component-header__text">{getLocalizedString('group_info')}</div>
          <div className="side-component-header__icon" onClick={() => setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } })} />
        </div>
        <div className="side-component-content">
          <div className="side-component-content__group">
            <div className="side-component-content__avatar"><CometChatAvatar image={group?.getIcon()} name={group?.getName()} /></div>
            <div>
              <div className="side-component-content__title">{group?.getName()}</div>
              <div className="side-component-content__description">{group?.getMembersCount?.() + ' ' + getLocalizedString('group_members')}</div>
            </div>
          </div>
          <div className="side-component-content__action">
            {actionItems.map((item, idx) => item.isAllowed() ? (
              <div key={item.name + idx} className={`side-component-content__action-item ${appState.isFreshChat && item.id === 'deleteChat' ? 'side-component-content__action-item-disabled' : ''}`} onClick={item.onClick}>
                <div className={item.type === 'alert' ? `side-component-content__action-item-icon side-component-content__action-item-icon-${item.id}` : `side-component-content__action-item-icon-default side-component-content__action-item-icon-default-${item.id}`} style={item.icon ? { WebkitMask: `url(${item.icon}), center, center, no-repeat` } : undefined} />
                <div className={item.type === 'alert' ? 'side-component-content__action-item-text' : 'side-component-content__action-item-text-default'}>{item.name}</div>
              </div>
            ) : null)}
          </div>
          {chatFeatures?.groupManagement.viewGroupMembers && (
            <>
              {group.getScope() !== CometChatUIKitConstants.groupMemberScope.participant ? (
                <div className="side-component-group-tabs-wrapper">
                  <div className="side-component-group-tabs">
                    <div className={`side-component-group-tabs__tab ${groupTab === 'view' ? 'side-component-group-tabs__tab-active' : ''}`} onClick={() => setGroupTab('view')}><div className={`side-component-group-tabs__tab-text ${groupTab === 'view' ? 'side-component-group-tabs__tab-text-active' : ''}`}>{getLocalizedString('view_members')}</div></div>
                    <div className={`side-component-group-tabs__tab ${groupTab === 'banned' ? 'side-component-group-tabs__tab-active' : ''}`} onClick={() => setGroupTab('banned')}><div className={`side-component-group-tabs__tab-text ${groupTab === 'banned' ? 'side-component-group-tabs__tab-text-active' : ''}`}>{getLocalizedString('banned_members')}</div></div>
                  </div>
                </div>
              ) : null}
              <div className={isAdminOrOwner() ? 'side-component-group-members-with-tabs' : 'side-component-group-members'}>
                {groupTab === 'view' ? <CometChatGroupMembers group={group} hideKickMemberOption={(chatFeatures && !chatFeatures?.moderatorControls?.kickUsers) ?? !CometChatSettings.chatFeatures.moderatorControls.kickUsers} hideScopeChangeOption={(chatFeatures && !chatFeatures?.moderatorControls?.promoteDemoteMembers) ?? !CometChatSettings.chatFeatures.moderatorControls.promoteDemoteMembers} hideBanMemberOption={(chatFeatures && !chatFeatures?.moderatorControls?.banUsers) ?? !CometChatSettings.chatFeatures.moderatorControls.banUsers} hideUserStatus={(chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence) ?? !CometChatSettings.chatFeatures.coreMessagingExperience.userAndFriendsPresence} />
                  : groupTab === 'banned' ? <CometChatBannedMembers group={group} /> : null}
              </div>
            </>
          )}
        </div>
        {showDeleteGroupChatDialog && <div className="cometchat-delete-chat-dialog__backdrop"><CometChatConfirmDialog title={getLocalizedString('delete_chat')} messageText={getLocalizedString('confirm_delete_chat')} confirmButtonText={getLocalizedString('conversation_delete_title')} onCancelClick={() => setShowDeleteGroupChatDialog(!showDeleteGroupChatDialog)} onSubmitClick={onDeleteGroupConversationClicked} /></div>}
        {showAddMembers && group && <div className="cometchat-add-members-wrapper"><CometChatAddMembers showBackButton group={group} onBack={() => setShowAddMembers(!showAddMembers)} /></div>}
        {showLeaveGroup && <div className="cometchat-leave-group__backdrop"><CometChatConfirmDialog title={getLocalizedString('leave_group')} messageText={getLocalizedString('confirm_leave_group')} confirmButtonText={getLocalizedString('leave')} onCancelClick={() => setShowLeaveGroup(!showLeaveGroup)} onSubmitClick={() => new Promise((resolve, reject) => { CometChat.leaveGroup(group.getGuid()).then(() => { const li = CometChatUIKitLoginListener.getLoggedInUser(); if (li) { const gc = CometChatUIKitUtility.clone(group); gc.setHasJoined(false); gc.setMembersCount(gc.getMembersCount() - 1); CometChatGroupEvents.ccGroupLeft.next({ userLeft: CometChatUIKitUtility.clone(li), leftGroup: gc, message: createGroupMemberLeftActionMessage(gc, li) }); } setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setSelectedItem(undefined); setAppState({ type: 'updateSelectedItem', payload: undefined }); setAppState({ type: 'updateSelectedItemGroup', payload: undefined }); setShowLeaveGroup(!showLeaveGroup); toastTextRef.current = getLocalizedString('group_left'); setShowToast(true); return resolve(); }, () => reject()); })} /></div>}
        {showDeleteGroup && <div className="cometchat-delete-group__backdrop"><CometChatConfirmDialog title={getLocalizedString('delete_and_exit')} messageText={getLocalizedString('confirm_delete_and_exit')} confirmButtonText={getLocalizedString('delete_and_exit_label')} onCancelClick={() => setShowDeleteGroup(!showDeleteGroup)} onSubmitClick={() => new Promise((resolve, reject) => { CometChat.deleteGroup(group.getGuid()).then(() => { setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setSelectedItem(undefined); CometChatGroupEvents.ccGroupDeleted.next(CometChatUIKitUtility.clone(group)); setShowDeleteGroup(!showDeleteGroup); CometChatConversationEvents.ccConversationDeleted.next((selectedItem as CometChat.Conversation)!); toastTextRef.current = getLocalizedString('group_left_and_chat_deleted'); setShowToast(true); return resolve(); }, () => reject()); })} /></div>}
        {showTransferOwnership && <div className="cometchat-transfer-ownership__backdrop"><CometChatTransferOwnership group={group} onClose={() => setShowTransferOwnership(!showTransferOwnership)} /></div>}
        {showTransferownershipDialog && <div className="cometchat-transfer-ownership-dialog__backdrop"><CometChatConfirmDialog title={getLocalizedString('ownership_transfer')} messageText={getLocalizedString('confirm_ownership_transfer')} confirmButtonText={getLocalizedString('continue')} onCancelClick={() => setShowTransferownershipDialog(!showTransferownershipDialog)} onSubmitClick={() => new Promise(resolve => { setShowTransferownershipDialog(!showTransferownershipDialog); setShowTransferOwnership(!showTransferOwnership); return resolve(); })} /></div>}
      </>
    );
  });
  SideComponentGroup.displayName = 'SideComponentGroup';

  const SideComponentThread = (props: ThreadProps) => {
    const { message } = props;
    const [requestBuilderState, setRequestBuilderState] = useState<CometChat.MessagesRequestBuilder>();
    const [showComposer, setShowComposer] = useState(true);

    const requestBuilder = useCallback(() => {
      setRequestBuilderState(new CometChat.MessagesRequestBuilder().setCategories(CometChatUIKit.getDataSource().getAllMessageCategories()).setTypes(CometChatUIKit.getDataSource().getAllMessageTypes()).hideReplies(true).setLimit(20).setParentMessageId(message.getId()));
    }, [message]);

    useEffect(() => {
      requestBuilder();
      let currentUser: CometChat.User | null = null;
      if (selectedItem instanceof CometChat.User) currentUser = selectedItem;
      else if (selectedItem instanceof CometChat.Conversation && selectedItem.getConversationType() === CometChat.RECEIVER_TYPE.USER && selectedItem.getConversationWith() instanceof CometChat.User) currentUser = selectedItem.getConversationWith() as CometChat.User;
      if (currentUser?.getBlockedByMe()) setShowComposer(false);
      const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(u => { if (u.getBlockedByMe()) setShowComposer(false); updateUserAfterBlockUnblock(u); });
      const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe(u => { if (!u.getBlockedByMe()) setShowComposer(true); updateUserAfterBlockUnblock(u); });
      return () => { ccUserBlocked?.unsubscribe(); ccUserUnblocked?.unsubscribe(); };
    }, [message]);

    const onClose = () => { setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setAppState({ type: 'updateThreadSearchMessage', payload: undefined }); };
    const closeMessageSearch = () => { setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setAppState({ type: 'updateShowMessagesSearch', payload: false }); };

    return (
      <CometChatThreadedMessages searchKeyword={appState.goToMessageId ? appState.searchKeyword : undefined} message={message} requestBuilderState={requestBuilderState} selectedItem={selectedItem || freshChatRef.current.conversation} onClose={onClose} showComposer={showComposer} goToMessageId={appState.threadSearchMessage && appState.goToMessageId ? appState.goToMessageId : undefined} onSubtitleClicked={() => { if (isMobileView()) closeMessageSearch(); setAppState({ type: 'updateThreadSearchMessage', payload: undefined }); setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) }); }} />
    );
  };

  useEffect(() => {
    if (newChat) {
      const convId = newChat.user?.getUid() || newChat.group?.getGuid();
      const convType = newChat.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
      CometChat.getConversation(convId!, convType).then(c => setSelectedItem(c), () => setSelectedItem(undefined));
    }
  }, [newChat, newChat?.user, newChat?.group]);

  useEffect(() => { fetchDefaultConversation(); setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); }, [layoutFeatures?.chatType, defaultUser, defaultGroup]);

  const onSelectorItemClicked = (e: CometChat.Conversation | CometChat.User | CometChat.Group | CometChat.Call, type: string) => {
    conversationItemClicked.current = true;
    setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
    setAppState({ type: 'updateThreadSearchMessage', payload: undefined });
    setAppState({ type: 'updateThreadedMessage', payload: undefined });
    setAppState({ type: 'updateGoToMessageId', payload: undefined });
    setAppState({ type: 'updateShowMessagesSearch', payload: false });
    setShowNewChat(false);
    if (type === 'updateSelectedItemGroup' && !(e as CometChat.Group).getHasJoined()) {
      if ((e as CometChat.Group).getType() === CometChatUIKitConstants.GroupTypes.public) {
        CometChat.joinGroup((e as CometChat.Group).getGuid(), (e as CometChat.Group).getType() as CometChat.GroupType).then((resp: any) => {
          setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setNewChat(undefined);
          resp.setHasJoined?.(true); resp.setScope?.(CometChatUIKitConstants.groupMemberScope.participant);
          setSelectedItem(resp as CometChat.Group); setAppState({ type, payload: resp });
          setTimeout(() => CometChatGroupEvents.ccGroupMemberJoined.next({ joinedGroup: resp, joinedUser: loggedInUser! }), 100);
        }).catch(console.error);
      } else {
        setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setNewChat(undefined); setGroup(e as CometChat.Group); setAppState({ type, payload: e }); showJoinGroupRef.current = true;
      }
    } else {
      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setNewChat(undefined); setAppState({ type, payload: e });
      setSelectedItem(activeTab === 'chats' ? (e as CometChat.Conversation) : activeTab === 'users' ? (e as CometChat.User) : activeTab === 'groups' ? (e as CometChat.Group) : activeTab === 'calls' ? (e as CometChat.Call) : undefined);
    }
  };

  const subscribeToEvents = useCallback(() => {
    const ccConversationDeleted = CometChatConversationEvents.ccConversationDeleted.subscribe((conv: CometChat.Conversation) => {
      if (conv) {
        if (newChat?.user && conv.getConversationType() === CometChatUIKitConstants.MessageReceiverType.user && (conv.getConversationWith() as CometChat.User).getUid() === newChat.user.getUid()) { setNewChat(undefined); setAppState({ type: 'newChat', payload: undefined }); setSelectedItem(undefined); setAppState({ type: 'updateSelectedItem', payload: undefined }); }
        else if (newChat?.group && conv.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group && (conv.getConversationWith() as CometChat.Group).getGuid() === newChat.group.getGuid()) { setNewChat(undefined); setAppState({ type: 'newChat', payload: undefined }); setSelectedItem(undefined); setAppState({ type: 'updateSelectedItem', payload: undefined }); }
        else if ((selectedItem as CometChat.Conversation)?.getConversationId?.() === conv.getConversationId?.()) { setSelectedItem(undefined); setAppState({ type: 'updateSelectedItem', payload: undefined }); }
      }
    });
    const ccOpenChat = CometChatUIEvents.ccOpenChat.subscribe(item => openChatForUser(item.user));
    const ccGroupJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe((data: IGroupMemberJoined) => { setGroup(data.joinedGroup); setSelectedItem(data.joinedGroup); setAppState({ type: 'updateSelectedItemGroup', payload: data.joinedGroup }); });
    const ccClickEvent = CometChatUIEvents.ccMouseEvent.subscribe((me: IMouseEvent) => { if (me.event.type === 'click' && (me.body as any)?.CometChatUserGroupMembersObject) openChatForUser((me.body as any)?.CometChatUserGroupMembersObject); });

    const openChatForUser = (user?: CometChat.User) => {
      const uid = user?.getUid();
      const closeSide = () => { setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setAppState({ type: 'updateThreadSearchMessage', payload: undefined }); setAppState({ type: 'updateThreadedMessage', payload: undefined }); setAppState({ type: 'updateGoToMessageId', payload: undefined }); setAppState({ type: 'updateShowMessagesSearch', payload: false }); };
      if (uid) {
        if (uid === loggedInUser?.getUid()) return;
        if (activeTab === 'chats') {
          CometChat.getConversation(uid!, CometChatUIKitConstants.MessageReceiverType.user).then(c => { if (!selectedItem || !(selectedItem instanceof CometChat.Conversation) || selectedItem?.getConversationId() !== c.getConversationId()) { setNewChat(undefined); setSelectedItem(c); setAppState({ type: 'updateSelectedItem', payload: c }); closeSide(); } }, () => { setNewChat({ user, group: undefined }); setSelectedItem(undefined); closeSide(); });
        } else if (activeTab === 'users') { setNewChat(undefined); setSelectedItem(user); setAppState({ type: 'updateSelectedItemUser', payload: user }); closeSide(); }
        else if (activeTab === 'groups') { setNewChat({ user, group: undefined }); setSelectedItem(undefined); closeSide(); }
      }
    };

    return () => { ccConversationDeleted?.unsubscribe(); ccOpenChat?.unsubscribe(); ccClickEvent?.unsubscribe(); ccGroupJoined?.unsubscribe(); };
  }, [newChat, selectedItem]);

  const attachSDKGroupListener = () => {
    const listenerId = 'BannedOrKickedMembers_GroupListener_' + String(Date.now());
    CometChat.addGroupListener(listenerId, new CometChat.GroupListener({
      onGroupMemberBanned: (_: any, kickedUser: CometChat.User, __: any, kickedFrom: CometChat.Group) => {
        if (((selectedItem as CometChat.Group).getGuid?.() === kickedFrom.getGuid() || ((selectedItem as CometChat.Conversation).getConversationWith?.() as CometChat.Group)?.getGuid?.() === kickedFrom.getGuid()) && kickedUser.getUid() === loggedInUser?.getUid()) setShowAlertPopup({ visible: true, description: getLocalizedString('member_banned') });
      },
      onGroupMemberKicked: (_: any, kickedUser: CometChat.User, __: any, kickedFrom: CometChat.Group) => {
        if (((selectedItem as CometChat.Group).getGuid?.() === kickedFrom.getGuid() || ((selectedItem as CometChat.Conversation).getConversationWith?.() as CometChat.Group)?.getGuid?.() === kickedFrom.getGuid()) && kickedUser.getUid() === loggedInUser?.getUid()) setShowAlertPopup({ visible: true, description: getLocalizedString('member_removed') });
      },
    }));
    return () => CometChat.removeGroupListener(listenerId);
  };

  useEffect(() => {
    if (loggedInUser) {
      const unsub1 = subscribeToEvents(); const unsub2 = attachSDKGroupListener();
      return () => { unsub1(); unsub2(); };
    }
  }, [loggedInUser, subscribeToEvents, attachSDKGroupListener]);

  const removedFromGroup = () => { setShowAlertPopup({ visible: false, description: '' }); setSelectedItem(undefined); setAppState({ type: 'updateSelectedItem', payload: undefined }); setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); };

  const getActiveItem = () => {
    if ((activeTab === 'chats' && selectedItem instanceof CometChat.Conversation) || (activeTab === 'users' && selectedItem instanceof CometChat.User) || (activeTab === 'groups' && selectedItem instanceof CometChat.Group) || (activeTab === 'calls' && selectedItem instanceof CallLog)) return selectedItem;
    return undefined;
  };

  const SideComponentWrapper = useMemo(() => <SideComponent />, [appState.sideComponent, appState.showMessagesSearch, appState.sideComponentTop, appState.threadSearchMessage]);

  const openSearchComponent = () => setAppState({ type: 'updateShowConversationsSearch', payload: true });
  const closeSearch = () => setAppState({ type: 'updateShowConversationsSearch', payload: false });

  const resetSideComponent = (conversationId: string) => {
    if (selectedItem && selectedItem instanceof CometChat.Conversation && (selectedItem as CometChat.Conversation).getConversationId() !== conversationId) {
      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setAppState({ type: 'updateThreadSearchMessage', payload: undefined }); setAppState({ type: 'updateThreadedMessage', payload: undefined }); setAppState({ type: 'updateShowMessagesSearch', payload: false }); activeSideComponentRef.current = '';
    }
  };

  const onConversationClicked = (conv: CometChat.Conversation) => {
    resetSideComponent(conv.getConversationId());
    if (!selectedItem || !(selectedItem instanceof CometChat.Conversation) || (selectedItem instanceof CometChat.Conversation && selectedItem.getConversationId() !== conv.getConversationId())) {
      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setNewChat(undefined); setAppState({ type: 'updateSelectedItem', payload: conv }); setSelectedItem(conv);
    }
  };

  const onMessageClicked = async (message: CometChat.BaseMessage, searchKeyword?: string) => {
    try {
      resetSideComponent(message.getConversationId());
      if (!message.getParentMessageId() && appState.sideComponent.visible && appState.sideComponent.type === 'threadedMessage') { setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setAppState({ type: 'updateThreadSearchMessage', payload: undefined }); setAppState({ type: 'updateThreadedMessage', payload: undefined }); }
      if (searchKeyword) setAppState({ type: 'UpdateSearchKeyword', payload: searchKeyword });
      const updateStates = async (conv: CometChat.Conversation) => {
        if (message.getParentMessageId()) {
          const msg = await CometChat.getMessageDetails(message.getParentMessageId());
          if (msg) { setAppState({ type: 'updateSideComponent', payload: { visible: true, type: 'threadedMessage' } }); setAppState({ type: 'updateThreadSearchMessage', payload: message }); setAppState({ type: 'updateThreadedMessage', payload: msg }); setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) }); setAppState({ type: 'updateSelectedItem', payload: conv }); setSelectedItem(conv); setNewChat(undefined); }
        } else { setAppState({ type: 'updateGoToMessageId', payload: String(message.getId()) }); setAppState({ type: 'updateSelectedItem', payload: conv }); setSelectedItem(conv); setNewChat(undefined); }
      };
      if (selectedItem instanceof CometChat.Conversation && selectedItem.getConversationId() === message.getConversationId()) updateStates(selectedItem);
      else { const conv = await CometChat.CometChatHelper.getConversationFromMessage(message); if (conv) updateStates(conv); }
    } catch (error) { console.error('Error navigating to message:', error); }
  };

  return loggedInUser ? (
    <div id={`${styleFeatures?.theme}-theme`} className="cometchat-root" data-theme={styleFeatures?.theme ?? 'dark'}>
      {showAlertPopup.visible && <CometChatAlertPopup onConfirmClick={removedFromGroup} title={getLocalizedString('no_longer_part_of_group')} description={`${getLocalizedString('you_have_been')} ${showAlertPopup.description} ${getLocalizedString('removed_by_admin')}`} />}
      <div className={`conversations-wrapper ${!layoutFeatures?.withSideBar ? 'hide-sidebar' : ''}`}>
        <div className="selector-wrapper">
          <CometChatSelector onSearchClicked={openSearchComponent} activeItem={getActiveItem()} activeTab={activeTab} group={group} onProtectedGroupJoin={g => setSelectedItem(g)} onSelectorItemClicked={onSelectorItemClicked} setShowCreateGroup={setShowCreateGroup} showCreateGroup={showCreateGroup} showJoinGroup={showJoinGroupRef.current} onHide={() => (showJoinGroupRef.current = false)} onNewChatClicked={() => { setShowNewChat(true); setAppState({ type: 'updateSideComponent', payload: { type: '', visible: false } }); }} onGroupCreated={g => { setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } }); setSelectedItem(g); }} hideCreateGroupButton={(chatFeatures && !chatFeatures.groupManagement.createGroup) ?? !CometChatSettings.chatFeatures.groupManagement.createGroup} />
        </div>
        <TabComponent />
        {appState.showConversationsSearch && (
          <div className="selector-wrapper-search">
            <CometChatSearch onMessageClicked={onMessageClicked} onConversationClicked={onConversationClicked} hideBackButton={false} onBack={closeSearch} />
          </div>
        )}
      </div>
      {appState.goToMessageId && appState.threadSearchMessage ? null : (
        <div className="messages-wrapper"><InformationComponent /></div>
      )}
      {SideComponentWrapper}
      <CometChatIncomingCall />
      {showToast ? <CometChatToast text={toastTextRef.current} onClose={() => setShowToast(false)} /> : null}
    </div>
  ) : null;
}

const MemoizedCometChatHome = React.memo(CometChatHome);
export { MemoizedCometChatHome as CometChatHome };
