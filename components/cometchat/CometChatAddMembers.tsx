"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { CSSProperties, JSX, useCallback, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatAddMembers } from './useCometChatAddMembers';
import {
  CometChatButton,
  CometChatGroupEvents,
  CometChatOption,
  CometChatUIKitConstants,
  CometChatUIKitUtility,
  CometChatUsers,
  SelectionMode,
  getLocalizedString,
  useCometChatErrorHandler,
  useRefSync,
} from '@cometchat/chat-uikit-react';
import { useCometChatContext } from '@/context/cometchat/CometChatContext';

const backbutton = '/cometchat/arrow_back.svg';

interface IAddMembersProps {
  backButtonIconURL?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  hideSearch?: boolean;
  searchIconURL?: string;
  searchPlaceholderText?: string;
  showSectionHeader?: boolean;
  sectionHeaderField?: keyof CometChat.User;
  loadingIconURL?: string;
  loadingStateView?: JSX.Element;
  emptyStateText?: string;
  emptyStateView?: JSX.Element;
  errorStateText?: string;
  errorStateView?: JSX.Element;
  hideError?: boolean;
  disableUsersPresence?: boolean;
  hideSeparator?: boolean;
  onError?: ((error: CometChat.CometChatException) => void) | null;
  menus?: JSX.Element;
  options?: (user: CometChat.User) => CometChatOption[];
  selectionMode?: SelectionMode;
  onSelect?: (user: CometChat.User, selected: boolean) => void;
  usersRequestBuilder?: CometChat.UsersRequestBuilder;
  searchRequestBuilder?: CometChat.UsersRequestBuilder;
  listItemView?: (user: CometChat.User) => JSX.Element;
  subtitleView?: (user: CometChat.User) => JSX.Element;
  group: CometChat.Group;
  onAddMembersButtonClick?: (guid: string, membersToAdd: CometChat.GroupMember[]) => void;
  buttonText?: string;
  closeButtonIconURL?: string;
  onClose?: () => void;
  statusIndicatorStyle?: CSSProperties;
}

export function CometChatAddMembers(props: IAddMembersProps) {
  const { chatFeatures } = useCometChatContext();
  const {
    showBackButton = false,
    onBack,
    hideSearch = false,
    showSectionHeader = false,
    sectionHeaderField = 'getName',
    loadingStateView,
    emptyStateView,
    errorStateView,
    hideError = false,
    onError,
    options,
    selectionMode = SelectionMode.multiple,
    onSelect,
    usersRequestBuilder: usersRequestBuilderProp,
    searchRequestBuilder,
    listItemView,
    subtitleView,
    group,
    onAddMembersButtonClick = null,
    buttonText = getLocalizedString('add_members'),
  } = props;

  let usersRequestBuilder = usersRequestBuilderProp;
  if (!usersRequestBuilder) {
    usersRequestBuilder = new CometChat.UsersRequestBuilder().setLimit(30);
    if (chatFeatures?.userManagement?.friendsOnly) {
      usersRequestBuilder = usersRequestBuilder.friendsOnly(true);
    }
  }

  const membersToAddRef = useRef<CometChat.GroupMember[]>([]);
  const selectionModeRef = useRef(selectionMode);
  const loggedInUserRef = useRef<CometChat.User | null>(null);
  const groupPropRef = useRefSync(group);
  const onBackPropRef = useRefSync(onBack);
  const onAddMembersButtonClickPropRef = useRefSync(onAddMembersButtonClick);
  const errorHandler = useCometChatErrorHandler(onError!);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [isError, setIsError] = useState(false);
  const [membersCount, setMembersCount] = useState(0);
  const selectedUsersMapRef = useRef<Map<string, CometChat.User>>(new Map());

  const createGroupMemberFromUser = useCallback(
    (user: CometChat.User): CometChat.GroupMember => {
      const groupMember = new CometChat.GroupMember(
        user.getUid(),
        CometChatUIKitConstants.groupMemberScope.participant
      );
      groupMember.setName(user.getName());
      groupMember.setGuid(groupPropRef.current.getGuid());
      groupMember.setAvatar(user?.getAvatar());
      groupMember.setStatus(user.getStatus());
      return groupMember;
    },
    [groupPropRef]
  );

  const handleSelect = useCallback(
    (user: CometChat.User, selected: boolean): void => {
      if (selected) {
        selectedUsersMapRef.current.set(user.getUid(), user);
      } else {
        selectedUsersMapRef.current.delete(user.getUid());
      }
      const selectedUsersList = Array.from(selectedUsersMapRef.current.values());
      membersToAddRef.current = selectedUsersList.map((u) => createGroupMemberFromUser(u));
      const count = selectedUsersList.length;
      setMembersCount(count);
      setIsDisabled(count === 0);
      onSelect?.(user, selected);
    },
    [createGroupMemberFromUser, onSelect]
  );

  const createActionMessage = useCallback(
    (actionOn: CometChat.GroupMember, loggedInUser: CometChat.User, group: CometChat.Group): CometChat.Action => {
      const actionMessage = new CometChat.Action(
        group.getGuid(),
        CometChatUIKitConstants.MessageTypes.groupMember,
        CometChatUIKitConstants.MessageReceiverType.group,
        CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
      );
      actionMessage.setAction(CometChatUIKitConstants.groupMemberAction.ADDED);
      actionMessage.setActionBy(CometChatUIKitUtility.clone(loggedInUser));
      actionMessage.setActionFor(CometChatUIKitUtility.clone(group));
      actionMessage.setActionOn(CometChatUIKitUtility.clone(actionOn));
      actionMessage.setReceiver(CometChatUIKitUtility.clone(group));
      actionMessage.setSender(CometChatUIKitUtility.clone(loggedInUser));
      actionMessage.setConversationId('group_' + group.getGuid());
      actionMessage.setMuid(CometChatUIKitUtility.ID());
      actionMessage.setMessage(`${loggedInUser.getName()} added ${actionOn.getUid()}`);
      actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
      return actionMessage;
    },
    []
  );

  const onAddBtnClickWrapper = useCallback(async (): Promise<void> => {
    if (membersToAddRef.current.length === 0) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const group = groupPropRef.current;
      const onAddBtnClick = onAddMembersButtonClickPropRef.current;
      if (onAddBtnClick) {
        onAddBtnClick(group.getGuid(), membersToAddRef.current);
        membersToAddRef.current = [];
        setMembersCount(0);
        return;
      }
      const UIDsToRemove: Set<string> = new Set();
      const response = await CometChat.addMembersToGroup(group.getGuid(), membersToAddRef.current, []);
      setIsLoading(false);
      if (response) {
        for (const key in response) {
          if ((response as any)[key] === 'success') UIDsToRemove.add(key);
        }
      }
      const addedMembers: CometChat.GroupMember[] = [];
      for (let i = 0; i < membersToAddRef.current.length; i++) {
        const curMember = membersToAddRef.current[i];
        if (UIDsToRemove.has(curMember.getUid())) addedMembers.push(curMember);
      }
      const loggedInUser = loggedInUserRef.current;
      if (loggedInUser) {
        const groupClone = CometChatUIKitUtility.clone(group);
        groupClone.setMembersCount(group.getMembersCount() + addedMembers.length);
        CometChatGroupEvents.ccGroupMemberAdded.next({
          messages: addedMembers.map((addedMember) => createActionMessage(addedMember, loggedInUser, groupClone)),
          usersAdded: addedMembers,
          userAddedIn: groupClone,
          userAddedBy: CometChatUIKitUtility.clone(loggedInUser),
        });
      }
      membersToAddRef.current = [];
      setMembersCount(0);
      onBackPropRef.current?.();
    } catch (error) {
      setIsLoading(false);
      setIsError(true);
      errorHandler(error);
    }
  }, [errorHandler, createActionMessage, groupPropRef, onAddMembersButtonClickPropRef, onBackPropRef]);

  function getBackBtnView(): JSX.Element | null {
    if (!showBackButton) return null;
    return (
      <div className="cometchat-add-members__back-button">
        <CometChatButton iconURL={backbutton} onClick={onBack} />
      </div>
    );
  }

  function getButtonText(): string {
    if (buttonText && buttonText !== getLocalizedString('add_members')) return buttonText;
    if (membersCount === 0) return getLocalizedString('add_members');
    if (membersCount === 1) {
      const singular = getLocalizedString('add_member');
      if (singular && singular !== '') return singular;
      const nSingular = getLocalizedString('add_n_members');
      if (nSingular && nSingular !== '') return nSingular.replace('{n}', '1');
      const generic = getLocalizedString('add_members');
      return generic && generic !== '' ? generic : '';
    }
    const n = getLocalizedString('add_n_members');
    if (!n || n === '') {
      const generic = getLocalizedString('add_members');
      return generic && generic !== '' ? generic : '';
    }
    return n.replace('{n}', membersCount.toString());
  }

  function getAddMembersBtnView() {
    const buttonTextValue = getButtonText();
    return (
      <div
        className={`cometchat-add-members__add-btn-wrapper ${isDisabled ? 'cometchat-add-members__add-btn-wrapper-disabled' : ''}`}
      >
        <CometChatButton
          key={`add-btn-${membersCount}`}
          isLoading={isLoading}
          text={buttonTextValue}
          onClick={onAddBtnClickWrapper}
        />
      </div>
    );
  }

  useCometChatAddMembers({
    loggedInUserRef,
    errorHandler,
    selectionMode,
    selectionModeRef,
    membersToAddRef,
  });

  return (
    <div className="cometchat-add-members">
      <CometChatUsers
        hideSearch={hideSearch}
        showSectionHeader={showSectionHeader}
        sectionHeaderKey={sectionHeaderField}
        loadingView={loadingStateView}
        emptyView={emptyStateView}
        errorView={errorStateView}
        hideError={hideError}
        onError={onError}
        options={options}
        selectionMode={selectionMode}
        onSelect={handleSelect}
        usersRequestBuilder={usersRequestBuilder}
        searchRequestBuilder={searchRequestBuilder}
        itemView={listItemView}
        subtitleView={subtitleView}
        activeUser={undefined}
        hideUserStatus={chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence}
        showSelectedUsersPreview={true}
      />
      {isError ? (
        <div className="cometchat-add-members_error-view">{getLocalizedString('member_error_subtitle')}</div>
      ) : null}
      {getAddMembersBtnView()}
      {getBackBtnView()}
    </div>
  );
}
