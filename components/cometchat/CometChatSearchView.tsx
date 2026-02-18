"use client";

import { CometChatButton, CometChatSearch, getLocalizedString } from '@cometchat/chat-uikit-react';
import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';

const closeIcon = '/cometchat/close2x.svg';

interface MessagesViewProps {
  user?: CometChat.User;
  group?: CometChat.Group;
  onClose?: () => void;
  onMessageClicked?: (message: CometChat.BaseMessage) => void;
}

const CometChatSearchView = (props: MessagesViewProps) => {
  const { user, group, onClose, onMessageClicked } = props;

  return (
    <div className="cometchat-search-view">
      <div className="cometchat-search-view__header">
        <div className="cometchat-search-view__title">{getLocalizedString('messages_search_title')}</div>
        <div className="cometchat-search-view__close-button">
          <CometChatButton iconURL={closeIcon} onClick={onClose} />
        </div>
      </div>
      <div className="cometchat-search-view__content">
        <CometChatSearch
          hideBackButton={true}
          uid={user?.getUid()}
          guid={group?.getGuid()}
          onBack={onClose}
          onMessageClicked={onMessageClicked}
          messagesRequestBuilder={new CometChat.MessagesRequestBuilder().setLimit(30)}
        />
      </div>
    </div>
  );
};

export default CometChatSearchView;
