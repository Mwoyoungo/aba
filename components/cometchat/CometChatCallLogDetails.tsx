"use client";

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CalendarObject,
  CometChatCallButtons,
  CometChatDate,
  CometChatList,
  CometChatListItem,
  CometChatLocalize,
  CometChatUIKit,
  CometChatUIKitCalls,
  CometChatUIKitConstants,
  CometChatUIKitLoginListener,
  MessageUtils,
  States,
  convertMinutesToHoursMinutesSeconds,
  getLocalizedString,
} from '@cometchat/chat-uikit-react';
import { useCometChatContext } from '@/context/cometchat/CometChatContext';

// SVG icon paths
const outgoingCallSuccessIcon = '/cometchat/outgoingCallSuccess.svg';
const callRejectedIcon = '/cometchat/callRejectedIcon.svg';
const incomingCallIcon = '/cometchat/incomingCallIcon.svg';
const incomingCallSuccessIcon = '/cometchat/incomingCallSuccess.svg';
const missedCallIcon = '/cometchat/missedCallIcon.svg';

function getDateFormat(): CalendarObject {
  const defaultFormat = {
    yesterday: `DD MMM, hh:mm A`,
    otherDays: `DD MMM, hh:mm A`,
    today: `DD MMM, hh:mm A`,
  };
  return { ...defaultFormat, ...CometChatLocalize.calendarObject };
}

function getCallStatusHelper(call: CometChat.Call, loggedInUser: CometChat.User): string {
  const isSentByMe = (call: any, loggedInUser: CometChat.User) => {
    const senderUid: string = call.callInitiator?.getUid();
    return !senderUid || senderUid === loggedInUser?.getUid();
  };
  const callStatus: string = call.getStatus();
  const isSentByMeFlag = isSentByMe(call, loggedInUser);
  if (isSentByMeFlag) {
    switch (callStatus) {
      case CometChatUIKitConstants.calls.initiated: return getLocalizedString('calls_outgoing_call');
      case CometChatUIKitConstants.calls.cancelled: return getLocalizedString('calls_cancelled_call');
      case CometChatUIKitConstants.calls.rejected: return getLocalizedString('calls_rejected_call');
      case CometChatUIKitConstants.calls.busy: return getLocalizedString('calls_missed_call');
      case CometChatUIKitConstants.calls.ended: return getLocalizedString('calls_ended_call');
      case CometChatUIKitConstants.calls.ongoing: return getLocalizedString('calls_answered_call');
      case CometChatUIKitConstants.calls.unanswered: return getLocalizedString('calls_unanswered_call');
      default: return getLocalizedString('calls_outgoing_call');
    }
  } else {
    switch (callStatus) {
      case CometChatUIKitConstants.calls.initiated: return getLocalizedString('calls_incoming_call');
      case CometChatUIKitConstants.calls.ongoing: return getLocalizedString('calls_answered_call');
      case CometChatUIKitConstants.calls.ended: return getLocalizedString('calls_ended_call');
      case CometChatUIKitConstants.calls.unanswered:
      case CometChatUIKitConstants.calls.cancelled: return getLocalizedString('calls_missed_call');
      case CometChatUIKitConstants.calls.busy: return getLocalizedString('calls_busy_call');
      case CometChatUIKitConstants.calls.rejected: return getLocalizedString('calls_rejected_call');
      default: return getLocalizedString('calls_outgoing_call');
    }
  }
}

function getAvatarUrlForCallHelper(call: CometChat.Call, loggedInUser: CometChat.User): string {
  const isSentByMe = (call: any, loggedInUser: CometChat.User) => {
    const senderUid: string = call.initiator?.getUid();
    return !senderUid || senderUid === loggedInUser?.getUid();
  };
  const isSentByMeFlag = isSentByMe(call, loggedInUser);
  const callStatus = getCallStatusHelper(call, loggedInUser);
  if (isSentByMeFlag) {
    switch (callStatus) {
      case getLocalizedString('calls_rejected_call'): return callRejectedIcon;
      case getLocalizedString('calls_busy_call'):
      case getLocalizedString('calls_missed_call'):
      case getLocalizedString('calls_unanswered_call'): return missedCallIcon;
      default: return outgoingCallSuccessIcon;
    }
  } else {
    switch (callStatus) {
      case getLocalizedString('calls_cancelled_call'): return incomingCallIcon;
      case getLocalizedString('calls_rejected_call'): return callRejectedIcon;
      case getLocalizedString('calls_busy_call'):
      case getLocalizedString('calls_missed_call'):
      case getLocalizedString('calls_unanswered_call'): return missedCallIcon;
      default: return incomingCallSuccessIcon;
    }
  }
}

// ---- CometChatCallDetailsInfo ----
export const CometChatCallDetailsInfo = (props: { call: any }) => {
  const { call } = props;
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);

  useEffect(() => {
    CometChatUIKit.getLoggedinUser().then((user) => setLoggedInUser(user));
  }, []);

  const getListItemSubtitleView = useCallback((item: any): JSX.Element => {
    return (
      <div className="cometchat-call-log-info__subtitle">
        <CometChatDate calendarObject={getDateFormat()} timestamp={item?.getInitiatedAt()} />
      </div>
    );
  }, []);

  const getCallDuration = useCallback((item: any) => {
    try {
      if (item?.getTotalDurationInMinutes()) {
        return convertMinutesToHoursMinutesSeconds(item?.getTotalDurationInMinutes());
      }
      return false;
    } catch (e) {
      return false;
    }
  }, []);

  const getListItemTailView = useCallback((item: any): JSX.Element => {
    return (
      <div className={getCallDuration(item) ? 'cometchat-call-log-info__tail-view' : 'cometchat-call-log-info__tail-view-disabled'}>
        {getCallDuration(item) ? getCallDuration(item) : '00:00'}
      </div>
    );
  }, [getCallDuration]);

  return (
    <div className="cometchat-call-log-info">
      {loggedInUser && (
        <CometChatListItem
          title={getCallStatusHelper(call, loggedInUser)}
          avatarURL={getAvatarUrlForCallHelper(call, loggedInUser)}
          subtitleView={getListItemSubtitleView(call)}
          trailingView={getListItemTailView(call)}
        />
      )}
    </div>
  );
};

// ---- CometChatCallDetailsParticipants ----
export const CometChatCallDetailsParticipants = (props: { call: any }) => {
  const { call } = props;

  const getCallParticipants = useCallback(() => call?.getParticipants(), [call]);

  function convertMinsToHMS(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    const seconds = Math.floor((minutes - Math.floor(minutes)) * 60);
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (remainingMinutes > 0) result += `${remainingMinutes}m `;
    result += `${seconds}s`;
    return result;
  }

  const getDurationOfCall = useCallback((item: any) => {
    if (item?.getHasJoined() || item?.getJoinedAt()) {
      return convertMinsToHMS(item?.getTotalDurationInMinutes());
    }
    return convertMinsToHMS(0);
  }, []);

  const getListItemSubtitleView = useCallback((): JSX.Element => {
    return <CometChatDate timestamp={call.initiatedAt} calendarObject={getDateFormat()} />;
  }, [call]);

  const getListItemTailView = useCallback((item: any): JSX.Element => {
    return (
      <div className={item?.getHasJoined() || item?.getJoinedAt() ? 'cometchat-call-log-participants__tail-view' : 'cometchat-call-log-participants__tail-view-disabled'}>
        {getDurationOfCall(item)}
      </div>
    );
  }, [getDurationOfCall]);

  const getListItem = useMemo(() => {
    return function (item: any): any {
      return (
        <CometChatListItem
          title={item?.getName()}
          avatarURL={item?.getAvatar()}
          avatarName={item?.getName()}
          subtitleView={getListItemSubtitleView()}
          trailingView={getListItemTailView(item)}
        />
      );
    };
  }, [getListItemSubtitleView, getListItemTailView]);

  return (
    <div className="cometchat-call-log-participants">
      <CometChatList
        hideSearch={true}
        list={getCallParticipants() || []}
        itemView={getListItem}
        listItemKey="getUid"
        state={States.loaded}
        showSectionHeader={false}
      />
    </div>
  );
};

// ---- CometChatCallDetailsRecording ----
export const CometChatCallDetailsRecording = (props: { call: any }) => {
  const { call } = props;

  const handleDownloadClick = useCallback((item: any) => {
    fetch(item?.getRecordingURL())
      .then((response) => response.blob())
      .then((blob) => {
        const blobURL = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobURL;
        a.download = 'recording.mp4';
        document.body.appendChild(a);
        a.click();
      })
      .catch((error: any) => console.error(error));
  }, []);

  const getRecordings = useCallback(() => {
    try { return call?.getRecordings(); } catch (e) { console.log(e); }
  }, [call]);

  const getRecordingStartTime = (item: any) => {
    try { return item?.getStartTime(); } catch (e) { console.log(e); }
  };

  const getListItemSubtitleView = useCallback((item: any): JSX.Element => {
    return (
      <div className="cometchat-call-log-recordings__subtitle">
        <CometChatDate calendarObject={getDateFormat()} timestamp={getRecordingStartTime(item)} />
      </div>
    );
  }, []);

  const getListItemTailView = useCallback((item: any): JSX.Element => {
    return <div className="cometchat-call-log-recordings__download" onClick={() => handleDownloadClick(item)} />;
  }, [handleDownloadClick]);

  const getListItem = useMemo(() => {
    return function (item: any): any {
      return (
        <CometChatListItem
          avatarURL=""
          title={item?.getRid()}
          subtitleView={getListItemSubtitleView(item)}
          trailingView={getListItemTailView(item)}
        />
      );
    };
  }, [getListItemSubtitleView, getListItemTailView]);

  return (
    <div className="cometchat-call-log-recordings">
      {!getRecordings() ? (
        <div className="cometchat-call-log-recordings__empty-state">
          <div className="cometchat-call-log-recordings__empty-state-icon" />
          <div className="cometchat-call-log-recordings__empty-state-text">
            {getLocalizedString('no_recording_available')}
          </div>
        </div>
      ) : (
        <CometChatList
          hideSearch={true}
          list={getRecordings()}
          itemView={getListItem}
          listItemKey="getRid"
          state={States.loaded}
          showSectionHeader={false}
        />
      )}
    </div>
  );
};

// ---- CometChatCallDetailsHistory ----
export const CometChatCallDetailsHistory = (props: { call: any }) => {
  const { call } = props;
  const [callList, setCallList] = useState<any[]>([]);
  const [callListState, setCallListState] = useState(States.loading);
  const requestBuilder = useRef<any>(null);
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);

  useEffect(() => {
    CometChatUIKit.getLoggedinUser().then((user) => setLoggedInUser(user));
  }, []);

  const setRequestBuilderFn = useCallback((): any => {
    try {
      let callUserId;
      if (call.getInitiator().getUid() === loggedInUser!.getUid()) {
        callUserId = call.getReceiver().getUid();
      } else {
        callUserId = call.getInitiator().getUid();
      }
      const authToken = loggedInUser!.getAuthToken() || '';
      let builder = new CometChatUIKitCalls.CallLogRequestBuilder()
        .setLimit(30)
        .setCallCategory('call')
        .setAuthToken(authToken);
      if (callUserId) builder = builder.setUid(callUserId);
      return builder.build();
    } catch (e) {
      console.log(e);
    }
  }, [call, loggedInUser]);

  const fetchNextCallList = useCallback(async (): Promise<any[]> => {
    try {
      return await requestBuilder?.current?.fetchNext();
    } catch (e) {
      throw new Error('Error while fetching call list');
    }
  }, []);

  const getCallList = useCallback(async () => {
    try {
      const calls = await fetchNextCallList();
      if (calls && calls.length > 0) {
        setCallList((prev) => [...prev, ...calls]);
        setCallListState(States.loaded);
      } else if (callList.length === 0) {
        setCallListState(States.empty);
      }
    } catch (e) {
      if (callList.length === 0) setCallListState(States.error);
    }
  }, [fetchNextCallList, callList]);

  useEffect(() => {
    if (loggedInUser) {
      requestBuilder.current = setRequestBuilderFn();
      getCallList();
    }
  }, [loggedInUser]);

  const getLoadingView = () => (
    <div className="cometchat-call-log-history__shimmer">
      {[...Array(10)].map((_, index) => (
        <div key={index} className="cometchat-call-log-history__shimmer-item">
          <div className="cometchat-call-log-history__shimmer-item-avatar"></div>
          <div className="cometchat-call-log-history__shimmer-item-body">
            <div className="cometchat-call-log-history__shimmer-item-body-title-wrapper">
              <div className="cometchat-call-log-history__shimmer-item-body-title"></div>
              <div className="cometchat-call-log-history__shimmer-item-body-subtitle"></div>
            </div>
            <div className="cometchat-call-log-history__shimmer-item-body-tail"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const getListItemSubtitleView = useCallback((item: any): JSX.Element => (
    <div className="cometchat-call-log-history__subtitle">
      <CometChatDate calendarObject={getDateFormat()} timestamp={item?.getInitiatedAt()} />
    </div>
  ), []);

  const getCallDuration = useCallback((item: any) => {
    try {
      if (item?.getTotalDurationInMinutes()) return convertMinutesToHoursMinutesSeconds(item?.getTotalDurationInMinutes());
      return false;
    } catch (e) { return false; }
  }, []);

  const getListItemTailView = useCallback((item: any): JSX.Element => (
    <div className={getCallDuration(item) ? 'cometchat-call-log-history__tail-view' : 'cometchat-call-log-history__tail-view-disabled'}>
      {getCallDuration(item) ? getCallDuration(item) : '00:00'}
    </div>
  ), [getCallDuration]);

  const getListItem = useMemo(() => {
    return function (item: any): any {
      if (!loggedInUser) return null;
      return (
        <CometChatListItem
          title={getCallStatusHelper(item, loggedInUser)}
          avatarURL={getAvatarUrlForCallHelper(item, loggedInUser)}
          subtitleView={getListItemSubtitleView(item)}
          trailingView={getListItemTailView(item)}
        />
      );
    };
  }, [getListItemSubtitleView, getListItemTailView, loggedInUser]);

  return (
    <div className="cometchat-call-log-history">
      {callListState === States.loading ? (
        getLoadingView()
      ) : (
        <CometChatList
          hideSearch={true}
          list={callList}
          onScrolledToBottom={getCallList}
          listItemKey="getSessionID"
          itemView={getListItem}
          state={callListState}
          showSectionHeader={false}
        />
      )}
    </div>
  );
};

// ---- CometChatCallDetails (main) ----
export const CometChatCallDetails = (props: { selectedItem: any; onBack?: () => void }) => {
  const { selectedItem, onBack } = props;
  const callDetailTabItems = [
    { id: 'participants', name: getLocalizedString('participants') },
    { id: 'recording', name: getLocalizedString('recording') },
    { id: 'history', name: getLocalizedString('history') },
  ];
  const [activeTab, setActiveTab] = useState('participants');
  const [user, setUser] = useState<CometChat.User>();
  const [subtitleText, setSubtitleText] = useState<string>();
  const { callFeatures, chatFeatures } = useCometChatContext();

  function verifyCallUser(call: any, loggedInUser: CometChat.User) {
    if (call.getInitiator().getUid() === loggedInUser.getUid()) {
      return call.getReceiver();
    } else {
      return call.getInitiator();
    }
  }

  useEffect(() => {
    const isBlocked = new MessageUtils().getUserStatusVisible(user);
    const userListenerId = 'users_custom' + Date.now();
    if (isBlocked) {
      setSubtitleText('');
      return;
    }
    setSubtitleText(getLocalizedString(`call_logs_user_status_${user?.getStatus().toLowerCase()}`));
    CometChat.addUserListener(
      userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          if (user?.getUid() === onlineUser.getUid()) {
            setSubtitleText(getLocalizedString(`call_logs_user_status_online`));
          }
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          if (user?.getUid() === offlineUser?.getUid()) {
            setSubtitleText(getLocalizedString(`call_logs_user_status_offline`));
          }
        },
      })
    );
    return () => {
      CometChat.removeUserListener(userListenerId);
    };
  }, [user]);

  useEffect(() => {
    const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
    const callUser = verifyCallUser(selectedItem, loggedInUser!);
    if (selectedItem.receiverType === CometChatUIKitConstants.MessageReceiverType.user) {
      CometChat.getUser(callUser.uid).then((response: CometChat.User) => {
        setUser(response);
      });
    }
  }, [selectedItem]);

  const getSubtitleView = useCallback(() => {
    return (
      <div className="cometchat-call-log-details__subtitle">
        {chatFeatures && chatFeatures?.coreMessagingExperience?.userAndFriendsPresence ? subtitleText : ''}
      </div>
    );
  }, [subtitleText, chatFeatures]);

  function getTrailingView() {
    return (
      <div className="cometchat-call-log-details__trailing-view">
        <CometChatCallButtons
          user={user!}
          key={'callbuttonsVCBSampleApp'}
          hideVideoCallButton={!callFeatures?.voiceAndVideoCalling?.oneOnOneVideoCalling}
          hideVoiceCallButton={!callFeatures?.voiceAndVideoCalling?.oneOnOneVoiceCalling}
        />
      </div>
    );
  }

  return (
    <div className="cometchat-call-log-details">
      <div className="cometchat-call-log-details__header">
        <div className="cometchat-call-log-details__header-back" onClick={onBack} />
        {getLocalizedString('call_details')}
      </div>
      <div className="cometchat-call-log-details__call-log-item">
        <CometChatListItem
          avatarName={user?.getName()}
          avatarURL={user?.getAvatar()}
          title={user?.getName() || ''}
          subtitleView={getSubtitleView()}
          trailingView={getTrailingView()}
        />
      </div>
      <CometChatCallDetailsInfo call={selectedItem} />
      <div className="cometchat-call-log-details__tabs">
        {callDetailTabItems.map((tabItem) => (
          <div
            key={tabItem.id}
            onClick={() => setActiveTab(tabItem.id)}
            className={
              activeTab === tabItem.id
                ? 'cometchat-call-log-details__tabs-tab-item-active'
                : 'cometchat-call-log-details__tabs-tab-item'
            }
          >
            {tabItem.name}
          </div>
        ))}
      </div>
      <>
        {activeTab === 'participants' ? (
          <CometChatCallDetailsParticipants call={selectedItem} />
        ) : activeTab === 'recording' ? (
          <CometChatCallDetailsRecording call={selectedItem} />
        ) : activeTab === 'history' ? (
          <CometChatCallDetailsHistory call={selectedItem} />
        ) : null}
      </>
    </div>
  );
};
