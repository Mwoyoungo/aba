"use client";

import React, { JSX, useCallback, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatTransferOwnership } from './useCometChatTransferOwnership';
import {
  CometChatButton,
  CometChatGroupEvents,
  CometChatGroupMembers,
  CometChatOption,
  CometChatRadioButton,
  CometChatUIKitConstants,
  CometChatUIKitUtility,
  SelectionMode,
  TitleAlignment,
  getLocalizedString,
  useCometChatErrorHandler,
  useRefSync,
} from '@cometchat/chat-uikit-react';
import { useCometChatContext } from '@/context/cometchat/CometChatContext';
import { CometChatSettings } from '@/lib/cometchatSettings';

interface ITransferOwnershipProps {
  group: CometChat.Group;
  title?: string;
  titleAlignment?: TitleAlignment;
  searchIconURL?: string;
  searchPlaceholderText?: string;
  hideSearch?: boolean;
  groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  loadingIconURL?: string;
  loadingStateView?: JSX.Element;
  emptyStateText?: string;
  emptyStateView?: JSX.Element;
  errorStateText?: string;
  errorStateView?: JSX.Element;
  onError?: ((error: CometChat.CometChatException) => void) | null;
  hideSeparator?: boolean;
  disableUsersPresence?: boolean;
  closeButtonIconURL?: string;
  onClose?: () => void;
  listItemView?: (groupMember: CometChat.GroupMember) => JSX.Element;
  subtitleView?: (groupMember: CometChat.GroupMember) => JSX.Element;
  transferButtonText?: string;
  onTransferOwnership?: (groupMember: CometChat.GroupMember) => void;
  cancelButtonText?: string;
  options?: (group: CometChat.Group, groupMember: CometChat.GroupMember) => CometChatOption[];
}

export function CometChatTransferOwnership(props: ITransferOwnershipProps) {
  const {
    group,
    hideSearch = false,
    groupMembersRequestBuilder,
    searchRequestBuilder,
    loadingStateView,
    emptyStateView,
    errorStateView,
    onError,
    onClose,
    listItemView,
    subtitleView,
    transferButtonText = getLocalizedString('transfer'),
    cancelButtonText = getLocalizedString('cancel'),
    options,
  } = props;

  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const selectedMemberRef = useRef<CometChat.GroupMember | null>(null);
  const errorHandler = useCometChatErrorHandler(onError);
  const groupPropRef = useRefSync(group);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const { chatFeatures } = useCometChatContext();

  function onSelect(groupMember: CometChat.GroupMember): void {
    if (isDisabled) setIsDisabled(false);
    selectedMemberRef.current = groupMember;
  }

  function tailView(groupMember: CometChat.GroupMember): JSX.Element {
    const scope =
      group.getOwner() === groupMember.getUid()
        ? CometChatUIKitConstants.groupMemberScope.owner
        : groupMember.getScope();
    if (group.getOwner() === groupMember.getUid()) {
      return <></>;
    } else {
      return (
        <div>
          <CometChatRadioButton
            name={'transfer-ownership'}
            id={groupMember.getUid()}
            labelText={getLocalizedString('member_scope_' + scope)}
            onRadioButtonChanged={() => onSelect(groupMember)}
          />
        </div>
      );
    }
  }

  const onTransferOwnershipWrapper = useCallback(async (): Promise<void> => {
    const selectedMember = selectedMemberRef.current;
    if (!selectedMember) return;
    setIsError(false);
    setIsLoading(true);
    try {
      const currentGroup = groupPropRef.current;
      await CometChat.transferGroupOwnership(currentGroup.getGuid(), selectedMember.getUid());
      setIsLoading(false);
      if (loggedInUser) {
        const groupClone = CometChatUIKitUtility.clone(currentGroup);
        groupClone.setOwner(selectedMember.getUid());
        CometChatGroupEvents.ccOwnershipChanged.next({
          group: groupClone,
          newOwner: CometChatUIKitUtility.clone(selectedMember),
        });
        if (onClose) onClose();
      }
      selectedMemberRef.current = null;
    } catch (error) {
      setIsLoading(false);
      setIsError(true);
      errorHandler(error);
    }
  }, [groupPropRef, loggedInUser, onClose, errorHandler]);

  function getConfirmButtonView(): JSX.Element {
    return (
      <div
        className={`cometchat-transfer-ownership__transfer-button ${isDisabled ? 'cometchat-transfer-ownership__transfer-button-disabled' : ''}`}
      >
        <CometChatButton
          text={transferButtonText}
          disabled={isDisabled}
          isLoading={isLoading}
          onClick={onTransferOwnershipWrapper}
        />
      </div>
    );
  }

  function getCancelButtonView(): JSX.Element {
    return (
      <div className="cometchat-transfer-ownership__cancel-button">
        <CometChatButton text={cancelButtonText} onClick={onClose} />
      </div>
    );
  }

  useCometChatTransferOwnership({ errorHandler, setLoggedInUser });

  return (
    <div className="cometchat-transfer-ownership">
      <CometChatGroupMembers
        hideError={undefined}
        onItemClick={undefined}
        options={options}
        group={group}
        hideSearch={hideSearch}
        groupMemberRequestBuilder={groupMembersRequestBuilder}
        searchRequestBuilder={searchRequestBuilder}
        loadingView={loadingStateView}
        emptyView={emptyStateView}
        errorView={errorStateView}
        onError={errorHandler}
        selectionMode={SelectionMode.none}
        itemView={listItemView}
        subtitleView={subtitleView}
        trailingView={tailView}
        hideUserStatus={
          (chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence) ??
          !CometChatSettings.chatFeatures.coreMessagingExperience.userAndFriendsPresence
        }
      />
      <div className="cometchat-transfer-ownership__buttons-wrapper">
        {isError ? <div className="cometchat-transfer-ownership_error-view">{getLocalizedString('error')}</div> : null}
        <div className="cometchat-transfer-ownership__buttons">
          {getCancelButtonView()}
          {getConfirmButtonView()}
        </div>
      </div>
    </div>
  );
}
